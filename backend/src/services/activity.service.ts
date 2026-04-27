import prisma from '../db/prisma.js'
import { Prisma } from '../generated/prisma/client.js'
import type { ActivityType, ActivityDirection } from '../generated/prisma/enums.js'

export interface ActivityInput {
  userId:       string
  // Hierarchy: when caseId is set, saleId and clientId are auto-populated from the case.
  // When saleId is set (no case), clientId is auto-populated from the sale.
  // clientId is always required in the DB; it is resolved here if not provided directly.
  clientId?:    string
  saleId?:      string
  caseId?:      string
  type:         ActivityType
  direction?:   ActivityDirection
  subject:      string
  description?: string
  outcome?:     string
  nextStep?:    string
  activityAt:   Date | string
}

const include = {
  user: { select: { id: true, displayName: true } },
  case: { select: { id: true, name: true } },
} satisfies Prisma.ActivityInclude

const DATE_FIELDS = ['activityAt'] as const

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
 * - clientId only → use as-is
 */
async function resolveHierarchy(input: {
  caseId?:   string
  saleId?:   string
  clientId?: string
}): Promise<{ caseId?: string; saleId?: string; clientId: string }> {
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
  if (!input.clientId) {
    throw new Error('At least one of clientId, saleId, or caseId must be provided')
  }
  return { clientId: input.clientId }
}

export interface ActivityFilters {
  clientId?: string
  saleId?:   string
  caseId?:   string
  userId?:   string
  type?:     ActivityType
}

function buildWhere(filters: ActivityFilters): Prisma.ActivityWhereInput {
  const where: Prisma.ActivityWhereInput = {}
  if (filters.clientId) where.clientId = filters.clientId
  if (filters.saleId)   where.saleId   = filters.saleId
  if (filters.caseId)   where.caseId   = filters.caseId
  if (filters.userId)   where.userId   = filters.userId
  if (filters.type)     where.type     = filters.type
  return where
}

export function listActivities(filters: ActivityFilters = {}) {
  return prisma.activity.findMany({
    where:   buildWhere(filters),
    include,
    orderBy: { activityAt: 'desc' },
  })
}

export function getActivityById(id: string) {
  return prisma.activity.findUnique({ where: { id }, include })
}

export async function createActivity(data: ActivityInput) {
  const sanitized = sanitize(data)
  const hierarchy = await resolveHierarchy({
    caseId:   sanitized.caseId,
    saleId:   sanitized.saleId,
    clientId: sanitized.clientId,
  })
  const createData = {
    ...sanitized,
    ...hierarchy,
  } as Prisma.ActivityUncheckedCreateInput
  return prisma.activity.create({ data: createData, include })
}

export async function updateActivity(
  id: string,
  data: Partial<Omit<ActivityInput, 'userId'>>
) {
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

  const updateData = {
    ...sanitized,
    ...hierarchy,
  } as Prisma.ActivityUncheckedUpdateInput
  return prisma.activity.update({ where: { id }, data: updateData, include })
}

export function deleteActivity(id: string) {
  return prisma.activity.delete({ where: { id } })
}
