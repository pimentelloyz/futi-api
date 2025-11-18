-- CreateEnum
CREATE TYPE "LeagueFormatType" AS ENUM ('ROUND_ROBIN', 'KNOCKOUT', 'MIXED', 'LEAGUE_PHASE', 'CUSTOM');

-- CreateEnum
CREATE TYPE "PhaseType" AS ENUM ('GROUP_STAGE', 'KNOCKOUT', 'LEAGUE', 'PLAYOFF');

-- CreateEnum
CREATE TYPE "TiebreakCriterion" AS ENUM ('POINTS', 'WINS', 'GOAL_DIFFERENCE', 'GOALS_FOR', 'GOALS_AGAINST', 'HEAD_TO_HEAD_POINTS', 'HEAD_TO_HEAD_GOAL_DIFF', 'HEAD_TO_HEAD_GOALS_FOR', 'HEAD_TO_HEAD_GOALS_AWAY', 'AWAY_GOALS', 'WINS_AWAY', 'FAIR_PLAY', 'RED_CARDS', 'YELLOW_CARDS', 'DRAW', 'UEFA_COEFFICIENT');

-- AlterTable
ALTER TABLE "League" ADD COLUMN     "formatId" TEXT;

-- AlterTable
ALTER TABLE "LeagueGroup" ADD COLUMN     "phaseId" TEXT;

