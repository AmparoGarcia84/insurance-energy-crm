-- Drop Policy and EnergyContract tables and their enums.
-- These entities were declared but never implemented; Sales covers both domains.

DROP TABLE IF EXISTS "Policy";
DROP TABLE IF EXISTS "EnergyContract";

DROP TYPE IF EXISTS "PolicyStatus";
DROP TYPE IF EXISTS "EnergyContractStatus";
