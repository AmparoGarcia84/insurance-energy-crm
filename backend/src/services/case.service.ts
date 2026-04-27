import prisma from '../db/prisma.js'
import { CaseStatus, CasePriority, CaseType } from '../generated/prisma/enums.js'

export type { CaseStatus, CasePriority, CaseType }

export interface CaseInput {
  clientId:     string
  saleId?:      string | null
  name:         string         // max 200
  occurrenceAt?: string | null // ISO 8601
  description?: string | null  // max 2000
  cause?:       string | null  // max 1000
  type?:        CaseType | null
  status?:      CaseStatus
  priority?:    CasePriority
  supplierId?:  string | null
}

const include = {
  client:   { select: { id: true, name: true } },
  sale:     { select: { id: true, title: true } },
  supplier: { select: { id: true, name: true } },
} as const

export function listCases(filters: { clientId?: string; saleId?: string } = {}) {
  const where: { clientId?: string; saleId?: string } = {}
  if (filters.clientId) where.clientId = filters.clientId
  if (filters.saleId)   where.saleId   = filters.saleId
  return prisma.case.findMany({
    where,
    include,
    orderBy: { updatedAt: 'desc' },
  })
}

export function getCaseById(id: string) {
  return prisma.case.findUnique({ where: { id }, include })
}

export async function createCase(data: CaseInput) {
  // When saleId is provided, verify it exists and derive clientId if not explicitly set
  let clientId = data.clientId
  if (data.saleId) {
    const sale = await prisma.sale.findUniqueOrThrow({
      where:  { id: data.saleId },
      select: { clientId: true },
    })
    clientId = sale.clientId
  }

  return prisma.case.create({
    data: {
      clientId,
      saleId:      data.saleId   ?? null,
      name:        data.name,
      occurrenceAt: data.occurrenceAt ? new Date(data.occurrenceAt) : null,
      description: data.description ?? null,
      cause:       data.cause       ?? null,
      type:        data.type        ?? null,
      status:      data.status      ?? CaseStatus.NEW,
      priority:    data.priority    ?? CasePriority.NORMAL,
      supplierId:  data.supplierId  ?? null,
    },
    include,
  })
}

export async function updateCase(id: string, data: Partial<CaseInput>) {
  // If saleId is being updated, re-derive clientId
  let clientId: string | undefined
  if (data.saleId !== undefined && data.saleId !== null) {
    const sale = await prisma.sale.findUniqueOrThrow({
      where:  { id: data.saleId },
      select: { clientId: true },
    })
    clientId = sale.clientId
  }

  return prisma.case.update({
    where: { id },
    data: {
      ...(data.clientId     !== undefined && { clientId: data.clientId }),
      ...(clientId          !== undefined && { clientId }),
      ...(data.saleId       !== undefined && { saleId: data.saleId }),
      ...(data.name         !== undefined && { name: data.name }),
      ...(data.occurrenceAt !== undefined && {
        occurrenceAt: data.occurrenceAt ? new Date(data.occurrenceAt) : null,
      }),
      ...(data.description  !== undefined && { description: data.description }),
      ...(data.cause        !== undefined && { cause: data.cause }),
      ...(data.type         !== undefined && { type: data.type }),
      ...(data.status       !== undefined && { status: data.status }),
      ...(data.priority     !== undefined && { priority: data.priority }),
      ...(data.supplierId   !== undefined && { supplierId: data.supplierId }),
    },
    include,
  })
}

export function deleteCase(id: string) {
  return prisma.case.delete({ where: { id } })
}
