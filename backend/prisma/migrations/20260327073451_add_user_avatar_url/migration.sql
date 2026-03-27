-- AlterTable
ALTER TABLE "ClientAddress" ALTER COLUMN "id" DROP DEFAULT;

-- AlterTable
ALTER TABLE "ClientBankAccount" ALTER COLUMN "id" DROP DEFAULT;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "avatarUrl" TEXT;
