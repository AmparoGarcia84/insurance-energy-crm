/**
 * app.ts — Express application factory
 *
 * Exports the configured Express app without starting the HTTP server.
 * Keeping the app creation separate from app.listen() allows Supertest
 * to mount the app in tests without binding a port.
 */
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
import tasksRouter from './routes/tasks.js'
import documentsRouter from './routes/documents.js'
import activitiesRouter from './routes/activities.js'
import dashboardRouter from './routes/dashboard.js'
import casesRouter from './routes/cases.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

export const app = express()

app.use(cors({
  origin: process.env.FRONTEND_URL ?? 'http://localhost:5173',
  credentials: true,
}))

app.use(express.json())
app.use(cookieParser())

app.get('/health', (_req, res) => {
  res.json({ status: 'ok' })
})

app.use('/uploads', express.static(path.join(__dirname, '../uploads')))

app.use('/auth', authRouter)
app.use('/clients', clientsRouter)
app.use('/admin', adminRouter)
app.use('/sales', salesRouter)
app.use('/collaborators', collaboratorsRouter)
app.use('/tasks', tasksRouter)
app.use('/documents', documentsRouter)
app.use('/activities', activitiesRouter)
app.use('/dashboard', dashboardRouter)
app.use('/cases', casesRouter)
