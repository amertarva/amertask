-- ============================================================================
-- Migration: Standalone Planning Table
-- Description: Make issue_planning independent (tidak require issue_id dari issues table)
-- ============================================================================

-- FASE 1: Ubah issue_planning menjadi standalone
-- Hapus foreign key constraint yang require issues table
ALTER TABLE public.issue_planning
  DROP CONSTRAINT IF EXISTS issue_planning_issue_id_fkey CASCADE;

-- Ubah issue_id menjadi nullable dan tambah kolom baru
ALTER TABLE public.issue_planning
  ALTER COLUMN issue_id DROP NOT NULL,
  ADD COLUMN IF NOT EXISTS team_id UUID REFERENCES public.teams(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS title TEXT NOT NULL DEFAULT 'Untitled Planning',
  ADD COLUMN IF NOT EXISTS description TEXT,
  ADD COLUMN IF NOT EXISTS priority TEXT DEFAULT 'medium',
  ADD COLUMN IF NOT EXISTS assignee_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'planned' CHECK (status IN ('planned', 'in_execution', 'completed', 'cancelled')),
  ADD COLUMN IF NOT EXISTS number INTEGER;

-- Create index untuk team_id
CREATE INDEX IF NOT EXISTS idx_issue_planning_team_id ON public.issue_planning(team_id);
CREATE INDEX IF NOT EXISTS idx_issue_planning_status ON public.issue_planning(status);

-- Update comment
COMMENT ON TABLE public.issue_planning IS
  'Standalone planning table - planning dapat exist tanpa issue. Saat mulai eksekusi, baru create issue dan link via issue_id';

COMMENT ON COLUMN public.issue_planning.issue_id IS
  'NULL = belum dieksekusi, NOT NULL = sudah dieksekusi (linked ke issues table)';

COMMENT ON COLUMN public.issue_planning.status IS
  'planned = masih planning, in_execution = sedang dieksekusi, completed = selesai, cancelled = dibatalkan';

-- FASE 2: Ubah issue_triage menjadi lebih flexible
-- Tambah kolom untuk track resolved status
ALTER TABLE public.issue_triage
  ADD COLUMN IF NOT EXISTS resolved_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS resolved_by_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS resolution_notes TEXT;

CREATE INDEX IF NOT EXISTS idx_issue_triage_resolved ON public.issue_triage(resolved_at);

COMMENT ON COLUMN public.issue_triage.resolved_at IS
  'NULL = bug masih aktif, NOT NULL = bug sudah resolved (bisa dihapus dari triage)';

-- FASE 3: Function untuk auto-generate planning number per team
CREATE OR REPLACE FUNCTION get_next_planning_number(p_team_id UUID)
RETURNS INTEGER AS $$
DECLARE
  v_max_number INTEGER;
BEGIN
  SELECT COALESCE(MAX(number), 0) INTO v_max_number
  FROM issue_planning
  WHERE team_id = p_team_id;
  
  RETURN v_max_number + 1;
END;
$$ LANGUAGE plpgsql;

-- FASE 4: Function untuk promote planning ke execution (create issue)
CREATE OR REPLACE FUNCTION promote_planning_to_execution(
  p_planning_id UUID,
  p_user_id UUID
) RETURNS UUID AS $$
DECLARE
  v_planning RECORD;
  v_issue_id UUID;
  v_issue_number INTEGER;
BEGIN
  -- Get planning data
  SELECT * INTO v_planning
  FROM issue_planning
  WHERE id = p_planning_id AND issue_id IS NULL;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Planning not found or already in execution';
  END IF;
  
  -- Get next issue number for team
  SELECT COALESCE(MAX(number), 0) + 1 INTO v_issue_number
  FROM issues
  WHERE team_id = v_planning.team_id;
  
  -- Create issue
  INSERT INTO issues (
    team_id,
    number,
    title,
    description,
    status,
    priority,
    assignee_id,
    created_by_id,
    is_triaged,
    source
  ) VALUES (
    v_planning.team_id,
    v_issue_number,
    v_planning.title,
    v_planning.description,
    'todo',
    v_planning.priority,
    v_planning.assignee_id,
    p_user_id,
    true,
    'planning'
  )
  RETURNING id INTO v_issue_id;
  
  -- Link planning to issue
  UPDATE issue_planning
  SET 
    issue_id = v_issue_id,
    status = 'in_execution',
    updated_at = NOW()
  WHERE id = p_planning_id;
  
  RETURN v_issue_id;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- SELESAI
-- ============================================================================
-- Perubahan:
-- 1. issue_planning sekarang standalone (tidak require issue_id)
-- 2. issue_planning punya kolom sendiri: team_id, title, description, priority, assignee_id, status, number
-- 3. issue_triage punya tracking untuk resolved bugs
-- 4. Function promote_planning_to_execution() untuk move planning ke execution
--
-- Workflow baru:
-- 1. Planning: INSERT ke issue_planning (issue_id = NULL, status = 'planned')
-- 2. Execution: Call promote_planning_to_execution() → create issue + link
-- 3. Triage: Bug masuk issue_triage, kalau selesai set resolved_at atau DELETE
-- ============================================================================

