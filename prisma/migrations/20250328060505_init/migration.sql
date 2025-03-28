/*
  Warnings:

  - You are about to drop the column `slotsId` on the `PaxAvailibility` table. All the data in the column will be lost.
  - Added the required column `slotId` to the `PaxAvailibility` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "PaxAvailibility" DROP CONSTRAINT "PaxAvailibility_slotsId_fkey";

-- DropIndex
DROP INDEX "PaxAvailibility_slotsId_idx";

-- AlterTable
ALTER TABLE "PaxAvailibility" DROP COLUMN "slotsId",
ADD COLUMN     "slotId" TEXT NOT NULL;

-- CreateIndex
CREATE INDEX "PaxAvailibility_slotId_idx" ON "PaxAvailibility"("slotId");

-- AddForeignKey
ALTER TABLE "PaxAvailibility" ADD CONSTRAINT "PaxAvailibility_slotId_fkey" FOREIGN KEY ("slotId") REFERENCES "Slots"("providerSlotId") ON DELETE CASCADE ON UPDATE CASCADE;
