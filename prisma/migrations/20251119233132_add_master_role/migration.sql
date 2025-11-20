-- AlterEnum
ALTER TYPE "AccessRole" ADD VALUE 'MASTER';

-- CreateIndex
CREATE INDEX "Match_homeTeamId_scheduledAt_idx" ON "Match"("homeTeamId", "scheduledAt");

-- CreateIndex
CREATE INDEX "Match_awayTeamId_scheduledAt_idx" ON "Match"("awayTeamId", "scheduledAt");
