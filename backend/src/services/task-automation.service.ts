/**
 * task-automation.service.ts
 *
 * Central service for all automatically generated tasks.
 * Each domain event that should trigger a task has its own named function here.
 * All functions call createTask internally and swallow errors so that a task
 * generation failure never breaks the originating operation.
 *
 * Current triggers:
 *   - createTaskForNewCase  (fired by case.service.ts after case creation)
 *
 * Future triggers (add functions here as features are defined):
 *   - createTaskForNewSale
 *   - createTaskForSaleStageChange
 */

import { CaseType } from '../generated/prisma/enums.js'
import { createTask } from './task.service.js'

// Label map mirrors CaseTypeLabels in shared/domain-types.ts
// Kept here to avoid importing shared types in the backend service layer
const CASE_TYPE_LABELS: Record<CaseType, string> = {
  [CaseType.CLAIM]:            'Siniestro',
  [CaseType.FAULT]:            'Avería',
  [CaseType.ACTIVATION]:       'Activación',
  [CaseType.WRONG_SETTLEMENT]: 'Liquidación errónea',
}

function addMonths(date: Date, months: number): Date {
  const d = new Date(date)
  d.setMonth(d.getMonth() + months)
  return d
}

function toISODate(date: Date): string {
  return date.toISOString().split('T')[0]
}

// ── Triggers ──────────────────────────────────────────────────────────────────

export interface NewCaseContext {
  caseId:          string
  caseName:        string
  caseType?:       CaseType | null
  /** supplierId from the case — mapped to providerSupplierId on the task */
  providerSupplierId?: string | null
  createdByUserId?: string | null
}

/**
 * Generates the initial review task when a new case is created.
 * Errors are caught and logged — the case creation is never rolled back.
 */
export async function createTaskForNewCase(ctx: NewCaseContext): Promise<void> {
  const typeLabel = ctx.caseType ? CASE_TYPE_LABELS[ctx.caseType] : null
  const subject     = `Revisión de caso - ${ctx.caseName}`
  const description = `Iniciar solución para el ${typeLabel ?? 'caso'}`
  const dueDate     = toISODate(addMonths(new Date(), 3))

  try {
    await createTask({
      subject,
      description,
      status:              'NOT_STARTED',
      dueDate,
      caseId:              ctx.caseId,
      assignedToUserId:    ctx.createdByUserId ?? undefined,
      providerSupplierId:  ctx.providerSupplierId ?? undefined,
      hasReminder:         false,
    })
  } catch (err) {
    // Task generation is a best-effort side effect — log and continue
    console.error('[task-automation] Failed to create task for new case:', err)
  }
}
