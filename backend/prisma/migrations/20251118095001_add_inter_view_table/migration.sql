-- AlterTable
ALTER TABLE `application` MODIFY `status` ENUM('pending', 'interviewing', 'accepted', 'rejected', 'withdrawn') NOT NULL DEFAULT 'pending';

-- CreateTable
CREATE TABLE `Interview` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `application_id` BIGINT NOT NULL,
    `scheduled_at` DATETIME(3) NOT NULL,
    `mode` ENUM('online', 'offline') NOT NULL,
    `location` VARCHAR(191) NULL,
    `meeting_link` VARCHAR(191) NULL,
    `status` ENUM('scheduled', 'rescheduled', 'cancelled', 'completed') NOT NULL DEFAULT 'scheduled',
    `notes` VARCHAR(191) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `Interview` ADD CONSTRAINT `Interview_application_id_fkey` FOREIGN KEY (`application_id`) REFERENCES `Application`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
