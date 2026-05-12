-- cleanup-duplicates.sql
-- Removes duplicate (recruiter_id, candidate_id, job_id) combinations
-- keeping only the most recently created record for each group.
-- Uses a CTE with row_number() to identify and delete older duplicates.

WITH duplicates AS (
  SELECT 
    id,
    ROW_NUMBER() OVER (
      PARTITION BY recruiter_id, candidate_id, job_id 
      ORDER BY created_at DESC
    ) AS rn
  FROM "PotentialCandidate"
  WHERE job_id IS NOT NULL AND deleted_at IS NULL
)
DELETE FROM "PotentialCandidate"
WHERE id IN (
  SELECT id FROM duplicates WHERE rn > 1
);

-- Log the number of deleted duplicates
GET DIAGNOSTICS ? = ROW_COUNT;
-- Note: Replace ? with a variable in your migration script
