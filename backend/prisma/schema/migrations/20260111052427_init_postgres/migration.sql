-- CreateEnum
CREATE TYPE "public"."Role" AS ENUM ('candidate', 'recruiter', 'admin');

-- CreateEnum
CREATE TYPE "public"."Status" AS ENUM ('active', 'banned', 'pending');

-- CreateEnum
CREATE TYPE "public"."Gender" AS ENUM ('male', 'female', 'other');

-- CreateEnum
CREATE TYPE "public"."CompanySize" AS ENUM ('small', 'medium', 'large');

-- CreateEnum
CREATE TYPE "public"."CompanyStatus" AS ENUM ('pending', 'approved', 'rejected', 'hidden');

-- CreateEnum
CREATE TYPE "public"."EmploymentType" AS ENUM ('fulltime', 'parttime', 'intern', 'contract');

-- CreateEnum
CREATE TYPE "public"."JobStatus" AS ENUM ('active', 'hidden', 'closed', 'expired');

-- CreateEnum
CREATE TYPE "public"."WorkMode" AS ENUM ('onsite', 'remote', 'hybrid');

-- CreateEnum
CREATE TYPE "public"."ExperienceLevel" AS ENUM ('fresher', 'junior', 'mid', 'senior', 'lead', 'intern');

-- CreateEnum
CREATE TYPE "public"."CvType" AS ENUM ('FILE', 'ONLINE');

-- CreateEnum
CREATE TYPE "public"."ApplicationStatus" AS ENUM ('pending', 'interviewing', 'accepted', 'rejected', 'withdrawn');

-- CreateEnum
CREATE TYPE "public"."NotificationType" AS ENUM ('system', 'application', 'company');

-- CreateEnum
CREATE TYPE "public"."TargetType" AS ENUM ('user', 'company', 'job');

-- CreateEnum
CREATE TYPE "public"."InterviewStatus" AS ENUM ('scheduled', 'rescheduled', 'cancelled', 'completed');

-- CreateEnum
CREATE TYPE "public"."InterviewMode" AS ENUM ('online', 'offline');

-- CreateEnum
CREATE TYPE "public"."PlanStatus" AS ENUM ('active', 'expired', 'cancelled');

-- CreateEnum
CREATE TYPE "public"."PlanHistoryStatus" AS ENUM ('completed', 'expired', 'cancelled');

-- CreateEnum
CREATE TYPE "public"."PaymentStatus" AS ENUM ('pending', 'paid', 'failed', 'cancelled', 'expired');

-- CreateEnum
CREATE TYPE "public"."PaymentMethod" AS ENUM ('vnpay');

-- CreateEnum
CREATE TYPE "public"."BoostTier" AS ENUM ('top_100', 'top_50', 'top_30', 'top_10');

-- CreateEnum
CREATE TYPE "public"."BoostStatus" AS ENUM ('active', 'expired', 'cancelled');

-- CreateEnum
CREATE TYPE "public"."CreditTxnType" AS ENUM ('grant', 'boost', 'refund');

