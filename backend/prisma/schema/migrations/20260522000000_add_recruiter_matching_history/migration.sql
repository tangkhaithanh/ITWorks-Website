-- CreateEnum
CREATE TYPE "public"."RecruiterMatchingAction" AS ENUM ('RANK_APPLICANTS', 'FIND_TALENT');

-- CreateTable
CREATE TABLE "public"."RecruiterMatchingHistory" (
    "id" BIGSERIAL NOT NULL,
    "recruiter_id" BIGINT NOT NULL,
    "job_id" BIGINT,
    "action_type" "public"."RecruiterMatchingAction" NOT NULL,
    "job_title_snapshot" TEXT NOT NULL,
    "company_name_snapshot" TEXT NOT NULL,
    "response_snapshot" JSONB NOT NULL,
    "searched_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RecruiterMatchingHistory_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "RecruiterMatchingHistory_recruiter_id_searched_at_idx" ON "public"."RecruiterMatchingHistory"("recruiter_id", "searched_at");

-- AddForeignKey
ALTER TABLE "public"."RecruiterMatchingHistory" ADD CONSTRAINT "RecruiterMatchingHistory_recruiter_id_fkey" FOREIGN KEY ("recruiter_id") REFERENCES "public"."Account"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."RecruiterMatchingHistory" ADD CONSTRAINT "RecruiterMatchingHistory_job_id_fkey" FOREIGN KEY ("job_id") REFERENCES "public"."Job"("id") ON DELETE SET NULL ON UPDATE CASCADE;
