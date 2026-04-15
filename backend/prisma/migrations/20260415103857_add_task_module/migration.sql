-- CreateEnum
CREATE TYPE "TaskStatus" AS ENUM ('NOT_STARTED', 'DEFERRED', 'IN_PROGRESS', 'COMPLETED', 'WAITING_FOR_INPUT', 'UNLOGGED');

-- CreateEnum
CREATE TYPE "TaskPriority" AS ENUM ('LOWEST', 'LOW', 'NORMAL', 'HIGH', 'HIGHEST');

-- CreateEnum
CREATE TYPE "TaskContextType" AS ENUM ('PROJECT', 'CONTACT');

-- CreateEnum
CREATE TYPE "RelatedEntityType" AS ENUM ('CLIENT', 'SALE', 'QUOTE', 'PROJECT', 'SALES_ORDER', 'PURCHASE_ORDER', 'INVOICE', 'CAMPAIGN', 'SUPPLIER', 'CASE', 'CONTRACT', 'PERSONAL_DATA');

-- CreateEnum
CREATE TYPE "ReminderChannel" AS ENUM ('EMAIL', 'IN_APP');

-- CreateEnum
CREATE TYPE "ReminderRecurrence" AS ENUM ('NONE', 'DAILY', 'WEEKLY', 'MONTHLY', 'YEARLY');

-- CreateTable
CREATE TABLE "Task" (
    "id" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "description" TEXT,
    "status" "TaskStatus" NOT NULL DEFAULT 'NOT_STARTED',
    "priority" "TaskPriority",
    "contextType" "TaskContextType",
    "relatedEntityType" "RelatedEntityType",
    "relatedEntityId" TEXT,
    "dueDate" DATE,
    "assignedToUserId" TEXT,
    "clientId" TEXT,
    "hasReminder" BOOLEAN NOT NULL DEFAULT false,
    "reminderAt" TIMESTAMP(3),
    "reminderChannel" "ReminderChannel",
    "reminderRecurrence" "ReminderRecurrence",
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Task_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Task" ADD CONSTRAINT "Task_assignedToUserId_fkey" FOREIGN KEY ("assignedToUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Task" ADD CONSTRAINT "Task_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE SET NULL ON UPDATE CASCADE;
