import { Response } from 'express'
import { Prisma } from '../generated/prisma/client.js'
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
  const { name } = req.body
  if (!name) {
    res.status(400).json({ error: 'name is required' })
    return
  }
  try {
    const client = await clientService.createClient(req.body)
    res.status(201).json(client)
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') {
      const existing = req.body.nif
        ? await clientService.findClientByNif(req.body.nif)
        : null
      res.status(409).json({ error: 'nif_duplicate', existing })
      return
    }
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

export async function importClients(req: AuthRequest, res: Response): Promise<void> {
  const csvText = req.body as string
  if (!csvText || typeof csvText !== 'string') {
    res.status(400).json({ error: 'CSV text body is required' })
    return
  }
  try {
    const result = await clientService.importClientsFromCsv(csvText)
    res.json(result)
  } catch (err) {
    res.status(500).json({ error: 'Import failed', detail: String(err) })
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
