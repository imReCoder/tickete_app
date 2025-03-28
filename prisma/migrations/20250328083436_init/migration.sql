-- DropForeignKey
ALTER TABLE "Price" DROP CONSTRAINT "Price_id_fkey";

-- AddForeignKey
ALTER TABLE "Price" ADD CONSTRAINT "Price_id_fkey" FOREIGN KEY ("id") REFERENCES "PaxAvailibility"("id") ON DELETE CASCADE ON UPDATE CASCADE;
