-- find-null-job-ids.sql
-- Identifies PotentialCandidate records where job_id is NULL
-- These records need to be assigned a default job or deleted before
-- the new unique constraint (recruiter_id, candidate_id, job_id) can be applied.

SELECT 
  pc.id,
  pc.recruiter_id,
  pc.candidate_id,
  pc.created_at,
  a.email AS recruiter_email
FROM "PotentialCandidate" pc
LEFT JOIN "Account" a ON a.id = pc.recruiter_id
WHERE pc.job_id IS NULL
ORDER BY pc.created_at DESC;
