/**
 * Integration tests for /clients routes.
 *
 * The service layer is mocked so no database connection is required.
 * Permission rules (OWNER vs EMPLOYEE) are exercised via route tests.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import request from 'supertest'
import jwt from 'jsonwebtoken'
import { app } from '../app.js'

vi.mock('../services/client.service.js', () => ({
  listClients: vi.fn(),
  getClientById: vi.fn(),
  createClient: vi.fn(),
  updateClient: vi.fn(),
  deleteClient: vi.fn(),
  findClientByNif: vi.fn(),
  importClientsFromCsv: vi.fn(),
}))

import * as clientService from '../services/client.service.js'

const mockList = vi.mocked(clientService.listClients)
const mockGetById = vi.mocked(clientService.getClientById)
const mockCreate = vi.mocked(clientService.createClient)
const mockUpdate = vi.mocked(clientService.updateClient)
const mockDelete = vi.mocked(clientService.deleteClient)

function makeAuthCookie(userId: string, role: 'OWNER' | 'EMPLOYEE'): string {
  const token = jwt.sign({ userId, role }, process.env.JWT_SECRET!, { expiresIn: '1h' })
  return `token=${token}`
}

const OWNER_COOKIE = makeAuthCookie('u-owner', 'OWNER')
const EMPLOYEE_COOKIE = makeAuthCookie('u-emp', 'EMPLOYEE')

const STUB_CLIENT = {
  id: 'c-001',
  clientNumber: '000001',
  name: 'Acme Corp',
  nif: 'B12345678',
  type: 'COMPANY',
  status: 'ACTIVE',
  addresses: [],
  bankAccounts: [],
  mainClient: null,
}

beforeEach(() => {
  vi.clearAllMocks()
})

// ─── GET /clients ─────────────────────────────────────────────────────────────

describe('GET /clients', () => {
  it('returns 401 when not authenticated', async () => {
    const res = await request(app).get('/clients')
    expect(res.status).toBe(401)
  })

  it('returns the client list for an authenticated user', async () => {
    mockList.mockResolvedValue([STUB_CLIENT] as never)

    const res = await request(app).get('/clients').set('Cookie', OWNER_COOKIE)

    expect(res.status).toBe(200)
    expect(Array.isArray(res.body)).toBe(true)
    expect(res.body[0].name).toBe('Acme Corp')
  })

  it('also works for EMPLOYEE role', async () => {
    mockList.mockResolvedValue([] as never)

    const res = await request(app).get('/clients').set('Cookie', EMPLOYEE_COOKIE)

    expect(res.status).toBe(200)
  })
})

// ─── GET /clients/:id ─────────────────────────────────────────────────────────

describe('GET /clients/:id', () => {
  it('returns 401 when not authenticated', async () => {
    const res = await request(app).get('/clients/c-001')
    expect(res.status).toBe(401)
  })

  it('returns the client for a valid id', async () => {
    mockGetById.mockResolvedValue(STUB_CLIENT as never)

    const res = await request(app).get('/clients/c-001').set('Cookie', OWNER_COOKIE)

    expect(res.status).toBe(200)
    expect(res.body.id).toBe('c-001')
  })

  it('returns 404 when the client does not exist', async () => {
    mockGetById.mockResolvedValue(null)

    const res = await request(app).get('/clients/nonexistent').set('Cookie', OWNER_COOKIE)

    expect(res.status).toBe(404)
  })
})

// ─── POST /clients ────────────────────────────────────────────────────────────

describe('POST /clients', () => {
  it('returns 401 when not authenticated', async () => {
    const res = await request(app).post('/clients').send({ name: 'Test' })
    expect(res.status).toBe(401)
  })

  it('returns 400 when name is missing', async () => {
    const res = await request(app)
      .post('/clients')
      .set('Cookie', OWNER_COOKIE)
      .send({ nif: 'X1234567A' })

    expect(res.status).toBe(400)
    expect(res.body.error).toBeDefined()
  })

  it('returns 201 and the created client on success', async () => {
    mockCreate.mockResolvedValue(STUB_CLIENT as never)

    const res = await request(app)
      .post('/clients')
      .set('Cookie', OWNER_COOKIE)
      .send({ name: 'Acme Corp', nif: 'B12345678' })

    expect(res.status).toBe(201)
    expect(res.body.name).toBe('Acme Corp')
  })

  it('returns 201 when created by an EMPLOYEE', async () => {
    mockCreate.mockResolvedValue(STUB_CLIENT as never)

    const res = await request(app)
      .post('/clients')
      .set('Cookie', EMPLOYEE_COOKIE)
      .send({ name: 'New Client' })

    expect(res.status).toBe(201)
  })

  it('returns 409 on duplicate NIF', async () => {
    const { Prisma } = await import('../generated/prisma/client.js')
    const err = new Prisma.PrismaClientKnownRequestError('Unique constraint', {
      code: 'P2002',
      clientVersion: '0',
    })
    mockCreate.mockRejectedValue(err)
    vi.mocked(clientService.findClientByNif).mockResolvedValue(null)

    const res = await request(app)
      .post('/clients')
      .set('Cookie', OWNER_COOKIE)
      .send({ name: 'Duplicate', nif: 'B12345678' })

    expect(res.status).toBe(409)
  })
})

// ─── PUT /clients/:id ─────────────────────────────────────────────────────────

describe('PUT /clients/:id', () => {
  it('returns 401 when not authenticated', async () => {
    const res = await request(app).put('/clients/c-001').send({ name: 'Updated' })
    expect(res.status).toBe(401)
  })

  it('returns 200 with the updated client on success', async () => {
    const updated = { ...STUB_CLIENT, name: 'Updated' }
    mockUpdate.mockResolvedValue(updated as never)

    const res = await request(app)
      .put('/clients/c-001')
      .set('Cookie', OWNER_COOKIE)
      .send({ name: 'Updated' })

    expect(res.status).toBe(200)
    expect(res.body.name).toBe('Updated')
  })

  it('returns 404 when client does not exist', async () => {
    mockUpdate.mockRejectedValue(Object.assign(new Error('Not found'), { code: 'P2025' }))

    const res = await request(app)
      .put('/clients/nonexistent')
      .set('Cookie', OWNER_COOKIE)
      .send({ name: 'X' })

    expect(res.status).toBe(404)
  })
})

// ─── DELETE /clients/:id ──────────────────────────────────────────────────────

describe('DELETE /clients/:id', () => {
  it('returns 401 when not authenticated', async () => {
    const res = await request(app).delete('/clients/c-001')
    expect(res.status).toBe(401)
  })

  it('returns 403 when the user is an EMPLOYEE', async () => {
    const res = await request(app)
      .delete('/clients/c-001')
      .set('Cookie', EMPLOYEE_COOKIE)

    expect(res.status).toBe(403)
    expect(mockDelete).not.toHaveBeenCalled()
  })

  it('returns 204 when the OWNER deletes a client', async () => {
    mockDelete.mockResolvedValue(undefined as never)

    const res = await request(app)
      .delete('/clients/c-001')
      .set('Cookie', OWNER_COOKIE)

    expect(res.status).toBe(204)
    expect(mockDelete).toHaveBeenCalledWith('c-001')
  })

  it('returns 404 when the client does not exist', async () => {
    mockDelete.mockRejectedValue(new Error('Not found'))

    const res = await request(app)
      .delete('/clients/nonexistent')
      .set('Cookie', OWNER_COOKIE)

    expect(res.status).toBe(404)
  })
})
