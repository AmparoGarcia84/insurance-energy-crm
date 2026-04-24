import prisma from '../db/prisma.js'

export type CaseStatus = 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED'

export interface CaseInput {
  /** Every case must belong to a sale. clientId is auto-derived from sale.clientId. */
  saleId:      string
  title:       string
  description?: string
  status?:     CaseStatus
}

const include = {
  client: { select: { id: true, name: true } },
  sale:   { select: { id: true, title: true } },
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
  const sale = await prisma.sale.findUniqueOrThrow({
    where:  { id: data.saleId },
    select: { clientId: true },
  })

  return prisma.case.create({
    data: {
      saleId:      data.saleId,
      clientId:    sale.clientId,
      title:       data.title,
      description: data.description,
      status:      data.status,
    },
    include,
  })
}

export async function updateCase(id: string, data: Partial<CaseInput>) {
  // If saleId changes, re-derive clientId from the new sale
  let clientId: string | undefined
  if (data.saleId) {
    const sale = await prisma.sale.findUniqueOrThrow({
      where:  { id: data.saleId },
      select: { clientId: true },
    })
    clientId = sale.clientId
  }

  return prisma.case.update({
    where: { id },
    data: {
      ...(data.saleId      !== undefined && { saleId: data.saleId }),
      ...(clientId         !== undefined && { clientId }),
      ...(data.title       !== undefined && { title: data.title }),
      ...(data.description !== undefined && { description: data.description }),
      ...(data.status      !== undefined && { status: data.status }),
    },
    include,
  })
}

export function deleteCase(id: string) {
  return prisma.case.delete({ where: { id } })
}
