-- AlterTable
ALTER TABLE "Match" ADD COLUMN     "groupId" TEXT,
ADD COLUMN     "leagueId" TEXT;

-- CreateTable
CREATE TABLE "League" (
    "id" TEXT NOT NULL,
    "name" VARCHAR(191) NOT NULL,
    "slug" VARCHAR(191) NOT NULL,
    "description" VARCHAR(255),
    "startAt" TIMESTAMP(3),
    "endAt" TIMESTAMP(3),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "League_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LeagueTeam" (
    "id" TEXT NOT NULL,
    "leagueId" TEXT NOT NULL,
    "teamId" TEXT NOT NULL,
    "division" VARCHAR(64),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LeagueTeam_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LeagueGroup" (
    "id" TEXT NOT NULL,
    "leagueId" TEXT NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LeagueGroup_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LeagueGroupTeam" (
    "id" TEXT NOT NULL,
    "groupId" TEXT NOT NULL,
    "teamId" TEXT NOT NULL,
    "position" INTEGER,

    CONSTRAINT "LeagueGroupTeam_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "League_slug_key" ON "League"("slug");

-- CreateIndex
CREATE INDEX "LeagueTeam_teamId_idx" ON "LeagueTeam"("teamId");

-- CreateIndex
CREATE UNIQUE INDEX "LeagueTeam_leagueId_teamId_key" ON "LeagueTeam"("leagueId", "teamId");

-- CreateIndex
CREATE INDEX "LeagueGroupTeam_teamId_idx" ON "LeagueGroupTeam"("teamId");

-- CreateIndex
CREATE UNIQUE INDEX "LeagueGroupTeam_groupId_teamId_key" ON "LeagueGroupTeam"("groupId", "teamId");

-- AddForeignKey
ALTER TABLE "Match" ADD CONSTRAINT "Match_leagueId_fkey" FOREIGN KEY ("leagueId") REFERENCES "League"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Match" ADD CONSTRAINT "Match_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "LeagueGroup"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LeagueTeam" ADD CONSTRAINT "LeagueTeam_leagueId_fkey" FOREIGN KEY ("leagueId") REFERENCES "League"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LeagueTeam" ADD CONSTRAINT "LeagueTeam_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LeagueGroup" ADD CONSTRAINT "LeagueGroup_leagueId_fkey" FOREIGN KEY ("leagueId") REFERENCES "League"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LeagueGroupTeam" ADD CONSTRAINT "LeagueGroupTeam_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "LeagueGroup"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LeagueGroupTeam" ADD CONSTRAINT "LeagueGroupTeam_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
