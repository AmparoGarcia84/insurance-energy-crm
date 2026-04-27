import prisma from '../db/prisma.js'
import { Prisma } from '../generated/prisma/client.js'
import type {
  TaskStatus,
  TaskPriority,
  TaskContextType,
  ReminderChannel,
  ReminderRecurrence,
} from '../generated/prisma/enums.js'

export interface TaskInput {
  subject:             string
  description?:        string
  status?:             TaskStatus
  priority?:           TaskPriority
  contextType?:        TaskContextType
  dueDate?:            Date | string | null
  assignedToUserId?:   string
  // Hierarchy: set caseId to cascade-populate saleId and clientId automatically.
  // Set saleId (no caseId) to cascade-populate clientId automatically.
  // Set only clientId for tasks not linked to a specific sale or case.
  clientId?:           string
  saleId?:             string
  caseId?:             string
  supplierId?:           string
  providerSupplierId?:   string
  hasReminder?:        boolean
  reminderAt?:         Date | string | null
  reminderChannel?:    ReminderChannel
  reminderRecurrence?: ReminderRecurrence
}

// Relation includes for all queries
const include = {
  assignedTo: { select: { id: true, displayName: true, email: true } },
  client:     { select: { id: true, name: true, clientNumber: true } },
  sale:       { select: { id: true, title: true } },
  case:       { select: { id: true, name: true } },
  supplier:         { select: { id: true, name: true } },
  providerSupplier: { select: { id: true, name: true, cif: true } },
} satisfies Prisma.TaskInclude

const DATE_FIELDS = ['dueDate', 'reminderAt'] as const

/**
 * Normalize raw request data before passing to Prisma:
 * - Empty strings → undefined
 * - Date string fields → Date objects
 */
function sanitize<T extends object>(data: T): T {
  return Object.fromEntries(
    Object.entries(data).map(([k, v]) => {
      if (v === '') return [k, undefined]
      if (DATE_FIELDS.includes(k as typeof DATE_FIELDS[number]) && typeof v === 'string') {
        return [k, new Date(v)]
      }
      return [k, v]
    })
  ) as T
}

/**
 * Resolve the client/sale/case hierarchy cascade:
 * - caseId provided  → auto-populate saleId and clientId from the case
 * - saleId provided (no caseId) → auto-populate clientId from the sale
 * - only clientId provided → use as-is
 */
async function resolveHierarchy(input: {
  caseId?:   string
  saleId?:   string
  clientId?: string
}): Promise<{ caseId?: string; saleId?: string; clientId?: string }> {
  if (input.caseId) {
    const found = await prisma.case.findUniqueOrThrow({
      where:  { id: input.caseId },
      select: { saleId: true, clientId: true },
    })
    return { caseId: input.caseId, saleId: found.saleId ?? undefined, clientId: found.clientId }
  }
  if (input.saleId) {
    const found = await prisma.sale.findUniqueOrThrow({
      where:  { id: input.saleId },
      select: { clientId: true },
    })
    return { saleId: input.saleId, clientId: found.clientId }
  }
  return { clientId: input.clientId }
}

// ── Filters ───────────────────────────────────────────────────────────────────

export interface TaskFilters {
  assignedToUserId?: string
  status?:           TaskStatus
  priority?:         TaskPriority
  contextType?:      TaskContextType
  clientId?:         string
  saleId?:           string
  caseId?:           string
  supplierId?:       string
  /** ISO date string — returns tasks with dueDate <= this value */
  dueBefore?:        string
  /** ISO date string — returns tasks with dueDate >= this value */
  dueAfter?:         string
  /** true → only tasks where dueDate < today */
  overdue?:          boolean
  /** true → only tasks where hasReminder = true */
  hasReminder?:      boolean
}

function buildWhere(filters: TaskFilters): Prisma.TaskWhereInput {
  const where: Prisma.TaskWhereInput = {}

  if (filters.assignedToUserId) where.assignedToUserId = filters.assignedToUserId
  if (filters.status)           where.status           = filters.status
  if (filters.priority)         where.priority         = filters.priority
  if (filters.contextType)      where.contextType      = filters.contextType
  if (filters.clientId)         where.clientId         = filters.clientId
  if (filters.saleId)           where.saleId           = filters.saleId
  if (filters.caseId)           where.caseId           = filters.caseId
  if (filters.supplierId)       where.supplierId       = filters.supplierId
  if (filters.hasReminder !== undefined) where.hasReminder = filters.hasReminder

  // dueDate range
  if (filters.dueBefore || filters.dueAfter || filters.overdue) {
    where.dueDate = {}
    if (filters.dueBefore) where.dueDate.lte = new Date(filters.dueBefore)
    if (filters.dueAfter)  where.dueDate.gte = new Date(filters.dueAfter)
    if (filters.overdue)   where.dueDate.lt  = new Date()
  }

  return where
}

// ── CRUD ──────────────────────────────────────────────────────────────────────

export function listTasks(filters: TaskFilters = {}) {
  return prisma.task.findMany({
    where:   buildWhere(filters),
    include,
    orderBy: { createdAt: 'desc' },
  })
}

export function getTaskById(id: string) {
  return prisma.task.findUnique({ where: { id }, include })
}

export async function createTask(data: TaskInput) {
  const sanitized = sanitize(data)
  const hierarchy = await resolveHierarchy({
    caseId:   sanitized.caseId,
    saleId:   sanitized.saleId,
    clientId: sanitized.clientId,
  })
  const createData: Prisma.TaskUncheckedCreateInput = {
    ...sanitized,
    ...hierarchy,
  } as Prisma.TaskUncheckedCreateInput
  return prisma.task.create({ data: createData, include })
}

export async function updateTask(id: string, data: Partial<TaskInput>) {
  const sanitized = sanitize(data)
  // Only re-run cascade if any hierarchy field is explicitly being updated
  const hasHierarchyChange =
    sanitized.caseId !== undefined ||
    sanitized.saleId !== undefined ||
    sanitized.clientId !== undefined
  const hierarchy = hasHierarchyChange
    ? await resolveHierarchy({
        caseId:   sanitized.caseId,
        saleId:   sanitized.saleId,
        clientId: sanitized.clientId,
      })
    : {}

  const updateData: Prisma.TaskUncheckedUpdateInput = {
    ...sanitized,
    ...hierarchy,
  } as Prisma.TaskUncheckedUpdateInput
  return prisma.task.update({ where: { id }, data: updateData, include })
}

export function deleteTask(id: string) {
  return prisma.task.delete({ where: { id } })
}
