-- AlterTable
ALTER TABLE `cv` ADD COLUMN `type` ENUM('FILE', 'ONLINE') NOT NULL DEFAULT 'ONLINE';

-- AlterTable
ALTER TABLE `jobdetail` MODIFY `description` LONGTEXT NULL,
    MODIFY `requirements` LONGTEXT NULL;
