-- Replace CaseType enum with business-aligned values.
-- Old: CLAIM, WRONG_SETTLEMENT, COVERAGE_DENIAL, DATA_CHANGE, QUERY, OTHER
-- New: CLAIM, FAULT, ACTIVATION, WRONG_SETTLEMENT

-- 1. Drop column default (none set, but defensive)
ALTER TABLE "Case" ALTER COLUMN "type" DROP DEFAULT;

-- 2. Rename existing enum out of the way
ALTER TYPE "CaseType" RENAME TO "CaseType_old";

-- 3. Create new enum with correct values
CREATE TYPE "CaseType" AS ENUM ('CLAIM', 'FAULT', 'ACTIVATION', 'WRONG_SETTLEMENT');

-- 4. Migrate existing rows:
--    CLAIM, WRONG_SETTLEMENT → keep
--    COVERAGE_DENIAL, DATA_CHANGE, QUERY, OTHER → NULL (field is optional)
ALTER TABLE "Case"
  ALTER COLUMN "type" TYPE "CaseType"
  USING CASE "type"::text
    WHEN 'CLAIM'            THEN 'CLAIM'::"CaseType"
    WHEN 'WRONG_SETTLEMENT' THEN 'WRONG_SETTLEMENT'::"CaseType"
    ELSE NULL
  END;

-- 5. Drop old enum
DROP TYPE "CaseType_old";
