-- CreateEnum
CREATE TYPE "EvaluationPositionType" AS ENUM ('LINE', 'GOALKEEPER');

-- AlterTable
ALTER TABLE "MatchPlayerEvaluationAssignment" ADD COLUMN     "weight" DECIMAL(5,2) NOT NULL DEFAULT 1.00;

-- AlterTable
ALTER TABLE "PlayerEvaluation" ADD COLUMN     "formId" TEXT,
ADD COLUMN     "formSnapshot" JSONB,
ADD COLUMN     "overallScore" DECIMAL(5,2);

-- CreateTable
CREATE TABLE "EvaluationForm" (
    "id" TEXT NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "positionType" "EvaluationPositionType" NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EvaluationForm_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EvaluationCriteria" (
    "id" TEXT NOT NULL,
    "formId" TEXT NOT NULL,
    "key" VARCHAR(50) NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "description" VARCHAR(255),
    "weight" DECIMAL(5,2) NOT NULL,
    "minValue" INTEGER NOT NULL DEFAULT 0,
    "maxValue" INTEGER NOT NULL DEFAULT 10,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EvaluationCriteria_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PlayerEvaluationItem" (
    "id" TEXT NOT NULL,
    "evaluationId" TEXT NOT NULL,
    "criteriaId" TEXT NOT NULL,
    "value" INTEGER NOT NULL,

    CONSTRAINT "PlayerEvaluationItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PlayerEvaluationAggregate" (
    "id" TEXT NOT NULL,
    "playerId" TEXT NOT NULL,
    "formId" TEXT NOT NULL,
    "count" INTEGER NOT NULL DEFAULT 0,
    "weightedSum" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "average" DECIMAL(5,2) NOT NULL DEFAULT 0,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PlayerEvaluationAggregate_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "EvaluationCriteria_formId_key_key" ON "EvaluationCriteria"("formId", "key");

-- CreateIndex
CREATE INDEX "PlayerEvaluationAggregate_playerId_idx" ON "PlayerEvaluationAggregate"("playerId");

-- CreateIndex
CREATE UNIQUE INDEX "PlayerEvaluationAggregate_playerId_formId_key" ON "PlayerEvaluationAggregate"("playerId", "formId");

-- AddForeignKey
ALTER TABLE "PlayerEvaluation" ADD CONSTRAINT "PlayerEvaluation_formId_fkey" FOREIGN KEY ("formId") REFERENCES "EvaluationForm"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EvaluationCriteria" ADD CONSTRAINT "EvaluationCriteria_formId_fkey" FOREIGN KEY ("formId") REFERENCES "EvaluationForm"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlayerEvaluationItem" ADD CONSTRAINT "PlayerEvaluationItem_evaluationId_fkey" FOREIGN KEY ("evaluationId") REFERENCES "PlayerEvaluation"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlayerEvaluationItem" ADD CONSTRAINT "PlayerEvaluationItem_criteriaId_fkey" FOREIGN KEY ("criteriaId") REFERENCES "EvaluationCriteria"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlayerEvaluationAggregate" ADD CONSTRAINT "PlayerEvaluationAggregate_playerId_fkey" FOREIGN KEY ("playerId") REFERENCES "Player"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlayerEvaluationAggregate" ADD CONSTRAINT "PlayerEvaluationAggregate_formId_fkey" FOREIGN KEY ("formId") REFERENCES "EvaluationForm"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
