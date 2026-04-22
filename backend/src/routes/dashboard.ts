import { Router } from 'express'
import { requireAuth } from '../middleware/auth.js'
import { getDashboardSummary } from '../controllers/dashboard.controller.js'

const router = Router()

router.use(requireAuth)

router.get('/summary', getDashboardSummary)

export default router
