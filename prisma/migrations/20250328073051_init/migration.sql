-- DropForeignKey
ALTER TABLE "Price" DROP CONSTRAINT "Price_id_fkey";

-- AddForeignKey
ALTER TABLE "PaxAvailibility" ADD CONSTRAINT "PaxAvailibility_id_fkey" FOREIGN KEY ("id") REFERENCES "Price"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
