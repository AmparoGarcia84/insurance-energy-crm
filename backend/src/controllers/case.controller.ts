import { Response } from 'express'
import { AuthRequest } from '../middleware/auth.js'
import * as caseService from '../services/case.service.js'

const NAME_MAX  = 200
const DESC_MAX  = 2000
const CAUSE_MAX = 1000

export async function listCases(req: AuthRequest, res: Response): Promise<void> {
  const { clientId, saleId } = req.query as Record<string, string | undefined>
  const cases = await caseService.listCases({ clientId, saleId })
  res.json(cases)
}

export async function getCase(req: AuthRequest, res: Response): Promise<void> {
  const found = await caseService.getCaseById(req.params.id as string)
  if (!found) {
    res.status(404).json({ error: 'Case not found' })
    return
  }
  res.json(found)
}

export async function createCase(req: AuthRequest, res: Response): Promise<void> {
  const { clientId, saleId, name, occurrenceAt, description, cause, type, status, priority, supplierId } = req.body

  if (!clientId || typeof clientId !== 'string') {
    res.status(400).json({ error: 'clientId is required' })
    return
  }
  if (!name || typeof name !== 'string' || !name.trim()) {
    res.status(400).json({ error: 'name is required' })
    return
  }
  if (name.length > NAME_MAX) {
    res.status(400).json({ error: `name must be at most ${NAME_MAX} characters` })
    return
  }
  if (description && description.length > DESC_MAX) {
    res.status(400).json({ error: `description must be at most ${DESC_MAX} characters` })
    return
  }
  if (cause && cause.length > CAUSE_MAX) {
    res.status(400).json({ error: `cause must be at most ${CAUSE_MAX} characters` })
    return
  }

  try {
    const created = await caseService.createCase({
      clientId, saleId, name, occurrenceAt, description, cause, type, status, priority, supplierId,
      createdByUserId: req.user!.userId,
    })
    res.status(201).json(created)
  } catch (err: unknown) {
    const e = err as { code?: string; message?: string }
    if (e?.code === 'P2025') {
      res.status(422).json({ error: 'Referenced record not found', detail: String(e.message) })
      return
    }
    res.status(500).json({ error: 'Failed to create case', detail: String(err) })
  }
}

export async function updateCase(req: AuthRequest, res: Response): Promise<void> {
  const { name, description, cause } = req.body

  if (name !== undefined && (typeof name !== 'string' || !name.trim())) {
    res.status(400).json({ error: 'name must be a non-empty string' })
    return
  }
  if (name && name.length > NAME_MAX) {
    res.status(400).json({ error: `name must be at most ${NAME_MAX} characters` })
    return
  }
  if (description && description.length > DESC_MAX) {
    res.status(400).json({ error: `description must be at most ${DESC_MAX} characters` })
    return
  }
  if (cause && cause.length > CAUSE_MAX) {
    res.status(400).json({ error: `cause must be at most ${CAUSE_MAX} characters` })
    return
  }

  try {
    const updated = await caseService.updateCase(req.params.id as string, req.body)
    res.json(updated)
  } catch (err: unknown) {
    const e = err as { code?: string }
    if (e?.code === 'P2025') {
      res.status(404).json({ error: 'Case not found' })
      return
    }
    res.status(500).json({ error: 'Failed to update case', detail: String(err) })
  }
}

export async function deleteCase(req: AuthRequest, res: Response): Promise<void> {
  if (req.user!.role !== 'OWNER') {
    res.status(403).json({ error: 'Forbidden' })
    return
  }
  try {
    await caseService.deleteCase(req.params.id as string)
    res.status(204).send()
  } catch {
    res.status(404).json({ error: 'Case not found' })
  }
}
