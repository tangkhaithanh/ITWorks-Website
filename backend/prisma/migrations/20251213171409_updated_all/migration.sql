/*
  Warnings:

  - You are about to drop the column `jobs_used` on the `companyplan` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[order_id]` on the table `CompanyPlan` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `jobs_left` to the `CompanyPlan` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `companyplan` DROP COLUMN `jobs_used`,
    ADD COLUMN `jobs_left` INTEGER NOT NULL,
    ADD COLUMN `order_id` BIGINT NULL;

-- AlterTable
ALTER TABLE `credittransaction` ADD COLUMN `order_id` BIGINT NULL,
    ADD COLUMN `plan_id` BIGINT NULL;

-- AlterTable
ALTER TABLE `paymentorder` MODIFY `amount` BIGINT NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX `CompanyPlan_order_id_key` ON `CompanyPlan`(`order_id`);

-- AddForeignKey
ALTER TABLE `CompanyPlan` ADD CONSTRAINT `CompanyPlan_order_id_fkey` FOREIGN KEY (`order_id`) REFERENCES `PaymentOrder`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `CreditTransaction` ADD CONSTRAINT `CreditTransaction_order_id_fkey` FOREIGN KEY (`order_id`) REFERENCES `PaymentOrder`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `CreditTransaction` ADD CONSTRAINT `CreditTransaction_plan_id_fkey` FOREIGN KEY (`plan_id`) REFERENCES `Plan`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `CreditTransaction` ADD CONSTRAINT `CreditTransaction_job_id_fkey` FOREIGN KEY (`job_id`) REFERENCES `Job`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
