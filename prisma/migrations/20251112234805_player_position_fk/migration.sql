/*
  Warnings:

  - You are about to drop the column `position` on the `Player` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Player" DROP COLUMN "position",
ADD COLUMN     "positionSlug" VARCHAR(20);

-- AlterTable
ALTER TABLE "Position" ALTER COLUMN "createdAt" SET DATA TYPE TIMESTAMP(3),
ALTER COLUMN "updatedAt" DROP DEFAULT,
ALTER COLUMN "updatedAt" SET DATA TYPE TIMESTAMP(3);

-- AddForeignKey
ALTER TABLE "Player" ADD CONSTRAINT "Player_positionSlug_fkey" FOREIGN KEY ("positionSlug") REFERENCES "Position"("slug") ON DELETE SET NULL ON UPDATE CASCADE;
