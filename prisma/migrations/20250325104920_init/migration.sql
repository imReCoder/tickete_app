/*
  Warnings:

  - You are about to drop the `Post` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `User` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "Post";
PRAGMA foreign_keys=on;

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "User";
PRAGMA foreign_keys=on;

-- CreateTable
CREATE TABLE "Partner" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "apiEndpoint" TEXT NOT NULL,
    "lastFetched" DATETIME
);

-- CreateTable
CREATE TABLE "Slots" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "startTime" TEXT NOT NULL,
    "startDate" TEXT NOT NULL,
    "remaining" INTEGER NOT NULL
);

-- CreateTable
CREATE TABLE "PaxAvailibility" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "type" TEXT NOT NULL,
    "name" TEXT,
    "description" TEXT,
    "slotsId" INTEGER,
    "priceId" INTEGER NOT NULL,
    CONSTRAINT "PaxAvailibility_priceId_fkey" FOREIGN KEY ("priceId") REFERENCES "Price" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "PaxAvailibility_slotsId_fkey" FOREIGN KEY ("slotsId") REFERENCES "Slots" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Price" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "finalPrice" INTEGER NOT NULL,
    "currencyCode" TEXT NOT NULL,
    "originalPrice" INTEGER NOT NULL
);

-- CreateTable
CREATE TABLE "SyncLog" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "partnerId" INTEGER NOT NULL,
    "syncStarted" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "syncFinished" DATETIME,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "errorMessage" TEXT,
    CONSTRAINT "SyncLog_partnerId_fkey" FOREIGN KEY ("partnerId") REFERENCES "Partner" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "Partner_name_key" ON "Partner"("name");
