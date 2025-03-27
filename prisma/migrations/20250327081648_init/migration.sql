-- CreateTable
CREATE TABLE "Partner" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "apiEndpoint" TEXT NOT NULL,
    "lastFetched" TIMESTAMP(3),

    CONSTRAINT "Partner_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Product" (
    "id" SERIAL NOT NULL,
    "productId" INTEGER NOT NULL,
    "days" TEXT NOT NULL,

    CONSTRAINT "Product_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Slots" (
    "id" SERIAL NOT NULL,
    "productId" INTEGER NOT NULL,
    "startTime" TEXT NOT NULL,
    "startDate" TEXT NOT NULL,
    "remaining" INTEGER NOT NULL,

    CONSTRAINT "Slots_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PaxAvailibility" (
    "id" SERIAL NOT NULL,
    "type" TEXT NOT NULL,
    "name" TEXT,
    "description" TEXT,
    "slotsId" INTEGER,
    "priceId" INTEGER NOT NULL,

    CONSTRAINT "PaxAvailibility_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Price" (
    "id" SERIAL NOT NULL,
    "finalPrice" INTEGER NOT NULL,
    "currencyCode" TEXT NOT NULL,
    "originalPrice" INTEGER NOT NULL,

    CONSTRAINT "Price_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SyncLog" (
    "id" SERIAL NOT NULL,
    "partnerId" INTEGER NOT NULL,
    "syncStarted" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "syncFinished" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'pending',
    "errorMessage" TEXT,

    CONSTRAINT "SyncLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Partner_name_key" ON "Partner"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Product_productId_key" ON "Product"("productId");

-- CreateIndex
CREATE INDEX "Slots_productId_startDate_startTime_idx" ON "Slots"("productId", "startDate", "startTime");

-- CreateIndex
CREATE UNIQUE INDEX "Slots_productId_startDate_startTime_key" ON "Slots"("productId", "startDate", "startTime");

-- AddForeignKey
ALTER TABLE "PaxAvailibility" ADD CONSTRAINT "PaxAvailibility_priceId_fkey" FOREIGN KEY ("priceId") REFERENCES "Price"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PaxAvailibility" ADD CONSTRAINT "PaxAvailibility_slotsId_fkey" FOREIGN KEY ("slotsId") REFERENCES "Slots"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SyncLog" ADD CONSTRAINT "SyncLog_partnerId_fkey" FOREIGN KEY ("partnerId") REFERENCES "Partner"("id") ON DELETE CASCADE ON UPDATE CASCADE;