-- CreateTable
CREATE TABLE "public"."Account" (
    "id" BIGSERIAL NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "role" "public"."Role" NOT NULL,
    "status" "public"."Status" NOT NULL DEFAULT 'active',
    "refreshToken" TEXT,
    "must_change_password" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Account_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."User" (
    "id" BIGSERIAL NOT NULL,
    "account_id" BIGINT NOT NULL,
    "full_name" TEXT NOT NULL,
    "phone" TEXT,
    "dob" TIMESTAMP(3),
    "gender" "public"."Gender",
    "address" TEXT,
    "avatar_url" TEXT,
    "avatar_public_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Candidate" (
    "id" BIGSERIAL NOT NULL,
    "user_id" BIGINT NOT NULL,
    "preferred_city" TEXT,
    "preferred_work_mode" "public"."WorkMode",
    "preferred_category" BIGINT,
    "preferred_salary" DOUBLE PRECISION,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Candidate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Industry" (
    "id" BIGSERIAL NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "Industry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Company" (
    "id" BIGSERIAL NOT NULL,
    "account_id" BIGINT NOT NULL,
    "name" TEXT NOT NULL,
    "logo_url" TEXT,
    "logo_public_id" TEXT,
    "website" TEXT,
    "description" TEXT,
    "headquarters" TEXT,
    "address" TEXT,
    "size" "public"."CompanySize",
    "business_code" TEXT,
    "representative_name" TEXT,
    "representative_position" TEXT,
    "license_file_url" TEXT,
    "license_file_public_id" TEXT,
    "contact_email" TEXT,
    "contact_phone" TEXT,
    "founded_date" TIMESTAMP(3),
    "status" "public"."CompanyStatus" NOT NULL DEFAULT 'pending',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Company_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."CompanySkill" (
    "id" BIGSERIAL NOT NULL,
    "company_id" BIGINT NOT NULL,
    "skill_id" BIGINT NOT NULL,

    CONSTRAINT "CompanySkill_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."CompanyIndustry" (
    "id" BIGSERIAL NOT NULL,
    "company_id" BIGINT NOT NULL,
    "industry_id" BIGINT NOT NULL,

    CONSTRAINT "CompanyIndustry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Job" (
    "id" BIGSERIAL NOT NULL,
    "company_id" BIGINT NOT NULL,
    "category_id" BIGINT NOT NULL,
    "title" TEXT NOT NULL,
    "salary_min" DOUBLE PRECISION,
    "salary_max" DOUBLE PRECISION,
    "negotiable" BOOLEAN NOT NULL DEFAULT false,
    "location_city" TEXT NOT NULL,
    "location_district" TEXT,
    "location_ward" TEXT,
    "location_street" TEXT,
    "location_full" TEXT,
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "work_modes" JSONB NOT NULL,
    "experience_levels" JSONB NOT NULL,
    "employment_type" "public"."EmploymentType" NOT NULL,
    "status" "public"."JobStatus" NOT NULL DEFAULT 'active',
    "deadline" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "number_of_openings" INTEGER NOT NULL DEFAULT 1,
    "views_count" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "Job_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."JobDetail" (
    "job_id" BIGINT NOT NULL,
    "description" TEXT,
    "requirements" TEXT,

    CONSTRAINT "JobDetail_pkey" PRIMARY KEY ("job_id")
);

-- CreateTable
CREATE TABLE "public"."Skill" (
    "id" BIGSERIAL NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "Skill_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."JobSkill" (
    "id" BIGSERIAL NOT NULL,
    "job_id" BIGINT NOT NULL,
    "skill_id" BIGINT NOT NULL,

    CONSTRAINT "JobSkill_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."CandidateSkill" (
    "id" BIGSERIAL NOT NULL,
    "candidate_id" BIGINT NOT NULL,
    "skill_id" BIGINT NOT NULL,

    CONSTRAINT "CandidateSkill_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."JobCategory" (
    "id" BIGSERIAL NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "JobCategory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Cv" (
    "id" BIGSERIAL NOT NULL,
    "candidate_id" BIGINT NOT NULL,
    "title" TEXT NOT NULL,
    "file_url" TEXT,
    "file_public_id" TEXT,
    "template_id" BIGINT,
    "content" JSONB,
    "type" "public"."CvType" NOT NULL DEFAULT 'ONLINE',
    "is_deleted" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Cv_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."CvTemplate" (
    "id" BIGSERIAL NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "preview_url" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CvTemplate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Application" (
    "id" BIGSERIAL NOT NULL,
    "job_id" BIGINT NOT NULL,
    "candidate_id" BIGINT NOT NULL,
    "cv_id" BIGINT NOT NULL,
    "status" "public"."ApplicationStatus" NOT NULL DEFAULT 'pending',
    "applied_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Application_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."SavedJob" (
    "id" BIGSERIAL NOT NULL,
    "candidate_id" BIGINT NOT NULL,
    "job_id" BIGINT NOT NULL,
    "saved_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SavedJob_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Notification" (
    "id" BIGSERIAL NOT NULL,
    "account_id" BIGINT NOT NULL,
    "type" "public"."NotificationType" NOT NULL,
    "message" TEXT NOT NULL,
    "is_read" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."AdminLog" (
    "id" BIGSERIAL NOT NULL,
    "admin_id" BIGINT NOT NULL,
    "action" TEXT NOT NULL,
    "target_type" "public"."TargetType" NOT NULL,
    "target_id" BIGINT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AdminLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."SiteStatistic" (
    "id" BIGSERIAL NOT NULL,
    "metric" TEXT NOT NULL,
    "value" INTEGER NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SiteStatistic_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."RecruiterStatistic" (
    "id" BIGSERIAL NOT NULL,
    "company_id" BIGINT NOT NULL,
    "metric" TEXT NOT NULL,
    "value" INTEGER NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RecruiterStatistic_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Interview" (
    "id" BIGSERIAL NOT NULL,
    "application_id" BIGINT NOT NULL,
    "scheduled_at" TIMESTAMP(3) NOT NULL,
    "mode" "public"."InterviewMode" NOT NULL,
    "location" TEXT,
    "meeting_link" TEXT,
    "status" "public"."InterviewStatus" NOT NULL DEFAULT 'scheduled',
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Interview_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Plan" (
    "id" BIGSERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "price" BIGINT NOT NULL,
    "job_limit" INTEGER NOT NULL,
    "credit_amount" INTEGER NOT NULL,
    "duration_days" INTEGER NOT NULL,
    "features" TEXT,
    "is_hidden" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Plan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."CompanyPlan" (
    "id" BIGSERIAL NOT NULL,
    "company_id" BIGINT NOT NULL,
    "plan_id" BIGINT NOT NULL,
    "start_date" TIMESTAMP(3) NOT NULL,
    "end_date" TIMESTAMP(3) NOT NULL,
    "purchased_price" BIGINT NOT NULL,
    "job_limit_snapshot" INTEGER NOT NULL,
    "credit_amount_snapshot" INTEGER NOT NULL,
    "jobs_left" INTEGER NOT NULL,
    "order_id" BIGINT,
    "credits_left" INTEGER NOT NULL,
    "status" "public"."PlanStatus" NOT NULL DEFAULT 'active',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CompanyPlan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."CompanyPlanHistory" (
    "id" BIGSERIAL NOT NULL,
    "company_id" BIGINT NOT NULL,
    "plan_id" BIGINT NOT NULL,
    "purchased_price" BIGINT NOT NULL,
    "job_limit_snapshot" INTEGER NOT NULL,
    "credit_amount_snapshot" INTEGER NOT NULL,
    "start_date" TIMESTAMP(3) NOT NULL,
    "end_date" TIMESTAMP(3) NOT NULL,
    "jobs_used" INTEGER NOT NULL,
    "credits_used" INTEGER NOT NULL,
    "status" "public"."PlanHistoryStatus" NOT NULL,
    "order_id" BIGINT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CompanyPlanHistory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."PaymentOrder" (
    "id" BIGSERIAL NOT NULL,
    "company_id" BIGINT NOT NULL,
    "plan_id" BIGINT NOT NULL,
    "amount" BIGINT NOT NULL,
    "payment_method" "public"."PaymentMethod" NOT NULL DEFAULT 'vnpay',
    "status" "public"."PaymentStatus" NOT NULL DEFAULT 'pending',
    "vnp_txn_ref" TEXT,
    "vnp_transaction_no" TEXT,
    "vnp_response_code" TEXT,
    "paid_at" TIMESTAMP(3),
    "expired_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PaymentOrder_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."BoostRule" (
    "id" BIGSERIAL NOT NULL,
    "tier" "public"."BoostTier" NOT NULL,
    "credits" INTEGER NOT NULL,
    "duration_days" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BoostRule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."JobBoost" (
    "id" BIGSERIAL NOT NULL,
    "job_id" BIGINT NOT NULL,
    "company_id" BIGINT NOT NULL,
    "tier" "public"."BoostTier" NOT NULL,
    "credits" INTEGER NOT NULL,
    "start_at" TIMESTAMP(3) NOT NULL,
    "end_at" TIMESTAMP(3) NOT NULL,
    "status" "public"."BoostStatus" NOT NULL DEFAULT 'active',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "JobBoost_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."CreditTransaction" (
    "id" BIGSERIAL NOT NULL,
    "company_id" BIGINT NOT NULL,
    "amount" INTEGER NOT NULL,
    "type" "public"."CreditTxnType" NOT NULL,
    "job_id" BIGINT,
    "order_id" BIGINT,
    "plan_id" BIGINT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CreditTransaction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."LocationCity" (
    "id" INTEGER NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "LocationCity_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."LocationWard" (
    "id" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "city_id" INTEGER NOT NULL,

    CONSTRAINT "LocationWard_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Account_email_key" ON "public"."Account"("email");

-- CreateIndex
CREATE UNIQUE INDEX "User_account_id_key" ON "public"."User"("account_id");

-- CreateIndex
CREATE UNIQUE INDEX "Candidate_user_id_key" ON "public"."Candidate"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "Industry_name_key" ON "public"."Industry"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Company_account_id_key" ON "public"."Company"("account_id");

-- CreateIndex
CREATE UNIQUE INDEX "Company_business_code_key" ON "public"."Company"("business_code");

-- CreateIndex
CREATE UNIQUE INDEX "CompanySkill_company_id_skill_id_key" ON "public"."CompanySkill"("company_id", "skill_id");

-- CreateIndex
CREATE UNIQUE INDEX "CompanyIndustry_company_id_industry_id_key" ON "public"."CompanyIndustry"("company_id", "industry_id");

-- CreateIndex
CREATE UNIQUE INDEX "Skill_name_key" ON "public"."Skill"("name");

-- CreateIndex
CREATE UNIQUE INDEX "JobCategory_name_key" ON "public"."JobCategory"("name");

-- CreateIndex
CREATE UNIQUE INDEX "CvTemplate_code_key" ON "public"."CvTemplate"("code");

-- CreateIndex
CREATE UNIQUE INDEX "CompanyPlan_company_id_key" ON "public"."CompanyPlan"("company_id");

-- CreateIndex
CREATE UNIQUE INDEX "CompanyPlan_order_id_key" ON "public"."CompanyPlan"("order_id");

-- CreateIndex
CREATE INDEX "CompanyPlan_company_id_status_end_date_idx" ON "public"."CompanyPlan"("company_id", "status", "end_date");

-- CreateIndex
CREATE INDEX "CompanyPlanHistory_company_id_status_end_date_created_at_idx" ON "public"."CompanyPlanHistory"("company_id", "status", "end_date", "created_at");

-- AddForeignKey
ALTER TABLE "public"."User" ADD CONSTRAINT "User_account_id_fkey" FOREIGN KEY ("account_id") REFERENCES "public"."Account"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Candidate" ADD CONSTRAINT "Candidate_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Company" ADD CONSTRAINT "Company_account_id_fkey" FOREIGN KEY ("account_id") REFERENCES "public"."Account"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."CompanySkill" ADD CONSTRAINT "CompanySkill_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "public"."Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."CompanySkill" ADD CONSTRAINT "CompanySkill_skill_id_fkey" FOREIGN KEY ("skill_id") REFERENCES "public"."Skill"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."CompanyIndustry" ADD CONSTRAINT "CompanyIndustry_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "public"."Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."CompanyIndustry" ADD CONSTRAINT "CompanyIndustry_industry_id_fkey" FOREIGN KEY ("industry_id") REFERENCES "public"."Industry"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Job" ADD CONSTRAINT "Job_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "public"."Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Job" ADD CONSTRAINT "Job_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "public"."JobCategory"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."JobDetail" ADD CONSTRAINT "JobDetail_job_id_fkey" FOREIGN KEY ("job_id") REFERENCES "public"."Job"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."JobSkill" ADD CONSTRAINT "JobSkill_job_id_fkey" FOREIGN KEY ("job_id") REFERENCES "public"."Job"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."JobSkill" ADD CONSTRAINT "JobSkill_skill_id_fkey" FOREIGN KEY ("skill_id") REFERENCES "public"."Skill"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."CandidateSkill" ADD CONSTRAINT "CandidateSkill_candidate_id_fkey" FOREIGN KEY ("candidate_id") REFERENCES "public"."Candidate"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."CandidateSkill" ADD CONSTRAINT "CandidateSkill_skill_id_fkey" FOREIGN KEY ("skill_id") REFERENCES "public"."Skill"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Cv" ADD CONSTRAINT "Cv_candidate_id_fkey" FOREIGN KEY ("candidate_id") REFERENCES "public"."Candidate"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Cv" ADD CONSTRAINT "Cv_template_id_fkey" FOREIGN KEY ("template_id") REFERENCES "public"."CvTemplate"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Application" ADD CONSTRAINT "Application_job_id_fkey" FOREIGN KEY ("job_id") REFERENCES "public"."Job"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Application" ADD CONSTRAINT "Application_candidate_id_fkey" FOREIGN KEY ("candidate_id") REFERENCES "public"."Candidate"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Application" ADD CONSTRAINT "Application_cv_id_fkey" FOREIGN KEY ("cv_id") REFERENCES "public"."Cv"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."SavedJob" ADD CONSTRAINT "SavedJob_candidate_id_fkey" FOREIGN KEY ("candidate_id") REFERENCES "public"."Candidate"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."SavedJob" ADD CONSTRAINT "SavedJob_job_id_fkey" FOREIGN KEY ("job_id") REFERENCES "public"."Job"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Notification" ADD CONSTRAINT "Notification_account_id_fkey" FOREIGN KEY ("account_id") REFERENCES "public"."Account"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."AdminLog" ADD CONSTRAINT "AdminLog_admin_id_fkey" FOREIGN KEY ("admin_id") REFERENCES "public"."Account"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."RecruiterStatistic" ADD CONSTRAINT "RecruiterStatistic_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "public"."Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Interview" ADD CONSTRAINT "Interview_application_id_fkey" FOREIGN KEY ("application_id") REFERENCES "public"."Application"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."CompanyPlan" ADD CONSTRAINT "CompanyPlan_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "public"."Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."CompanyPlan" ADD CONSTRAINT "CompanyPlan_plan_id_fkey" FOREIGN KEY ("plan_id") REFERENCES "public"."Plan"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."CompanyPlan" ADD CONSTRAINT "CompanyPlan_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "public"."PaymentOrder"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."CompanyPlanHistory" ADD CONSTRAINT "CompanyPlanHistory_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "public"."Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."CompanyPlanHistory" ADD CONSTRAINT "CompanyPlanHistory_plan_id_fkey" FOREIGN KEY ("plan_id") REFERENCES "public"."Plan"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."CompanyPlanHistory" ADD CONSTRAINT "CompanyPlanHistory_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "public"."PaymentOrder"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."PaymentOrder" ADD CONSTRAINT "PaymentOrder_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "public"."Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."PaymentOrder" ADD CONSTRAINT "PaymentOrder_plan_id_fkey" FOREIGN KEY ("plan_id") REFERENCES "public"."Plan"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."JobBoost" ADD CONSTRAINT "JobBoost_job_id_fkey" FOREIGN KEY ("job_id") REFERENCES "public"."Job"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."JobBoost" ADD CONSTRAINT "JobBoost_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "public"."Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."CreditTransaction" ADD CONSTRAINT "CreditTransaction_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "public"."Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."CreditTransaction" ADD CONSTRAINT "CreditTransaction_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "public"."PaymentOrder"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."CreditTransaction" ADD CONSTRAINT "CreditTransaction_plan_id_fkey" FOREIGN KEY ("plan_id") REFERENCES "public"."Plan"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."CreditTransaction" ADD CONSTRAINT "CreditTransaction_job_id_fkey" FOREIGN KEY ("job_id") REFERENCES "public"."Job"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."LocationWard" ADD CONSTRAINT "LocationWard_city_id_fkey" FOREIGN KEY ("city_id") REFERENCES "public"."LocationCity"("id") ON DELETE CASCADE ON UPDATE CASCADE;
