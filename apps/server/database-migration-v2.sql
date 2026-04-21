-- TaskOps Database Migration V2
-- Menambahkan kolom baru dan update constraints

-- 1. Tambah kolom reason dan plan_info ke tabel issues
ALTER TABLE public.issues 
ADD COLUMN IF NOT EXISTS reason TEXT,
ADD COLUMN IF NOT EXISTS plan_info TEXT;

-- Tambah comment untuk dokumentasi
COMMENT ON COLUMN public.issues.reason IS 'Alasan prioritas untuk backlog priority';
COMMENT ON COLUMN public.issues.plan_info IS 'Informasi detail planning/expected output';

-- 2. Update enum role di team_members untuk include 'pm'
ALTER TABLE public.team_members 
DROP CONSTRAINT IF EXISTS team_members_role_check;

ALTER TABLE public.team_members 
ADD CONSTRAINT team_members_role_check 
CHECK (role IN ('owner', 'admin', 'member', 'pm'));

-- 3. Tambah indexes untuk performance
CREATE INDEX IF NOT EXISTS idx_issues_created_by_date 
ON public.issues(created_by_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_issues_team_status 
ON public.issues(team_id, status);

CREATE INDEX IF NOT EXISTS idx_issues_team_priority 
ON public.issues(team_id, priority);

-- 4. Tambah index untuk activity queries
CREATE INDEX IF NOT EXISTS idx_issues_created_at 
ON public.issues(created_at DESC);

-- Success message
DO $$
BEGIN
  RAISE NOTICE 'Migration V2 completed successfully!';
  RAISE NOTICE 'Added columns: reason, plan_info';
  RAISE NOTICE 'Updated role enum to include: pm';
  RAISE NOTICE 'Added performance indexes';
END $$;
