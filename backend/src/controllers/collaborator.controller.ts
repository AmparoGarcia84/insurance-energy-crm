import { Response } from 'express'
import { AuthRequest } from '../middleware/auth.js'
import * as collaboratorService from '../services/collaborator.service.js'

export async function listCollaborators(_req: AuthRequest, res: Response): Promise<void> {
  const collaborators = await collaboratorService.listCollaborators()
  res.json(collaborators)
}

export async function getCollaborator(req: AuthRequest, res: Response): Promise<void> {
  const collaborator = await collaboratorService.getCollaboratorById(req.params.id as string)
  if (!collaborator) {
    res.status(404).json({ error: 'Collaborator not found' })
    return
  }
  res.json(collaborator)
}

export async function createCollaborator(req: AuthRequest, res: Response): Promise<void> {
  const { name, phone } = req.body
  if (!name || !phone) {
    res.status(400).json({ error: 'name and phone are required' })
    return
  }
  try {
    const collaborator = await collaboratorService.createCollaborator({ name, phone })
    res.status(201).json(collaborator)
  } catch (err) {
    res.status(500).json({ error: 'Failed to create collaborator', detail: String(err) })
  }
}

export async function updateCollaborator(req: AuthRequest, res: Response): Promise<void> {
  try {
    const collaborator = await collaboratorService.updateCollaborator(req.params.id as string, req.body)
    res.json(collaborator)
  } catch (err: any) {
    if (err?.code === 'P2025') {
      res.status(404).json({ error: 'Collaborator not found' })
      return
    }
    res.status(500).json({ error: 'Failed to update collaborator', detail: String(err) })
  }
}

export async function deleteCollaborator(req: AuthRequest, res: Response): Promise<void> {
  if (req.user!.role !== 'OWNER') {
    res.status(403).json({ error: 'Forbidden' })
    return
  }
  try {
    await collaboratorService.deleteCollaborator(req.params.id as string)
    res.status(204).send()
  } catch {
    res.status(404).json({ error: 'Collaborator not found' })
  }
}
