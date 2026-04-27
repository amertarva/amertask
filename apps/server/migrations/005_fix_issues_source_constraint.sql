-- ============================================================================
-- Migration: Fix Issues Source Constraint
-- Description: Tambah 'planning' sebagai nilai valid untuk issues.source
-- ============================================================================

-- Drop constraint lama
ALTER TABLE public.issues
  DROP CONSTRAINT IF EXISTS issues_source_check;

-- Tambah constraint baru dengan 'planning'
ALTER TABLE public.issues
  ADD CONSTRAINT issues_source_check 
  CHECK (source IN ('slack', 'email', 'manual', 'planning'));

-- Update comment
COMMENT ON COLUMN public.issues.source IS
  'Sumber issue: slack, email, manual, atau planning (dari promote planning)';

-- ============================================================================
-- SELESAI
-- ============================================================================
