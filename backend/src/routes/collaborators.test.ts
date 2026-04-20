/**
 * Integration tests for /collaborators routes.
 * Service layer is mocked — no database connection required.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import request from 'supertest'
import jwt from 'jsonwebtoken'
import { app } from '../app.js'

vi.mock('../services/collaborator.service.js', () => ({
  listCollaborators:    vi.fn(),
  getCollaboratorById:  vi.fn(),
  createCollaborator:   vi.fn(),
  updateCollaborator:   vi.fn(),
  deleteCollaborator:   vi.fn(),
}))

import * as collaboratorService from '../services/collaborator.service.js'

const mockList    = vi.mocked(collaboratorService.listCollaborators)
const mockGetById = vi.mocked(collaboratorService.getCollaboratorById)
const mockCreate  = vi.mocked(collaboratorService.createCollaborator)
const mockUpdate  = vi.mocked(collaboratorService.updateCollaborator)
const mockDelete  = vi.mocked(collaboratorService.deleteCollaborator)

function makeAuthCookie(userId: string, role: 'OWNER' | 'EMPLOYEE'): string {
  const token = jwt.sign({ userId, role }, process.env.JWT_SECRET!, { expiresIn: '1h' })
  return `token=${token}`
}

const OWNER_COOKIE    = makeAuthCookie('u-owner', 'OWNER')
const EMPLOYEE_COOKIE = makeAuthCookie('u-emp',   'EMPLOYEE')

const STUB_COLLABORATOR = {
  id: 'col-001',
  name: 'Pedro Sánchez',
  phone: '600000001',
}

beforeEach(() => vi.clearAllMocks())

// ─── GET /collaborators ───────────────────────────────────────────────────────

describe('GET /collaborators', () => {
  it('returns 401 when not authenticated', async () => {
    const res = await request(app).get('/collaborators')
    expect(res.status).toBe(401)
  })

  it('returns the collaborator list for an authenticated user', async () => {
    mockList.mockResolvedValue([STUB_COLLABORATOR] as never)
    const res = await request(app).get('/collaborators').set('Cookie', OWNER_COOKIE)
    expect(res.status).toBe(200)
    expect(Array.isArray(res.body)).toBe(true)
    expect(res.body[0].name).toBe('Pedro Sánchez')
  })

  it('works for EMPLOYEE role', async () => {
    mockList.mockResolvedValue([] as never)
    const res = await request(app).get('/collaborators').set('Cookie', EMPLOYEE_COOKIE)
    expect(res.status).toBe(200)
  })
})

// ─── GET /collaborators/:id ───────────────────────────────────────────────────

describe('GET /collaborators/:id', () => {
  it('returns 401 when not authenticated', async () => {
    const res = await request(app).get('/collaborators/col-001')
    expect(res.status).toBe(401)
  })

  it('returns the collaborator for a valid id', async () => {
    mockGetById.mockResolvedValue(STUB_COLLABORATOR as never)
    const res = await request(app).get('/collaborators/col-001').set('Cookie', OWNER_COOKIE)
    expect(res.status).toBe(200)
    expect(res.body.id).toBe('col-001')
  })

  it('returns 404 when the collaborator does not exist', async () => {
    mockGetById.mockResolvedValue(null)
    const res = await request(app).get('/collaborators/nonexistent').set('Cookie', OWNER_COOKIE)
    expect(res.status).toBe(404)
  })
})

// ─── POST /collaborators ──────────────────────────────────────────────────────

describe('POST /collaborators', () => {
  it('returns 401 when not authenticated', async () => {
    const res = await request(app).post('/collaborators').send({ name: 'X', phone: '600' })
    expect(res.status).toBe(401)
  })

  it('returns 400 when name is missing', async () => {
    const res = await request(app)
      .post('/collaborators').set('Cookie', OWNER_COOKIE)
      .send({ phone: '600000001' })
    expect(res.status).toBe(400)
    expect(res.body.error).toBeDefined()
  })

  it('returns 400 when phone is missing', async () => {
    const res = await request(app)
      .post('/collaborators').set('Cookie', OWNER_COOKIE)
      .send({ name: 'Pedro' })
    expect(res.status).toBe(400)
    expect(res.body.error).toBeDefined()
  })

  it('returns 201 and the created collaborator on success', async () => {
    mockCreate.mockResolvedValue(STUB_COLLABORATOR as never)
    const res = await request(app)
      .post('/collaborators').set('Cookie', OWNER_COOKIE)
      .send({ name: 'Pedro Sánchez', phone: '600000001' })
    expect(res.status).toBe(201)
    expect(res.body.name).toBe('Pedro Sánchez')
  })

  it('EMPLOYEE can create a collaborator', async () => {
    mockCreate.mockResolvedValue(STUB_COLLABORATOR as never)
    const res = await request(app)
      .post('/collaborators').set('Cookie', EMPLOYEE_COOKIE)
      .send({ name: 'Pedro Sánchez', phone: '600000001' })
    expect(res.status).toBe(201)
  })
})

// ─── PUT /collaborators/:id ───────────────────────────────────────────────────

describe('PUT /collaborators/:id', () => {
  it('returns 401 when not authenticated', async () => {
    const res = await request(app).put('/collaborators/col-001').send({ name: 'Updated' })
    expect(res.status).toBe(401)
  })

  it('returns 200 with the updated collaborator on success', async () => {
    const updated = { ...STUB_COLLABORATOR, name: 'Updated' }
    mockUpdate.mockResolvedValue(updated as never)
    const res = await request(app)
      .put('/collaborators/col-001').set('Cookie', OWNER_COOKIE)
      .send({ name: 'Updated' })
    expect(res.status).toBe(200)
    expect(res.body.name).toBe('Updated')
  })

  it('returns 404 when the collaborator does not exist', async () => {
    mockUpdate.mockRejectedValue(Object.assign(new Error('Not found'), { code: 'P2025' }))
    const res = await request(app)
      .put('/collaborators/nonexistent').set('Cookie', OWNER_COOKIE)
      .send({ name: 'X' })
    expect(res.status).toBe(404)
  })
})

// ─── DELETE /collaborators/:id ────────────────────────────────────────────────

describe('DELETE /collaborators/:id', () => {
  it('returns 401 when not authenticated', async () => {
    const res = await request(app).delete('/collaborators/col-001')
    expect(res.status).toBe(401)
  })

  it('returns 403 when the user is an EMPLOYEE', async () => {
    const res = await request(app).delete('/collaborators/col-001').set('Cookie', EMPLOYEE_COOKIE)
    expect(res.status).toBe(403)
    expect(mockDelete).not.toHaveBeenCalled()
  })

  it('returns 204 when the OWNER deletes a collaborator', async () => {
    mockDelete.mockResolvedValue(undefined as never)
    const res = await request(app).delete('/collaborators/col-001').set('Cookie', OWNER_COOKIE)
    expect(res.status).toBe(204)
    expect(mockDelete).toHaveBeenCalledWith('col-001')
  })

  it('returns 404 when the collaborator does not exist', async () => {
    mockDelete.mockRejectedValue(new Error('Not found'))
    const res = await request(app).delete('/collaborators/nonexistent').set('Cookie', OWNER_COOKIE)
    expect(res.status).toBe(404)
  })
})
