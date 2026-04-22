import prisma from '../db/prisma.js'
import { TaskStatus } from '../generated/prisma/client.js'

// ── Stage sets ────────────────────────────────────────────────────────────────

const INSURANCE_OPEN_STAGES = new Set([
  'RESPONSE_PENDING',
  'DOCUMENTS_PENDING',
  'SIGNATURE_PENDING',
  'ISSUANCE_PENDING',
  'BILLING_THIS_MONTH',
  'BILLING_NEXT_MONTH',
  'RECURRENT_BILLING',
  'INVOICE_PENDING_PAYMENT',
  'WRONG_SETTLEMENT',
])

const ENERGY_OPEN_STAGES = new Set([
  'RESPONSE_PENDING',
  'DOCUMENTS_PENDING',
  'SIGNATURE_PENDING',
  'ACTIVATION_PENDING',
  'BILLING_THIS_MONTH',
])

// ── Helpers ───────────────────────────────────────────────────────────────────

function monthRange(year: number, month: number): { gte: Date; lt: Date } {
  return {
    gte: new Date(year, month, 1),
    lt: new Date(year, month + 1, 1),
  }
}

function deltaPercent(current: number, previous: number): number | null {
  if (previous === 0) return null
  return Math.round(((current - previous) / previous) * 100)
}

// ── Types ─────────────────────────────────────────────────────────────────────

export interface MonthKpis {
  toCollectAmount: number
  collectedAmount: number
  newSalesCount: number
  newClientsCount: number
}

export interface DashboardSummary {
  thisMonth: MonthKpis
  lastMonth: MonthKpis
  delta: {
    toCollectAmount: number | null
    collectedAmount: number | null
    newSalesCount: number | null
    newClientsCount: number | null
  }
  pipeline: {
    openCount: number
    openValue: number
    insuranceOpenCount: number
    energyOpenCount: number
  }
  recentActivities: {
    id: string
    type: string
    subject: string
    activityAt: string
    clientName: string | null
    saleTitle: string | null
    userName: string | null
  }[]
  pendingTasks: {
    id: string
    subject: string
    priority: string
    dueDate: string | null
    clientName: string | null
    assignedToName: string | null
  }[]
}

// ── Main ──────────────────────────────────────────────────────────────────────

