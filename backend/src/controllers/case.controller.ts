import { Response } from 'express'
import { AuthRequest } from '../middleware/auth.js'
import * as caseService from '../services/case.service.js'

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
  const { saleId, title, description, status } = req.body
  if (!saleId || typeof saleId !== 'string') {
    res.status(400).json({ error: 'saleId is required' })
    return
  }
  if (!title || typeof title !== 'string' || !title.trim()) {
    res.status(400).json({ error: 'title is required' })
    return
  }
  try {
    const created = await caseService.createCase({ saleId, title, description, status })
    res.status(201).json(created)
  } catch (err: unknown) {
    const e = err as { code?: string; message?: string }
    if (e?.code === 'P2025') {
      res.status(422).json({ error: 'Sale not found', detail: 'saleId does not reference an existing sale' })
      return
    }
    res.status(500).json({ error: 'Failed to create case', detail: String(err) })
  }
}

export async function updateCase(req: AuthRequest, res: Response): Promise<void> {
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
