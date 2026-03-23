import {
  ClientType,
  ClientStatus,
  ClientQualification,
  CollectionManager,
} from '@crm/shared'

export { ClientType, ClientStatus, ClientQualification, CollectionManager }

const BASE = 'http://localhost:3000/clients'

export interface Client {
  id: string
  clientNumber?: string
  displayName: string
  legalName?: string
  taxId?: string

  type: ClientType
  status: ClientStatus
  qualification?: ClientQualification
  activity?: string
  sector?: string
  collectionManager?: CollectionManager

  birthDate?: string
  drivingLicenseIssueDate?: string
  dniExpiryDate?: string

  phone?: string
  mobilePhone?: string
  secondaryPhone?: string
  email?: string
  fax?: string
  website?: string

  street?: string
  postalCode?: string
  city?: string
  province?: string
  country?: string
  iban?: string
  employees?: number
  annualRevenue?: number

  isMainClient?: boolean
  mainClientId?: string

  notes?: string
  description?: string

  createdAt: string
  updatedAt: string
}

export type ClientInput = Omit<Client, 'id' | 'createdAt' | 'updatedAt'>

async function request<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(url, { credentials: 'include', ...options })
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  if (res.status === 204) return undefined as T
  return res.json()
}

export const getClients   = ()                                       => request<Client[]>(BASE)
export const getClient    = (id: string)                             => request<Client>(`${BASE}/${id}`)
export const createClient = (data: ClientInput)                      => request<Client>(BASE, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) })
export const updateClient = (id: string, data: Partial<ClientInput>) => request<Client>(`${BASE}/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) })
export const deleteClient = (id: string)                             => request<void>(`${BASE}/${id}`, { method: 'DELETE' })
