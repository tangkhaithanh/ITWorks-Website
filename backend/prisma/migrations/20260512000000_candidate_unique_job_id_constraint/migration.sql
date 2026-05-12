-- Candidate Unique Job ID Constraint
-- Changes PotentialCandidate uniqueness from:
--   (recruiter_id, candidate_id)
-- to:
--   (recruiter_id, candidate_id, job_id)

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM "PotentialCandidate"
    WHERE job_id IS NULL
  ) THEN
    RAISE EXCEPTION 'Cannot apply migration: PotentialCandidate has rows with NULL job_id. Resolve them before migrating.';
  END IF;
END $$;

WITH duplicates AS (
  SELECT
    id,
    ROW_NUMBER() OVER (
      PARTITION BY recruiter_id, candidate_id, job_id
      ORDER BY created_at DESC, id DESC
    ) AS rn
  FROM "PotentialCandidate"
  WHERE deleted_at IS NULL
)
DELETE FROM "PotentialCandidate"
WHERE id IN (
  SELECT id
  FROM duplicates
  WHERE rn > 1
);

ALTER TABLE "PotentialCandidate"
  DROP CONSTRAINT IF EXISTS "PotentialCandidate_recruiter_id_candidate_id_key";

ALTER TABLE "PotentialCandidate"
  ALTER COLUMN job_id SET NOT NULL;

ALTER TABLE "PotentialCandidate"
  ADD CONSTRAINT "PotentialCandidate_recruiter_id_candidate_id_job_id_key"
  UNIQUE (recruiter_id, candidate_id, job_id);
