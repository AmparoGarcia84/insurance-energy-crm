const BASE = `${import.meta.env.VITE_API_URL ?? 'http://localhost:3000'}/documents`

// ── Enums ─────────────────────────────────────────────────────────────────────

export enum DocumentGroup {
  INSURANCE = 'INSURANCE',
  ENERGY    = 'ENERGY',
}

export enum DocumentType {
  INVOICE       = 'INVOICE',
  CONTRACT      = 'CONTRACT',
  PROJECT       = 'PROJECT',
  DOCUMENTATION = 'DOCUMENTATION',
  POLICY        = 'POLICY',
}

export enum DocumentStatus {
  PENDING_SIGNATURE = 'PENDING_SIGNATURE',
  EXPIRED           = 'EXPIRED',
  UPDATED           = 'UPDATED',
  UNDER_REVIEW      = 'UNDER_REVIEW',
}

// ── Types ─────────────────────────────────────────────────────────────────────

export interface DocumentRecord {
  id:               string
  name:             string
  group:            DocumentGroup | null
  documentType:     DocumentType
  status:           DocumentStatus
  includedAt:       string
  expiryDate:       string | null
  fileUrl:          string | null
  clientId:         string
  saleId:           string | null
  uploadedByUserId: string | null
  createdAt:        string
  updatedAt:        string
  client?:     { id: string; name: string; clientNumber: string | null } | null
  sale?:       { id: string; title: string; type: string } | null
  uploadedBy?: { id: string; displayName: string } | null
}

// ── API helpers ───────────────────────────────────────────────────────────────

async function request<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(url, { credentials: 'include', ...options })
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  if (res.status === 204) return undefined as T
  return res.json()
}

export function getDocuments(clientId?: string, saleId?: string): Promise<DocumentRecord[]> {
  const params = new URLSearchParams()
  if (clientId) params.set('clientId', clientId)
  if (saleId)   params.set('saleId',   saleId)
  const qs = params.toString()
  return request<DocumentRecord[]>(qs ? `${BASE}?${qs}` : BASE)
}

/** Sends the document with an optional PDF file using multipart/form-data. */
export function createDocument(data: FormData): Promise<DocumentRecord> {
  return request<DocumentRecord>(BASE, { method: 'POST', body: data })
}

export function updateDocument(id: string, data: FormData): Promise<DocumentRecord> {
  return request<DocumentRecord>(`${BASE}/${id}`, { method: 'PATCH', body: data })
}

export function deleteDocument(id: string): Promise<void> {
  return request<void>(`${BASE}/${id}`, { method: 'DELETE' })
}
