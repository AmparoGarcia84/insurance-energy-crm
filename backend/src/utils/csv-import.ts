/**
 * csv-import.ts — Pure CSV parsing and Zoho CRM field mapping utilities.
 * Used by both the db_provision/import-clients.ts script and the API endpoint.
 */
import type {
  ClientType,
  ClientStatus,
  ClientQualification,
  CollectionManager,
  AddressType,
} from '../generated/prisma/enums.js'

// ─── CSV parser ──────────────────────────────────────────────────────────────

export function parseCSV(content: string): string[][] {
  const rows: string[][] = []
  let row: string[] = []
  let field = ''
  let inQuotes = false
  let i = 0

  while (i < content.length) {
    const ch = content[i]
    const next = content[i + 1]

    if (inQuotes) {
      if (ch === '"' && next === '"') { field += '"'; i += 2; continue }
      if (ch === '"') { inQuotes = false; i++; continue }
      field += ch; i++; continue
    }

    if (ch === '"') { inQuotes = true; i++; continue }

    if (ch === ',') { row.push(field); field = ''; i++; continue }

    if (ch === '\r' && next === '\n') {
      row.push(field); rows.push(row); row = []; field = ''; i += 2; continue
    }

    if (ch === '\n') {
      row.push(field); rows.push(row); row = []; field = ''; i++; continue
    }

    field += ch; i++
  }

  if (field || row.length > 0) { row.push(field); rows.push(row) }

  return rows
}

export function col(row: string[], index: number): string {
  return (row[index] ?? '').trim().normalize('NFC')
}

export function parseDate(value: string): Date | null {
  if (!value || value === '0000-00-00' || value === '9999-01-01') return null
  const d = new Date(value)
  return isNaN(d.getTime()) ? null : d
}

const IBAN_REGEX = /^[A-Z]{2}\d{2}[A-Z0-9]{1,30}$/

export function parseIBAN(value: string): string | null {
  const clean = value.replace(/\s+/g, '').toUpperCase()
  return IBAN_REGEX.test(clean) ? clean : null
}

// ─── Enum mappings ────────────────────────────────────────────────────────────

export function mapType(value: string): ClientType {
  const map: Record<string, ClientType> = {
    'Particular':  'INDIVIDUAL',
    'Empresa':     'COMPANY',
    'Autónomo':    'SELF_EMPLOYED',
    'Autonomo':    'SELF_EMPLOYED',
    'Pensionista': 'PENSIONER',
    'Jubilad@':    'RETIRED',
    'Jubilado':    'RETIRED',
    'Colaborador': 'COLLABORATOR',
    'Proveedor':   'SUPPLIER',
    'Posible':     'PROSPECT',
    'CCPP':        'COMMUNITY_OF_OWNERS',
  }
  return map[value] ?? 'INDIVIDUAL'
}

export function mapStatus(value: string): ClientStatus {
  const v = value.toLowerCase()
  if (v === 'vigor' || v === 'activo' || v === 'active')          return 'ACTIVE'
  if (v === 'prospect' || v === 'posible')                        return 'PROSPECTING'
  if (v === 'baja' || v === 'inactive')                           return 'INACTIVE'
  if (v === 'captación' || v === 'captacion' || v === 'lead')     return 'LEAD'
  if (v === 'perdido' || v === 'lost')                            return 'LOST'
  return 'LEAD'
}

export function mapQualification(value: string): ClientQualification | undefined {
  const map: Record<string, ClientQualification> = {
    'Referencias BNI':          'BNI_REFERRAL',
    'Cartera':                  'PORTFOLIO',
    'Nuevo negocio':            'NEW_BUSINESS',
    'Cliente referenciado':     'REFERRED_CLIENT',
    'Anulado':                  'CANCELLED',
    'Anulacion':                'CANCELLED',
    'Marketing Redes sociales': 'MARKETING_SOCIAL_MEDIA',
    'Pérdida mercado':          'MARKET_LOSS',
    'Perdida mercado':          'MARKET_LOSS',
    'Proyecto cancelado':       'PROJECT_CANCELLED',
    'Impago':                   'PAYMENT_DEFAULT',
    'No rentable':              'NOT_PROFITABLE',
  }
  return map[value]
}

export function mapCollectionManager(value: string): CollectionManager | undefined {
  const v = value.toLowerCase()
  if (v.includes('compañ') || v.includes('compan')) return 'INSURANCE_COMPANY'
  if (v.includes('transferencia') || v.includes('bank')) return 'BANK_TRANSFER'
  if (v.includes('gexbrok') || v.includes('broker'))    return 'BROKER'
  if (v.includes('tarjeta') || v.includes('card'))      return 'CARD_PAYMENT'
  if (v.includes('impago') || v.includes('unpaid'))     return 'UNPAID'
  return undefined
}

export function mapAddressType(value: string): AddressType {
  const v = value.toLowerCase()
  if (v.includes('fiscal'))                                    return 'FISCAL'
  if (v.includes('empresa') || v.includes('negocio') || v.includes('business')) return 'BUSINESS'
  return 'PERSONAL'
}

// ─── Column indices (0-based) ─────────────────────────────────────────────────

export const C = {
  ID:                   0,
  QUALIFICATION:        3,
  NAME:                 4,
  PHONE:                5,
  MAIN_CLIENT_OLD_ID:   7,
  WEBSITE:              9,
  TYPE:                 10,
  ACCOUNT_OWNER:        11,
  SECTOR:               12,
  EMPLOYEES:            13,
  ANNUAL_REVENUE:       14,
  SIC_CODE:             15,
  BILLING_STREET:       23,
  BILLING_CITY:         24,
  BILLING_PROVINCE:     25,
  BILLING_POSTAL:       26,
  BILLING_COUNTRY:      27,
  DESCRIPTION:          28,
  CLIENT_NUMBER:        29,
  IBAN:                 35,
  NIF:                  36,
  ALT_ADDRESS_STREET:   37,
  STATUS:               38,
  ADDRESS_TYPE:         39,
  SECONDARY_PHONE:      40,
  MOBILE_PHONE:         41,
  EMAIL:                42,
  ACTIVITY:             43,
  MAIN_STREET:          44,
  MAIN_CITY:            45,
  COMMERCIAL_AGENT:     46,
  COLLECTION_MANAGER:   48,
  MAIN_POSTAL:          49,
  BIRTH_DATE:           53,
  DRIVING_LICENSE_DATE: 54,
  DNI_EXPIRY:           55,
}
