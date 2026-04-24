import {
  ClientType,
  ClientStatus,
  ClientQualification,
  CollectionManager,
  ClientAddress,
  ClientBankAccount,
  ClientAddressInput,
  ClientBankAccountInput,
  ClientEmail,
  ClientEmailInput,
} from '@crm/shared'

export {
  ClientType,
  ClientStatus,
  ClientQualification,
  CollectionManager,
  type ClientAddress,
  type ClientBankAccount,
  type ClientAddressInput,
  type ClientBankAccountInput,
  type ClientEmail,
  type ClientEmailInput,
}

const BASE = `${import.meta.env.VITE_API_URL ?? 'http://localhost:3000'}/clients`

export interface Client {
  id: string
  clientNumber?: string
  name: string
  nif?: string

  type?: ClientType
  status?: ClientStatus
  qualification?: ClientQualification
  activity?: string
  sector?: string
  collectionManager?: CollectionManager

  birthDate?: string
  drivingLicenseIssueDate?: string
  dniExpiryDate?: string

  mobilePhone?: string
  secondaryPhone?: string
  website?: string

  employees?: number
  annualRevenue?: number
  sicCode?: string

  accountOwnerUserId?: string
  accountOwnerName?: string
  commercialAgentUserId?: string
  commercialAgentName?: string

  isMainClient?: boolean
  mainClientId?: string
  mainClient?: { id: string; name: string; clientNumber?: string }

  description?: string

  emails?: ClientEmail[]
  addresses?: ClientAddress[]
  bankAccounts?: ClientBankAccount[]

  createdAt: string
  updatedAt: string
}

export type ClientInput = Omit<Client, 'id' | 'clientNumber' | 'createdAt' | 'updatedAt' | 'addresses' | 'bankAccounts' | 'emails'> & {
  addresses?: ClientAddressInput[]
  bankAccounts?: ClientBankAccountInput[]
  emails?: ClientEmailInput[]
}

export class ApiError extends Error {
  constructor(
    public status: number,
    public code?: string,
    public payload?: unknown,
  ) {
    super(`HTTP ${status}`)
  }
}

async function request<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(url, { credentials: 'include', ...options })
  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    throw new ApiError(res.status, body?.error, body)
  }
  if (res.status === 204) return undefined as T
  return res.json()
}

export interface ImportResult {
  created: number
  skipped: number
  errors: string[]
}

export const getClients    = ()                                       => request<Client[]>(BASE)
export const getClient     = (id: string)                             => request<Client>(`${BASE}/${id}`)
export const createClient  = (data: ClientInput)                      => request<Client>(BASE, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) })
export const updateClient  = (id: string, data: Partial<ClientInput>) => request<Client>(`${BASE}/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) })
export const deleteClient  = (id: string)                             => request<void>(`${BASE}/${id}`, { method: 'DELETE' })
export const importClients = (csvText: string)                        => request<ImportResult>(`${BASE}/import`, { method: 'POST', headers: { 'Content-Type': 'text/plain; charset=utf-8' }, body: csvText })
