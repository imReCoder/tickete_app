/*
  Warnings:

  - A unique constraint covering the columns `[slotId,type]` on the table `PaxAvailibility` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "PaxAvailibility_slotId_idx";

-- CreateIndex
CREATE INDEX "PaxAvailibility_slotId_type_idx" ON "PaxAvailibility"("slotId", "type");

-- CreateIndex
CREATE UNIQUE INDEX "PaxAvailibility_slotId_type_key" ON "PaxAvailibility"("slotId", "type");
