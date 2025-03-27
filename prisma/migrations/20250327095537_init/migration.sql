/*
  Warnings:

  - The primary key for the `Slots` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `id` on the `Slots` table. All the data in the column will be lost.
  - Added the required column `providerSlotId` to the `Slots` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "PaxAvailibility" DROP CONSTRAINT "PaxAvailibility_slotsId_fkey";

-- AlterTable
ALTER TABLE "Slots" DROP CONSTRAINT "Slots_pkey",
DROP COLUMN "id",
ADD COLUMN     "providerSlotId" INTEGER NOT NULL,
ADD CONSTRAINT "Slots_pkey" PRIMARY KEY ("providerSlotId");

-- AddForeignKey
ALTER TABLE "PaxAvailibility" ADD CONSTRAINT "PaxAvailibility_slotsId_fkey" FOREIGN KEY ("slotsId") REFERENCES "Slots"("providerSlotId") ON DELETE SET NULL ON UPDATE CASCADE;
