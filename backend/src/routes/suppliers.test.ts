/**
 * Integration tests for /suppliers routes.
 * Service layer is mocked — no database connection required.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import request from 'supertest'
import jwt from 'jsonwebtoken'
import { app } from '../app.js'

vi.mock('../services/supplier.service.js', () => ({
  listSuppliers:    vi.fn(),
  getSupplierById:  vi.fn(),
  createSupplier:   vi.fn(),
  updateSupplier:   vi.fn(),
  deleteSupplier:   vi.fn(),
}))

import * as supplierService from '../services/supplier.service.js'

const mockList    = vi.mocked(supplierService.listSuppliers)
const mockGetById = vi.mocked(supplierService.getSupplierById)
const mockCreate  = vi.mocked(supplierService.createSupplier)
const mockUpdate  = vi.mocked(supplierService.updateSupplier)
const mockDelete  = vi.mocked(supplierService.deleteSupplier)

function makeAuthCookie(userId: string, role: 'OWNER' | 'EMPLOYEE'): string {
  const token = jwt.sign({ userId, role }, process.env.JWT_SECRET!, { expiresIn: '1h' })
  return `token=${token}`
}

const OWNER_COOKIE    = makeAuthCookie('u-owner', 'OWNER')
const EMPLOYEE_COOKIE = makeAuthCookie('u-emp',   'EMPLOYEE')

const STUB_SUPPLIER = {
  id:             'sup-001',
  name:           'Mapfre España S.A.',
  cif:            'A11111110',
  phone:          '91 581 91 00',
  secondaryPhone: null,
  createdAt:      '2026-01-01T00:00:00.000Z',
  updatedAt:      '2026-01-01T00:00:00.000Z',
  addresses: [
    {
      id:         'sa-001',
      supplierId: 'sup-001',
      type:       'FISCAL',
      street:     'Carretera de Pozuelo, 52',
      postalCode: '28222',
      city:       'Majadahonda',
      province:   'Madrid',
      country:    'España',
    },
  ],
  emails: [
    {
      id:         'se-001',
      supplierId: 'sup-001',
      address:    'mediadores@mapfre.com',
      isPrimary:  true,
      label:      'Mediadores',
      labelColor: null,
    },
  ],
}

beforeEach(() => vi.clearAllMocks())

// ─── GET /suppliers ───────────────────────────────────────────────────────────

describe('GET /suppliers', () => {
  it('returns 401 when not authenticated', async () => {
    const res = await request(app).get('/suppliers')
    expect(res.status).toBe(401)
  })

  it('returns the supplier list for OWNER', async () => {
    mockList.mockResolvedValue([STUB_SUPPLIER] as never)
    const res = await request(app).get('/suppliers').set('Cookie', OWNER_COOKIE)
    expect(res.status).toBe(200)
    expect(Array.isArray(res.body)).toBe(true)
    expect(res.body[0].name).toBe('Mapfre España S.A.')
  })

  it('returns the supplier list for EMPLOYEE', async () => {
    mockList.mockResolvedValue([] as never)
    const res = await request(app).get('/suppliers').set('Cookie', EMPLOYEE_COOKIE)
    expect(res.status).toBe(200)
  })
})

// ─── GET /suppliers/:id ───────────────────────────────────────────────────────

describe('GET /suppliers/:id', () => {
  it('returns 401 when not authenticated', async () => {
    const res = await request(app).get('/suppliers/sup-001')
    expect(res.status).toBe(401)
  })

  it('returns the supplier with addresses and emails', async () => {
    mockGetById.mockResolvedValue(STUB_SUPPLIER as never)
    const res = await request(app).get('/suppliers/sup-001').set('Cookie', OWNER_COOKIE)
    expect(res.status).toBe(200)
    expect(res.body.id).toBe('sup-001')
    expect(res.body.addresses).toHaveLength(1)
    expect(res.body.emails).toHaveLength(1)
  })

  it('returns 404 when supplier does not exist', async () => {
    mockGetById.mockResolvedValue(null)
    const res = await request(app).get('/suppliers/nonexistent').set('Cookie', OWNER_COOKIE)
    expect(res.status).toBe(404)
  })
})

// ─── POST /suppliers ──────────────────────────────────────────────────────────

describe('POST /suppliers', () => {
  it('returns 401 when not authenticated', async () => {
    const res = await request(app).post('/suppliers').send({ name: 'X' })
    expect(res.status).toBe(401)
  })

  it('returns 400 when name is missing', async () => {
    const res = await request(app)
      .post('/suppliers').set('Cookie', OWNER_COOKIE)
      .send({ cif: 'A11111110' })
    expect(res.status).toBe(400)
    expect(res.body.error).toBeDefined()
  })

  it('returns 400 when CIF format is invalid', async () => {
    const res = await request(app)
      .post('/suppliers').set('Cookie', OWNER_COOKIE)
      .send({ name: 'Test SL', cif: 'INVALID' })
    expect(res.status).toBe(400)
    expect(res.body.error).toMatch(/CIF/)
  })

  it('returns 201 with the created supplier when CIF is valid', async () => {
    mockCreate.mockResolvedValue(STUB_SUPPLIER as never)
    const res = await request(app)
      .post('/suppliers').set('Cookie', OWNER_COOKIE)
      .send({ name: 'Mapfre España S.A.', cif: 'A11111110' })
    expect(res.status).toBe(201)
    expect(res.body.name).toBe('Mapfre España S.A.')
  })

  it('returns 201 when no CIF is provided', async () => {
    const noFifSupplier = { ...STUB_SUPPLIER, cif: null }
    mockCreate.mockResolvedValue(noFifSupplier as never)
    const res = await request(app)
      .post('/suppliers').set('Cookie', OWNER_COOKIE)
      .send({ name: 'Sin CIF SL' })
    expect(res.status).toBe(201)
  })

  it('returns 409 on duplicate CIF', async () => {
    mockCreate.mockRejectedValue(Object.assign(new Error('Unique constraint'), { code: 'P2002' }))
    const res = await request(app)
      .post('/suppliers').set('Cookie', OWNER_COOKIE)
      .send({ name: 'Duplicado SL', cif: 'A11111110' })
    expect(res.status).toBe(409)
  })

  it('EMPLOYEE can create a supplier', async () => {
    mockCreate.mockResolvedValue(STUB_SUPPLIER as never)
    const res = await request(app)
      .post('/suppliers').set('Cookie', EMPLOYEE_COOKIE)
      .send({ name: 'Mapfre España S.A.', cif: 'A11111110' })
    expect(res.status).toBe(201)
  })
})

// ─── PUT /suppliers/:id ───────────────────────────────────────────────────────

describe('PUT /suppliers/:id', () => {
  it('returns 401 when not authenticated', async () => {
    const res = await request(app).put('/suppliers/sup-001').send({ name: 'Updated' })
    expect(res.status).toBe(401)
  })

  it('returns 400 when updated CIF is invalid', async () => {
    const res = await request(app)
      .put('/suppliers/sup-001').set('Cookie', OWNER_COOKIE)
      .send({ cif: 'BADCIF' })
    expect(res.status).toBe(400)
    expect(res.body.error).toMatch(/CIF/)
  })

  it('returns 200 with updated supplier on success', async () => {
    const updated = { ...STUB_SUPPLIER, name: 'Mapfre Actualizado' }
    mockUpdate.mockResolvedValue(updated as never)
    const res = await request(app)
      .put('/suppliers/sup-001').set('Cookie', OWNER_COOKIE)
      .send({ name: 'Mapfre Actualizado' })
    expect(res.status).toBe(200)
    expect(res.body.name).toBe('Mapfre Actualizado')
  })

  it('returns 404 when supplier does not exist', async () => {
    mockUpdate.mockRejectedValue(Object.assign(new Error('Not found'), { code: 'P2025' }))
    const res = await request(app)
      .put('/suppliers/nonexistent').set('Cookie', OWNER_COOKIE)
      .send({ name: 'X' })
    expect(res.status).toBe(404)
  })
})

// ─── DELETE /suppliers/:id ────────────────────────────────────────────────────

describe('DELETE /suppliers/:id', () => {
  it('returns 401 when not authenticated', async () => {
    const res = await request(app).delete('/suppliers/sup-001')
    expect(res.status).toBe(401)
  })

  it('returns 403 when user is EMPLOYEE', async () => {
    const res = await request(app).delete('/suppliers/sup-001').set('Cookie', EMPLOYEE_COOKIE)
    expect(res.status).toBe(403)
    expect(mockDelete).not.toHaveBeenCalled()
  })

  it('returns 204 when OWNER deletes a supplier', async () => {
    mockDelete.mockResolvedValue(undefined as never)
    const res = await request(app).delete('/suppliers/sup-001').set('Cookie', OWNER_COOKIE)
    expect(res.status).toBe(204)
    expect(mockDelete).toHaveBeenCalledWith('sup-001')
  })

  it('returns 404 when supplier does not exist', async () => {
    mockDelete.mockRejectedValue(new Error('Not found'))
    const res = await request(app).delete('/suppliers/nonexistent').set('Cookie', OWNER_COOKIE)
    expect(res.status).toBe(404)
  })
})
