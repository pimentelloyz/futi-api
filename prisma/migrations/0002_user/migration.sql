-- Migration for User model (apply manually if needed)
CREATE TABLE `User` (
	`id` VARCHAR(191) NOT NULL,
	`firebaseUid` VARCHAR(128) NOT NULL,
	`email` VARCHAR(191) NULL,
	`displayName` VARCHAR(191) NULL,
	`createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
	`updatedAt` DATETIME(3) NOT NULL,
	UNIQUE INDEX `User_firebaseUid_key` (`firebaseUid`),
	UNIQUE INDEX `User_email_key` (`email`),
	PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

