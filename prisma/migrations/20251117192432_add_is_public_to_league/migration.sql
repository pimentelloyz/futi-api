/*
  Warnings:

  - A unique constraint covering the columns `[userId,teamId,leagueId,matchId]` on the table `AccessMembership` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "AccessRole" ADD VALUE 'LEAGUE_MANAGER';
ALTER TYPE "AccessRole" ADD VALUE 'MATCH_MANAGER';
ALTER TYPE "AccessRole" ADD VALUE 'REFEREE_COMMISSION';
ALTER TYPE "AccessRole" ADD VALUE 'FAN';

-- DropIndex
DROP INDEX "AccessMembership_userId_teamId_leagueId_key";

-- AlterTable
ALTER TABLE "AccessMembership" ADD COLUMN     "matchId" TEXT;

-- AlterTable
ALTER TABLE "League" ADD COLUMN     "isPublic" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "LeagueInvitation" (
    "id" TEXT NOT NULL,
    "code" VARCHAR(64) NOT NULL,
    "leagueId" TEXT NOT NULL,
    "createdBy" VARCHAR(191),
    "maxUses" INTEGER NOT NULL DEFAULT 1,
    "uses" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "expiresAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LeagueInvitation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InvitationCode" (
    "id" TEXT NOT NULL,
    "code" VARCHAR(64) NOT NULL,
    "teamId" TEXT NOT NULL,
    "createdBy" VARCHAR(191),
    "maxUses" INTEGER NOT NULL DEFAULT 1,
    "uses" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "expiresAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "InvitationCode_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "LeagueInvitation_code_key" ON "LeagueInvitation"("code");

-- CreateIndex
CREATE INDEX "LeagueInvitation_leagueId_idx" ON "LeagueInvitation"("leagueId");

-- CreateIndex
CREATE UNIQUE INDEX "InvitationCode_code_key" ON "InvitationCode"("code");

-- CreateIndex
CREATE INDEX "InvitationCode_teamId_idx" ON "InvitationCode"("teamId");

-- CreateIndex
CREATE INDEX "AccessMembership_matchId_idx" ON "AccessMembership"("matchId");

-- CreateIndex
CREATE UNIQUE INDEX "AccessMembership_userId_teamId_leagueId_matchId_key" ON "AccessMembership"("userId", "teamId", "leagueId", "matchId");

-- AddForeignKey
ALTER TABLE "AccessMembership" ADD CONSTRAINT "AccessMembership_matchId_fkey" FOREIGN KEY ("matchId") REFERENCES "Match"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LeagueInvitation" ADD CONSTRAINT "LeagueInvitation_leagueId_fkey" FOREIGN KEY ("leagueId") REFERENCES "League"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InvitationCode" ADD CONSTRAINT "InvitationCode_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
