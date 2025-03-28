/*
  Warnings:

  - You are about to drop the column `priceId` on the `PaxAvailibility` table. All the data in the column will be lost.
  - Added the required column `max` to the `PaxAvailibility` table without a default value. This is not possible if the table is not empty.
  - Added the required column `min` to the `PaxAvailibility` table without a default value. This is not possible if the table is not empty.
  - Added the required column `remaining` to the `PaxAvailibility` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "PaxAvailibility" DROP CONSTRAINT "PaxAvailibility_priceId_fkey";

-- DropForeignKey
ALTER TABLE "PaxAvailibility" DROP CONSTRAINT "PaxAvailibility_slotsId_fkey";

-- DropIndex
DROP INDEX "Slots_productId_startDate_startTime_idx";

-- AlterTable
ALTER TABLE "PaxAvailibility" DROP COLUMN "priceId",
ADD COLUMN     "max" INTEGER NOT NULL,
ADD COLUMN     "min" INTEGER NOT NULL,
ADD COLUMN     "remaining" INTEGER NOT NULL;

-- CreateIndex
CREATE INDEX "PaxAvailibility_slotsId_idx" ON "PaxAvailibility"("slotsId");

-- AddForeignKey
ALTER TABLE "PaxAvailibility" ADD CONSTRAINT "PaxAvailibility_slotsId_fkey" FOREIGN KEY ("slotsId") REFERENCES "Slots"("providerSlotId") ON DELETE CASCADE ON UPDATE CASCADE;
