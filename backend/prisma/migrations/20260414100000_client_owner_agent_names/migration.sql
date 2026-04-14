-- AlterTable: add denormalized name columns for account owner and commercial agent
ALTER TABLE "Client" ADD COLUMN "accountOwnerName" TEXT;
ALTER TABLE "Client" ADD COLUMN "commercialAgentName" TEXT;
