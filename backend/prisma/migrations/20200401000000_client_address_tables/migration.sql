-- Remove flat address columns added in migration 3
ALTER TABLE "Client" DROP COLUMN IF EXISTS "street";
ALTER TABLE "Client" DROP COLUMN IF EXISTS "postalCode";
ALTER TABLE "Client" DROP COLUMN IF EXISTS "city";
ALTER TABLE "Client" DROP COLUMN IF EXISTS "province";
ALTER TABLE "Client" DROP COLUMN IF EXISTS "country";

-- Remove iban (moving to ClientBankAccount)
ALTER TABLE "Client" DROP COLUMN IF EXISTS "iban";

-- Create enums
CREATE TYPE "AddressType" AS ENUM ('FISCAL', 'BUSINESS', 'PERSONAL');
CREATE TYPE "AccountType" AS ENUM ('PERSONAL', 'BUSINESS');

-- Create ClientAddress table
CREATE TABLE "ClientAddress" (
  "id"         TEXT NOT NULL DEFAULT gen_random_uuid(),
  "clientId"   TEXT NOT NULL,
  "type"       "AddressType" NOT NULL,
  "street"     TEXT,
  "postalCode" TEXT,
  "city"       TEXT,
  "province"   TEXT,
  "country"    TEXT,
  CONSTRAINT "ClientAddress_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "ClientAddress_clientId_fkey"
    FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- Create ClientBankAccount table
CREATE TABLE "ClientBankAccount" (
  "id"       TEXT NOT NULL DEFAULT gen_random_uuid(),
  "clientId" TEXT NOT NULL,
  "type"     "AccountType" NOT NULL,
  "iban"     TEXT NOT NULL,
  CONSTRAINT "ClientBankAccount_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "ClientBankAccount_clientId_fkey"
    FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
