/**
 * Integration tests for /documents routes.
 *
 * Documents support multipart file uploads (multer) but the service layer
 * is mocked, so tests exercise controller validation and permission rules
 * without touching the filesystem or the database.
 *
 * POST / PATCH use multipart/form-data because of the multer middleware.
 * The controller also accepts requests without a file (fileUrl comes from body).
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import request from 'supertest'
import jwt from 'jsonwebtoken'
import { app } from '../app.js'

vi.mock('../services/document.service.js', () => ({
  listDocuments:   vi.fn(),
  getDocumentById: vi.fn(),
  createDocument:  vi.fn(),
  updateDocument:  vi.fn(),
  deleteDocument:  vi.fn(),
}))

import * as documentService from '../services/document.service.js'

const mockList    = vi.mocked(documentService.listDocuments)
const mockGetById = vi.mocked(documentService.getDocumentById)
const mockCreate  = vi.mocked(documentService.createDocument)
const mockUpdate  = vi.mocked(documentService.updateDocument)
const mockDelete  = vi.mocked(documentService.deleteDocument)

function makeAuthCookie(userId: string, role: 'OWNER' | 'EMPLOYEE'): string {
  const token = jwt.sign({ userId, role }, process.env.JWT_SECRET!, { expiresIn: '1h' })
  return `token=${token}`
}

const OWNER_COOKIE    = makeAuthCookie('u-owner', 'OWNER')
const EMPLOYEE_COOKIE = makeAuthCookie('u-emp',   'EMPLOYEE')

const STUB_DOC = {
  id: 'doc-001',
  name: 'Policy Certificate',
  documentType: 'POLICY',
  status: 'VALID',
  clientId: 'c-001',
  client: { id: 'c-001', name: 'Acme Corp', clientNumber: '000001' },
  sale: null,
  uploadedBy: null,
  fileUrl: null,
}

beforeEach(() => vi.clearAllMocks())

// ─── GET /documents ───────────────────────────────────────────────────────────

describe('GET /documents', () => {
  it('returns 401 when not authenticated', async () => {
    const res = await request(app).get('/documents')
    expect(res.status).toBe(401)
  })

  it('returns the document list for an authenticated user', async () => {
    mockList.mockResolvedValue([STUB_DOC] as never)
    const res = await request(app).get('/documents').set('Cookie', OWNER_COOKIE)
    expect(res.status).toBe(200)
    expect(Array.isArray(res.body)).toBe(true)
    expect(res.body[0].name).toBe('Policy Certificate')
  })

  it('passes clientId filter to the service', async () => {
    mockList.mockResolvedValue([] as never)
    await request(app).get('/documents?clientId=c-001').set('Cookie', OWNER_COOKIE)
    expect(mockList).toHaveBeenCalledWith(expect.objectContaining({ clientId: 'c-001' }))
  })

  it('passes saleId filter to the service', async () => {
    mockList.mockResolvedValue([] as never)
    await request(app).get('/documents?saleId=s-001').set('Cookie', OWNER_COOKIE)
    expect(mockList).toHaveBeenCalledWith(expect.objectContaining({ saleId: 's-001' }))
  })

  it('passes documentType filter to the service', async () => {
    mockList.mockResolvedValue([] as never)
    await request(app).get('/documents?documentType=POLICY').set('Cookie', OWNER_COOKIE)
    expect(mockList).toHaveBeenCalledWith(expect.objectContaining({ documentType: 'POLICY' }))
  })

  it('passes status filter to the service', async () => {
    mockList.mockResolvedValue([] as never)
    await request(app).get('/documents?status=EXPIRED').set('Cookie', OWNER_COOKIE)
    expect(mockList).toHaveBeenCalledWith(expect.objectContaining({ status: 'EXPIRED' }))
  })

  it('works for EMPLOYEE role', async () => {
    mockList.mockResolvedValue([] as never)
    const res = await request(app).get('/documents').set('Cookie', EMPLOYEE_COOKIE)
    expect(res.status).toBe(200)
  })
})

// ─── GET /documents/:id ───────────────────────────────────────────────────────

describe('GET /documents/:id', () => {
  it('returns 401 when not authenticated', async () => {
    const res = await request(app).get('/documents/doc-001')
    expect(res.status).toBe(401)
  })

  it('returns the document for a valid id', async () => {
    mockGetById.mockResolvedValue(STUB_DOC as never)
    const res = await request(app).get('/documents/doc-001').set('Cookie', OWNER_COOKIE)
    expect(res.status).toBe(200)
    expect(res.body.id).toBe('doc-001')
  })

  it('returns 404 when the document does not exist', async () => {
    mockGetById.mockResolvedValue(null)
    const res = await request(app).get('/documents/nonexistent').set('Cookie', OWNER_COOKIE)
    expect(res.status).toBe(404)
  })
})

// ─── POST /documents ──────────────────────────────────────────────────────────

describe('POST /documents', () => {
  it('returns 401 when not authenticated', async () => {
    const res = await request(app).post('/documents')
      .field('name', 'X').field('documentType', 'POLICY').field('clientId', 'c-1')
    expect(res.status).toBe(401)
  })

  it('returns 400 when name is missing', async () => {
    const res = await request(app)
      .post('/documents').set('Cookie', OWNER_COOKIE)
      .field('documentType', 'POLICY').field('clientId', 'c-001')
    expect(res.status).toBe(400)
    expect(res.body.error).toMatch(/name/)
  })

  it('returns 400 when documentType is missing', async () => {
    const res = await request(app)
      .post('/documents').set('Cookie', OWNER_COOKIE)
      .field('name', 'Certificate').field('clientId', 'c-001')
    expect(res.status).toBe(400)
    expect(res.body.error).toMatch(/documentType/)
  })

  it('returns 400 when clientId is missing', async () => {
    const res = await request(app)
      .post('/documents').set('Cookie', OWNER_COOKIE)
      .field('name', 'Certificate').field('documentType', 'POLICY')
    expect(res.status).toBe(400)
    expect(res.body.error).toMatch(/clientId/)
  })

  it('returns 201 and the created document on success (no file)', async () => {
    mockCreate.mockResolvedValue(STUB_DOC as never)
    const res = await request(app)
      .post('/documents').set('Cookie', OWNER_COOKIE)
      .field('name', 'Policy Certificate')
      .field('documentType', 'POLICY')
      .field('clientId', 'c-001')
    expect(res.status).toBe(201)
    expect(res.body.name).toBe('Policy Certificate')
  })

  it('EMPLOYEE can create a document', async () => {
    mockCreate.mockResolvedValue(STUB_DOC as never)
    const res = await request(app)
      .post('/documents').set('Cookie', EMPLOYEE_COOKIE)
      .field('name', 'Policy Certificate')
      .field('documentType', 'POLICY')
      .field('clientId', 'c-001')
    expect(res.status).toBe(201)
  })
})

// ─── PATCH /documents/:id ─────────────────────────────────────────────────────

describe('PATCH /documents/:id', () => {
  it('returns 401 when not authenticated', async () => {
    const res = await request(app).patch('/documents/doc-001').field('name', 'Updated')
    expect(res.status).toBe(401)
  })

  it('returns 200 with the updated document on success', async () => {
    const updated = { ...STUB_DOC, name: 'Updated' }
    mockUpdate.mockResolvedValue(updated as never)
    const res = await request(app)
      .patch('/documents/doc-001').set('Cookie', OWNER_COOKIE)
      .field('name', 'Updated')
    expect(res.status).toBe(200)
    expect(res.body.name).toBe('Updated')
  })

  it('returns 404 when the document does not exist', async () => {
    mockUpdate.mockRejectedValue(Object.assign(new Error('Not found'), { code: 'P2025' }))
    const res = await request(app)
      .patch('/documents/nonexistent').set('Cookie', OWNER_COOKIE)
      .field('name', 'X')
    expect(res.status).toBe(404)
  })
})

// ─── DELETE /documents/:id ────────────────────────────────────────────────────

describe('DELETE /documents/:id', () => {
  it('returns 401 when not authenticated', async () => {
    const res = await request(app).delete('/documents/doc-001')
    expect(res.status).toBe(401)
  })

  it('returns 403 when the user is an EMPLOYEE', async () => {
    const res = await request(app).delete('/documents/doc-001').set('Cookie', EMPLOYEE_COOKIE)
    expect(res.status).toBe(403)
    expect(mockDelete).not.toHaveBeenCalled()
  })

  it('returns 204 when the OWNER deletes a document', async () => {
    mockDelete.mockResolvedValue(undefined as never)
    const res = await request(app).delete('/documents/doc-001').set('Cookie', OWNER_COOKIE)
    expect(res.status).toBe(204)
    expect(mockDelete).toHaveBeenCalledWith('doc-001')
  })

  it('returns 404 when the document does not exist', async () => {
    mockDelete.mockRejectedValue(new Error('Not found'))
    const res = await request(app).delete('/documents/nonexistent').set('Cookie', OWNER_COOKIE)
    expect(res.status).toBe(404)
  })
})
