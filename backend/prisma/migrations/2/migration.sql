-- Migration 2: Expand Client model with full domain fields

-- Step 1: Add new values to existing enums
ALTER TYPE "ClientType" ADD VALUE IF NOT EXISTS 'COMPANY';
ALTER TYPE "ClientType" ADD VALUE IF NOT EXISTS 'COMMUNITY_OF_OWNERS';
ALTER TYPE "ClientType" ADD VALUE IF NOT EXISTS 'SELF_EMPLOYED';
ALTER TYPE "ClientType" ADD VALUE IF NOT EXISTS 'PENSIONER';
ALTER TYPE "ClientType" ADD VALUE IF NOT EXISTS 'RETIRED';
ALTER TYPE "ClientType" ADD VALUE IF NOT EXISTS 'COLLABORATOR';
ALTER TYPE "ClientType" ADD VALUE IF NOT EXISTS 'PROSPECT';
ALTER TYPE "ClientType" ADD VALUE IF NOT EXISTS 'OTHER';
ALTER TYPE "ClientType" ADD VALUE IF NOT EXISTS 'SUPPLIER';

ALTER TYPE "ClientStatus" ADD VALUE IF NOT EXISTS 'PROSPECTING';
ALTER TYPE "ClientStatus" ADD VALUE IF NOT EXISTS 'PAYMENT_DEFAULT';
ALTER TYPE "ClientStatus" ADD VALUE IF NOT EXISTS 'HIGH_CLAIMS';

-- Step 2: Create new enums
CREATE TYPE "ClientQualification" AS ENUM (
  'NEW_BUSINESS',
  'PORTFOLIO',
  'REFERRED_CLIENT',
  'BNI_REFERRAL',
  'MARKETING_SOCIAL_MEDIA',
  'MARKET_LOSS',
  'PROJECT_CANCELLED',
  'CANCELLED',
  'NOT_PROFITABLE',
  'PAYMENT_DEFAULT'
);

CREATE TYPE "CollectionManager" AS ENUM (
  'INSURANCE_COMPANY',
  'BANK_TRANSFER',
  'BROKER',
  'CARD_PAYMENT',
  'UNPAID'
);

-- Step 3: Add new columns to Client table
ALTER TABLE "Client"
  ADD COLUMN IF NOT EXISTS "clientNumber"             TEXT,
  ADD COLUMN IF NOT EXISTS "qualification"            "ClientQualification",
  ADD COLUMN IF NOT EXISTS "activity"                 TEXT,
  ADD COLUMN IF NOT EXISTS "sector"                   TEXT,
  ADD COLUMN IF NOT EXISTS "collectionManager"        "CollectionManager",
  ADD COLUMN IF NOT EXISTS "birthDate"                DATE,
  ADD COLUMN IF NOT EXISTS "drivingLicenseIssueDate"  DATE,
  ADD COLUMN IF NOT EXISTS "dniExpiryDate"            DATE,
  ADD COLUMN IF NOT EXISTS "mobilePhone"              TEXT,
  ADD COLUMN IF NOT EXISTS "secondaryPhone"           TEXT,
  ADD COLUMN IF NOT EXISTS "fax"                      TEXT,
  ADD COLUMN IF NOT EXISTS "website"                  TEXT,
  ADD COLUMN IF NOT EXISTS "iban"                     TEXT,
  ADD COLUMN IF NOT EXISTS "employees"                INTEGER,
  ADD COLUMN IF NOT EXISTS "annualRevenue"            DOUBLE PRECISION,
  ADD COLUMN IF NOT EXISTS "isMainClient"             BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS "mainClientId"             TEXT,
  ADD COLUMN IF NOT EXISTS "description"              TEXT;

-- Step 4: Self-referencing FK for client hierarchy
ALTER TABLE "Client"
  ADD CONSTRAINT "Client_mainClientId_fkey"
  FOREIGN KEY ("mainClientId")
  REFERENCES "Client"("id")
  ON DELETE SET NULL
  ON UPDATE CASCADE;
