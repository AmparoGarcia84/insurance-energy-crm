export type CaseStatus = 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED'

const BASE = `${import.meta.env.VITE_API_URL ?? 'http://localhost:3000'}/cases`

export interface Case {
  id: string
  clientId: string
  client: { id: string; name: string }
  title: string
  description?: string
  status: CaseStatus
  createdAt: string
  updatedAt: string
}

export interface CaseInput {
  clientId: string
  title: string
  description?: string
  status?: CaseStatus
}

export async function getCases(): Promise<Case[]> {
  const res = await fetch(BASE, { credentials: 'include' })
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
