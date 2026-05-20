-- CreateEnum
CREATE TYPE "public"."PotentialCandidateStatus" AS ENUM ('SAVED', 'CONTACTED', 'INTERESTED', 'INTERVIEW_SCHEDULED', 'NOT_INTERESTED', 'HIRED');

-- CreateEnum
CREATE TYPE "public"."PotentialCandidatePriority" AS ENUM ('LOW', 'MEDIUM', 'HIGH');

-- CreateTable
CREATE TABLE "public"."PotentialCandidate" (
    "id" BIGSERIAL NOT NULL,
    "candidate_id" BIGINT NOT NULL,
    "job_id" BIGINT NOT NULL,
    "recruiter_id" BIGINT NOT NULL,
    "match_score" DOUBLE PRECISION,
    "matched_skills" TEXT[],
    "missing_skills" TEXT[],
    "note" TEXT,
    "tags" TEXT[],
    "status" "public"."PotentialCandidateStatus" NOT NULL DEFAULT 'SAVED',
    "priority" "public"."PotentialCandidatePriority" NOT NULL DEFAULT 'MEDIUM',
    "follow_up_date" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "PotentialCandidate_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "PotentialCandidate_recruiter_id_candidate_id_job_id_key" ON "public"."PotentialCandidate"("recruiter_id", "candidate_id", "job_id");

-- AddForeignKey
ALTER TABLE "public"."PotentialCandidate" ADD CONSTRAINT "PotentialCandidate_candidate_id_fkey" FOREIGN KEY ("candidate_id") REFERENCES "public"."Candidate"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."PotentialCandidate" ADD CONSTRAINT "PotentialCandidate_job_id_fkey" FOREIGN KEY ("job_id") REFERENCES "public"."Job"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."PotentialCandidate" ADD CONSTRAINT "PotentialCandidate_recruiter_id_fkey" FOREIGN KEY ("recruiter_id") REFERENCES "public"."Account"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
