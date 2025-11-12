-- CreateEnum
CREATE TYPE "MatchStatus" AS ENUM ('SCHEDULED', 'IN_PROGRESS', 'FINISHED', 'CANCELED');

-- CreateEnum
CREATE TYPE "AccessRole" AS ENUM ('ADMIN', 'MANAGER', 'ASSISTANT', 'PLAYER');

-- CreateEnum
CREATE TYPE "MatchEventType" AS ENUM ('GOAL', 'FOUL', 'YELLOW_CARD', 'RED_CARD', 'OWN_GOAL');

-- CreateEnum
CREATE TYPE "PreferredFoot" AS ENUM ('LEFT', 'RIGHT', 'BOTH');

-- CreateTable
CREATE TABLE "Team" (
    "id" TEXT NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "icon" VARCHAR(255),
    "description" VARCHAR(255),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Team_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "firebaseUid" VARCHAR(128) NOT NULL,
    "email" VARCHAR(191),
    "displayName" VARCHAR(191),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Player" (
    "id" TEXT NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "position" VARCHAR(50),
    "number" INTEGER,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "photo" VARCHAR(255),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "userId" TEXT,

    CONSTRAINT "Player_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Match" (
    "id" TEXT NOT NULL,
    "homeTeamId" TEXT NOT NULL,
    "awayTeamId" TEXT NOT NULL,
    "scheduledAt" TIMESTAMP(3) NOT NULL,
    "venue" VARCHAR(191),
    "status" "MatchStatus" NOT NULL DEFAULT 'SCHEDULED',
    "homeScore" INTEGER NOT NULL DEFAULT 0,
    "awayScore" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Match_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserPushToken" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "token" VARCHAR(512) NOT NULL,
    "platform" VARCHAR(32),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UserPushToken_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RefreshToken" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "tokenHash" VARCHAR(191) NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "revokedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RefreshToken_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AccessMembership" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "teamId" TEXT,
    "role" "AccessRole" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AccessMembership_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MatchLineupEntry" (
    "id" TEXT NOT NULL,
    "matchId" TEXT NOT NULL,
    "teamId" TEXT NOT NULL,
    "playerId" TEXT NOT NULL,
    "isStarting" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MatchLineupEntry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MatchEvent" (
    "id" TEXT NOT NULL,
    "matchId" TEXT NOT NULL,
    "teamId" TEXT,
    "playerId" TEXT,
    "minute" INTEGER,
    "type" "MatchEventType" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MatchEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PlayerSkill" (
    "id" TEXT NOT NULL,
    "playerId" TEXT NOT NULL,
    "preferredFoot" "PreferredFoot" NOT NULL,
    "attack" INTEGER NOT NULL DEFAULT 50,
    "defense" INTEGER NOT NULL DEFAULT 50,
    "shooting" INTEGER NOT NULL DEFAULT 50,
    "ballControl" INTEGER NOT NULL DEFAULT 50,
    "pace" INTEGER NOT NULL DEFAULT 50,
    "passing" INTEGER NOT NULL DEFAULT 50,
    "dribbling" INTEGER NOT NULL DEFAULT 50,
    "physical" INTEGER NOT NULL DEFAULT 50,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PlayerSkill_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MatchPlayerEvaluationAssignment" (
    "id" TEXT NOT NULL,
    "matchId" TEXT NOT NULL,
    "evaluatorPlayerId" TEXT NOT NULL,
    "targetPlayerId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),

    CONSTRAINT "MatchPlayerEvaluationAssignment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PlayerEvaluation" (
    "id" TEXT NOT NULL,
    "assignmentId" TEXT NOT NULL,
    "rating" INTEGER NOT NULL DEFAULT 0,
    "comment" VARCHAR(500),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PlayerEvaluation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_PlayerToTeam" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_PlayerToTeam_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_firebaseUid_key" ON "User"("firebaseUid");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Player_userId_key" ON "Player"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "UserPushToken_userId_token_key" ON "UserPushToken"("userId", "token");

-- CreateIndex
CREATE UNIQUE INDEX "RefreshToken_tokenHash_key" ON "RefreshToken"("tokenHash");

-- CreateIndex
CREATE INDEX "AccessMembership_userId_role_idx" ON "AccessMembership"("userId", "role");

-- CreateIndex
CREATE INDEX "AccessMembership_teamId_idx" ON "AccessMembership"("teamId");

-- CreateIndex
CREATE UNIQUE INDEX "AccessMembership_userId_teamId_key" ON "AccessMembership"("userId", "teamId");

-- CreateIndex
CREATE INDEX "MatchLineupEntry_matchId_teamId_idx" ON "MatchLineupEntry"("matchId", "teamId");

-- CreateIndex
CREATE UNIQUE INDEX "MatchLineupEntry_matchId_playerId_key" ON "MatchLineupEntry"("matchId", "playerId");

-- CreateIndex
CREATE INDEX "MatchEvent_matchId_idx" ON "MatchEvent"("matchId");

-- CreateIndex
CREATE INDEX "MatchEvent_playerId_idx" ON "MatchEvent"("playerId");

-- CreateIndex
CREATE UNIQUE INDEX "PlayerSkill_playerId_key" ON "PlayerSkill"("playerId");

-- CreateIndex
CREATE INDEX "MatchPlayerEvaluationAssignment_evaluatorPlayerId_matchId_idx" ON "MatchPlayerEvaluationAssignment"("evaluatorPlayerId", "matchId");

-- CreateIndex
CREATE INDEX "MatchPlayerEvaluationAssignment_targetPlayerId_matchId_idx" ON "MatchPlayerEvaluationAssignment"("targetPlayerId", "matchId");

-- CreateIndex
CREATE UNIQUE INDEX "MatchPlayerEvaluationAssignment_matchId_evaluatorPlayerId_t_key" ON "MatchPlayerEvaluationAssignment"("matchId", "evaluatorPlayerId", "targetPlayerId");

-- CreateIndex
CREATE UNIQUE INDEX "PlayerEvaluation_assignmentId_key" ON "PlayerEvaluation"("assignmentId");

-- CreateIndex
CREATE INDEX "_PlayerToTeam_B_index" ON "_PlayerToTeam"("B");

-- AddForeignKey
ALTER TABLE "Player" ADD CONSTRAINT "Player_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Match" ADD CONSTRAINT "Match_homeTeamId_fkey" FOREIGN KEY ("homeTeamId") REFERENCES "Team"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Match" ADD CONSTRAINT "Match_awayTeamId_fkey" FOREIGN KEY ("awayTeamId") REFERENCES "Team"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserPushToken" ADD CONSTRAINT "UserPushToken_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RefreshToken" ADD CONSTRAINT "RefreshToken_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AccessMembership" ADD CONSTRAINT "AccessMembership_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AccessMembership" ADD CONSTRAINT "AccessMembership_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MatchLineupEntry" ADD CONSTRAINT "MatchLineupEntry_matchId_fkey" FOREIGN KEY ("matchId") REFERENCES "Match"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MatchLineupEntry" ADD CONSTRAINT "MatchLineupEntry_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MatchLineupEntry" ADD CONSTRAINT "MatchLineupEntry_playerId_fkey" FOREIGN KEY ("playerId") REFERENCES "Player"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MatchEvent" ADD CONSTRAINT "MatchEvent_matchId_fkey" FOREIGN KEY ("matchId") REFERENCES "Match"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MatchEvent" ADD CONSTRAINT "MatchEvent_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MatchEvent" ADD CONSTRAINT "MatchEvent_playerId_fkey" FOREIGN KEY ("playerId") REFERENCES "Player"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlayerSkill" ADD CONSTRAINT "PlayerSkill_playerId_fkey" FOREIGN KEY ("playerId") REFERENCES "Player"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MatchPlayerEvaluationAssignment" ADD CONSTRAINT "MatchPlayerEvaluationAssignment_matchId_fkey" FOREIGN KEY ("matchId") REFERENCES "Match"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MatchPlayerEvaluationAssignment" ADD CONSTRAINT "MatchPlayerEvaluationAssignment_evaluatorPlayerId_fkey" FOREIGN KEY ("evaluatorPlayerId") REFERENCES "Player"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MatchPlayerEvaluationAssignment" ADD CONSTRAINT "MatchPlayerEvaluationAssignment_targetPlayerId_fkey" FOREIGN KEY ("targetPlayerId") REFERENCES "Player"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlayerEvaluation" ADD CONSTRAINT "PlayerEvaluation_assignmentId_fkey" FOREIGN KEY ("assignmentId") REFERENCES "MatchPlayerEvaluationAssignment"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_PlayerToTeam" ADD CONSTRAINT "_PlayerToTeam_A_fkey" FOREIGN KEY ("A") REFERENCES "Player"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_PlayerToTeam" ADD CONSTRAINT "_PlayerToTeam_B_fkey" FOREIGN KEY ("B") REFERENCES "Team"("id") ON DELETE CASCADE ON UPDATE CASCADE;

