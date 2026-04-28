/**
 * Unit tests for dashboard.service.ts
 *
 * The Prisma client is mocked so no database connection is required.
 * Tests cover:
 *   - response shape (all required fields present)
 *   - pipeline open/closed stage classification
 *   - delta calculation (percentage change and null when previous is 0)
 *   - amount aggregation (null amounts treated as 0)
 *   - recentActivities and pendingTasks mapping
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('../db/prisma.js', () => ({
  default: {
    sale:     { findMany: vi.fn(), count: vi.fn() },
    client:   { count: vi.fn() },
    activity: { findMany: vi.fn() },
    task:     { findMany: vi.fn() },
  },
}))

import prisma from '../db/prisma.js'
import { getDashboardSummary } from './dashboard.service.js'

const mockSaleFindMany   = vi.mocked(prisma.sale.findMany)
const mockSaleCount      = vi.mocked(prisma.sale.count)
const mockClientCount    = vi.mocked(prisma.client.count)
const mockActivityFindMany = vi.mocked(prisma.activity.findMany)
const mockTaskFindMany   = vi.mocked(prisma.task.findMany)

// Helper to set up all mocks with sensible defaults then override selectively
function setupMocks(overrides: {
  toCollectThis?: { amount: number | null }[]
  collectedThis?: { amount: number | null }[]
  newSalesThis?: number
  newClientsThis?: number
  toCollectLast?: { amount: number | null }[]
  collectedLast?: { amount: number | null }[]
  newSalesLast?: number
  newClientsLast?: number
  allOpenSales?: { type: string; insuranceStage: string | null; energyStage: string | null; expectedRevenue: number | null; amount: number | null }[]
  activities?: object[]
  tasks?: object[]
} = {}) {
  // Promise.all order in the service:
  // 0: toCollectThis, 1: collectedThis, 2: newSalesThis (count), 3: newClientsThis (count)
  // 4: toCollectLast, 5: collectedLast, 6: newSalesLast (count), 7: newClientsLast (count)
  // 8: allOpenSales, 9: recentActivities, 10: pendingTasks

  mockSaleFindMany
    .mockResolvedValueOnce((overrides.toCollectThis ?? []) as never)
    .mockResolvedValueOnce((overrides.collectedThis ?? []) as never)
    .mockResolvedValueOnce((overrides.toCollectLast ?? []) as never)
    .mockResolvedValueOnce((overrides.collectedLast ?? []) as never)
    .mockResolvedValueOnce((overrides.allOpenSales ?? []) as never)

  mockSaleCount
    .mockResolvedValueOnce(overrides.newSalesThis ?? 0)
    .mockResolvedValueOnce(overrides.newSalesLast ?? 0)

  mockClientCount
    .mockResolvedValueOnce(overrides.newClientsThis ?? 0)
    .mockResolvedValueOnce(overrides.newClientsLast ?? 0)

  mockActivityFindMany.mockResolvedValue((overrides.activities ?? []) as never)
  mockTaskFindMany.mockResolvedValue((overrides.tasks ?? []) as never)
}

beforeEach(() => vi.clearAllMocks())

// ─── Response shape ───────────────────────────────────────────────────────────

describe('getDashboardSummary — response shape', () => {
  it('returns all required top-level keys', async () => {
    setupMocks()
    const result = await getDashboardSummary()

    expect(result).toHaveProperty('thisMonth')
    expect(result).toHaveProperty('lastMonth')
    expect(result).toHaveProperty('delta')
    expect(result).toHaveProperty('pipeline')
    expect(result).toHaveProperty('recentActivities')
    expect(result).toHaveProperty('pendingTasks')
  })

  it('thisMonth and lastMonth contain all KPI fields', async () => {
    setupMocks()
    const { thisMonth, lastMonth } = await getDashboardSummary()

    for (const kpi of [thisMonth, lastMonth]) {
      expect(kpi).toHaveProperty('toCollectAmount')
      expect(kpi).toHaveProperty('collectedAmount')
      expect(kpi).toHaveProperty('newSalesCount')
      expect(kpi).toHaveProperty('newClientsCount')
    }
  })

  it('pipeline contains all required fields', async () => {
    setupMocks()
    const { pipeline } = await getDashboardSummary()

    expect(pipeline).toHaveProperty('openCount')
    expect(pipeline).toHaveProperty('openValue')
    expect(pipeline).toHaveProperty('insuranceOpenCount')
    expect(pipeline).toHaveProperty('energyOpenCount')
  })

  it('recentActivities is an array', async () => {
    setupMocks()
    const { recentActivities } = await getDashboardSummary()
    expect(Array.isArray(recentActivities)).toBe(true)
  })

  it('pendingTasks is an array', async () => {
    setupMocks()
    const { pendingTasks } = await getDashboardSummary()
    expect(Array.isArray(pendingTasks)).toBe(true)
  })
})

// ─── Amount aggregation ───────────────────────────────────────────────────────

describe('getDashboardSummary — amount aggregation', () => {
  it('sums toCollectAmount correctly', async () => {
    setupMocks({ toCollectThis: [{ amount: 1000 }, { amount: 500 }] })
    const { thisMonth } = await getDashboardSummary()
    expect(thisMonth.toCollectAmount).toBe(1500)
  })

  it('treats null amounts as 0 when summing', async () => {
    setupMocks({ toCollectThis: [{ amount: null }, { amount: 200 }] })
    const { thisMonth } = await getDashboardSummary()
    expect(thisMonth.toCollectAmount).toBe(200)
  })

  it('returns 0 when no sales match', async () => {
    setupMocks()
    const { thisMonth } = await getDashboardSummary()
    expect(thisMonth.toCollectAmount).toBe(0)
    expect(thisMonth.collectedAmount).toBe(0)
  })
})

// ─── Delta calculation ────────────────────────────────────────────────────────

describe('getDashboardSummary — delta calculation', () => {
  it('calculates positive delta percentage', async () => {
    setupMocks({
      toCollectThis: [{ amount: 1500 }],
      toCollectLast: [{ amount: 1000 }],
    })
    const { delta } = await getDashboardSummary()
    expect(delta.toCollectAmount).toBe(50) // +50%
  })

  it('calculates negative delta percentage', async () => {
    setupMocks({
      toCollectThis: [{ amount: 800 }],
      toCollectLast: [{ amount: 1000 }],
    })
    const { delta } = await getDashboardSummary()
    expect(delta.toCollectAmount).toBe(-20) // -20%
  })

  it('returns null delta when previous month value is 0', async () => {
    setupMocks({
      toCollectThis: [{ amount: 500 }],
      toCollectLast: [],
    })
    const { delta } = await getDashboardSummary()
    expect(delta.toCollectAmount).toBeNull()
  })

  it('returns null delta for newSalesCount when last month count is 0', async () => {
    setupMocks({ newSalesThis: 3, newSalesLast: 0 })
    const { delta } = await getDashboardSummary()
    expect(delta.newSalesCount).toBeNull()
  })

  it('rounds delta to the nearest integer', async () => {
    setupMocks({
      toCollectThis: [{ amount: 133 }],
      toCollectLast: [{ amount: 100 }],
    })
    const { delta } = await getDashboardSummary()
    expect(delta.toCollectAmount).toBe(33) // 33% rounded
  })
})

// ─── Pipeline classification ──────────────────────────────────────────────────

describe('getDashboardSummary — pipeline open/closed classification', () => {
  it('counts an INSURANCE sale in an open stage', async () => {
    setupMocks({
      allOpenSales: [
        { type: 'INSURANCE', insuranceStage: 'RESPONSE_PENDING', energyStage: null, expectedRevenue: 1000, amount: null },
      ],
    })
    const { pipeline } = await getDashboardSummary()
    expect(pipeline.openCount).toBe(1)
    expect(pipeline.insuranceOpenCount).toBe(1)
    expect(pipeline.energyOpenCount).toBe(0)
  })

  it('counts an ENERGY sale in an open stage', async () => {
    setupMocks({
      allOpenSales: [
        { type: 'ENERGY', insuranceStage: null, energyStage: 'ACTIVATION_PENDING', expectedRevenue: 500, amount: null },
      ],
    })
    const { pipeline } = await getDashboardSummary()
    expect(pipeline.openCount).toBe(1)
    expect(pipeline.energyOpenCount).toBe(1)
    expect(pipeline.insuranceOpenCount).toBe(0)
  })

  it('does not count a sale in a closed stage', async () => {
    setupMocks({
      allOpenSales: [
        { type: 'INSURANCE', insuranceStage: 'BILLED_AND_PAID', energyStage: null, expectedRevenue: 1000, amount: null },
      ],
    })
    const { pipeline } = await getDashboardSummary()
    expect(pipeline.openCount).toBe(0)
    expect(pipeline.insuranceOpenCount).toBe(0)
  })

  it('uses expectedRevenue for open pipeline value', async () => {
    setupMocks({
      allOpenSales: [
        { type: 'INSURANCE', insuranceStage: 'SIGNATURE_PENDING', energyStage: null, expectedRevenue: 2500, amount: 1000 },
      ],
    })
    const { pipeline } = await getDashboardSummary()
    expect(pipeline.openValue).toBe(2500)
  })

  it('falls back to amount when expectedRevenue is null', async () => {
    setupMocks({
      allOpenSales: [
        { type: 'INSURANCE', insuranceStage: 'ISSUANCE_PENDING', energyStage: null, expectedRevenue: null, amount: 800 },
      ],
    })
    const { pipeline } = await getDashboardSummary()
    expect(pipeline.openValue).toBe(800)
  })

  it('returns zero openValue when both expectedRevenue and amount are null', async () => {
    setupMocks({
      allOpenSales: [
        { type: 'INSURANCE', insuranceStage: 'BILLING_THIS_MONTH', energyStage: null, expectedRevenue: null, amount: null },
      ],
    })
    const { pipeline } = await getDashboardSummary()
    expect(pipeline.openValue).toBe(0)
  })

  it('counts multiple open sales correctly', async () => {
    setupMocks({
      allOpenSales: [
        { type: 'INSURANCE', insuranceStage: 'RESPONSE_PENDING', energyStage: null, expectedRevenue: 1000, amount: null },
        { type: 'ENERGY', insuranceStage: null, energyStage: 'BILLING_THIS_MONTH', expectedRevenue: 500, amount: null },
        { type: 'INSURANCE', insuranceStage: 'BILLED_AND_PAID', energyStage: null, expectedRevenue: 200, amount: null },
      ],
    })
    const { pipeline } = await getDashboardSummary()
    expect(pipeline.openCount).toBe(2)
    expect(pipeline.insuranceOpenCount).toBe(1)
    expect(pipeline.energyOpenCount).toBe(1)
    expect(pipeline.openValue).toBe(1500)
  })
})

// ─── recentActivities mapping ─────────────────────────────────────────────────

describe('getDashboardSummary — recentActivities mapping', () => {
  it('maps activity fields correctly', async () => {
    setupMocks({
      activities: [
        {
          id: 'act-001',
          type: 'CALL',
          subject: 'Follow up',
          activityAt: new Date('2026-04-01T10:00:00.000Z'),
          client: { name: 'Ana García' },
          sale: null,
          user: { displayName: 'Mila' },
        },
      ],
    })
    const { recentActivities } = await getDashboardSummary()
    expect(recentActivities).toHaveLength(1)
    expect(recentActivities[0]).toMatchObject({
      id: 'act-001',
      type: 'CALL',
      subject: 'Follow up',
      activityAt: '2026-04-01T10:00:00.000Z',
      clientName: 'Ana García',
      saleTitle: null,
      userName: 'Mila',
    })
  })

  it('returns null for optional relation fields when not set', async () => {
    setupMocks({
      activities: [
        {
          id: 'act-002',
          type: 'EMAIL',
          subject: 'Sent policy',
          activityAt: new Date('2026-04-10T09:00:00.000Z'),
          client: null,
          sale: null,
          user: null,
        },
      ],
    })
    const { recentActivities } = await getDashboardSummary()
    expect(recentActivities[0].clientName).toBeNull()
    expect(recentActivities[0].saleTitle).toBeNull()
    expect(recentActivities[0].userName).toBeNull()
  })
})

// ─── pendingTasks mapping ─────────────────────────────────────────────────────

describe('getDashboardSummary — pendingTasks mapping', () => {
  it('maps task fields correctly', async () => {
    setupMocks({
      tasks: [
        {
          id: 'task-001',
          subject: 'Send documents',
          priority: 'HIGH',
          dueDate: new Date('2026-04-30T00:00:00.000Z'),
          client: { name: 'Ana García' },
          assignedTo: { displayName: 'Mila' },
        },
      ],
    })
    const { pendingTasks } = await getDashboardSummary()
    expect(pendingTasks).toHaveLength(1)
    expect(pendingTasks[0]).toMatchObject({
      id: 'task-001',
      subject: 'Send documents',
      priority: 'HIGH',
      dueDate: '2026-04-30T00:00:00.000Z',
      clientName: 'Ana García',
      assignedToName: 'Mila',
    })
  })

  it('defaults priority to NORMAL when null', async () => {
    setupMocks({
      tasks: [
        {
          id: 'task-002',
          subject: 'Review case',
          priority: null,
          dueDate: null,
          client: null,
          assignedTo: null,
        },
      ],
    })
    const { pendingTasks } = await getDashboardSummary()
    expect(pendingTasks[0].priority).toBe('NORMAL')
    expect(pendingTasks[0].dueDate).toBeNull()
    expect(pendingTasks[0].clientName).toBeNull()
    expect(pendingTasks[0].assignedToName).toBeNull()
  })
})
