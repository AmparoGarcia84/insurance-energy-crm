-- Drop old simplified Sale table and its enum
DROP TABLE IF EXISTS "Sale";
DROP TYPE IF EXISTS "SaleStatus";

-- New enums
CREATE TYPE "SaleType" AS ENUM ('INSURANCE', 'ENERGY');
CREATE TYPE "SaleBusinessType" AS ENUM ('NEW_BUSINESS', 'EXISTING_BUSINESS');
CREATE TYPE "SaleProjectSource" AS ENUM ('NONE', 'NOTICE', 'COLD_CALL', 'EMPLOYEE_REFERRAL', 'EXTERNAL_REFERRAL', 'PARTNER', 'ONLINE_STORE', 'PUBLIC_RELATIONS', 'TRADE_SHOW', 'SALES_EMAIL_ALIAS', 'SEMINAR_PARTNER', 'INTERNAL_SEMINAR', 'WEB_DOWNLOAD', 'WEB_RESEARCH', 'CHAT');
CREATE TYPE "SaleForecastCategory" AS ENUM ('CHANNEL', 'BEST_CASE', 'CONFIRMED');
CREATE TYPE "InsuranceSaleStage" AS ENUM ('RESPONSE_PENDING', 'DOCUMENTS_PENDING', 'SIGNATURE_PENDING', 'ISSUANCE_PENDING', 'BILLING_THIS_MONTH', 'BILLING_NEXT_MONTH', 'RECURRENT_BILLING', 'INVOICE_PENDING_PAYMENT', 'WRONG_SETTLEMENT', 'BILLED_AND_PAID', 'CANCELED_UNPAID', 'NOT_INSURABLE', 'KO_SCORING', 'LOST');
CREATE TYPE "EnergySaleStage" AS ENUM ('RESPONSE_PENDING', 'DOCUMENTS_PENDING', 'SIGNATURE_PENDING', 'ACTIVATION_PENDING', 'BILLING_THIS_MONTH', 'BILLED_AND_PAID', 'LOST');

-- New Sale table
CREATE TABLE "Sale" (
    "id"                    TEXT NOT NULL,
    "clientId"              TEXT NOT NULL,
    "clientName"            TEXT,
    "type"                  "SaleType" NOT NULL,
    "businessType"          "SaleBusinessType",
    "title"                 TEXT NOT NULL,
    "companyName"           TEXT,
    "insuranceBranch"       TEXT,
    "insuranceStage"        "InsuranceSaleStage",
    "energyStage"           "EnergySaleStage",
    "amount"                DOUBLE PRECISION,
    "expectedRevenue"       DOUBLE PRECISION,
    "expectedSavingsPerYear" DOUBLE PRECISION,
    "probabilityPercent"    DOUBLE PRECISION,
    "forecastCategory"      "SaleForecastCategory",
    "expectedCloseDate"     DATE,
    "issueDate"             DATE,
    "billingDate"           DATE,
    "projectSource"         "SaleProjectSource",
    "channel"               TEXT,
    "campaignSource"        TEXT,
    "socialLeadId"          TEXT,
    "ownerUserId"           TEXT,
    "ownerUserName"         TEXT,
    "contactName"           TEXT,
    "policyNumber"          TEXT,
    "contractId"            TEXT,
    "nextStep"              TEXT,
    "lostReason"            TEXT,
    "description"           TEXT,
    "createdAt"             TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"             TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Sale_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "Sale" ADD CONSTRAINT "Sale_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
