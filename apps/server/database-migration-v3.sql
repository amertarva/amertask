-- TaskOps Database Migration V3
-- Menambahkan kolom triage_reason untuk alasan terkendala (bug triage)

ALTER TABLE public.issues
ADD COLUMN IF NOT EXISTS triage_reason TEXT;

COMMENT ON COLUMN public.issues.triage_reason IS 'Alasan terkendala untuk antrean bug triage';

DO $$
BEGIN
  RAISE NOTICE 'Migration V3 completed successfully!';
  RAISE NOTICE 'Added column: triage_reason';
END $$;
