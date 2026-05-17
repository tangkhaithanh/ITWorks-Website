-- AlterTable
ALTER TABLE "public"."Candidate" ADD COLUMN     "desired_role" TEXT,
ADD COLUMN     "desired_salary_max" DOUBLE PRECISION,
ADD COLUMN     "desired_salary_min" DOUBLE PRECISION,
ADD COLUMN     "education_level" TEXT,
ADD COLUMN     "email" TEXT,
ADD COLUMN     "experience_years" DOUBLE PRECISION,
ADD COLUMN     "full_name" TEXT,
ADD COLUMN     "open_to_work" BOOLEAN DEFAULT true,
ADD COLUMN     "phone" TEXT;
