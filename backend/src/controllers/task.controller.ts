import { Response } from 'express'
import { Prisma } from '../generated/prisma/client.js'
import { AuthRequest } from '../middleware/auth.js'
import * as taskService from '../services/task.service.js'
import type { TaskFilters } from '../services/task.service.js'

// ── List ──────────────────────────────────────────────────────────────────────

export async function listTasks(req: AuthRequest, res: Response): Promise<void> {
  const {
    assignedToUserId,
    status,
    priority,
    contextType,
    clientId,
    saleId,
    caseId,
    dueBefore,
    dueAfter,
    overdue,
    hasReminder,
  } = req.query as Record<string, string | undefined>

  const filters: TaskFilters = {}
  if (assignedToUserId) filters.assignedToUserId = assignedToUserId
  if (status)           filters.status           = status as TaskFilters['status']
  if (priority)         filters.priority         = priority as TaskFilters['priority']
  if (contextType)      filters.contextType      = contextType as TaskFilters['contextType']
  if (clientId)         filters.clientId         = clientId
  if (saleId)           filters.saleId           = saleId
  if (caseId)           filters.caseId           = caseId
  if (dueBefore)        filters.dueBefore        = dueBefore
  if (dueAfter)         filters.dueAfter         = dueAfter
  if (overdue === 'true')      filters.overdue      = true
  if (hasReminder === 'true')  filters.hasReminder  = true
  if (hasReminder === 'false') filters.hasReminder  = false

  const tasks = await taskService.listTasks(filters)
  res.json(tasks)
}

// ── Get ───────────────────────────────────────────────────────────────────────

export async function getTask(req: AuthRequest, res: Response): Promise<void> {
  const task = await taskService.getTaskById(req.params.id as string)
  if (!task) {
    res.status(404).json({ error: 'Task not found' })
    return
  }
  res.json(task)
}

// ── Create ────────────────────────────────────────────────────────────────────

export async function createTask(req: AuthRequest, res: Response): Promise<void> {
  const body = req.body

  if (!body.subject || typeof body.subject !== 'string' || !body.subject.trim()) {
    res.status(400).json({ error: 'subject is required' })
    return
  }

  // Reminder cross-field validation
  if (body.hasReminder) {
    if (!body.reminderAt) {
      res.status(400).json({ error: 'reminderAt is required when hasReminder is true' })
      return
    }
    if (!body.reminderChannel) {
      res.status(400).json({ error: 'reminderChannel is required when hasReminder is true' })
      return
    }
  }
  if (body.reminderRecurrence && !body.hasReminder) {
    res.status(400).json({ error: 'reminderRecurrence is only allowed when hasReminder is true' })
    return
  }

  try {
    const task = await taskService.createTask(body)
    res.status(201).json(task)
  } catch (err: unknown) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2003') {
      res.status(422).json({ error: 'Foreign key constraint failed', detail: err.meta?.field_name })
      return
    }
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2025') {
      res.status(422).json({ error: 'Referenced entity not found' })
      return
    }
    res.status(500).json({ error: 'Failed to create task', detail: String(err) })
  }
}

// ── Update ────────────────────────────────────────────────────────────────────

export async function updateTask(req: AuthRequest, res: Response): Promise<void> {
  const body = req.body

  if (body.hasReminder === true) {
    if (body.reminderAt === null || body.reminderAt === '') {
      res.status(400).json({ error: 'reminderAt is required when hasReminder is true' })
      return
    }
    if (body.reminderChannel === null || body.reminderChannel === '') {
      res.status(400).json({ error: 'reminderChannel is required when hasReminder is true' })
      return
    }
  }
  if (body.reminderRecurrence && body.hasReminder === false) {
    res.status(400).json({ error: 'reminderRecurrence is only allowed when hasReminder is true' })
    return
  }

  try {
    const task = await taskService.updateTask(req.params.id as string, body)
    res.json(task)
  } catch (err: unknown) {
    const e = err as { code?: string }
    if (e?.code === 'P2025') {
      res.status(404).json({ error: 'Task not found' })
      return
    }
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2003') {
      res.status(422).json({ error: 'Foreign key constraint failed', detail: err.meta?.field_name })
      return
    }
    res.status(500).json({ error: 'Failed to update task', detail: String(err) })
  }
}

// ── Delete ────────────────────────────────────────────────────────────────────

export async function deleteTask(req: AuthRequest, res: Response): Promise<void> {
  if (req.user!.role !== 'OWNER') {
    res.status(403).json({ error: 'Forbidden' })
    return
  }
  try {
    await taskService.deleteTask(req.params.id as string)
    res.status(204).send()
  } catch {
    res.status(404).json({ error: 'Task not found' })
  }
}
