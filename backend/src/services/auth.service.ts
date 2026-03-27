/**
 * services/auth.service.ts — Authentication business logic
 *
 * Contains the core authentication operations, decoupled from HTTP concerns.
 * Controllers call these functions and are responsible for translating results
 * and errors into HTTP responses.
 *
 * Separation of concerns here means the logic can be unit-tested without
 * spinning up an HTTP server, and can be reused by future transports (e.g.
 * WebSockets, CLI scripts) if needed.
 */
import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'
import prisma from '../db/prisma.js'
import { AuthPayload } from '../middleware/auth.js'

/**
 * Validates credentials and returns a signed JWT plus a safe user profile.
 *
 * The error message is intentionally identical for a missing user and a wrong
 * password — callers should never be able to distinguish the two cases, which
 * would allow email enumeration attacks.
 *
 * The JWT is signed with an 8-hour expiry to match a typical working day; the
 * user must re-authenticate after that without any refresh-token mechanism.
 */
export async function login(email: string, password: string) {
  const user = await prisma.user.findUnique({ where: { email } })

  // Use a generic error for both "user not found" and "wrong password" cases
  if (!user) throw new Error('Invalid credentials')

  // bcrypt.compare does the constant-time comparison to prevent timing attacks
  const valid = await bcrypt.compare(password, user.passwordHash)
  if (!valid) throw new Error('Invalid credentials')

  const payload: AuthPayload = { userId: user.id, role: user.role }
  const token = jwt.sign(payload, process.env.JWT_SECRET!, { expiresIn: '8h' })

  // Return only the fields the frontend needs — never expose passwordHash
  return {
    token,
    user: {
      id: user.id,
      email: user.email,
      role: user.role,
      displayName: user.displayName,
      avatarUrl: user.avatarUrl ?? undefined,
    },
  }
}

/**
 * Fetches the current user's profile by ID.
 * Used by the GET /auth/me endpoint so the frontend can re-hydrate the user
 * object from a stored token on page refresh (once token persistence is added).
 *
 * findUniqueOrThrow is used instead of findUnique so that a missing user
 * propagates as an error automatically — the controller maps it to 404.
 * The select projection ensures passwordHash is never returned.
 */
export async function getMe(userId: string) {
  const user = await prisma.user.findUniqueOrThrow({
    where: { id: userId },
    select: { id: true, email: true, role: true, displayName: true, avatarUrl: true },
  })
  return user
}

/** Updates the avatar URL for a user and returns the updated safe profile. */
export async function updateAvatar(userId: string, avatarUrl: string) {
  const user = await prisma.user.update({
    where: { id: userId },
    data: { avatarUrl },
    select: { id: true, email: true, role: true, displayName: true, avatarUrl: true },
  })
  return user
}
