import prisma from '../db/prisma.js'
import { Prisma } from '../generated/prisma/client.js'

export interface SaleInput {
  clientId: string
  clientName?: string
  type: 'INSURANCE' | 'ENERGY'
  businessType?: Prisma.SaleUncheckedCreateInput['businessType']
  title: string
  companyName?: string
  insuranceBranch?: string
  insuranceStage?: Prisma.SaleUncheckedCreateInput['insuranceStage']
  energyStage?: Prisma.SaleUncheckedCreateInput['energyStage']
  amount?: number
  expectedRevenue?: number
  expectedSavingsPerYear?: number
  probabilityPercent?: number
  forecastCategory?: Prisma.SaleUncheckedCreateInput['forecastCategory']
  expectedCloseDate?: Date | string
  issueDate?: Date | string
  billingDate?: Date | string
  projectSource?: Prisma.SaleUncheckedCreateInput['projectSource']
  channel?: string
  campaignSource?: string
  socialLeadId?: string
  ownerUserId?: string
  ownerUserName?: string
  contactName?: string
  policyNumber?: string
  contractId?: string
  nextStep?: string
  lostReason?: string
  description?: string
}

const DATE_FIELDS = ['expectedCloseDate', 'issueDate', 'billingDate'] as const

function sanitize<T>(data: T): T {
  return Object.fromEntries(
    Object.entries(data as Record<string, unknown>).map(([k, v]) => {
      if (v === '') return [k, undefined]
      if (DATE_FIELDS.includes(k as typeof DATE_FIELDS[number]) && typeof v === 'string') {
        return [k, new Date(v)]
      }
      return [k, v]
    })
  ) as T
}

export function listSales(filters: { clientId?: string } = {}) {
  return prisma.sale.findMany({
    where: filters.clientId ? { clientId: filters.clientId } : undefined,
    orderBy: { updatedAt: 'desc' },
  })
}

export function getSaleById(id: string) {
  return prisma.sale.findUnique({ where: { id } })
}

export function createSale(data: SaleInput) {
  const createData: Prisma.SaleUncheckedCreateInput = sanitize(data) as Prisma.SaleUncheckedCreateInput
  return prisma.sale.create({ data: createData })
}

export function updateSale(id: string, data: Partial<SaleInput>) {
  const updateData: Prisma.SaleUncheckedUpdateInput = sanitize(data) as Prisma.SaleUncheckedUpdateInput
  return prisma.sale.update({ where: { id }, data: updateData })
}

export function deleteSale(id: string) {
  return prisma.sale.delete({ where: { id } })
}
