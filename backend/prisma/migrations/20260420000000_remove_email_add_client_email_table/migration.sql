-- AlterTable
ALTER TABLE "Client" DROP COLUMN "email";

-- CreateTable
CREATE TABLE "ClientEmail" (
    "id" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "isPrimary" BOOLEAN NOT NULL DEFAULT false,
    "label" TEXT,
    "labelColor" TEXT,

    CONSTRAINT "ClientEmail_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "ClientEmail" ADD CONSTRAINT "ClientEmail_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE CASCADE ON UPDATE CASCADE;
