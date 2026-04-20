/**
 * Integration tests for /admin routes.
 *
 * All admin endpoints are OWNER-only. EMPLOYEE users receive 403 on every call.
 * The admin service is mocked — no database connection required.
 *
 * Extra rule tested: an OWNER cannot delete their own account.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import request from 'supertest'
import jwt from 'jsonwebtoken'
import { app } from '../app.js'

vi.mock('../services/admin.service.js', () => ({
  listUsers:   vi.fn(),
  createUser:  vi.fn(),
  deleteUser:  vi.fn(),
}))

// admin.service imports prisma without .js extension — also mock that path
vi.mock('../services/admin.service', () => ({
  listUsers:   vi.fn(),
  createUser:  vi.fn(),
  deleteUser:  vi.fn(),
}))

import * as adminService from '../services/admin.service.js'

const mockListUsers  = vi.mocked(adminService.listUsers)
const mockCreateUser = vi.mocked(adminService.createUser)
const mockDeleteUser = vi.mocked(adminService.deleteUser)

const OWNER_ID = 'u-owner'

function makeAuthCookie(userId: string, role: 'OWNER' | 'EMPLOYEE'): string {
  const token = jwt.sign({ userId, role }, process.env.JWT_SECRET!, { expiresIn: '1h' })
  return `token=${token}`
}

const OWNER_COOKIE    = makeAuthCookie(OWNER_ID, 'OWNER')
const EMPLOYEE_COOKIE = makeAuthCookie('u-emp',  'EMPLOYEE')

const STUB_USER = {
  id: 'u-002',
  email: 'asesor@crm.com',
  role: 'EMPLOYEE',
  displayName: 'Asesor',
  avatarUrl: null,
}

beforeEach(() => vi.clearAllMocks())

// ─── GET /admin/users ─────────────────────────────────────────────────────────

describe('GET /admin/users', () => {
  it('returns 401 when not authenticated', async () => {
    const res = await request(app).get('/admin/users')
    expect(res.status).toBe(401)
  })

  it('returns 403 for EMPLOYEE role', async () => {
    const res = await request(app).get('/admin/users').set('Cookie', EMPLOYEE_COOKIE)
    expect(res.status).toBe(403)
    expect(mockListUsers).not.toHaveBeenCalled()
  })

  it('returns the user list for an OWNER', async () => {
    mockListUsers.mockResolvedValue([STUB_USER] as never)
    const res = await request(app).get('/admin/users').set('Cookie', OWNER_COOKIE)
    expect(res.status).toBe(200)
    expect(Array.isArray(res.body)).toBe(true)
    expect(res.body[0].email).toBe('asesor@crm.com')
  })

  it('never exposes passwordHash in the response', async () => {
    mockListUsers.mockResolvedValue([STUB_USER] as never)
    const res = await request(app).get('/admin/users').set('Cookie', OWNER_COOKIE)
    expect(res.body[0]).not.toHaveProperty('passwordHash')
  })
})

// ─── POST /admin/users ────────────────────────────────────────────────────────

describe('POST /admin/users', () => {
  it('returns 401 when not authenticated', async () => {
    const res = await request(app).post('/admin/users')
      .send({ displayName: 'X', email: 'x@x.com', role: 'EMPLOYEE', password: 'pass1234' })
    expect(res.status).toBe(401)
  })

  it('returns 403 for EMPLOYEE role', async () => {
    const res = await request(app).post('/admin/users').set('Cookie', EMPLOYEE_COOKIE)
      .send({ displayName: 'X', email: 'x@x.com', role: 'EMPLOYEE', password: 'pass1234' })
    expect(res.status).toBe(403)
    expect(mockCreateUser).not.toHaveBeenCalled()
  })

  it('returns 400 when displayName is missing', async () => {
    const res = await request(app).post('/admin/users').set('Cookie', OWNER_COOKIE)
      .send({ email: 'x@x.com', role: 'EMPLOYEE', password: 'pass1234' })
    expect(res.status).toBe(400)
  })

  it('returns 400 when email is missing', async () => {
    const res = await request(app).post('/admin/users').set('Cookie', OWNER_COOKIE)
      .send({ displayName: 'X', role: 'EMPLOYEE', password: 'pass1234' })
    expect(res.status).toBe(400)
  })

  it('returns 400 when role is missing', async () => {
    const res = await request(app).post('/admin/users').set('Cookie', OWNER_COOKIE)
      .send({ displayName: 'X', email: 'x@x.com', password: 'pass1234' })
    expect(res.status).toBe(400)
  })

  it('returns 400 when password is missing', async () => {
    const res = await request(app).post('/admin/users').set('Cookie', OWNER_COOKIE)
      .send({ displayName: 'X', email: 'x@x.com', role: 'EMPLOYEE' })
    expect(res.status).toBe(400)
  })

  it('returns 201 and the created user on success', async () => {
    mockCreateUser.mockResolvedValue(STUB_USER as never)
    const res = await request(app).post('/admin/users').set('Cookie', OWNER_COOKIE)
      .send({ displayName: 'Asesor', email: 'asesor@crm.com', role: 'EMPLOYEE', password: 'employee1234' })
    expect(res.status).toBe(201)
    expect(res.body.user.email).toBe('asesor@crm.com')
    expect(res.body.user).not.toHaveProperty('passwordHash')
  })

  it('returns 409 when the email is already in use', async () => {
    mockCreateUser.mockRejectedValue(Object.assign(new Error('Unique'), { code: 'P2002' }))
    const res = await request(app).post('/admin/users').set('Cookie', OWNER_COOKIE)
      .send({ displayName: 'X', email: 'taken@crm.com', role: 'EMPLOYEE', password: 'pass1234' })
    expect(res.status).toBe(409)
  })
})

// ─── DELETE /admin/users/:id ──────────────────────────────────────────────────

describe('DELETE /admin/users/:id', () => {
  it('returns 401 when not authenticated', async () => {
    const res = await request(app).delete('/admin/users/u-002')
    expect(res.status).toBe(401)
  })

  it('returns 403 for EMPLOYEE role', async () => {
    const res = await request(app).delete('/admin/users/u-002').set('Cookie', EMPLOYEE_COOKIE)
    expect(res.status).toBe(403)
    expect(mockDeleteUser).not.toHaveBeenCalled()
  })

  it('returns 400 when the OWNER tries to delete their own account', async () => {
    const res = await request(app).delete(`/admin/users/${OWNER_ID}`).set('Cookie', OWNER_COOKIE)
    expect(res.status).toBe(400)
    expect(res.body.error).toMatch(/own account/)
    expect(mockDeleteUser).not.toHaveBeenCalled()
  })

  it('returns 204 when the OWNER deletes another user', async () => {
    mockDeleteUser.mockResolvedValue(undefined as never)
    const res = await request(app).delete('/admin/users/u-002').set('Cookie', OWNER_COOKIE)
    expect(res.status).toBe(204)
    expect(mockDeleteUser).toHaveBeenCalledWith('u-002')
  })

  it('returns 404 when the user does not exist', async () => {
    mockDeleteUser.mockRejectedValue(Object.assign(new Error('Not found'), { code: 'P2025' }))
    const res = await request(app).delete('/admin/users/nonexistent').set('Cookie', OWNER_COOKIE)
    expect(res.status).toBe(404)
  })
})
