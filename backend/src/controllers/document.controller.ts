import path from 'path'
import { fileURLToPath } from 'url'
import { Response } from 'express'
import multer from 'multer'
import { Prisma } from '../generated/prisma/client.js'
import { AuthRequest } from '../middleware/auth.js'
import * as documentService from '../services/document.service.js'
import type { DocumentFilters } from '../services/document.service.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

const storage = multer.diskStorage({
  destination: path.join(__dirname, '../../uploads/documents'),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname)
    const base = path.basename(file.originalname, ext).replace(/\s+/g, '-')
    cb(null, `${Date.now()}-${base}${ext}`)
  },
})

export const documentUpload = multer({
  storage,
  limits: { fileSize: 20 * 1024 * 1024 }, // 20 MB
  fileFilter: (_req, file, cb) => {
    if (file.mimetype !== 'application/pdf') {
      cb(new Error('Only PDF files are allowed'))
      return
    }
    cb(null, true)
  },
}).single('file')

// ── List ──────────────────────────────────────────────────────────────────────

export async function listDocuments(req: AuthRequest, res: Response): Promise<void> {
  const { clientId, saleId, group, documentType, status } = req.query as Record<string, string | undefined>

  const filters: DocumentFilters = {}
  if (clientId)     filters.clientId     = clientId
  if (saleId)       filters.saleId       = saleId
  if (group)        filters.group        = group        as DocumentFilters['group']
  if (documentType) filters.documentType = documentType as DocumentFilters['documentType']
  if (status)       filters.status       = status       as DocumentFilters['status']

  const documents = await documentService.listDocuments(filters)
  res.json(documents)
}

// ── Get ───────────────────────────────────────────────────────────────────────

export async function getDocument(req: AuthRequest, res: Response): Promise<void> {
  const doc = await documentService.getDocumentById(req.params.id as string)
  if (!doc) {
    res.status(404).json({ error: 'Document not found' })
    return
  }
  res.json(doc)
}

// ── Create ────────────────────────────────────────────────────────────────────

export async function createDocument(req: AuthRequest, res: Response): Promise<void> {
  const body = req.body
  const file = (req as any).file as Express.Multer.File | undefined

  if (!body.name || typeof body.name !== 'string' || !body.name.trim()) {
    res.status(400).json({ error: 'name is required' })
    return
  }
  if (!body.documentType) {
    res.status(400).json({ error: 'documentType is required' })
    return
  }
  if (!body.clientId) {
    res.status(400).json({ error: 'clientId is required' })
    return
  }

  const fileUrl = file ? `/uploads/documents/${file.filename}` : (body.fileUrl ?? null)

  try {
    const doc = await documentService.createDocument({
      ...body,
      fileUrl,
      uploadedByUserId: req.user!.userId,
    })
    res.status(201).json(doc)
  } catch (err: any) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2003') {
      res.status(422).json({ error: 'Foreign key constraint failed', detail: err.meta?.field_name })
      return
    }
    res.status(500).json({ error: 'Failed to create document', detail: String(err) })
  }
}

// ── Update ────────────────────────────────────────────────────────────────────

export async function updateDocument(req: AuthRequest, res: Response): Promise<void> {
  const body = req.body
  const file = (req as any).file as Express.Multer.File | undefined

  const data: Record<string, unknown> = { ...body }
  if (file) {
    data.fileUrl = `/uploads/documents/${file.filename}`
  }

  try {
    const doc = await documentService.updateDocument(req.params.id as string, data as any)
    res.json(doc)
  } catch (err: any) {
    if (err?.code === 'P2025') {
      res.status(404).json({ error: 'Document not found' })
      return
    }
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2003') {
      res.status(422).json({ error: 'Foreign key constraint failed', detail: err.meta?.field_name })
      return
    }
    res.status(500).json({ error: 'Failed to update document', detail: String(err) })
  }
}

// ── Delete ────────────────────────────────────────────────────────────────────

export async function deleteDocument(req: AuthRequest, res: Response): Promise<void> {
  if (req.user!.role !== 'OWNER') {
    res.status(403).json({ error: 'Forbidden' })
    return
  }
  try {
    await documentService.deleteDocument(req.params.id as string)
    res.status(204).send()
  } catch {
    res.status(404).json({ error: 'Document not found' })
  }
}
