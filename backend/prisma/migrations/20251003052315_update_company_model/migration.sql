/*
  Warnings:

  - A unique constraint covering the columns `[business_code]` on the table `Company` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE `company` ADD COLUMN `business_code` VARCHAR(191) NULL,
    ADD COLUMN `contact_email` VARCHAR(191) NULL,
    ADD COLUMN `contact_phone` VARCHAR(191) NULL,
    ADD COLUMN `founded_date` DATETIME(3) NULL,
    ADD COLUMN `headquarters` VARCHAR(191) NULL,
    ADD COLUMN `license_file_url` VARCHAR(191) NULL,
    ADD COLUMN `representative_name` VARCHAR(191) NULL,
    ADD COLUMN `representative_position` VARCHAR(191) NULL;

-- CreateIndex
CREATE UNIQUE INDEX `Company_business_code_key` ON `Company`(`business_code`);
