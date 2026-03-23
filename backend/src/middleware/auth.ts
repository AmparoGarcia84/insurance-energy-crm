/**
 * middleware/auth.ts — JWT authentication middleware
 *
 * Provides the `requireAuth` Express middleware that protects any route
 * requiring a logged-in user. It reads the JWT from the httpOnly cookie
 * named "token" (set by POST /auth/login), verifies its signature and expiry,
 * and attaches the decoded payload to `req.user` so downstream controllers
 * know who is making the request without hitting the database.
 *
 * Using an httpOnly cookie means the token is never accessible from JavaScript,
 * which prevents XSS-based token theft.
 */
import { Request, Response, NextFunction } from 'express'
import jwt from 'jsonwebtoken'

/** Claims embedded in every JWT issued by this backend. */
export interface AuthPayload {
  userId: string
  role: 'OWNER' | 'EMPLOYEE'
}

/**
 * Extends the standard Express Request so that TypeScript knows req.user
 * is available on routes protected by requireAuth. Controllers can read
 * req.user!.userId / req.user!.role without additional casting.
 */
export interface AuthRequest extends Request {
  user?: AuthPayload
}

/**
 * Express middleware that enforces authentication on a route.
 *
 * Reads the JWT from the httpOnly "token" cookie. Rejects requests that:
 *  - have no "token" cookie
 *  - carry a token with an invalid signature or that has expired
 *
 * On success it calls next(), passing control to the route handler with
 * req.user populated. On failure it responds with 401 and does NOT call next().
 */
export function requireAuth(req: AuthRequest, res: Response, next: NextFunction): void {
  // cookie-parser makes cookies available on req.cookies
  const token = req.cookies?.token

  if (!token) {
    res.status(401).json({ error: 'Unauthorized' })
    return
  }

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET!) as AuthPayload
    req.user = payload
    next()
  } catch {
    // jwt.verify throws for expired, tampered, or structurally invalid tokens
    res.status(401).json({ error: 'Invalid token' })
  }
}
