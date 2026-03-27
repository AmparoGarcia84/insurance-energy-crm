import type { Sale } from '@crm/shared'
import { SaleType, InsuranceSaleStage, EnergySaleStage } from '@crm/shared'

export type { Sale }
export { SaleType, InsuranceSaleStage, EnergySaleStage }

export type SaleInput = Omit<Sale, 'id' | 'createdAt' | 'updatedAt'>

const BASE = 'http://localhost:3000/sales'

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

export const getSales   = ()                                        => request<Sale[]>(BASE)
export const createSale = (data: SaleInput)                        => request<Sale>(BASE, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) })
export const updateSale = (id: string, data: Partial<SaleInput>)  => request<Sale>(`${BASE}/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) })
export const deleteSale = (id: string)                             => request<void>(`${BASE}/${id}`, { method: 'DELETE' })
