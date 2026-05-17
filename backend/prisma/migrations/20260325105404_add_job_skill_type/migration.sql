/*
  Warnings:

  - You are about to drop the column `email` on the `Candidate` table. All the data in the column will be lost.
  - You are about to drop the column `full_name` on the `Candidate` table. All the data in the column will be lost.
  - You are about to drop the column `phone` on the `Candidate` table. All the data in the column will be lost.

*/
-- CreateEnum
CREATE TYPE "public"."JobSkillType" AS ENUM ('REQUIRED', 'NICE_TO_HAVE');

-- AlterTable
ALTER TABLE "public"."Candidate" DROP COLUMN "email",
DROP COLUMN "full_name",
DROP COLUMN "phone";

-- AlterTable
ALTER TABLE "public"."JobSkill" ADD COLUMN     "type" "public"."JobSkillType" NOT NULL DEFAULT 'REQUIRED';
