import { describe, it, expect, vi } from 'vitest'
import jwt from 'jsonwebtoken'
import type { Response, NextFunction } from 'express'
import { requireAuth, type AuthRequest } from './auth.js'

const JWT_SECRET = process.env.JWT_SECRET!

function makeReq(token?: string): AuthRequest {
  return {
    cookies: token ? { token } : {},
  } as AuthRequest
}

function makeRes(): { res: Response; status: ReturnType<typeof vi.fn>; json: ReturnType<typeof vi.fn> } {
  const json = vi.fn()
  const status = vi.fn().mockReturnValue({ json })
  const res = { status, json } as unknown as Response
  return { res, status, json }
}

describe('requireAuth middleware', () => {
  it('returns 401 when no token cookie is present', () => {
    const req = makeReq()
    const { res, status } = makeRes()
    const next: NextFunction = vi.fn()

    requireAuth(req, res, next)

    expect(status).toHaveBeenCalledWith(401)
    expect(next).not.toHaveBeenCalled()
  })

  it('populates req.user and calls next() for a valid token', () => {
    const payload = { userId: 'user-1', role: 'OWNER' as const }
    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '1h' })

    const req = makeReq(token)
    const { res } = makeRes()
    const next: NextFunction = vi.fn()

    requireAuth(req, res, next)

    expect(next).toHaveBeenCalledOnce()
    expect(req.user).toMatchObject({ userId: 'user-1', role: 'OWNER' })
  })

  it('returns 401 for a token signed with the wrong secret', () => {
    const token = jwt.sign({ userId: 'u1', role: 'EMPLOYEE' }, 'wrong-secret')

    const req = makeReq(token)
    const { res, status } = makeRes()
    const next: NextFunction = vi.fn()

    requireAuth(req, res, next)

    expect(status).toHaveBeenCalledWith(401)
    expect(next).not.toHaveBeenCalled()
  })

  it('returns 401 for an expired token', () => {
    const token = jwt.sign({ userId: 'u1', role: 'EMPLOYEE' }, JWT_SECRET, { expiresIn: '0s' })

    const req = makeReq(token)
    const { res, status } = makeRes()
    const next: NextFunction = vi.fn()

    requireAuth(req, res, next)

    expect(status).toHaveBeenCalledWith(401)
    expect(next).not.toHaveBeenCalled()
  })

  it('returns 401 for a malformed token string', () => {
    const req = makeReq('this.is.not.a.jwt')
    const { res, status } = makeRes()
    const next: NextFunction = vi.fn()

    requireAuth(req, res, next)

    expect(status).toHaveBeenCalledWith(401)
    expect(next).not.toHaveBeenCalled()
  })
})
