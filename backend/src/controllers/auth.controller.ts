/**
 * controllers/auth.controller.ts — HTTP handlers for authentication routes
 *
 * Translates HTTP requests into service calls and HTTP responses.
 * Controllers are intentionally thin: they validate inputs, delegate all
 * business logic to auth.service.ts, and map results / errors to status codes.
 *
 * This layering (route → controller → service) makes each layer independently
 * testable and prevents HTTP concerns from leaking into business logic.
 */
import path from 'path'
import { fileURLToPath } from 'url'
import { Request, Response } from 'express'
import multer from 'multer'
import * as authService from '../services/auth.service.js'
import { AuthRequest } from '../middleware/auth.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

const storage = multer.diskStorage({
  destination: path.join(__dirname, '../../uploads/avatars'),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname)
    cb(null, `${(_req as AuthRequest).user!.userId}${ext}`)
  },
})

export const avatarUpload = multer({
  storage,
  limits: { fileSize: 2 * 1024 * 1024 }, // 2 MB
  fileFilter: (_req, file, cb) => {
    if (!file.mimetype.startsWith('image/')) {
      cb(new Error('Only image files are allowed'))
    } else {
      cb(null, true)
    }
  },
})

/**
 * POST /auth/login
 *
 * Accepts { email, password } in the request body and returns a JWT plus
 * user profile on success. Returns 400 for missing fields (client error) and
 * 401 for invalid credentials (authentication failure) — these different codes
 * help API consumers distinguish a bad request from a failed login attempt.
 */
export async function login(req: Request, res: Response): Promise<void> {
  const { email, password } = req.body

  // Validate required fields before hitting the database
  if (!email || !password) {
    res.status(400).json({ error: 'Email and password are required' })
    return
  }

  try {
    const result = await authService.login(email, password)

    // Set the JWT in an httpOnly cookie so it is never accessible from JavaScript.
    // sameSite: 'lax' allows the cookie to be sent on same-site navigations while
    // blocking cross-site requests. secure: true must be enabled in production (HTTPS).
    res.cookie('token', result.token, {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      maxAge: 8 * 60 * 60 * 1000, // 8 hours in milliseconds, matches JWT expiry
    })

    // Return only the user profile — the token is in the cookie, not the body
    res.json({ user: result.user })
  } catch {
    // Any error from the service layer (wrong credentials, DB error) maps to 401
    // so callers cannot distinguish one failure mode from another
    res.status(401).json({ error: 'Invalid credentials' })
  }
}

/**
 * GET /auth/me (requires requireAuth middleware)
 *
 * Returns the profile of the currently authenticated user, identified by the
 * userId embedded in the JWT cookie. Used by the frontend on page load to
 * rehydrate the session without requiring a full login.
 */
export async function getMe(req: AuthRequest, res: Response): Promise<void> {
  try {
    const user = await authService.getMe(req.user!.userId)
    res.json(user)
  } catch {
    // findUniqueOrThrow throws if the user record no longer exists (e.g. deleted)
    res.status(404).json({ error: 'User not found' })
  }
}

/**
 * POST /auth/logout (requires requireAuth middleware)
 *
 * Clears the auth cookie by overwriting it with an empty value and maxAge 0,
 * which instructs the browser to delete it immediately.
 */
export function logout(_req: AuthRequest, res: Response): void {
  res.cookie('token', '', { httpOnly: true, maxAge: 0 })
  res.json({ ok: true })
}

/**
 * POST /auth/avatar (requires requireAuth middleware)
 *
 * Accepts a multipart/form-data upload with a single "avatar" field.
 * Saves the file to disk under uploads/avatars/ and stores the public URL
 * in the User record so it's returned by subsequent /auth/me calls.
 */
/** PATCH /auth/password — Change the current user's password. */
export async function changePassword(req: AuthRequest, res: Response): Promise<void> {
  const { currentPassword, newPassword } = req.body
  if (!currentPassword || !newPassword) {
    res.status(400).json({ error: 'currentPassword and newPassword are required' })
    return
  }
  if (newPassword.length < 8) {
    res.status(400).json({ error: 'Password must be at least 8 characters' })
    return
  }
  try {
    await authService.changePassword(req.user!.userId, currentPassword, newPassword)
    res.json({ ok: true })
  } catch (err: any) {
    if (err.message === 'Invalid current password') {
      res.status(401).json({ error: 'Invalid current password' })
      return
    }
    res.status(500).json({ error: 'Failed to change password' })
  }
}

/** PATCH /auth/email — Change the current user's email address. */
export async function changeEmail(req: AuthRequest, res: Response): Promise<void> {
  const { email } = req.body
  if (!email) {
    res.status(400).json({ error: 'Email is required' })
    return
  }
  try {
    const user = await authService.changeEmail(req.user!.userId, email)
    res.json({ user })
  } catch (err: any) {
    if (err.code === 'P2002') {
      res.status(409).json({ error: 'Email already in use' })
      return
    }
    res.status(500).json({ error: 'Failed to change email' })
  }
}

export async function uploadAvatar(req: AuthRequest, res: Response): Promise<void> {
  if (!req.file) {
    res.status(400).json({ error: 'No file uploaded' })
    return
  }

  try {
    const avatarUrl = `/uploads/avatars/${req.file.filename}`
    const user = await authService.updateAvatar(req.user!.userId, avatarUrl)
    res.json({ user })
  } catch {
    res.status(500).json({ error: 'Failed to update avatar' })
  }
}
