import { Response } from 'express'
import { Prisma } from '../generated/prisma/client.js'
import { AuthRequest } from '../middleware/auth.js'
import * as activityService from '../services/activity.service.js'
import type { ActivityFilters } from '../services/activity.service.js'

const VALID_TYPES = ['CALL', 'EMAIL', 'WHATSAPP_NOTE', 'MEETING'] as const
const VALID_DIRECTIONS = ['INBOUND', 'OUTBOUND'] as const

// ── List ──────────────────────────────────────────────────────────────────────

export async function listActivities(req: AuthRequest, res: Response): Promise<void> {
  const { clientId, saleId, caseId, userId, type } = req.query as Record<string, string | undefined>

  const filters: ActivityFilters = {}
  if (clientId) filters.clientId = clientId
  if (saleId)   filters.saleId   = saleId
  if (caseId)   filters.caseId   = caseId
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

  // At least one anchor is required: clientId, saleId, or caseId.
  // If caseId or saleId is provided, clientId is auto-derived from the hierarchy.
  if (!body.clientId && !body.saleId && !body.caseId) {
    res.status(400).json({ error: 'clientId is required (or provide saleId / caseId to derive it)' })
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
    if (err instanceof Error && err.message.includes('At least one of')) {
      res.status(400).json({ error: err.message })
      return
    }
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2003') {
      res.status(422).json({ error: 'Foreign key constraint failed', detail: err.meta?.field_name })
      return
    }
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2025') {
      res.status(422).json({ error: 'Referenced entity not found' })
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
