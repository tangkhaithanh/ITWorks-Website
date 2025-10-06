/*
  Warnings:

  - Added the required column `logo_public_id` to the `Company` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `company` ADD COLUMN `logo_public_id` VARCHAR(191) NOT NULL;
