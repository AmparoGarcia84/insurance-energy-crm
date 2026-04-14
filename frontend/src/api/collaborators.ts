const BASE = `${import.meta.env.VITE_API_URL ?? 'http://localhost:3000'}/collaborators`

export interface Collaborator {
  id: string
  name: string
  phone: string
  createdAt: string
  updatedAt: string
}

export type CollaboratorInput = Pick<Collaborator, 'name' | 'phone'>

export class ApiError extends Error {
  constructor(public status: number) {
    super(`HTTP ${status}`)
  }
}

async function request<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(url, { credentials: 'include', ...options })
  if (!res.ok) {
    await res.json().catch(() => ({}))
    throw new ApiError(res.status)
  }
  if (res.status === 204) return undefined as T
  return res.json()
}

export const getCollaborators   = ()                                             => request<Collaborator[]>(BASE)
export const createCollaborator = (data: CollaboratorInput)                      => request<Collaborator>(BASE, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) })
export const updateCollaborator = (id: string, data: Partial<CollaboratorInput>) => request<Collaborator>(`${BASE}/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) })
export const deleteCollaborator = (id: string)                                   => request<void>(`${BASE}/${id}`, { method: 'DELETE' })
