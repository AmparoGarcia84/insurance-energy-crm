/**
 * routes/auth.ts — Authentication route definitions
 *
 * Maps HTTP methods and paths to their controller handlers and applies the
 * appropriate middleware. Mounted under /auth in index.ts, so the full paths
 * are /auth/login and /auth/me.
 *
 * Keeping route declarations separate from controllers and middleware means
 * the full API surface for a feature is visible at a glance in one place.
 */
import { Router } from 'express'
import { login, getMe, logout } from '../controllers/auth.controller.js'
import { requireAuth } from '../middleware/auth.js'

const router = Router()

// Public: no token required — this is how tokens are obtained in the first place
router.post('/login', login)

// Protected: requireAuth verifies the cookie token before the handler runs
router.get('/me', requireAuth, getMe)
router.post('/logout', requireAuth, logout)

export default router
