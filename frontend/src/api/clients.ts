import {
  ClientType,
  ClientStatus,
  ClientQualification,
  CollectionManager,
  ClientAddress,
  ClientBankAccount,
  ClientAddressInput,
  ClientBankAccountInput,
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
}

const BASE = 'http://localhost:3000/clients'

export interface Client {
  id: string
  clientNumber?: string
  name: string
  nif?: string

  type: ClientType
  status: ClientStatus
  qualification?: ClientQualification
  activity?: string
  sector?: string
  collectionManager?: CollectionManager

  birthDate?: string
  drivingLicenseIssueDate?: string
  dniExpiryDate?: string

  mobilePhone?: string
  secondaryPhone?: string
  email?: string
  website?: string

  employees?: number
  annualRevenue?: number
  sicCode?: string

  accountOwnerUserId?: string
  commercialAgentUserId?: string

  contractsCounterpartyId?: string

  isMainClient?: boolean
  mainClientId?: string

  description?: string

  addresses?: ClientAddress[]
  bankAccounts?: ClientBankAccount[]

  createdAt: string
  updatedAt: string
}

export type ClientInput = Omit<Client, 'id' | 'createdAt' | 'updatedAt' | 'addresses' | 'bankAccounts'> & {
  addresses?: ClientAddressInput[]
  bankAccounts?: ClientBankAccountInput[]
}

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
