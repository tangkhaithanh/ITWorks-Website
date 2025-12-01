/*
  Warnings:

  - You are about to drop the column `education` on the `candidate` table. All the data in the column will be lost.
  - You are about to drop the column `experience` on the `candidate` table. All the data in the column will be lost.
  - You are about to drop the column `level` on the `candidateskill` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE `candidate` DROP COLUMN `education`,
    DROP COLUMN `experience`,
    ADD COLUMN `preferred_category` BIGINT NULL,
    ADD COLUMN `preferred_city` VARCHAR(191) NULL,
    ADD COLUMN `preferred_salary` DOUBLE NULL,
    ADD COLUMN `preferred_work_mode` ENUM('onsite', 'remote', 'hybrid') NULL;

-- AlterTable
ALTER TABLE `candidateskill` DROP COLUMN `level`;
