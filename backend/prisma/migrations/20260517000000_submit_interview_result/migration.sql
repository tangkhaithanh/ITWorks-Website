DO $$ BEGIN
    CREATE TYPE "public"."InterviewResult" AS ENUM ('pass', 'reject', 'hold');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

ALTER TYPE "public"."InterviewStatus" ADD VALUE IF NOT EXISTS 'no_show';

ALTER TABLE "public"."Interview"
ADD COLUMN IF NOT EXISTS "result" "public"."InterviewResult";
