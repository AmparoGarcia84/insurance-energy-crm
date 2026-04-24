import type { Sale } from '@crm/shared'
import {
  SaleType,
  SaleBusinessType,
  SaleBusinessTypeLabels,
  SaleProjectSource,
  SaleProjectSourceLabels,
  SaleForecastCategory,
  SaleForecastCategoryLabels,
  InsuranceSaleStage,
  EnergySaleStage,
} from '@crm/shared'

export type { Sale }
export {
  SaleType,
  SaleBusinessType,
  SaleBusinessTypeLabels,
  SaleProjectSource,
  SaleProjectSourceLabels,
  SaleForecastCategory,
  SaleForecastCategoryLabels,
  InsuranceSaleStage,
  EnergySaleStage,
}

export type SaleInput = Omit<Sale, 'id' | 'createdAt' | 'updatedAt'>

/** Ordered list of insurance pipeline stages — single source of truth. */
export const INSURANCE_STAGES: InsuranceSaleStage[] = [
  InsuranceSaleStage.RESPONSE_PENDING,
  InsuranceSaleStage.DOCUMENTS_PENDING,
  InsuranceSaleStage.SIGNATURE_PENDING,
  InsuranceSaleStage.ISSUANCE_PENDING,
  InsuranceSaleStage.BILLING_THIS_MONTH,
  InsuranceSaleStage.BILLING_NEXT_MONTH,
  InsuranceSaleStage.RECURRENT_BILLING,
  InsuranceSaleStage.INVOICE_PENDING_PAYMENT,
  InsuranceSaleStage.WRONG_SETTLEMENT,
  InsuranceSaleStage.BILLED_AND_PAID,
  InsuranceSaleStage.CANCELED_UNPAID,
  InsuranceSaleStage.NOT_INSURABLE,
  InsuranceSaleStage.KO_SCORING,
  InsuranceSaleStage.LOST,
]

/** Ordered list of energy pipeline stages — single source of truth. */
export const ENERGY_STAGES: EnergySaleStage[] = [
  EnergySaleStage.RESPONSE_PENDING,
  EnergySaleStage.DOCUMENTS_PENDING,
  EnergySaleStage.SIGNATURE_PENDING,
  EnergySaleStage.ACTIVATION_PENDING,
  EnergySaleStage.BILLING_THIS_MONTH,
  EnergySaleStage.BILLED_AND_PAID,
  EnergySaleStage.LOST,
]

/** Kanban column colours per insurance stage — single source of truth. */
export const INSURANCE_STAGE_COLORS: Record<InsuranceSaleStage, string> = {
  [InsuranceSaleStage.RESPONSE_PENDING]:        '#d2b87a',
  [InsuranceSaleStage.DOCUMENTS_PENDING]:       '#f0a830',
  [InsuranceSaleStage.SIGNATURE_PENDING]:       '#e06820',
  [InsuranceSaleStage.ISSUANCE_PENDING]:        '#4080d0',
  [InsuranceSaleStage.BILLING_THIS_MONTH]:      '#30a060',
  [InsuranceSaleStage.BILLING_NEXT_MONTH]:      '#20a090',
  [InsuranceSaleStage.RECURRENT_BILLING]:       '#20a090',
  [InsuranceSaleStage.INVOICE_PENDING_PAYMENT]: '#7030c0',
  [InsuranceSaleStage.WRONG_SETTLEMENT]:        '#d04040',
  [InsuranceSaleStage.BILLED_AND_PAID]:         '#208040',
  [InsuranceSaleStage.CANCELED_UNPAID]:         '#c03030',
  [InsuranceSaleStage.NOT_INSURABLE]:           '#a02020',
  [InsuranceSaleStage.KO_SCORING]:              '#707070',
  [InsuranceSaleStage.LOST]:                    '#909090',
}

/** Kanban column colours per energy stage — single source of truth. */
export const ENERGY_STAGE_COLORS: Record<EnergySaleStage, string> = {
  [EnergySaleStage.RESPONSE_PENDING]:   '#d2b87a',
  [EnergySaleStage.DOCUMENTS_PENDING]:  '#f0a830',
  [EnergySaleStage.SIGNATURE_PENDING]:  '#e06820',
  [EnergySaleStage.ACTIVATION_PENDING]: '#4080d0',
  [EnergySaleStage.BILLING_THIS_MONTH]: '#30a060',
  [EnergySaleStage.BILLED_AND_PAID]:    '#208040',
  [EnergySaleStage.LOST]:               '#909090',
}

const BASE = `${import.meta.env.VITE_API_URL ?? 'http://localhost:3000'}/sales`

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

export const getSales   = (filters: { clientId?: string } = {})     => {
  const params = new URLSearchParams()
  if (filters.clientId) params.set('clientId', filters.clientId)
  const qs = params.toString()
  return request<Sale[]>(qs ? `${BASE}?${qs}` : BASE)
}
export const createSale = (data: SaleInput)                        => request<Sale>(BASE, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) })
export const updateSale = (id: string, data: Partial<SaleInput>)  => request<Sale>(`${BASE}/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) })
export const deleteSale = (id: string)                             => request<void>(`${BASE}/${id}`, { method: 'DELETE' })
