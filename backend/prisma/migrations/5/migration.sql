-- Rename displayName → name (preserving existing data)
ALTER TABLE "Client" RENAME COLUMN "displayName" TO "name";

-- Rename taxId → nif (preserving existing data)
ALTER TABLE "Client" RENAME COLUMN "taxId" TO "nif";

-- Drop removed columns
ALTER TABLE "Client" DROP COLUMN IF EXISTS "legalName";
ALTER TABLE "Client" DROP COLUMN IF EXISTS "phone";
ALTER TABLE "Client" DROP COLUMN IF EXISTS "fax";
ALTER TABLE "Client" DROP COLUMN IF EXISTS "notes";

-- Add new columns
ALTER TABLE "Client" ADD COLUMN IF NOT EXISTS "sicCode"                 TEXT;
ALTER TABLE "Client" ADD COLUMN IF NOT EXISTS "accountOwnerUserId"      TEXT;
ALTER TABLE "Client" ADD COLUMN IF NOT EXISTS "commercialAgentUserId"   TEXT;
