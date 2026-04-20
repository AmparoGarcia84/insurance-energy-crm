/**
 * Integration tests for /sales routes.
 * Service layer is mocked — no database connection required.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import request from 'supertest'
import jwt from 'jsonwebtoken'
import { app } from '../app.js'

vi.mock('../services/sale.service.js', () => ({
  listSales: vi.fn(),
  getSaleById: vi.fn(),
  createSale: vi.fn(),
  updateSale: vi.fn(),
  deleteSale: vi.fn(),
}))

import * as saleService from '../services/sale.service.js'

const mockList   = vi.mocked(saleService.listSales)
const mockGetById = vi.mocked(saleService.getSaleById)
const mockCreate  = vi.mocked(saleService.createSale)
const mockUpdate  = vi.mocked(saleService.updateSale)
const mockDelete  = vi.mocked(saleService.deleteSale)

function makeAuthCookie(userId: string, role: 'OWNER' | 'EMPLOYEE'): string {
  const token = jwt.sign({ userId, role }, process.env.JWT_SECRET!, { expiresIn: '1h' })
  return `token=${token}`
}

const OWNER_COOKIE    = makeAuthCookie('u-owner', 'OWNER')
const EMPLOYEE_COOKIE = makeAuthCookie('u-emp',   'EMPLOYEE')

const STUB_SALE = {
  id: 's-001',
  title: 'Home insurance',
  type: 'INSURANCE',
  clientId: 'c-001',
  clientName: 'Acme Corp',
  businessType: null,
  amount: 1200,
  insuranceStage: 'PENDING',
  energyStage: null,
}

beforeEach(() => vi.clearAllMocks())

// ─── GET /sales ───────────────────────────────────────────────────────────────

describe('GET /sales', () => {
  it('returns 401 when not authenticated', async () => {
    const res = await request(app).get('/sales')
    expect(res.status).toBe(401)
  })

  it('returns the sale list for an authenticated user', async () => {
    mockList.mockResolvedValue([STUB_SALE] as never)
    const res = await request(app).get('/sales').set('Cookie', OWNER_COOKIE)
    expect(res.status).toBe(200)
    expect(Array.isArray(res.body)).toBe(true)
    expect(res.body[0].title).toBe('Home insurance')
  })

  it('works for EMPLOYEE role', async () => {
    mockList.mockResolvedValue([] as never)
    const res = await request(app).get('/sales').set('Cookie', EMPLOYEE_COOKIE)
    expect(res.status).toBe(200)
  })
})

// ─── GET /sales/:id ───────────────────────────────────────────────────────────

describe('GET /sales/:id', () => {
  it('returns 401 when not authenticated', async () => {
    const res = await request(app).get('/sales/s-001')
    expect(res.status).toBe(401)
  })

  it('returns the sale for a valid id', async () => {
    mockGetById.mockResolvedValue(STUB_SALE as never)
    const res = await request(app).get('/sales/s-001').set('Cookie', OWNER_COOKIE)
    expect(res.status).toBe(200)
    expect(res.body.id).toBe('s-001')
  })

  it('returns 404 when sale does not exist', async () => {
    mockGetById.mockResolvedValue(null)
    const res = await request(app).get('/sales/nonexistent').set('Cookie', OWNER_COOKIE)
    expect(res.status).toBe(404)
  })
})

// ─── POST /sales ──────────────────────────────────────────────────────────────

describe('POST /sales', () => {
  it('returns 401 when not authenticated', async () => {
    const res = await request(app).post('/sales').send({ title: 'X', type: 'INSURANCE', clientId: 'c-1' })
    expect(res.status).toBe(401)
  })

  it('returns 400 when title is missing', async () => {
    const res = await request(app)
      .post('/sales').set('Cookie', OWNER_COOKIE)
      .send({ type: 'INSURANCE', clientId: 'c-1' })
    expect(res.status).toBe(400)
  })

  it('returns 400 when type is missing', async () => {
    const res = await request(app)
      .post('/sales').set('Cookie', OWNER_COOKIE)
      .send({ title: 'X', clientId: 'c-1' })
    expect(res.status).toBe(400)
  })

  it('returns 400 when clientId is missing', async () => {
    const res = await request(app)
      .post('/sales').set('Cookie', OWNER_COOKIE)
      .send({ title: 'X', type: 'ENERGY' })
    expect(res.status).toBe(400)
  })

  it('returns 201 and the created sale on success', async () => {
    mockCreate.mockResolvedValue(STUB_SALE as never)
    const res = await request(app)
      .post('/sales').set('Cookie', OWNER_COOKIE)
      .send({ title: 'Home insurance', type: 'INSURANCE', clientId: 'c-001' })
    expect(res.status).toBe(201)
    expect(res.body.title).toBe('Home insurance')
  })

  it('EMPLOYEE can create a sale', async () => {
    mockCreate.mockResolvedValue(STUB_SALE as never)
    const res = await request(app)
      .post('/sales').set('Cookie', EMPLOYEE_COOKIE)
      .send({ title: 'Home insurance', type: 'INSURANCE', clientId: 'c-001' })
    expect(res.status).toBe(201)
  })
})

// ─── PUT /sales/:id ───────────────────────────────────────────────────────────

describe('PUT /sales/:id', () => {
  it('returns 401 when not authenticated', async () => {
    const res = await request(app).put('/sales/s-001').send({ title: 'Updated' })
    expect(res.status).toBe(401)
  })

  it('returns 200 with the updated sale on success', async () => {
    const updated = { ...STUB_SALE, title: 'Updated' }
    mockUpdate.mockResolvedValue(updated as never)
    const res = await request(app)
      .put('/sales/s-001').set('Cookie', OWNER_COOKIE)
      .send({ title: 'Updated' })
    expect(res.status).toBe(200)
    expect(res.body.title).toBe('Updated')
  })

  it('returns 404 when sale does not exist', async () => {
    mockUpdate.mockRejectedValue(Object.assign(new Error('Not found'), { code: 'P2025' }))
    const res = await request(app)
      .put('/sales/nonexistent').set('Cookie', OWNER_COOKIE)
      .send({ title: 'X' })
    expect(res.status).toBe(404)
  })
})

// ─── DELETE /sales/:id ────────────────────────────────────────────────────────

describe('DELETE /sales/:id', () => {
  it('returns 401 when not authenticated', async () => {
    const res = await request(app).delete('/sales/s-001')
    expect(res.status).toBe(401)
  })

  it('returns 403 when the user is an EMPLOYEE', async () => {
    const res = await request(app).delete('/sales/s-001').set('Cookie', EMPLOYEE_COOKIE)
    expect(res.status).toBe(403)
    expect(mockDelete).not.toHaveBeenCalled()
  })

  it('returns 204 when the OWNER deletes a sale', async () => {
    mockDelete.mockResolvedValue(undefined as never)
    const res = await request(app).delete('/sales/s-001').set('Cookie', OWNER_COOKIE)
    expect(res.status).toBe(204)
    expect(mockDelete).toHaveBeenCalledWith('s-001')
  })

  it('returns 404 when the sale does not exist', async () => {
    mockDelete.mockRejectedValue(new Error('Not found'))
    const res = await request(app).delete('/sales/nonexistent').set('Cookie', OWNER_COOKIE)
    expect(res.status).toBe(404)
  })
})
