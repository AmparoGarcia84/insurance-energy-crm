export type CaseStatus   = 'NEW' | 'ON_HOLD' | 'FORWARDED' | 'IN_PROGRESS' | 'CLOSED'
export type CasePriority = 'HIGH' | 'NORMAL' | 'LOW'
export type CaseType     =
  | 'CLAIM'            // Siniestro           (seguros)
  | 'FAULT'            // Avería              (energía)
  | 'ACTIVATION'       // Activación          (energía)
  | 'WRONG_SETTLEMENT' // Liquidación errónea (ambos)

const BASE = `${import.meta.env.VITE_API_URL ?? 'http://localhost:3000'}/cases`

export interface Case {
  id:           string
  clientId:     string
  client:       { id: string; name: string }
  saleId?:      string | null
  sale?:        { id: string; title: string } | null
  name:         string
  occurrenceAt?: string | null
  description?:  string | null
  cause?:        string | null
  type?:         CaseType | null
  status:        CaseStatus
  priority:      CasePriority
  supplierId?:   string | null
  supplier?:     { id: string; name: string } | null
  createdAt:     string
  updatedAt:     string
}

export interface CaseFilters {
  clientId?: string
  saleId?:   string
}

export interface CaseInput {
  clientId:     string
  saleId?:      string | null
  name:         string
  occurrenceAt?: string | null
  description?:  string | null
  cause?:        string | null
  type?:         CaseType | null
  status?:       CaseStatus
  priority?:     CasePriority
  supplierId?:   string | null
}

export async function getCases(filters: CaseFilters = {}): Promise<Case[]> {
  const params = new URLSearchParams()
  if (filters.clientId) params.set('clientId', filters.clientId)
  if (filters.saleId)   params.set('saleId',   filters.saleId)
  const qs = params.toString()
  const res = await fetch(qs ? `${BASE}?${qs}` : BASE, { credentials: 'include' })
  if (!res.ok) throw new Error('Failed to fetch cases')
  return res.json()
}

export async function createCase(data: CaseInput): Promise<Case> {
  const res = await fetch(BASE, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })
  if (!res.ok) throw new Error('Failed to create case')
  return res.json()
}

export async function updateCase(id: string, data: Partial<CaseInput>): Promise<Case> {
  const res = await fetch(`${BASE}/${id}`, {
    method: 'PUT',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })
  if (!res.ok) throw new Error('Failed to update case')
  return res.json()
}

export async function deleteCase(id: string): Promise<void> {
  const res = await fetch(`${BASE}/${id}`, { method: 'DELETE', credentials: 'include' })
  if (!res.ok) throw new Error('Failed to delete case')
}
