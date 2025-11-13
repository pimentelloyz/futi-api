/*
  Warnings:

  - You are about to drop the `_PlayerToTeam` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[homeTeamId,awayTeamId,scheduledAt]` on the table `Match` will be added. If there are existing duplicate values, this will fail.

*/
-- DropForeignKey
ALTER TABLE "_PlayerToTeam" DROP CONSTRAINT "_PlayerToTeam_A_fkey";

-- DropForeignKey
ALTER TABLE "_PlayerToTeam" DROP CONSTRAINT "_PlayerToTeam_B_fkey";

-- DropTable
DROP TABLE "_PlayerToTeam";

-- CreateTable
CREATE TABLE "PlayersOnTeams" (
    "playerId" TEXT NOT NULL,
    "teamId" TEXT NOT NULL,
    "assignedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "assignedBy" TEXT,

    CONSTRAINT "PlayersOnTeams_pkey" PRIMARY KEY ("playerId","teamId")
);

-- CreateIndex
CREATE UNIQUE INDEX "Match_homeTeamId_awayTeamId_scheduledAt_key" ON "Match"("homeTeamId", "awayTeamId", "scheduledAt");

-- AddForeignKey
ALTER TABLE "PlayersOnTeams" ADD CONSTRAINT "PlayersOnTeams_playerId_fkey" FOREIGN KEY ("playerId") REFERENCES "Player"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlayersOnTeams" ADD CONSTRAINT "PlayersOnTeams_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
