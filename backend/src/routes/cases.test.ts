/**
 * Integration tests for /cases routes.
 * Service layer is mocked — no database connection required.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import request from 'supertest'
import jwt from 'jsonwebtoken'
import { app } from '../app.js'

vi.mock('../services/case.service.js', () => ({
  listCases:    vi.fn(),
  getCaseById:  vi.fn(),
  createCase:   vi.fn(),
  updateCase:   vi.fn(),
  deleteCase:   vi.fn(),
}))

import * as caseService from '../services/case.service.js'

const mockList    = vi.mocked(caseService.listCases)
const mockGetById = vi.mocked(caseService.getCaseById)
const mockCreate  = vi.mocked(caseService.createCase)
const mockUpdate  = vi.mocked(caseService.updateCase)
const mockDelete  = vi.mocked(caseService.deleteCase)

function makeAuthCookie(userId: string, role: 'OWNER' | 'EMPLOYEE'): string {
  const token = jwt.sign({ userId, role }, process.env.JWT_SECRET!, { expiresIn: '1h' })
  return `token=${token}`
}

const OWNER_COOKIE    = makeAuthCookie('u-owner', 'OWNER')
const EMPLOYEE_COOKIE = makeAuthCookie('u-emp',   'EMPLOYEE')

const STUB_CASE = {
  id:          'case-001',
  clientId:    'c-carmen',
  client:      { id: 'c-carmen', name: 'Carmen López' },
  title:       'Siniestro agua en vivienda',
  description: 'Rotura de tubería en baño principal.',
  status:      'IN_PROGRESS',
  createdAt:   new Date('2024-01-10').toISOString(),
  updatedAt:   new Date('2024-01-15').toISOString(),
}

beforeEach(() => vi.clearAllMocks())

// ─── GET /cases ───────────────────────────────────────────────────────────────

describe('GET /cases', () => {
  it('returns 401 when not authenticated', async () => {
    const res = await request(app).get('/cases')
    expect(res.status).toBe(401)
  })

  it('returns the case list for an authenticated user', async () => {
    mockList.mockResolvedValue([STUB_CASE] as never)
    const res = await request(app).get('/cases').set('Cookie', OWNER_COOKIE)
    expect(res.status).toBe(200)
    expect(Array.isArray(res.body)).toBe(true)
    expect(res.body[0].title).toBe('Siniestro agua en vivienda')
  })

  it('works for EMPLOYEE role', async () => {
    mockList.mockResolvedValue([] as never)
    const res = await request(app).get('/cases').set('Cookie', EMPLOYEE_COOKIE)
    expect(res.status).toBe(200)
  })
})

// ─── GET /cases/:id ───────────────────────────────────────────────────────────

describe('GET /cases/:id', () => {
  it('returns 401 when not authenticated', async () => {
    const res = await request(app).get('/cases/case-001')
    expect(res.status).toBe(401)
  })

  it('returns the case for a valid id', async () => {
    mockGetById.mockResolvedValue(STUB_CASE as never)
    const res = await request(app).get('/cases/case-001').set('Cookie', OWNER_COOKIE)
    expect(res.status).toBe(200)
    expect(res.body.id).toBe('case-001')
  })

  it('returns 404 when the case does not exist', async () => {
    mockGetById.mockResolvedValue(null)
    const res = await request(app).get('/cases/nonexistent').set('Cookie', OWNER_COOKIE)
    expect(res.status).toBe(404)
  })
})

// ─── POST /cases ──────────────────────────────────────────────────────────────

describe('POST /cases', () => {
  it('returns 401 when not authenticated', async () => {
    const res = await request(app).post('/cases').send({ clientId: 'c-1', title: 'Test' })
    expect(res.status).toBe(401)
  })

  it('returns 400 when clientId is missing', async () => {
    const res = await request(app)
      .post('/cases').set('Cookie', OWNER_COOKIE)
      .send({ title: 'Sin cliente' })
    expect(res.status).toBe(400)
    expect(res.body.error).toBeDefined()
  })

  it('returns 400 when title is missing', async () => {
    const res = await request(app)
      .post('/cases').set('Cookie', OWNER_COOKIE)
      .send({ clientId: 'c-1' })
    expect(res.status).toBe(400)
    expect(res.body.error).toBeDefined()
  })

  it('returns 201 and the created case on success', async () => {
    mockCreate.mockResolvedValue(STUB_CASE as never)
    const res = await request(app)
      .post('/cases').set('Cookie', OWNER_COOKIE)
      .send({ clientId: 'c-carmen', title: 'Siniestro agua en vivienda' })
    expect(res.status).toBe(201)
    expect(res.body.title).toBe('Siniestro agua en vivienda')
  })

  it('EMPLOYEE can create a case', async () => {
    mockCreate.mockResolvedValue(STUB_CASE as never)
    const res = await request(app)
      .post('/cases').set('Cookie', EMPLOYEE_COOKIE)
      .send({ clientId: 'c-carmen', title: 'Nuevo caso' })
    expect(res.status).toBe(201)
  })
})

// ─── PUT /cases/:id ───────────────────────────────────────────────────────────

describe('PUT /cases/:id', () => {
  it('returns 401 when not authenticated', async () => {
    const res = await request(app).put('/cases/case-001').send({ title: 'Updated' })
    expect(res.status).toBe(401)
  })

  it('returns 200 with the updated case on success', async () => {
    const updated = { ...STUB_CASE, title: 'Updated title' }
    mockUpdate.mockResolvedValue(updated as never)
    const res = await request(app)
      .put('/cases/case-001').set('Cookie', OWNER_COOKIE)
      .send({ title: 'Updated title' })
    expect(res.status).toBe(200)
    expect(res.body.title).toBe('Updated title')
  })

  it('returns 404 when the case does not exist', async () => {
    mockUpdate.mockRejectedValue(Object.assign(new Error('Not found'), { code: 'P2025' }))
    const res = await request(app)
      .put('/cases/nonexistent').set('Cookie', OWNER_COOKIE)
      .send({ title: 'X' })
    expect(res.status).toBe(404)
  })
})

// ─── DELETE /cases/:id ────────────────────────────────────────────────────────

describe('DELETE /cases/:id', () => {
  it('returns 401 when not authenticated', async () => {
    const res = await request(app).delete('/cases/case-001')
    expect(res.status).toBe(401)
  })

  it('returns 403 when the user is an EMPLOYEE', async () => {
    const res = await request(app).delete('/cases/case-001').set('Cookie', EMPLOYEE_COOKIE)
    expect(res.status).toBe(403)
    expect(mockDelete).not.toHaveBeenCalled()
  })

  it('returns 204 when the OWNER deletes a case', async () => {
    mockDelete.mockResolvedValue(undefined as never)
    const res = await request(app).delete('/cases/case-001').set('Cookie', OWNER_COOKIE)
    expect(res.status).toBe(204)
    expect(mockDelete).toHaveBeenCalledWith('case-001')
  })

  it('returns 404 when the case does not exist', async () => {
    mockDelete.mockRejectedValue(new Error('Not found'))
    const res = await request(app).delete('/cases/nonexistent').set('Cookie', OWNER_COOKIE)
    expect(res.status).toBe(404)
  })
})
