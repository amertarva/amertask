-- ============================================================================
-- Migration: Cleanup Issues Table
-- Description: Hapus kolom yang sudah dipindah ke tabel terpisah
-- ============================================================================

-- IMPORTANT: Jalankan SETELAH memastikan data sudah dimigrasikan ke tabel baru
-- Verifikasi dulu dengan query:
-- SELECT COUNT(*) FROM issue_triage;
-- SELECT COUNT(*) FROM issue_planning;

-- FASE 1: Backup data (opsional, untuk safety)
-- Uncomment jika ingin backup dulu
/*
CREATE TABLE IF NOT EXISTS issues_backup_20260425 AS 
SELECT * FROM issues;
*/

-- FASE 2: Hapus kolom yang sudah tidak digunakan
-- Kolom ini sudah dipindah ke issue_triage
ALTER TABLE public.issues
  DROP COLUMN IF EXISTS reason CASCADE,
  DROP COLUMN IF EXISTS triage_reason CASCADE;

-- Kolom ini sudah dipindah ke issue_planning
ALTER TABLE public.issues
  DROP COLUMN IF EXISTS plan_info CASCADE;

-- FASE 3: Verifikasi struktur tabel
-- Check kolom yang tersisa
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'issues'
ORDER BY ordinal_position;

-- FASE 4: Tambah comment untuk dokumentasi
COMMENT ON TABLE public.issues IS
  'Core issue data - planning data di issue_planning, triage data di issue_triage, dependencies di issue_dependencies';

-- ============================================================================
-- SELESAI
-- ============================================================================
-- Tabel issues sekarang hanya berisi:
-- - Core data: id, number, team_id, title, description
-- - Status: status, priority, labels
-- - Relations: assignee_id, created_by_id, parent_issue_id
-- - Metadata: source, is_triaged, created_at, updated_at
--
-- Data lainnya ada di:
-- - issue_planning: start_date, due_date, estimated_hours, plan_info
-- - issue_triage: reason, triage_reason, triaged_by_id, triaged_at
-- - issue_dependencies: relasi antar issues
-- ============================================================================
