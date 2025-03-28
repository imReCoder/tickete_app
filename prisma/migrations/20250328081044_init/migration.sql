-- DropForeignKey
ALTER TABLE "PaxAvailibility" DROP CONSTRAINT "PaxAvailibility_id_fkey";

-- AlterTable
ALTER TABLE "Price" ALTER COLUMN "id" DROP DEFAULT;
DROP SEQUENCE "Price_id_seq";

-- AddForeignKey
ALTER TABLE "Price" ADD CONSTRAINT "Price_id_fkey" FOREIGN KEY ("id") REFERENCES "PaxAvailibility"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
