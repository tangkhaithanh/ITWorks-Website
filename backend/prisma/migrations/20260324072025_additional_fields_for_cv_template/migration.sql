/*
  Warnings:

  - A unique constraint covering the columns `[code,version]` on the table `CvTemplate` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `layout_schema` to the `CvTemplate` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "public"."Cv" ADD COLUMN     "template_version" INTEGER;

-- AlterTable
ALTER TABLE "public"."CvTemplate" ADD COLUMN     "is_active" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "layout_schema" JSONB NOT NULL,
ADD COLUMN     "style_tokens" JSONB,
ADD COLUMN     "version" INTEGER NOT NULL DEFAULT 1;

-- CreateIndex
CREATE UNIQUE INDEX "CvTemplate_code_version_key" ON "public"."CvTemplate"("code", "version");
