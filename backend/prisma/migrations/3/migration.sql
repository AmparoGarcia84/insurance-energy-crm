-- Expand address: rename generic column to street, add the rest
ALTER TABLE "Client" RENAME COLUMN "address" TO "street";
ALTER TABLE "Client" ADD COLUMN IF NOT EXISTS "postalCode" TEXT;
ALTER TABLE "Client" ADD COLUMN IF NOT EXISTS "city"       TEXT;
ALTER TABLE "Client" ADD COLUMN IF NOT EXISTS "province"   TEXT;
ALTER TABLE "Client" ADD COLUMN IF NOT EXISTS "country"    TEXT;
