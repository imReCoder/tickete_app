/*
  Warnings:

  - Made the column `description` on table `PaxAvailibility` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "PaxAvailibility" ALTER COLUMN "description" SET NOT NULL,
ALTER COLUMN "max" DROP NOT NULL,
ALTER COLUMN "min" DROP NOT NULL;
