/*
  Warnings:

  - You are about to drop the `Partner` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `SyncLog` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "SyncLog" DROP CONSTRAINT "SyncLog_partnerId_fkey";

-- DropTable
DROP TABLE "Partner";

-- DropTable
DROP TABLE "SyncLog";

-- CreateTable
CREATE TABLE "SynSettings" (
    "id" INTEGER NOT NULL,
    "enable" BOOLEAN NOT NULL,

    CONSTRAINT "SynSettings_pkey" PRIMARY KEY ("id")
);
