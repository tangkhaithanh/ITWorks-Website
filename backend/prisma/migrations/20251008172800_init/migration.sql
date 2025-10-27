/*
  Warnings:

  - You are about to drop the column `industry_id` on the `company` table. All the data in the column will be lost.
  - You are about to drop the column `experience_level` on the `job` table. All the data in the column will be lost.
  - You are about to drop the column `location` on the `job` table. All the data in the column will be lost.
  - You are about to drop the column `work_mode` on the `job` table. All the data in the column will be lost.
  - Added the required column `experience_levels` to the `Job` table without a default value. This is not possible if the table is not empty.
  - Added the required column `location_city` to the `Job` table without a default value. This is not possible if the table is not empty.
  - Added the required column `work_modes` to the `Job` table without a default value. This is not possible if the table is not empty.
  - Made the column `salary_min` on table `job` required. This step will fail if there are existing NULL values in that column.
  - Made the column `salary_max` on table `job` required. This step will fail if there are existing NULL values in that column.
  - Made the column `category_id` on table `job` required. This step will fail if there are existing NULL values in that column.

*/
-- DropForeignKey
ALTER TABLE `company` DROP FOREIGN KEY `Company_industry_id_fkey`;

-- DropForeignKey
ALTER TABLE `job` DROP FOREIGN KEY `Job_category_id_fkey`;

-- DropIndex
DROP INDEX `Company_industry_id_fkey` ON `company`;

-- DropIndex
DROP INDEX `Job_category_id_fkey` ON `job`;

-- AlterTable
ALTER TABLE `company` DROP COLUMN `industry_id`;

-- AlterTable
ALTER TABLE `job` DROP COLUMN `experience_level`,
    DROP COLUMN `location`,
    DROP COLUMN `work_mode`,
    ADD COLUMN `experience_levels` JSON NOT NULL,
    ADD COLUMN `latitude` DOUBLE NULL,
    ADD COLUMN `location_city` VARCHAR(191) NOT NULL,
    ADD COLUMN `location_district` VARCHAR(191) NULL,
    ADD COLUMN `location_full` VARCHAR(191) NULL,
    ADD COLUMN `location_street` VARCHAR(191) NULL,
    ADD COLUMN `location_ward` VARCHAR(191) NULL,
    ADD COLUMN `longitude` DOUBLE NULL,
    ADD COLUMN `work_modes` JSON NOT NULL,
    MODIFY `salary_min` DOUBLE NOT NULL,
    MODIFY `salary_max` DOUBLE NOT NULL,
    MODIFY `category_id` BIGINT NOT NULL;

-- CreateTable
CREATE TABLE `CompanySkill` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `company_id` BIGINT NOT NULL,
    `skill_id` BIGINT NOT NULL,

    UNIQUE INDEX `CompanySkill_company_id_skill_id_key`(`company_id`, `skill_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `CompanyIndustry` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `company_id` BIGINT NOT NULL,
    `industry_id` BIGINT NOT NULL,

    UNIQUE INDEX `CompanyIndustry_company_id_industry_id_key`(`company_id`, `industry_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `CompanySkill` ADD CONSTRAINT `CompanySkill_company_id_fkey` FOREIGN KEY (`company_id`) REFERENCES `Company`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `CompanySkill` ADD CONSTRAINT `CompanySkill_skill_id_fkey` FOREIGN KEY (`skill_id`) REFERENCES `Skill`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `CompanyIndustry` ADD CONSTRAINT `CompanyIndustry_company_id_fkey` FOREIGN KEY (`company_id`) REFERENCES `Company`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `CompanyIndustry` ADD CONSTRAINT `CompanyIndustry_industry_id_fkey` FOREIGN KEY (`industry_id`) REFERENCES `Industry`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Job` ADD CONSTRAINT `Job_category_id_fkey` FOREIGN KEY (`category_id`) REFERENCES `JobCategory`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
