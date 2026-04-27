-- Add system event types to ActivityType enum so it matches domain-types and frontend.
ALTER TYPE "ActivityType" ADD VALUE IF NOT EXISTS 'STAGE_CHANGED';
ALTER TYPE "ActivityType" ADD VALUE IF NOT EXISTS 'DOC_UPLOADED';
ALTER TYPE "ActivityType" ADD VALUE IF NOT EXISTS 'EXPORT';
ALTER TYPE "ActivityType" ADD VALUE IF NOT EXISTS 'CREATED';
ALTER TYPE "ActivityType" ADD VALUE IF NOT EXISTS 'UPDATED';
