-- Redesign Case table: new fields, renamed column title->name,
-- updated CaseStatus enum, new CasePriority + CaseType enums,
-- saleId now optional, supplier relation added.

-- 1. Create new enums
CREATE TYPE "CasePriority" AS ENUM ('HIGH', 'NORMAL', 'LOW');
CREATE TYPE "CaseType" AS ENUM ('CLAIM', 'WRONG_SETTLEMENT', 'COVERAGE_DENIAL', 'DATA_CHANGE', 'QUERY', 'OTHER');

-- 2. Add new values to CaseStatus (Postgres allows ADD VALUE outside transaction)
ALTER TYPE "CaseStatus" ADD VALUE IF NOT EXISTS 'NEW';
ALTER TYPE "CaseStatus" ADD VALUE IF NOT EXISTS 'ON_HOLD';
ALTER TYPE "CaseStatus" ADD VALUE IF NOT EXISTS 'FORWARDED';

-- 3. Migrate existing rows to valid future-enum values
--    OPEN -> NEW,  IN_PROGRESS stays,  RESOLVED -> CLOSED
UPDATE "Case" SET "status" = 'NEW'    WHERE "status"::text = 'OPEN';
UPDATE "Case" SET "status" = 'CLOSED' WHERE "status"::text = 'RESOLVED';

-- 4. Add new `name` column (filled from `title`)
ALTER TABLE "Case" ADD COLUMN "name" TEXT;
UPDATE "Case" SET "name" = "title";
ALTER TABLE "Case" ALTER COLUMN "name" SET NOT NULL;

-- 5. Add remaining new optional/defaulted columns
ALTER TABLE "Case" ADD COLUMN "occurrenceAt" TIMESTAMP(3);
ALTER TABLE "Case" ADD COLUMN "cause"        TEXT;
ALTER TABLE "Case" ADD COLUMN "type"         "CaseType";
ALTER TABLE "Case" ADD COLUMN "priority"     "CasePriority" NOT NULL DEFAULT 'NORMAL';
ALTER TABLE "Case" ADD COLUMN "supplierId"   TEXT;

-- 6. Make saleId optional
ALTER TABLE "Case" ALTER COLUMN "saleId" DROP NOT NULL;

-- 7. Recreate CaseStatus as a clean enum (remove OPEN and RESOLVED)
--    Must drop the column default first, then change type, then restore default.
ALTER TABLE "Case" ALTER COLUMN "status" DROP DEFAULT;
ALTER TYPE "CaseStatus" RENAME TO "CaseStatus_old";
CREATE TYPE "CaseStatus" AS ENUM ('NEW', 'ON_HOLD', 'FORWARDED', 'IN_PROGRESS', 'CLOSED');
ALTER TABLE "Case"
  ALTER COLUMN "status" TYPE "CaseStatus"
  USING "status"::text::"CaseStatus";
ALTER TABLE "Case" ALTER COLUMN "status" SET DEFAULT 'NEW';
DROP TYPE "CaseStatus_old";

-- 8. Drop old title column
ALTER TABLE "Case" DROP COLUMN "title";

-- 9. Supplier FK and index
ALTER TABLE "Case"
  ADD CONSTRAINT "Case_supplierId_fkey"
  FOREIGN KEY ("supplierId") REFERENCES "Supplier"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

CREATE INDEX "Case_supplierId_idx" ON "Case"("supplierId");
