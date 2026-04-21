/**
 * Integration tests for /activities routes.
 *
 * Tests cover:
 * - auth guard (401 for unauthenticated)
 * - list with filters forwarded to the service
 * - create validation (required fields, enum values)
 * - update validation
 * - delete permission (OWNER only)
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import request from 'supertest'
import jwt from 'jsonwebtoken'
import { app } from '../app.js'

vi.mock('../services/activity.service.js', () => ({
  listActivities:  vi.fn(),
  getActivityById: vi.fn(),
  createActivity:  vi.fn(),
  updateActivity:  vi.fn(),
  deleteActivity:  vi.fn(),
}))

import * as activityService from '../services/activity.service.js'

const mockList    = vi.mocked(activityService.listActivities)
const mockGetById = vi.mocked(activityService.getActivityById)
const mockCreate  = vi.mocked(activityService.createActivity)
const mockUpdate  = vi.mocked(activityService.updateActivity)
const mockDelete  = vi.mocked(activityService.deleteActivity)

function makeAuthCookie(userId: string, role: 'OWNER' | 'EMPLOYEE'): string {
  const token = jwt.sign({ userId, role }, process.env.JWT_SECRET!, { expiresIn: '1h' })
  return `token=${token}`
}

const OWNER_COOKIE    = makeAuthCookie('u-owner', 'OWNER')
const EMPLOYEE_COOKIE = makeAuthCookie('u-emp',   'EMPLOYEE')

const STUB_ACTIVITY = {
  id:         'act-001',
  userId:     'u-owner',
  clientId:   'c-001',
  saleId:     null,
  type:       'CALL',
  direction:  'OUTBOUND',
  subject:    'Initial call',
  description: null,
  outcome:    null,
  nextStep:   null,
  activityAt: '2026-04-21T10:00:00.000Z',
  createdAt:  '2026-04-21T10:00:00.000Z',
  updatedAt:  '2026-04-21T10:00:00.000Z',
  user:       { id: 'u-owner', displayName: 'Mila' },
}

beforeEach(() => vi.clearAllMocks())

// ─── GET /activities ──────────────────────────────────────────────────────────

describe('GET /activities', () => {
  it('returns 401 when not authenticated', async () => {
    const res = await request(app).get('/activities')
    expect(res.status).toBe(401)
  })

  it('returns the activity list for authenticated users', async () => {
    mockList.mockResolvedValue([STUB_ACTIVITY] as never)
    const res = await request(app).get('/activities').set('Cookie', OWNER_COOKIE)
    expect(res.status).toBe(200)
    expect(Array.isArray(res.body)).toBe(true)
    expect(res.body[0].subject).toBe('Initial call')
  })

  it('passes clientId filter to the service', async () => {
    mockList.mockResolvedValue([] as never)
    await request(app).get('/activities?clientId=c-001').set('Cookie', OWNER_COOKIE)
    expect(mockList).toHaveBeenCalledWith(expect.objectContaining({ clientId: 'c-001' }))
  })

  it('passes type filter to the service when valid', async () => {
    mockList.mockResolvedValue([] as never)
    await request(app).get('/activities?type=CALL').set('Cookie', OWNER_COOKIE)
    expect(mockList).toHaveBeenCalledWith(expect.objectContaining({ type: 'CALL' }))
  })

  it('ignores invalid type filter', async () => {
    mockList.mockResolvedValue([] as never)
    await request(app).get('/activities?type=UNKNOWN').set('Cookie', OWNER_COOKIE)
    expect(mockList).toHaveBeenCalledWith(expect.not.objectContaining({ type: expect.anything() }))
  })
})

// ─── GET /activities/:id ──────────────────────────────────────────────────────

describe('GET /activities/:id', () => {
  it('returns 404 for unknown id', async () => {
    mockGetById.mockResolvedValue(null as never)
    const res = await request(app).get('/activities/nope').set('Cookie', OWNER_COOKIE)
    expect(res.status).toBe(404)
  })

  it('returns the activity when found', async () => {
    mockGetById.mockResolvedValue(STUB_ACTIVITY as never)
    const res = await request(app).get('/activities/act-001').set('Cookie', OWNER_COOKIE)
    expect(res.status).toBe(200)
    expect(res.body.subject).toBe('Initial call')
  })
})

// ─── POST /activities ─────────────────────────────────────────────────────────

describe('POST /activities', () => {
  const VALID_BODY = {
    clientId:   'c-001',
    type:       'CALL',
    subject:    'Follow-up call',
    activityAt: '2026-04-21T10:00:00.000Z',
  }

  it('returns 400 when clientId is missing', async () => {
    const res = await request(app)
      .post('/activities')
      .set('Cookie', OWNER_COOKIE)
      .send({ type: 'CALL', subject: 'x', activityAt: '2026-04-21T10:00:00.000Z' })
    expect(res.status).toBe(400)
    expect(res.body.error).toMatch(/clientId/)
  })

  it('returns 400 when type is missing', async () => {
    const res = await request(app)
      .post('/activities')
      .set('Cookie', OWNER_COOKIE)
      .send({ clientId: 'c-001', subject: 'x', activityAt: '2026-04-21T10:00:00.000Z' })
    expect(res.status).toBe(400)
    expect(res.body.error).toMatch(/type/)
  })

  it('returns 400 when type is invalid', async () => {
    const res = await request(app)
      .post('/activities')
      .set('Cookie', OWNER_COOKIE)
      .send({ ...VALID_BODY, type: 'STAGE_CHANGED' })
    expect(res.status).toBe(400)
    expect(res.body.error).toMatch(/type/)
  })

  it('returns 400 when subject is missing', async () => {
    const res = await request(app)
      .post('/activities')
      .set('Cookie', OWNER_COOKIE)
      .send({ clientId: 'c-001', type: 'CALL', activityAt: '2026-04-21T10:00:00.000Z' })
    expect(res.status).toBe(400)
    expect(res.body.error).toMatch(/subject/)
  })

  it('returns 400 when activityAt is missing', async () => {
    const res = await request(app)
      .post('/activities')
      .set('Cookie', OWNER_COOKIE)
      .send({ clientId: 'c-001', type: 'CALL', subject: 'x' })
    expect(res.status).toBe(400)
    expect(res.body.error).toMatch(/activityAt/)
  })

  it('returns 400 when direction is invalid', async () => {
    const res = await request(app)
      .post('/activities')
      .set('Cookie', OWNER_COOKIE)
      .send({ ...VALID_BODY, direction: 'SIDEWAYS' })
    expect(res.status).toBe(400)
    expect(res.body.error).toMatch(/direction/)
  })

  it('creates an activity and returns 201', async () => {
    mockCreate.mockResolvedValue(STUB_ACTIVITY as never)
    const res = await request(app)
      .post('/activities')
      .set('Cookie', OWNER_COOKIE)
      .send(VALID_BODY)
    expect(res.status).toBe(201)
    expect(res.body.subject).toBe('Initial call')
  })

  it('attaches the authenticated user id', async () => {
    mockCreate.mockResolvedValue(STUB_ACTIVITY as never)
    await request(app)
      .post('/activities')
      .set('Cookie', OWNER_COOKIE)
      .send(VALID_BODY)
    expect(mockCreate).toHaveBeenCalledWith(
      expect.objectContaining({ userId: 'u-owner' })
    )
  })

  it('works for EMPLOYEE role', async () => {
    mockCreate.mockResolvedValue(STUB_ACTIVITY as never)
    const res = await request(app)
      .post('/activities')
      .set('Cookie', EMPLOYEE_COOKIE)
      .send(VALID_BODY)
    expect(res.status).toBe(201)
  })
})

// ─── PATCH /activities/:id ────────────────────────────────────────────────────

describe('PATCH /activities/:id', () => {
  it('returns 400 when type is invalid', async () => {
    const res = await request(app)
      .patch('/activities/act-001')
      .set('Cookie', OWNER_COOKIE)
      .send({ type: 'EXPORT' })
    expect(res.status).toBe(400)
    expect(res.body.error).toMatch(/type/)
  })

  it('updates successfully', async () => {
    mockUpdate.mockResolvedValue({ ...STUB_ACTIVITY, subject: 'Updated' } as never)
    const res = await request(app)
      .patch('/activities/act-001')
      .set('Cookie', OWNER_COOKIE)
      .send({ subject: 'Updated' })
    expect(res.status).toBe(200)
    expect(res.body.subject).toBe('Updated')
  })

  it('returns 404 when activity not found', async () => {
    const { Prisma } = await import('../generated/prisma/client.js')
    const err = new Prisma.PrismaClientKnownRequestError('Not found', {
      code: 'P2025', clientVersion: '0',
    })
    mockUpdate.mockRejectedValue(err)
    const res = await request(app)
      .patch('/activities/nope')
      .set('Cookie', OWNER_COOKIE)
      .send({ subject: 'x' })
    expect(res.status).toBe(404)
  })
})

// ─── DELETE /activities/:id ───────────────────────────────────────────────────

describe('DELETE /activities/:id', () => {
  it('returns 403 for EMPLOYEE', async () => {
    const res = await request(app)
      .delete('/activities/act-001')
      .set('Cookie', EMPLOYEE_COOKIE)
    expect(res.status).toBe(403)
  })

  it('deletes successfully for OWNER', async () => {
    mockDelete.mockResolvedValue(undefined as never)
    const res = await request(app)
      .delete('/activities/act-001')
      .set('Cookie', OWNER_COOKIE)
    expect(res.status).toBe(204)
  })

  it('returns 404 when activity not found', async () => {
    mockDelete.mockRejectedValue(new Error('not found'))
    const res = await request(app)
      .delete('/activities/nope')
      .set('Cookie', OWNER_COOKIE)
    expect(res.status).toBe(404)
  })
})
