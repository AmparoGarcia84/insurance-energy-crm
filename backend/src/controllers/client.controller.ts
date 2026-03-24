import { Response } from 'express'
import { AuthRequest } from '../middleware/auth.js'
import * as clientService from '../services/client.service.js'

export async function listClients(_req: AuthRequest, res: Response): Promise<void> {
  const clients = await clientService.listClients()
  res.json(clients)
}

export async function getClient(req: AuthRequest, res: Response): Promise<void> {
  const client = await clientService.getClientById(req.params.id as string)
  if (!client) {
    res.status(404).json({ error: 'Client not found' })
    return
  }
  res.json(client)
}

export async function createClient(req: AuthRequest, res: Response): Promise<void> {
  const { name, type } = req.body
  if (!name || !type) {
    res.status(400).json({ error: 'name and type are required' })
    return
  }
  try {
    const client = await clientService.createClient(req.body)
    res.status(201).json(client)
  } catch (err) {
    res.status(500).json({ error: 'Failed to create client', detail: String(err) })
  }
}

export async function updateClient(req: AuthRequest, res: Response): Promise<void> {
  try {
    const client = await clientService.updateClient(req.params.id as string, req.body)
    res.json(client)
  } catch (err: any) {
    if (err?.code === 'P2025') {
      res.status(404).json({ error: 'Client not found' })
    } else {
      res.status(500).json({ error: 'Failed to update client', detail: String(err) })
    }
  }
}

export async function deleteClient(req: AuthRequest, res: Response): Promise<void> {
  if (req.user!.role !== 'OWNER') {
    res.status(403).json({ error: 'Forbidden' })
    return
  }
  try {
    await clientService.deleteClient(req.params.id as string)
    res.status(204).send()
  } catch {
    res.status(404).json({ error: 'Client not found' })
  }
}
