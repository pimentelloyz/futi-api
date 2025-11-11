-- AlterTable
ALTER TABLE `Match` ADD COLUMN `venue` VARCHAR(191) NULL;

-- CreateTable
CREATE TABLE `MatchEvent` (
    `id` VARCHAR(191) NOT NULL,
    `matchId` VARCHAR(191) NOT NULL,
    `teamId` VARCHAR(191) NULL,
    `playerId` VARCHAR(191) NULL,
    `minute` INTEGER NULL,
    `type` ENUM('GOAL', 'FOUL', 'YELLOW_CARD', 'RED_CARD', 'OWN_GOAL') NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `MatchEvent_matchId_idx`(`matchId`),
    INDEX `MatchEvent_playerId_idx`(`playerId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `PlayerSkill` (
    `id` VARCHAR(191) NOT NULL,
    `playerId` VARCHAR(191) NOT NULL,
    `preferredFoot` ENUM('LEFT', 'RIGHT', 'BOTH') NOT NULL,
    `attack` INTEGER NOT NULL DEFAULT 50,
    `defense` INTEGER NOT NULL DEFAULT 50,
    `shooting` INTEGER NOT NULL DEFAULT 50,
    `ballControl` INTEGER NOT NULL DEFAULT 50,
    `pace` INTEGER NOT NULL DEFAULT 50,
    `passing` INTEGER NOT NULL DEFAULT 50,
    `dribbling` INTEGER NOT NULL DEFAULT 50,
    `physical` INTEGER NOT NULL DEFAULT 50,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `PlayerSkill_playerId_key`(`playerId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `MatchEvent` ADD CONSTRAINT `MatchEvent_matchId_fkey` FOREIGN KEY (`matchId`) REFERENCES `Match`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `MatchEvent` ADD CONSTRAINT `MatchEvent_teamId_fkey` FOREIGN KEY (`teamId`) REFERENCES `Team`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `MatchEvent` ADD CONSTRAINT `MatchEvent_playerId_fkey` FOREIGN KEY (`playerId`) REFERENCES `Player`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `PlayerSkill` ADD CONSTRAINT `PlayerSkill_playerId_fkey` FOREIGN KEY (`playerId`) REFERENCES `Player`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
