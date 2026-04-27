/*
  Warnings:

  - You are about to drop the column `providerName` on the `Task` table. All the data in the column will be lost.
  - You are about to drop the column `providerPhone` on the `Task` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Task" DROP COLUMN "providerName",
DROP COLUMN "providerPhone",
ADD COLUMN     "providerSupplierId" TEXT;

-- CreateIndex
CREATE INDEX "Task_supplierId_idx" ON "Task"("supplierId");

-- CreateIndex
CREATE INDEX "Task_providerSupplierId_idx" ON "Task"("providerSupplierId");

-- AddForeignKey
ALTER TABLE "Task" ADD CONSTRAINT "Task_providerSupplierId_fkey" FOREIGN KEY ("providerSupplierId") REFERENCES "Supplier"("id") ON DELETE SET NULL ON UPDATE CASCADE;