-- CreateTable
CREATE TABLE "LeagueFormat" (
    "id" TEXT NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "slug" VARCHAR(100) NOT NULL,
    "description" TEXT,
    "type" "LeagueFormatType" NOT NULL,
    "isTemplate" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LeagueFormat_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LeaguePhaseConfig" (
    "id" TEXT NOT NULL,
    "formatId" TEXT NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "order" INTEGER NOT NULL,
    "type" "PhaseType" NOT NULL,
    "teamsCount" INTEGER,
    "groupsCount" INTEGER,
    "teamsPerGroup" INTEGER,
    "hasHomeAway" BOOLEAN NOT NULL DEFAULT true,
    "hasExtraTime" BOOLEAN NOT NULL DEFAULT false,
    "hasPenalties" BOOLEAN NOT NULL DEFAULT false,
    "hasAwayGoal" BOOLEAN NOT NULL DEFAULT false,
    "advancingTeams" INTEGER,
    "advancingFrom" VARCHAR(50),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LeaguePhaseConfig_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LeaguePhase" (
    "id" TEXT NOT NULL,
    "leagueId" TEXT NOT NULL,
    "configId" TEXT,
    "name" VARCHAR(100) NOT NULL,
    "order" INTEGER NOT NULL,
    "type" "PhaseType" NOT NULL,
    "status" VARCHAR(20) NOT NULL DEFAULT 'NOT_STARTED',
    "startDate" TIMESTAMP(3),
    "endDate" TIMESTAMP(3),
    "hasHomeAway" BOOLEAN NOT NULL DEFAULT true,
    "hasExtraTime" BOOLEAN NOT NULL DEFAULT false,
    "hasPenalties" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LeaguePhase_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TiebreakRule" (
    "id" TEXT NOT NULL,
    "configId" TEXT NOT NULL,
    "order" INTEGER NOT NULL,
    "criterion" "TiebreakCriterion" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TiebreakRule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DisciplineRule" (
    "id" TEXT NOT NULL,
    "leagueId" TEXT NOT NULL,
    "yellowCardsForSuspension" INTEGER NOT NULL DEFAULT 3,
    "yellowCardsAccumulation" BOOLEAN NOT NULL DEFAULT true,
    "resetYellowsAfterPhaseOrder" INTEGER,
    "redCardMinimumGames" INTEGER NOT NULL DEFAULT 1,
    "doubleYellowGames" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DisciplineRule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LeagueStanding" (
    "id" TEXT NOT NULL,
    "phaseId" TEXT NOT NULL,
    "teamId" TEXT NOT NULL,
    "groupId" TEXT,
    "position" INTEGER,
    "played" INTEGER NOT NULL DEFAULT 0,
    "wins" INTEGER NOT NULL DEFAULT 0,
    "draws" INTEGER NOT NULL DEFAULT 0,
    "losses" INTEGER NOT NULL DEFAULT 0,
    "goalsFor" INTEGER NOT NULL DEFAULT 0,
    "goalsAgainst" INTEGER NOT NULL DEFAULT 0,
    "goalDifference" INTEGER NOT NULL DEFAULT 0,
    "points" INTEGER NOT NULL DEFAULT 0,
    "winsHome" INTEGER NOT NULL DEFAULT 0,
    "winsAway" INTEGER NOT NULL DEFAULT 0,
    "goalsHome" INTEGER NOT NULL DEFAULT 0,
    "goalsAway" INTEGER NOT NULL DEFAULT 0,
    "yellowCards" INTEGER NOT NULL DEFAULT 0,
    "redCards" INTEGER NOT NULL DEFAULT 0,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LeagueStanding_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "LeagueFormat_slug_key" ON "LeagueFormat"("slug");

-- CreateIndex
CREATE INDEX "LeagueFormat_slug_idx" ON "LeagueFormat"("slug");

-- CreateIndex
CREATE INDEX "LeagueFormat_isTemplate_idx" ON "LeagueFormat"("isTemplate");

-- CreateIndex
CREATE INDEX "LeaguePhaseConfig_formatId_idx" ON "LeaguePhaseConfig"("formatId");

-- CreateIndex
CREATE INDEX "LeaguePhaseConfig_order_idx" ON "LeaguePhaseConfig"("order");

-- CreateIndex
CREATE INDEX "LeaguePhase_leagueId_idx" ON "LeaguePhase"("leagueId");

-- CreateIndex
CREATE INDEX "LeaguePhase_status_idx" ON "LeaguePhase"("status");

-- CreateIndex
CREATE UNIQUE INDEX "LeaguePhase_leagueId_order_key" ON "LeaguePhase"("leagueId", "order");

-- CreateIndex
CREATE INDEX "TiebreakRule_configId_idx" ON "TiebreakRule"("configId");

-- CreateIndex
CREATE UNIQUE INDEX "TiebreakRule_configId_order_key" ON "TiebreakRule"("configId", "order");

-- CreateIndex
CREATE UNIQUE INDEX "DisciplineRule_leagueId_key" ON "DisciplineRule"("leagueId");

-- CreateIndex
CREATE INDEX "DisciplineRule_leagueId_idx" ON "DisciplineRule"("leagueId");

-- CreateIndex
CREATE INDEX "LeagueStanding_phaseId_idx" ON "LeagueStanding"("phaseId");

-- CreateIndex
CREATE INDEX "LeagueStanding_teamId_idx" ON "LeagueStanding"("teamId");

-- CreateIndex
CREATE INDEX "LeagueStanding_groupId_idx" ON "LeagueStanding"("groupId");

-- CreateIndex
CREATE UNIQUE INDEX "LeagueStanding_phaseId_teamId_groupId_key" ON "LeagueStanding"("phaseId", "teamId", "groupId");

-- CreateIndex
CREATE INDEX "League_formatId_idx" ON "League"("formatId");

-- CreateIndex
CREATE INDEX "LeagueGroup_phaseId_idx" ON "LeagueGroup"("phaseId");

-- AddForeignKey
ALTER TABLE "League" ADD CONSTRAINT "League_formatId_fkey" FOREIGN KEY ("formatId") REFERENCES "LeagueFormat"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LeagueGroup" ADD CONSTRAINT "LeagueGroup_phaseId_fkey" FOREIGN KEY ("phaseId") REFERENCES "LeaguePhase"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LeaguePhaseConfig" ADD CONSTRAINT "LeaguePhaseConfig_formatId_fkey" FOREIGN KEY ("formatId") REFERENCES "LeagueFormat"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LeaguePhase" ADD CONSTRAINT "LeaguePhase_leagueId_fkey" FOREIGN KEY ("leagueId") REFERENCES "League"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LeaguePhase" ADD CONSTRAINT "LeaguePhase_configId_fkey" FOREIGN KEY ("configId") REFERENCES "LeaguePhaseConfig"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TiebreakRule" ADD CONSTRAINT "TiebreakRule_configId_fkey" FOREIGN KEY ("configId") REFERENCES "LeaguePhaseConfig"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DisciplineRule" ADD CONSTRAINT "DisciplineRule_leagueId_fkey" FOREIGN KEY ("leagueId") REFERENCES "League"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LeagueStanding" ADD CONSTRAINT "LeagueStanding_phaseId_fkey" FOREIGN KEY ("phaseId") REFERENCES "LeaguePhase"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LeagueStanding" ADD CONSTRAINT "LeagueStanding_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LeagueStanding" ADD CONSTRAINT "LeagueStanding_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "LeagueGroup"("id") ON DELETE SET NULL ON UPDATE CASCADE;
