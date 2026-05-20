-- CreateEnum
CREATE TYPE "public"."ReportTargetType" AS ENUM ('job', 'company');

-- CreateEnum
CREATE TYPE "public"."ReportStatus" AS ENUM ('pending', 'under_review', 'resolved', 'dismissed');

-- AlterEnum
ALTER TYPE "public"."NotificationType" ADD VALUE 'report';

-- CreateTable
CREATE TABLE "public"."Report" (
    "id" BIGSERIAL NOT NULL,
    "reporter_account_id" BIGINT NOT NULL,
    "target_type" "public"."ReportTargetType" NOT NULL,
    "job_id" BIGINT,
    "company_id" BIGINT,
    "reason" TEXT NOT NULL,
    "status" "public"."ReportStatus" NOT NULL DEFAULT 'pending',
    "latest_admin_note" TEXT,
    "reviewed_by_account_id" BIGINT,
    "reviewed_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Report_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "Report_exactly_one_target_check" CHECK (
        (("job_id" IS NOT NULL AND "company_id" IS NULL AND "target_type" = 'job')
        OR ("job_id" IS NULL AND "company_id" IS NOT NULL AND "target_type" = 'company'))
    )
);

-- CreateTable
CREATE TABLE "public"."ReportStatusHistory" (
    "id" BIGSERIAL NOT NULL,
    "report_id" BIGINT NOT NULL,
    "changed_by_account_id" BIGINT NOT NULL,
    "from_status" "public"."ReportStatus",
    "to_status" "public"."ReportStatus" NOT NULL,
    "note" TEXT,
    "action" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ReportStatusHistory_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Report_status_created_at_idx" ON "public"."Report"("status", "created_at");

-- CreateIndex
CREATE INDEX "Report_target_type_job_id_idx" ON "public"."Report"("target_type", "job_id");

-- CreateIndex
CREATE INDEX "Report_target_type_company_id_idx" ON "public"."Report"("target_type", "company_id");

-- CreateIndex
CREATE INDEX "Report_reporter_account_id_target_type_job_id_idx" ON "public"."Report"("reporter_account_id", "target_type", "job_id");

-- CreateIndex
CREATE INDEX "Report_reporter_account_id_target_type_company_id_idx" ON "public"."Report"("reporter_account_id", "target_type", "company_id");

-- CreateIndex
CREATE INDEX "ReportStatusHistory_report_id_created_at_idx" ON "public"."ReportStatusHistory"("report_id", "created_at");

-- CreateIndex
CREATE INDEX "ReportStatusHistory_changed_by_account_id_idx" ON "public"."ReportStatusHistory"("changed_by_account_id");

-- AddForeignKey
ALTER TABLE "public"."Report" ADD CONSTRAINT "Report_reporter_account_id_fkey" FOREIGN KEY ("reporter_account_id") REFERENCES "public"."Account"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Report" ADD CONSTRAINT "Report_reviewed_by_account_id_fkey" FOREIGN KEY ("reviewed_by_account_id") REFERENCES "public"."Account"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Report" ADD CONSTRAINT "Report_job_id_fkey" FOREIGN KEY ("job_id") REFERENCES "public"."Job"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Report" ADD CONSTRAINT "Report_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "public"."Company"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ReportStatusHistory" ADD CONSTRAINT "ReportStatusHistory_report_id_fkey" FOREIGN KEY ("report_id") REFERENCES "public"."Report"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ReportStatusHistory" ADD CONSTRAINT "ReportStatusHistory_changed_by_account_id_fkey" FOREIGN KEY ("changed_by_account_id") REFERENCES "public"."Account"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
