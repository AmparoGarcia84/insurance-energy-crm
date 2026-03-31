import { Response } from 'express'
import { AuthRequest } from '../middleware/auth.js'
import * as saleService from '../services/sale.service.js'

export async function listSales(_req: AuthRequest, res: Response): Promise<void> {
  const sales = await saleService.listSales()
  res.json(sales)
}

export async function getSale(req: AuthRequest, res: Response): Promise<void> {
  const sale = await saleService.getSaleById(req.params.id as string)
  if (!sale) {
    res.status(404).json({ error: 'Sale not found' })
    return
  }
  res.json(sale)
}

export async function createSale(req: AuthRequest, res: Response): Promise<void> {
  const { title, type, clientId } = req.body
  if (!title || !type || !clientId) {
    res.status(400).json({ error: 'title, type and clientId are required' })
    return
  }
  try {
    const sale = await saleService.createSale(req.body)
    res.status(201).json(sale)
  } catch (err) {
    res.status(500).json({ error: 'Failed to create sale', detail: String(err) })
  }
}

export async function updateSale(req: AuthRequest, res: Response): Promise<void> {
  try {
    const sale = await saleService.updateSale(req.params.id as string, req.body)
    res.json(sale)
  } catch (err: any) {
    if (err?.code === 'P2025') {
      res.status(404).json({ error: 'Sale not found' })
      return
    }
    res.status(500).json({ error: 'Failed to update sale', detail: String(err) })
  }
}

export async function deleteSale(req: AuthRequest, res: Response): Promise<void> {
  if (req.user!.role !== 'OWNER') {
    res.status(403).json({ error: 'Forbidden' })
    return
  }
  try {
    await saleService.deleteSale(req.params.id as string)
    res.status(204).send()
  } catch {
    res.status(404).json({ error: 'Sale not found' })
  }
}
