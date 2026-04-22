import { Response } from 'express'
import { AuthRequest } from '../middleware/auth.js'
import * as dashboardService from '../services/dashboard.service.js'

export async function getDashboardSummary(_req: AuthRequest, res: Response): Promise<void> {
  try {
    const summary = await dashboardService.getDashboardSummary()
    res.json(summary)
  } catch (err) {
    res.status(500).json({ error: 'Failed to load dashboard summary', detail: String(err) })
  }
}
