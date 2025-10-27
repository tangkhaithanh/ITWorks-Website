-- AlterTable
ALTER TABLE `job` ADD COLUMN `number_of_openings` INTEGER NOT NULL DEFAULT 1,
    ADD COLUMN `views_count` INTEGER NOT NULL DEFAULT 0;