export async function getDashboardSummary(): Promise<DashboardSummary> {
  const now = new Date()
  const thisYear = now.getFullYear()
  const thisMonth = now.getMonth()
  const lastYear = thisMonth === 0 ? thisYear - 1 : thisYear
  const lastMonth = thisMonth === 0 ? 11 : thisMonth - 1

  const thisRange = monthRange(thisYear, thisMonth)
  const lastRange = monthRange(lastYear, lastMonth)

  // ── This month KPIs ────────────────────────────────────────────────────────

  const [
    toCollectThis,
    collectedThis,
    newSalesThis,
    newClientsThis,
    toCollectLast,
    collectedLast,
    newSalesLast,
    newClientsLast,
    allOpenSales,
    recentActivities,
    pendingTasks,
  ] = await Promise.all([
    // Sales with billingDate in current month (what should be billed)
    prisma.sale.findMany({
      where: { billingDate: thisRange },
      select: { amount: true },
    }),

    // Sales with BILLED_AND_PAID and billingDate in current month
    prisma.sale.findMany({
      where: {
        billingDate: thisRange,
        OR: [
          { insuranceStage: 'BILLED_AND_PAID' },
          { energyStage: 'BILLED_AND_PAID' },
        ],
      },
      select: { amount: true },
    }),

    // Sales created this month
    prisma.sale.count({ where: { createdAt: thisRange } }),

    // Clients created this month
    prisma.client.count({ where: { createdAt: thisRange } }),

    // Previous month — to collect
    prisma.sale.findMany({
      where: { billingDate: lastRange },
      select: { amount: true },
    }),

    // Previous month — collected
    prisma.sale.findMany({
      where: {
        billingDate: lastRange,
        OR: [
          { insuranceStage: 'BILLED_AND_PAID' },
          { energyStage: 'BILLED_AND_PAID' },
        ],
      },
      select: { amount: true },
    }),

    // Sales created last month
    prisma.sale.count({ where: { createdAt: lastRange } }),

    // Clients created last month
    prisma.client.count({ where: { createdAt: lastRange } }),

    // All sales (for pipeline open count)
    prisma.sale.findMany({
      select: {
        type: true,
        insuranceStage: true,
        energyStage: true,
        expectedRevenue: true,
        amount: true,
      },
    }),

    // Recent activities
    prisma.activity.findMany({
      take: 8,
      orderBy: { activityAt: 'desc' },
      select: {
        id: true,
        type: true,
        subject: true,
        activityAt: true,
        client: { select: { name: true } },
        sale:   { select: { title: true } },
        user:   { select: { displayName: true } },
      },
    }),

    // Pending tasks
    prisma.task.findMany({
      where: {
        status: { not: TaskStatus.COMPLETED },
      },
      take: 6,
      orderBy: [
        { dueDate: 'asc' },
        { priority: 'desc' },
      ],
      include: {
        client:     { select: { name: true } },
        assignedTo: { select: { displayName: true } },
      },
    }),
  ])

  // ── Pipeline calculation ───────────────────────────────────────────────────

  let openCount = 0
  let openValue = 0
  let insuranceOpenCount = 0
  let energyOpenCount = 0

  for (const sale of allOpenSales) {
    let isOpen = false
    if (sale.type === 'INSURANCE' && sale.insuranceStage && INSURANCE_OPEN_STAGES.has(sale.insuranceStage)) {
      isOpen = true
      insuranceOpenCount++
    } else if (sale.type === 'ENERGY' && sale.energyStage && ENERGY_OPEN_STAGES.has(sale.energyStage)) {
      isOpen = true
      energyOpenCount++
    }
    if (isOpen) {
      openCount++
      openValue += sale.expectedRevenue ?? sale.amount ?? 0
    }
  }

  // ── Aggregate amounts ──────────────────────────────────────────────────────

  const sum = (rows: { amount: number | null }[]) =>
    rows.reduce((acc, r) => acc + (r.amount ?? 0), 0)

  const thisKpis: MonthKpis = {
    toCollectAmount: sum(toCollectThis),
    collectedAmount: sum(collectedThis),
    newSalesCount: newSalesThis,
    newClientsCount: newClientsThis,
  }

  const lastKpis: MonthKpis = {
    toCollectAmount: sum(toCollectLast),
    collectedAmount: sum(collectedLast),
    newSalesCount: newSalesLast,
    newClientsCount: newClientsLast,
  }

  return {
    thisMonth: thisKpis,
    lastMonth: lastKpis,
    delta: {
      toCollectAmount:  deltaPercent(thisKpis.toCollectAmount,  lastKpis.toCollectAmount),
      collectedAmount:  deltaPercent(thisKpis.collectedAmount,  lastKpis.collectedAmount),
      newSalesCount:    deltaPercent(thisKpis.newSalesCount,    lastKpis.newSalesCount),
      newClientsCount:  deltaPercent(thisKpis.newClientsCount,  lastKpis.newClientsCount),
    },
    pipeline: { openCount, openValue, insuranceOpenCount, energyOpenCount },
    recentActivities: recentActivities.map(a => ({
      id:           a.id,
      type:         a.type,
      subject:      a.subject,
      activityAt:   a.activityAt.toISOString(),
      clientName:   a.client?.name ?? null,
      saleTitle:    a.sale?.title ?? null,
      userName:     a.user?.displayName ?? null,
    })),
    pendingTasks: pendingTasks.map(t => ({
      id:               t.id,
      subject:          t.subject,
      priority:         t.priority ?? 'NORMAL',
      dueDate:          t.dueDate ? t.dueDate.toISOString() : null,
      clientName:       t.client?.name ?? null,
      assignedToName:   t.assignedTo?.displayName ?? null,
    })),
  }
}
