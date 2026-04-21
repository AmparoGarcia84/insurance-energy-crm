import { Response } from 'express'
import { Prisma } from '../generated/prisma/client.js'
import { AuthRequest } from '../middleware/auth.js'
import * as activityService from '../services/activity.service.js'
import type { ActivityFilters } from '../services/activity.service.js'

const VALID_TYPES = ['CALL', 'EMAIL', 'WHATSAPP_NOTE', 'MEETING'] as const
const VALID_DIRECTIONS = ['INBOUND', 'OUTBOUND'] as const

// ── List ──────────────────────────────────────────────────────────────────────

export async function listActivities(req: AuthRequest, res: Response): Promise<void> {
  const { clientId, saleId, userId, type } = req.query as Record<string, string | undefined>

  const filters: ActivityFilters = {}
  if (clientId) filters.clientId = clientId
  if (saleId)   filters.saleId   = saleId
  if (userId)   filters.userId   = userId
  if (type && VALID_TYPES.includes(type as typeof VALID_TYPES[number])) {
    filters.type = type as ActivityFilters['type']
  }

  const activities = await activityService.listActivities(filters)
  res.json(activities)
}

// ── Get ───────────────────────────────────────────────────────────────────────

export async function getActivity(req: AuthRequest, res: Response): Promise<void> {
  const activity = await activityService.getActivityById(req.params.id as string)
  if (!activity) {
    res.status(404).json({ error: 'Activity not found' })
    return
  }
  res.json(activity)
}

// ── Create ────────────────────────────────────────────────────────────────────

export async function createActivity(req: AuthRequest, res: Response): Promise<void> {
  const body = req.body

  if (!body.clientId || typeof body.clientId !== 'string') {
    res.status(400).json({ error: 'clientId is required' })
    return
  }
  if (!body.type || !VALID_TYPES.includes(body.type)) {
    res.status(400).json({ error: `type must be one of: ${VALID_TYPES.join(', ')}` })
    return
  }
  if (!body.subject || typeof body.subject !== 'string' || !body.subject.trim()) {
    res.status(400).json({ error: 'subject is required' })
    return
  }
  if (!body.activityAt) {
    res.status(400).json({ error: 'activityAt is required' })
    return
  }
  if (body.direction && !VALID_DIRECTIONS.includes(body.direction)) {
    res.status(400).json({ error: `direction must be one of: ${VALID_DIRECTIONS.join(', ')}` })
    return
  }

  // Attach the authenticated user as the owner of the activity
  const data = { ...body, userId: req.user!.userId }

  try {
    const activity = await activityService.createActivity(data)
    res.status(201).json(activity)
  } catch (err: unknown) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2003') {
      res.status(422).json({ error: 'Foreign key constraint failed', detail: err.meta?.field_name })
      return
    }
    res.status(500).json({ error: 'Failed to create activity', detail: String(err) })
  }
}

// ── Update ────────────────────────────────────────────────────────────────────

export async function updateActivity(req: AuthRequest, res: Response): Promise<void> {
  const body = req.body

  if (body.type && !VALID_TYPES.includes(body.type)) {
    res.status(400).json({ error: `type must be one of: ${VALID_TYPES.join(', ')}` })
    return
  }
  if (body.direction && !VALID_DIRECTIONS.includes(body.direction)) {
    res.status(400).json({ error: `direction must be one of: ${VALID_DIRECTIONS.join(', ')}` })
    return
  }

  try {
    const activity = await activityService.updateActivity(req.params.id as string, body)
    res.json(activity)
  } catch (err: unknown) {
    if (err instanceof Prisma.PrismaClientKnownRequestError) {
      if (err.code === 'P2025') {
        res.status(404).json({ error: 'Activity not found' })
        return
      }
    }
    res.status(500).json({ error: 'Failed to update activity', detail: String(err) })
  }
}

// ── Delete ────────────────────────────────────────────────────────────────────

export async function deleteActivity(req: AuthRequest, res: Response): Promise<void> {
  if (req.user!.role !== 'OWNER') {
    res.status(403).json({ error: 'Forbidden' })
    return
  }
  try {
    await activityService.deleteActivity(req.params.id as string)
    res.status(204).send()
  } catch {
    res.status(404).json({ error: 'Activity not found' })
  }
}
