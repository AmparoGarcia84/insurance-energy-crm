import prisma from '../db/prisma.js'
import type { ClientType, ClientStatus } from '../generated/prisma/enums.js'

// These enums will be importable from generated/prisma/enums.js after `prisma generate` runs
// with the updated schema (migration 2). Until then, defined as string unions matching the DB values.
type ClientQualification =
  | 'NEW_BUSINESS' | 'PORTFOLIO' | 'REFERRED_CLIENT' | 'BNI_REFERRAL'
  | 'MARKETING_SOCIAL_MEDIA' | 'MARKET_LOSS' | 'PROJECT_CANCELLED'
  | 'CANCELLED' | 'NOT_PROFITABLE' | 'PAYMENT_DEFAULT'

type CollectionManager =
  | 'INSURANCE_COMPANY' | 'BANK_TRANSFER' | 'BROKER' | 'CARD_PAYMENT' | 'UNPAID'

export interface ClientInput {
  // Identificación
  displayName: string
  clientNumber?: string
  legalName?: string
  taxId?: string

  // Clasificación
  type: ClientType
  status?: ClientStatus
  qualification?: ClientQualification
  activity?: string
  sector?: string
  collectionManager?: CollectionManager

  // Fechas / documentos
  birthDate?: Date | null
  drivingLicenseIssueDate?: Date | null
  dniExpiryDate?: Date | null

  // Contacto
  phone?: string
  mobilePhone?: string
  secondaryPhone?: string
  email?: string
  fax?: string
  website?: string

  // Dirección
  street?: string
  postalCode?: string
  city?: string
  province?: string
  country?: string

  // Facturación y empresa
  iban?: string
  employees?: number | null
  annualRevenue?: number | null

  // Jerarquía
  isMainClient?: boolean
  mainClientId?: string | null

  // Observaciones
  notes?: string
  description?: string
}

export function listClients() {
  return prisma.client.findMany({ orderBy: { displayName: 'asc' } })
}

export function getClientById(id: string) {
  return prisma.client.findUnique({ where: { id } })
}

export function createClient(data: ClientInput) {
  return prisma.client.create({ data })
}

export function updateClient(id: string, data: Partial<ClientInput>) {
  return prisma.client.update({ where: { id }, data })
}

export function deleteClient(id: string) {
  return prisma.client.delete({ where: { id } })
}
