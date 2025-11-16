/*
  Warnings:

  - A unique constraint covering the columns `[userId,teamId,leagueId]` on the table `AccessMembership` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX IF EXISTS "AccessMembership_userId_teamId_key";

-- AlterTable
ALTER TABLE "AccessMembership" ADD COLUMN     "leagueId" TEXT;

-- CreateIndex
CREATE INDEX "AccessMembership_leagueId_idx" ON "AccessMembership"("leagueId");

-- CreateIndex
CREATE UNIQUE INDEX "AccessMembership_userId_teamId_leagueId_key" ON "AccessMembership"("userId", "teamId", "leagueId");

-- AddForeignKey
ALTER TABLE "AccessMembership" ADD CONSTRAINT "AccessMembership_leagueId_fkey" FOREIGN KEY ("leagueId") REFERENCES "League"("id") ON DELETE SET NULL ON UPDATE CASCADE;
