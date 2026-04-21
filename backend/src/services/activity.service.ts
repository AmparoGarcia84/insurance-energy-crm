import prisma from '../db/prisma.js'
import { Prisma } from '../generated/prisma/client.js'
import type { ActivityType, ActivityDirection } from '../generated/prisma/enums.js'

export interface ActivityInput {
  userId:      string
  clientId:    string
  saleId?:     string
  type:        ActivityType
  direction?:  ActivityDirection
  subject:     string
  description?: string
  outcome?:    string
  nextStep?:   string
  activityAt:  Date | string
}

const include = {
  user: { select: { id: true, displayName: true } },
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

export interface ActivityFilters {
  clientId?: string
  saleId?:   string
  userId?:   string
  type?:     ActivityType
}

function buildWhere(filters: ActivityFilters): Prisma.ActivityWhereInput {
  const where: Prisma.ActivityWhereInput = {}
  if (filters.clientId) where.clientId = filters.clientId
  if (filters.saleId)   where.saleId   = filters.saleId
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

export function createActivity(data: ActivityInput) {
  const createData = sanitize(data) as Prisma.ActivityUncheckedCreateInput
  return prisma.activity.create({ data: createData, include })
}

export function updateActivity(id: string, data: Partial<Omit<ActivityInput, 'userId' | 'clientId'>>) {
  const updateData = sanitize(data) as Prisma.ActivityUncheckedUpdateInput
  return prisma.activity.update({ where: { id }, data: updateData, include })
}

export function deleteActivity(id: string) {
  return prisma.activity.delete({ where: { id } })
}
