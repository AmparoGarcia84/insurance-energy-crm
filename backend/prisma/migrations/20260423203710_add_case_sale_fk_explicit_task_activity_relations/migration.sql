/*
  Warnings:

  - You are about to drop the column `relatedEntityId` on the `Task` table. All the data in the column will be lost.
  - You are about to drop the column `relatedEntityType` on the `Task` table. All the data in the column will be lost.
  - Added the required column `saleId` to the `Case` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Activity" ADD COLUMN     "caseId" TEXT;

-- AlterTable
ALTER TABLE "Case" ADD COLUMN     "saleId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "Task" DROP COLUMN "relatedEntityId",
DROP COLUMN "relatedEntityType",
ADD COLUMN     "caseId" TEXT,
ADD COLUMN     "saleId" TEXT;

-- DropEnum
DROP TYPE "RelatedEntityType";

-- CreateIndex
CREATE INDEX "Activity_caseId_idx" ON "Activity"("caseId");

-- CreateIndex
CREATE INDEX "Case_clientId_idx" ON "Case"("clientId");

-- CreateIndex
CREATE INDEX "Case_saleId_idx" ON "Case"("saleId");

-- CreateIndex
CREATE INDEX "Document_clientId_idx" ON "Document"("clientId");

-- CreateIndex
CREATE INDEX "EnergyContract_clientId_idx" ON "EnergyContract"("clientId");

-- CreateIndex
CREATE INDEX "Policy_clientId_idx" ON "Policy"("clientId");

-- CreateIndex
CREATE INDEX "Sale_clientId_idx" ON "Sale"("clientId");

-- CreateIndex
CREATE INDEX "Task_assignedToUserId_idx" ON "Task"("assignedToUserId");

-- CreateIndex
CREATE INDEX "Task_clientId_idx" ON "Task"("clientId");

-- CreateIndex
CREATE INDEX "Task_saleId_idx" ON "Task"("saleId");

-- CreateIndex
CREATE INDEX "Task_caseId_idx" ON "Task"("caseId");

-- CreateIndex
CREATE INDEX "Task_dueDate_idx" ON "Task"("dueDate");

-- CreateIndex
CREATE INDEX "Workday_userId_date_idx" ON "Workday"("userId", "date");

-- AddForeignKey
ALTER TABLE "Case" ADD CONSTRAINT "Case_saleId_fkey" FOREIGN KEY ("saleId") REFERENCES "Sale"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Task" ADD CONSTRAINT "Task_saleId_fkey" FOREIGN KEY ("saleId") REFERENCES "Sale"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Task" ADD CONSTRAINT "Task_caseId_fkey" FOREIGN KEY ("caseId") REFERENCES "Case"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Activity" ADD CONSTRAINT "Activity_caseId_fkey" FOREIGN KEY ("caseId") REFERENCES "Case"("id") ON DELETE SET NULL ON UPDATE CASCADE;
