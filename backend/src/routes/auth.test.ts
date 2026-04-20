/**
 * Integration tests for /auth routes.
 *
 * The service layer is mocked so no database connection is required.
 * JWT cookies are built with the test secret set in test-setup.ts.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import request from 'supertest'
import jwt from 'jsonwebtoken'
import { app } from '../app.js'

vi.mock('../services/auth.service.js', () => ({
  login: vi.fn(),
  getMe: vi.fn(),
  changePassword: vi.fn(),
  changeEmail: vi.fn(),
  updateAvatar: vi.fn(),
}))

// Import after mocking so we get the mocked versions
import * as authService from '../services/auth.service.js'

const mockLogin = vi.mocked(authService.login)
const mockGetMe = vi.mocked(authService.getMe)
const mockChangePassword = vi.mocked(authService.changePassword)
const mockChangeEmail = vi.mocked(authService.changeEmail)

function makeAuthCookie(userId: string, role: 'OWNER' | 'EMPLOYEE'): string {
  const token = jwt.sign({ userId, role }, process.env.JWT_SECRET!, { expiresIn: '1h' })
  return `token=${token}`
}

beforeEach(() => {
  vi.clearAllMocks()
})

// ─── POST /auth/login ─────────────────────────────────────────────────────────

describe('POST /auth/login', () => {
  it('returns 400 when email is missing', async () => {
    const res = await request(app).post('/auth/login').send({ password: 'pw' })
    expect(res.status).toBe(400)
  })

  it('returns 400 when password is missing', async () => {
    const res = await request(app).post('/auth/login').send({ email: 'a@b.com' })
    expect(res.status).toBe(400)
  })

  it('returns 401 when service throws invalid credentials', async () => {
    mockLogin.mockRejectedValue(new Error('Invalid credentials'))
    const res = await request(app).post('/auth/login').send({ email: 'a@b.com', password: 'wrong' })
    expect(res.status).toBe(401)
    expect(res.body.error).toBeDefined()
  })

  it('returns 200, user payload and sets httpOnly cookie on valid login', async () => {
    mockLogin.mockResolvedValue({
      token: 'signed-jwt',
      user: { id: 'u1', email: 'mila@crm.com', role: 'OWNER', displayName: 'Mila', avatarUrl: undefined },
    })

    const res = await request(app)
      .post('/auth/login')
      .send({ email: 'mila@crm.com', password: 'correct' })

    expect(res.status).toBe(200)
    expect(res.body.user.email).toBe('mila@crm.com')
    expect(res.body.user.role).toBe('OWNER')
    const cookies: string[] = res.headers['set-cookie'] as unknown as string[]
    expect(cookies).toBeDefined()
    expect(cookies.some((c: string) => c.startsWith('token='))).toBe(true)
    expect(cookies.some((c: string) => c.includes('HttpOnly'))).toBe(true)
  })
})

// ─── GET /auth/me ─────────────────────────────────────────────────────────────

describe('GET /auth/me', () => {
  it('returns 401 when no auth cookie is present', async () => {
    const res = await request(app).get('/auth/me')
    expect(res.status).toBe(401)
  })

  it('returns the user profile for an authenticated request', async () => {
    mockGetMe.mockResolvedValue({
      id: 'u1',
      email: 'mila@crm.com',
      role: 'OWNER',
      displayName: 'Mila',
      avatarUrl: null,
    })

    const res = await request(app)
      .get('/auth/me')
      .set('Cookie', makeAuthCookie('u1', 'OWNER'))

    expect(res.status).toBe(200)
    expect(res.body.email).toBe('mila@crm.com')
    expect(res.body).not.toHaveProperty('passwordHash')
  })

  it('returns 404 when the user record no longer exists', async () => {
    mockGetMe.mockRejectedValue(new Error('Not found'))

    const res = await request(app)
      .get('/auth/me')
      .set('Cookie', makeAuthCookie('deleted-user', 'EMPLOYEE'))

    expect(res.status).toBe(404)
  })
})

// ─── POST /auth/logout ────────────────────────────────────────────────────────

describe('POST /auth/logout', () => {
  it('returns 401 without auth cookie', async () => {
    const res = await request(app).post('/auth/logout')
    expect(res.status).toBe(401)
  })

  it('clears the cookie and returns ok for an authenticated request', async () => {
    const res = await request(app)
      .post('/auth/logout')
      .set('Cookie', makeAuthCookie('u1', 'OWNER'))

    expect(res.status).toBe(200)
    expect(res.body.ok).toBe(true)
    const cookies: string[] = res.headers['set-cookie'] as unknown as string[]
    expect(cookies.some((c: string) => c.includes('token=;') || c.includes('token=;') || c.includes('Max-Age=0'))).toBe(true)
  })
})

// ─── PATCH /auth/password ─────────────────────────────────────────────────────

describe('PATCH /auth/password', () => {
  it('returns 401 without auth cookie', async () => {
    const res = await request(app).patch('/auth/password').send({ currentPassword: 'old', newPassword: 'new1234' })
    expect(res.status).toBe(401)
  })

  it('returns 400 when fields are missing', async () => {
    const res = await request(app)
      .patch('/auth/password')
      .set('Cookie', makeAuthCookie('u1', 'OWNER'))
      .send({ currentPassword: 'old' })

    expect(res.status).toBe(400)
  })

  it('returns 400 when new password is shorter than 8 characters', async () => {
    const res = await request(app)
      .patch('/auth/password')
      .set('Cookie', makeAuthCookie('u1', 'OWNER'))
      .send({ currentPassword: 'old', newPassword: 'short' })

    expect(res.status).toBe(400)
  })

  it('returns 401 when current password is wrong', async () => {
    mockChangePassword.mockRejectedValue(new Error('Invalid current password'))

    const res = await request(app)
      .patch('/auth/password')
      .set('Cookie', makeAuthCookie('u1', 'OWNER'))
      .send({ currentPassword: 'wrong', newPassword: 'newpassword' })

    expect(res.status).toBe(401)
  })

  it('returns 200 on successful password change', async () => {
    mockChangePassword.mockResolvedValue(undefined)

    const res = await request(app)
      .patch('/auth/password')
      .set('Cookie', makeAuthCookie('u1', 'OWNER'))
      .send({ currentPassword: 'correct', newPassword: 'newpassword' })

    expect(res.status).toBe(200)
    expect(res.body.ok).toBe(true)
  })
})

// ─── PATCH /auth/email ────────────────────────────────────────────────────────

describe('PATCH /auth/email', () => {
  it('returns 401 without auth cookie', async () => {
    const res = await request(app).patch('/auth/email').send({ email: 'new@test.com' })
    expect(res.status).toBe(401)
  })

  it('returns 400 when email is missing', async () => {
    const res = await request(app)
      .patch('/auth/email')
      .set('Cookie', makeAuthCookie('u1', 'OWNER'))
      .send({})

    expect(res.status).toBe(400)
  })

  it('returns 409 when email is already in use', async () => {
    mockChangeEmail.mockRejectedValue(Object.assign(new Error('Unique'), { code: 'P2002' }))

    const res = await request(app)
      .patch('/auth/email')
      .set('Cookie', makeAuthCookie('u1', 'OWNER'))
      .send({ email: 'taken@crm.com' })

    expect(res.status).toBe(409)
  })

  it('returns 200 with the updated user on success', async () => {
    mockChangeEmail.mockResolvedValue({
      id: 'u1',
      email: 'new@crm.com',
      role: 'OWNER',
      displayName: 'Mila',
      avatarUrl: null,
    })

    const res = await request(app)
      .patch('/auth/email')
      .set('Cookie', makeAuthCookie('u1', 'OWNER'))
      .send({ email: 'new@crm.com' })

    expect(res.status).toBe(200)
    expect(res.body.user.email).toBe('new@crm.com')
  })
})
