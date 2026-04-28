/**
 * Integration tests for /dashboard routes.
 *
 * The service layer is mocked so no database connection is required.
 * The single endpoint requires authentication; no role restriction applies
 * (both OWNER and EMPLOYEE can access the summary).
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import request from 'supertest'
import jwt from 'jsonwebtoken'
import { app } from '../app.js'

vi.mock('../services/dashboard.service.js', () => ({
  getDashboardSummary: vi.fn(),
}))

import * as dashboardService from '../services/dashboard.service.js'

const mockGetSummary = vi.mocked(dashboardService.getDashboardSummary)

function makeAuthCookie(userId: string, role: 'OWNER' | 'EMPLOYEE'): string {
  const token = jwt.sign({ userId, role }, process.env.JWT_SECRET!, { expiresIn: '1h' })
  return `token=${token}`
}

const OWNER_COOKIE    = makeAuthCookie('u-owner', 'OWNER')
const EMPLOYEE_COOKIE = makeAuthCookie('u-emp',   'EMPLOYEE')

const STUB_SUMMARY = {
  thisMonth: { toCollectAmount: 5000, collectedAmount: 3000, newSalesCount: 4, newClientsCount: 2 },
  lastMonth: { toCollectAmount: 4000, collectedAmount: 2500, newSalesCount: 3, newClientsCount: 1 },
  delta: { toCollectAmount: 25, collectedAmount: 20, newSalesCount: 33, newClientsCount: 100 },
  pipeline: { openCount: 10, openValue: 50000, insuranceOpenCount: 7, energyOpenCount: 3 },
  recentActivities: [
    {
      id: 'act-001',
      type: 'CALL',
      subject: 'Follow up',
      activityAt: '2026-04-01T10:00:00.000Z',
      clientName: 'Ana García',
      saleTitle: null,
      userName: 'Mila',
    },
  ],
  pendingTasks: [
    {
      id: 'task-001',
      subject: 'Send documents',
      priority: 'HIGH',
      dueDate: '2026-04-30T00:00:00.000Z',
      clientName: 'Ana García',
      assignedToName: 'Mila',
    },
  ],
}

beforeEach(() => vi.clearAllMocks())

// ─── GET /dashboard/summary ───────────────────────────────────────────────────

describe('GET /dashboard/summary', () => {
  it('returns 401 when not authenticated', async () => {
    const res = await request(app).get('/dashboard/summary')
    expect(res.status).toBe(401)
  })

  it('returns 200 with summary data for an OWNER', async () => {
    mockGetSummary.mockResolvedValue(STUB_SUMMARY as never)

    const res = await request(app)
      .get('/dashboard/summary')
      .set('Cookie', OWNER_COOKIE)

    expect(res.status).toBe(200)
    expect(res.body.thisMonth).toBeDefined()
    expect(res.body.lastMonth).toBeDefined()
    expect(res.body.delta).toBeDefined()
    expect(res.body.pipeline).toBeDefined()
    expect(Array.isArray(res.body.recentActivities)).toBe(true)
    expect(Array.isArray(res.body.pendingTasks)).toBe(true)
  })

  it('returns 200 with summary data for an EMPLOYEE', async () => {
    mockGetSummary.mockResolvedValue(STUB_SUMMARY as never)

    const res = await request(app)
      .get('/dashboard/summary')
      .set('Cookie', EMPLOYEE_COOKIE)

    expect(res.status).toBe(200)
    expect(res.body.pipeline.openCount).toBe(10)
  })

  it('returns correct KPI values', async () => {
    mockGetSummary.mockResolvedValue(STUB_SUMMARY as never)

    const res = await request(app)
      .get('/dashboard/summary')
      .set('Cookie', OWNER_COOKIE)

    expect(res.body.thisMonth.toCollectAmount).toBe(5000)
    expect(res.body.thisMonth.collectedAmount).toBe(3000)
    expect(res.body.thisMonth.newSalesCount).toBe(4)
    expect(res.body.thisMonth.newClientsCount).toBe(2)
  })

  it('returns correct delta values', async () => {
    mockGetSummary.mockResolvedValue(STUB_SUMMARY as never)

    const res = await request(app)
      .get('/dashboard/summary')
      .set('Cookie', OWNER_COOKIE)

    expect(res.body.delta.toCollectAmount).toBe(25)
    expect(res.body.delta.collectedAmount).toBe(20)
  })

  it('returns 500 when the service throws', async () => {
    mockGetSummary.mockRejectedValue(new Error('DB connection lost'))

    const res = await request(app)
      .get('/dashboard/summary')
      .set('Cookie', OWNER_COOKIE)

    expect(res.status).toBe(500)
    expect(res.body.error).toBeDefined()
  })

  it('calls getDashboardSummary once per request', async () => {
    mockGetSummary.mockResolvedValue(STUB_SUMMARY as never)

    await request(app)
      .get('/dashboard/summary')
      .set('Cookie', OWNER_COOKIE)

    expect(mockGetSummary).toHaveBeenCalledTimes(1)
  })
})
