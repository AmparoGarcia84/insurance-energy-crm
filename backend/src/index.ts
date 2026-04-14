/**
 * backend/src/index.ts — Express application entry point
 *
 * Bootstraps the HTTP server: loads environment variables, registers global
 * middleware, mounts feature routers, and starts listening.
 *
 * Keeping this file thin (no business logic) makes it easy to test individual
 * routers and services in isolation without starting the whole server.
 */
import 'dotenv/config'
import path from 'path'
import { fileURLToPath } from 'url'
import express from 'express'
import cors from 'cors'
import cookieParser from 'cookie-parser'
import authRouter from './routes/auth.js'
import clientsRouter from './routes/clients.js'
import adminRouter from './routes/admin.js'
import salesRouter from './routes/sales.js'
import collaboratorsRouter from './routes/collaborators.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

const app = express()
const PORT = process.env.PORT ?? 3000

// credentials: true is required so the browser sends cookies cross-origin.
// origin must be explicit (not '*') when credentials are involved.
app.use(cors({
  origin: process.env.FRONTEND_URL ?? 'http://localhost:5173',
  credentials: true,
}))

// Parse incoming JSON request bodies so controllers receive plain objects.
app.use(express.json())

// Parse cookies so middleware can read the httpOnly auth token.
app.use(cookieParser())

/**
 * Health-check endpoint used by deployment infrastructure (Docker, CI, load
 * balancers) to verify the process is alive without requiring authentication.
 */
app.get('/health', (_req, res) => {
  res.json({ status: 'ok' })
})

// Serve uploaded files (e.g. user avatars) as static assets.
app.use('/uploads', express.static(path.join(__dirname, '../uploads')))

// All authentication routes (/auth/login, /auth/me) are handled here.
app.use('/auth', authRouter)
app.use('/clients', clientsRouter)
app.use('/admin', adminRouter)
app.use('/sales', salesRouter)
app.use('/collaborators', collaboratorsRouter)

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
})
