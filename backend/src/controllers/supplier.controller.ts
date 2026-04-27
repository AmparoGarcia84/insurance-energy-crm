import { Response } from 'express'
import { AuthRequest } from '../middleware/auth.js'
import * as supplierService from '../services/supplier.service.js'
import { isValidCIF } from '../utils/validators.js'

export async function listSuppliers(_req: AuthRequest, res: Response): Promise<void> {
  const suppliers = await supplierService.listSuppliers()
  res.json(suppliers)
}

export async function getSupplier(req: AuthRequest, res: Response): Promise<void> {
  const supplier = await supplierService.getSupplierById(req.params.id as string)
  if (!supplier) {
    res.status(404).json({ error: 'Supplier not found' })
    return
  }
  res.json(supplier)
}

export async function createSupplier(req: AuthRequest, res: Response): Promise<void> {
  const { name, cif, ...rest } = req.body

  if (!name || typeof name !== 'string' || name.trim() === '') {
    res.status(400).json({ error: 'name is required' })
    return
  }

  if (cif !== undefined && cif !== null && cif !== '') {
    if (!isValidCIF(cif)) {
      res.status(400).json({ error: 'Invalid CIF format' })
      return
    }
  }

  try {
    const supplier = await supplierService.createSupplier({ name: name.trim(), cif, ...rest })
    res.status(201).json(supplier)
  } catch (err: unknown) {
    const prismaErr = err as { code?: string }
    if (prismaErr?.code === 'P2002') {
      res.status(409).json({ error: 'A supplier with this CIF already exists' })
      return
    }
    res.status(500).json({ error: 'Failed to create supplier', detail: String(err) })
  }
}

export async function updateSupplier(req: AuthRequest, res: Response): Promise<void> {
  const { cif, ...rest } = req.body

  if (cif !== undefined && cif !== null && cif !== '') {
    if (!isValidCIF(cif)) {
      res.status(400).json({ error: 'Invalid CIF format' })
      return
    }
  }

  try {
    const supplier = await supplierService.updateSupplier(req.params.id as string, { cif, ...rest })
    res.json(supplier)
  } catch (err: unknown) {
    const prismaErr = err as { code?: string }
    if (prismaErr?.code === 'P2025') {
      res.status(404).json({ error: 'Supplier not found' })
      return
    }
    if (prismaErr?.code === 'P2002') {
      res.status(409).json({ error: 'A supplier with this CIF already exists' })
      return
    }
    res.status(500).json({ error: 'Failed to update supplier', detail: String(err) })
  }
}

export async function deleteSupplier(req: AuthRequest, res: Response): Promise<void> {
  if (req.user!.role !== 'OWNER') {
    res.status(403).json({ error: 'Forbidden' })
    return
  }
  try {
    await supplierService.deleteSupplier(req.params.id as string)
    res.status(204).send()
  } catch {
    res.status(404).json({ error: 'Supplier not found' })
  }
}
