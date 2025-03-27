/*
  Warnings:

  - The primary key for the `Slots` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - Made the column `slotsId` on table `PaxAvailibility` required. This step will fail if there are existing NULL values in that column.

*/
-- DropForeignKey
ALTER TABLE "PaxAvailibility" DROP CONSTRAINT "PaxAvailibility_slotsId_fkey";

-- AlterTable
ALTER TABLE "PaxAvailibility" ALTER COLUMN "slotsId" SET NOT NULL,
ALTER COLUMN "slotsId" SET DATA TYPE TEXT;

-- AlterTable
ALTER TABLE "Slots" DROP CONSTRAINT "Slots_pkey",
ALTER COLUMN "providerSlotId" SET DATA TYPE TEXT,
ADD CONSTRAINT "Slots_pkey" PRIMARY KEY ("providerSlotId");

-- AddForeignKey
ALTER TABLE "PaxAvailibility" ADD CONSTRAINT "PaxAvailibility_slotsId_fkey" FOREIGN KEY ("slotsId") REFERENCES "Slots"("providerSlotId") ON DELETE RESTRICT ON UPDATE CASCADE;
