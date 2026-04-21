import type { Activity, ActivityDirection } from '@crm/shared'
import { ActivityType, ActivityDirection as ActivityDirectionEnum } from '@crm/shared'

export type { Activity, ActivityDirection }
export { ActivityType, ActivityDirection } from '@crm/shared'

/** User-facing interaction types (excludes system event types from ActivityType) */
export const CLIENT_ACTIVITY_TYPES = [
  ActivityType.CALL,
  ActivityType.EMAIL,
  ActivityType.WHATSAPP_NOTE,
  ActivityType.MEETING,
] as const

export interface ActivityWithRelations extends Activity {
  user?: { id: string; displayName: string } | null
}

export interface ActivityFilters {
  clientId?: string
  saleId?:   string
  type?:     ActivityType
}

export interface ActivityPayload {
  clientId:    string
  saleId?:     string
  type:        ActivityType
  direction?:  ActivityDirectionEnum
  subject:     string
  description?: string
  outcome?:    string
  nextStep?:   string
  activityAt:  string
}

const BASE = `${import.meta.env.VITE_API_URL ?? 'http://localhost:3000'}/activities`

async function request<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(url, { credentials: 'include', ...options })
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  if (res.status === 204) return undefined as T
  return res.json()
}

export function getActivities(filters: ActivityFilters = {}): Promise<ActivityWithRelations[]> {
  const params = new URLSearchParams()
  if (filters.clientId) params.set('clientId', filters.clientId)
  if (filters.saleId)   params.set('saleId',   filters.saleId)
  if (filters.type)     params.set('type',      filters.type)
  const qs = params.toString()
  return request<ActivityWithRelations[]>(qs ? `${BASE}?${qs}` : BASE)
}

export function createActivity(data: ActivityPayload): Promise<ActivityWithRelations> {
  return request<ActivityWithRelations>(BASE, {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify(data),
  })
}

export function updateActivity(id: string, data: Partial<Omit<ActivityPayload, 'clientId'>>): Promise<ActivityWithRelations> {
  return request<ActivityWithRelations>(`${BASE}/${id}`, {
    method:  'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify(data),
  })
}

export function deleteActivity(id: string): Promise<void> {
  return request<void>(`${BASE}/${id}`, { method: 'DELETE' })
}
