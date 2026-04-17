import prisma from '../db/prisma.js'
import { Prisma } from '../generated/prisma/client.js'
import type { DocumentGroup, DocumentType, DocumentStatus } from '../generated/prisma/enums.js'

export interface DocumentInput {
  name:                string
  group?:              DocumentGroup | null
  documentType:        DocumentType
  status?:             DocumentStatus
  includedAt?:         Date | string
  expiryDate?:         Date | string | null
  fileUrl?:            string | null
  clientId:            string
  saleId?:             string | null
  uploadedByUserId?:   string | null
}

const include = {
  client:     { select: { id: true, name: true, clientNumber: true } },
  sale:       { select: { id: true, title: true, type: true } },
  uploadedBy: { select: { id: true, displayName: true } },
} satisfies Prisma.DocumentInclude

const DATE_FIELDS = ['includedAt', 'expiryDate'] as const

function sanitize<T extends object>(data: T): T {
  return Object.fromEntries(
    Object.entries(data).map(([k, v]) => {
      if (v === '') return [k, undefined]
      if (DATE_FIELDS.includes(k as typeof DATE_FIELDS[number]) && typeof v === 'string') {
        return [k, new Date(v)]
      }
      return [k, v]
    })
  ) as T
}

export interface DocumentFilters {
  clientId?:     string
  saleId?:       string
  group?:        DocumentGroup
  documentType?: DocumentType
  status?:       DocumentStatus
}

function buildWhere(filters: DocumentFilters): Prisma.DocumentWhereInput {
  const where: Prisma.DocumentWhereInput = {}
  if (filters.clientId)     where.clientId     = filters.clientId
  if (filters.saleId)       where.saleId       = filters.saleId
  if (filters.group)        where.group        = filters.group
  if (filters.documentType) where.documentType = filters.documentType
  if (filters.status)       where.status       = filters.status
  return where
}

export function listDocuments(filters: DocumentFilters = {}) {
  return prisma.document.findMany({
    where:   buildWhere(filters),
    include,
    orderBy: { includedAt: 'desc' },
  })
}

export function getDocumentById(id: string) {
  return prisma.document.findUnique({ where: { id }, include })
}

export function createDocument(data: DocumentInput) {
  const createData = sanitize(data) as Prisma.DocumentUncheckedCreateInput
  return prisma.document.create({ data: createData, include })
}

export function updateDocument(id: string, data: Partial<DocumentInput>) {
  const updateData = sanitize(data) as Prisma.DocumentUncheckedUpdateInput
  return prisma.document.update({ where: { id }, data: updateData, include })
}

export function deleteDocument(id: string) {
  return prisma.document.delete({ where: { id } })
}
