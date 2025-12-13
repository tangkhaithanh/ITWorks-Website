/*
  Warnings:

  - Added the required column `credit_amount_snapshot` to the `CompanyPlan` table without a default value. This is not possible if the table is not empty.
  - Added the required column `job_limit_snapshot` to the `CompanyPlan` table without a default value. This is not possible if the table is not empty.
  - Added the required column `purchased_price` to the `CompanyPlan` table without a default value. This is not possible if the table is not empty.
  - Added the required column `credit_amount_snapshot` to the `CompanyPlanHistory` table without a default value. This is not possible if the table is not empty.
  - Added the required column `job_limit_snapshot` to the `CompanyPlanHistory` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `companyplan` ADD COLUMN `credit_amount_snapshot` INTEGER NOT NULL,
    ADD COLUMN `job_limit_snapshot` INTEGER NOT NULL,
    ADD COLUMN `purchased_price` DOUBLE NOT NULL;

-- AlterTable
ALTER TABLE `companyplanhistory` ADD COLUMN `credit_amount_snapshot` INTEGER NOT NULL,
    ADD COLUMN `job_limit_snapshot` INTEGER NOT NULL;

-- CreateIndex
CREATE INDEX `CompanyPlan_company_id_status_end_date_idx` ON `CompanyPlan`(`company_id`, `status`, `end_date`);

-- CreateIndex
CREATE INDEX `CompanyPlanHistory_company_id_status_end_date_created_at_idx` ON `CompanyPlanHistory`(`company_id`, `status`, `end_date`, `created_at`);
