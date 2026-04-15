import prisma from '../db/prisma.js'
import { Prisma } from '../generated/prisma/client.js'
import type {
  TaskStatus,
  TaskPriority,
  TaskContextType,
  RelatedEntityType,
  ReminderChannel,
  ReminderRecurrence,
} from '../generated/prisma/enums.js'

export interface TaskInput {
  subject:             string
  description?:        string
  status?:             TaskStatus
  priority?:           TaskPriority
  contextType?:        TaskContextType
  relatedEntityType?:  RelatedEntityType
  relatedEntityId?:    string
  dueDate?:            Date | string | null
  assignedToUserId?:   string
  clientId?:           string
  hasReminder?:        boolean
  reminderAt?:         Date | string | null
  reminderChannel?:    ReminderChannel
  reminderRecurrence?: ReminderRecurrence
}

// Relation includes for all queries
const include = {
  assignedTo: { select: { id: true, displayName: true, email: true } },
  client:     { select: { id: true, name: true, clientNumber: true } },
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

// ── Filters ───────────────────────────────────────────────────────────────────

export interface TaskFilters {
  assignedToUserId?:  string
  status?:            TaskStatus
  priority?:          TaskPriority
  contextType?:       TaskContextType
  relatedEntityType?: RelatedEntityType
  clientId?:          string
  /** ISO date string — returns tasks with dueDate <= this value */
  dueBefore?:         string
  /** ISO date string — returns tasks with dueDate >= this value */
  dueAfter?:          string
  /** true → only tasks where dueDate < today */
  overdue?:           boolean
  /** true → only tasks where hasReminder = true */
  hasReminder?:       boolean
}

function buildWhere(filters: TaskFilters): Prisma.TaskWhereInput {
  const where: Prisma.TaskWhereInput = {}

  if (filters.assignedToUserId)  where.assignedToUserId  = filters.assignedToUserId
  if (filters.status)            where.status            = filters.status
  if (filters.priority)          where.priority          = filters.priority
  if (filters.contextType)       where.contextType       = filters.contextType
  if (filters.relatedEntityType) where.relatedEntityType = filters.relatedEntityType
  if (filters.clientId)          where.clientId          = filters.clientId
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

export function createTask(data: TaskInput) {
  const createData: Prisma.TaskUncheckedCreateInput = sanitize(data) as Prisma.TaskUncheckedCreateInput
  return prisma.task.create({ data: createData, include })
}

export function updateTask(id: string, data: Partial<TaskInput>) {
  const updateData: Prisma.TaskUncheckedUpdateInput = sanitize(data) as Prisma.TaskUncheckedUpdateInput
  return prisma.task.update({ where: { id }, data: updateData, include })
}

export function deleteTask(id: string) {
  return prisma.task.delete({ where: { id } })
}
