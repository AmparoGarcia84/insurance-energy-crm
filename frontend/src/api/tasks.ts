import type { Task, TaskStatus, TaskPriority } from '@crm/shared'

export type { Task, TaskStatus, TaskPriority }
export { TaskStatus, TaskPriority } from '@crm/shared'

/** Shape returned by the backend — includes denormalized relations */
export interface TaskWithRelations extends Task {
  assignedTo?: { id: string; displayName: string; email: string } | null
  client?:     { id: string; name: string; clientNumber?: string | null } | null
}

export interface TaskFilters {
  clientId?:  string
  status?:    TaskStatus
  assignedToUserId?: string
  overdue?:   boolean
  hasReminder?: boolean
}

const BASE = 'http://localhost:3000/tasks'

async function request<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(url, { credentials: 'include', ...options })
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  if (res.status === 204) return undefined as T
  return res.json()
}

export function getTasks(filters: TaskFilters = {}): Promise<TaskWithRelations[]> {
  const params = new URLSearchParams()
  if (filters.clientId)          params.set('clientId',          filters.clientId)
  if (filters.status)            params.set('status',            filters.status)
  if (filters.assignedToUserId)  params.set('assignedToUserId',  filters.assignedToUserId)
  if (filters.overdue)           params.set('overdue',           'true')
  if (filters.hasReminder !== undefined) params.set('hasReminder', String(filters.hasReminder))

  const qs = params.toString()
  return request<TaskWithRelations[]>(qs ? `${BASE}?${qs}` : BASE)
}
