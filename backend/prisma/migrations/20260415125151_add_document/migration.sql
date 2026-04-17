-- CreateEnum
CREATE TYPE "DocumentGroup" AS ENUM ('INSURANCE', 'ENERGY');

-- CreateEnum
CREATE TYPE "DocumentType" AS ENUM ('INVOICE', 'CONTRACT', 'PROJECT', 'DOCUMENTATION', 'POLICY');

-- CreateEnum
CREATE TYPE "DocumentStatus" AS ENUM ('PENDING_SIGNATURE', 'EXPIRED', 'UPDATED', 'UNDER_REVIEW');

-- CreateTable
CREATE TABLE "Document" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "group" "DocumentGroup" NOT NULL,
    "documentType" "DocumentType" NOT NULL,
    "status" "DocumentStatus" NOT NULL DEFAULT 'PENDING_SIGNATURE',
    "includedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiryDate" DATE,
    "fileUrl" TEXT,
    "clientId" TEXT NOT NULL,
    "saleId" TEXT,
    "uploadedByUserId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Document_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Document" ADD CONSTRAINT "Document_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Document" ADD CONSTRAINT "Document_saleId_fkey" FOREIGN KEY ("saleId") REFERENCES "Sale"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Document" ADD CONSTRAINT "Document_uploadedByUserId_fkey" FOREIGN KEY ("uploadedByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
