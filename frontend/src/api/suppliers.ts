import type { SupplierAddress, SupplierEmail, SupplierAddressInput, SupplierEmailInput } from '@crm/shared'

export type { SupplierAddress, SupplierEmail, SupplierAddressInput, SupplierEmailInput }

const BASE = `${import.meta.env.VITE_API_URL ?? 'http://localhost:3000'}/suppliers`

export interface Supplier {
  id:             string
  name:           string
  cif?:           string
  phone?:         string
  secondaryPhone?: string
  createdAt:      string
  updatedAt:      string
  addresses?:     SupplierAddress[]
  emails?:        SupplierEmail[]
}

export interface SupplierInput {
  name:            string
  cif?:            string
  phone?:          string
  secondaryPhone?: string
  addresses?:      SupplierAddressInput[]
  emails?:         SupplierEmailInput[]
}

async function request<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(url, { credentials: 'include', ...options })
  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    throw Object.assign(new Error(body.error ?? `HTTP ${res.status}`), { status: res.status, body })
  }
  if (res.status === 204) return undefined as T
  return res.json()
}

export const getSuppliers  = ()                                               => request<Supplier[]>(BASE)
export const getSupplier   = (id: string)                                     => request<Supplier>(`${BASE}/${id}`)
export const createSupplier = (data: SupplierInput)                           => request<Supplier>(BASE, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) })
export const updateSupplier = (id: string, data: Partial<SupplierInput>)      => request<Supplier>(`${BASE}/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) })
export const deleteSupplier = (id: string)                                    => request<void>(`${BASE}/${id}`, { method: 'DELETE' })
