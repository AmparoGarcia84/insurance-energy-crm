import type { Task } from '@crm/shared'

export type { Task }
export { TaskStatus, TaskPriority, RelatedEntityType, ReminderChannel, ReminderRecurrence } from '@crm/shared'
import type { TaskStatus, TaskPriority, RelatedEntityType, ReminderChannel, ReminderRecurrence } from '@crm/shared'

/** Shape returned by the backend — includes denormalized relations */
export interface TaskWithRelations extends Task {
  assignedTo?:       { id: string; displayName: string; email: string } | null
  client?:           { id: string; name: string; clientNumber?: string | null } | null
  sale?:             { id: string; title: string } | null
  case?:             { id: string; title: string } | null
  supplier?:         { id: string; name: string } | null
  providerSupplier?: { id: string; name: string; cif?: string | null } | null
}

export interface TaskFilters {
  clientId?:          string
  supplierId?:        string
  status?:            TaskStatus
  assignedToUserId?:  string
  overdue?:           boolean
  hasReminder?:       boolean
  relatedEntityType?: RelatedEntityType
  relatedEntityId?:   string
}

export interface TaskPayload {
  subject:              string
  description?:         string
  status?:              TaskStatus
  priority?:            TaskPriority
  relatedEntityType?:   RelatedEntityType
  relatedEntityId?:     string
  dueDate?:             string | null
  assignedToUserId?:    string
  clientId?:            string
  saleId?:              string
  caseId?:              string
  supplierId?:           string
  providerSupplierId?:   string
  hasReminder?:          boolean
  reminderAt?:          string | null
  reminderChannel?:     ReminderChannel
  reminderRecurrence?:  ReminderRecurrence
}

const BASE = `${import.meta.env.VITE_API_URL ?? 'http://localhost:3000'}/tasks`

async function request<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(url, { credentials: 'include', ...options })
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  if (res.status === 204) return undefined as T
  return res.json()
}

export function getTasks(filters: TaskFilters = {}): Promise<TaskWithRelations[]> {
  const params = new URLSearchParams()
  if (filters.clientId)          params.set('clientId',          filters.clientId)
  if (filters.supplierId)        params.set('supplierId',        filters.supplierId)
  if (filters.status)            params.set('status',            filters.status)
  if (filters.assignedToUserId)  params.set('assignedToUserId',  filters.assignedToUserId)
  if (filters.overdue)           params.set('overdue',           'true')
  if (filters.hasReminder !== undefined) params.set('hasReminder', String(filters.hasReminder))
  if (filters.relatedEntityType) params.set('relatedEntityType', filters.relatedEntityType)
  if (filters.relatedEntityId)   params.set('relatedEntityId',   filters.relatedEntityId)

  const qs = params.toString()
  return request<TaskWithRelations[]>(qs ? `${BASE}?${qs}` : BASE)
}

export function createTask(data: TaskPayload): Promise<TaskWithRelations> {
  return request<TaskWithRelations>(BASE, {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify(data),
  })
}

export function updateTask(id: string, data: Partial<TaskPayload>): Promise<TaskWithRelations> {
  return request<TaskWithRelations>(`${BASE}/${id}`, {
    method:  'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify(data),
  })
}

export function deleteTask(id: string): Promise<void> {
  return request<void>(`${BASE}/${id}`, { method: 'DELETE' })
}
