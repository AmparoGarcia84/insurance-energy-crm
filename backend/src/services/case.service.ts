import prisma from '../db/prisma.js'

export type CaseStatus = 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED'

export interface CaseInput {
  clientId: string
  title: string
  description?: string
  status?: CaseStatus
}

export function listCases() {
  return prisma.case.findMany({
    include: { client: { select: { id: true, name: true } } },
    orderBy: { updatedAt: 'desc' },
  })
}

export function getCaseById(id: string) {
  return prisma.case.findUnique({
    where: { id },
    include: { client: { select: { id: true, name: true } } },
  })
}

export function createCase(data: CaseInput) {
  return prisma.case.create({
    data,
    include: { client: { select: { id: true, name: true } } },
  })
}

export function updateCase(id: string, data: Partial<CaseInput>) {
  return prisma.case.update({
    where: { id },
    data,
    include: { client: { select: { id: true, name: true } } },
  })
}

export function deleteCase(id: string) {
  return prisma.case.delete({ where: { id } })
}
