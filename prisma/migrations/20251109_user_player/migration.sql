-- Add userId column to Player and set up one-to-one relation with User
ALTER TABLE `Player`
  ADD COLUMN `userId` VARCHAR(191) NULL,
  ADD UNIQUE INDEX `Player_userId_key` (`userId`);

ALTER TABLE `Player`
  ADD CONSTRAINT `Player_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
