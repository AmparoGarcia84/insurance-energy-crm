import prisma from '../db/prisma.js'
import type { ClientType, ClientStatus } from '../generated/prisma/enums.js'

// String unions matching DB enum values — will be importable from generated enums after prisma generate
type ClientQualification =
  | 'NEW_BUSINESS' | 'PORTFOLIO' | 'REFERRED_CLIENT' | 'BNI_REFERRAL'
  | 'MARKETING_SOCIAL_MEDIA' | 'MARKET_LOSS' | 'PROJECT_CANCELLED'
  | 'CANCELLED' | 'NOT_PROFITABLE' | 'PAYMENT_DEFAULT'

type CollectionManager =
  | 'INSURANCE_COMPANY' | 'BANK_TRANSFER' | 'BROKER' | 'CARD_PAYMENT' | 'UNPAID'

type AddressType = 'FISCAL' | 'BUSINESS' | 'PERSONAL'
type AccountType = 'PERSONAL' | 'BUSINESS'

interface ClientAddressInput {
  type: AddressType
  street?: string
  postalCode?: string
  city?: string
  province?: string
  country?: string
}

interface ClientBankAccountInput {
  type: AccountType
  iban: string
}

export interface ClientInput {
  // Identificación
  name: string
  clientNumber?: string
  nif?: string

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
  mobilePhone?: string
  secondaryPhone?: string
  email?: string
  website?: string

  // Empresa
  employees?: number | null
  annualRevenue?: number | null
  sicCode?: string

  // Gestión comercial
  accountOwnerUserId?: string
  commercialAgentUserId?: string

  // Integraciones
  contractsCounterpartyId?: string

  // Jerarquía
  isMainClient?: boolean
  mainClientId?: string | null

  // Observaciones
  description?: string

  // Relaciones
  addresses?: ClientAddressInput[]
  bankAccounts?: ClientBankAccountInput[]
}

// include and nested relation data use `as any` until `prisma generate` runs with the updated schema
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const include: any = { addresses: true, bankAccounts: true }

const DATE_FIELDS = ['birthDate', 'drivingLicenseIssueDate', 'dniExpiryDate'] as const

/** Convert empty strings to undefined and date strings to Date objects */
function sanitize<T extends Record<string, unknown>>(data: T): T {
  return Object.fromEntries(
    Object.entries(data).map(([k, v]) => {
      if (v === '') return [k, undefined]
      if (DATE_FIELDS.includes(k as typeof DATE_FIELDS[number]) && typeof v === 'string') {
        return [k, new Date(v)]
      }
      return [k, v]
    })
  ) as T
}

export function listClients() {
  return prisma.client.findMany({ orderBy: { name: 'asc' }, include })
}

export function getClientById(id: string) {
  return prisma.client.findUnique({ where: { id }, include })
}

export function createClient(data: ClientInput) {
  const { addresses, bankAccounts, ...rest } = data
  return prisma.client.create({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    data: {
      ...sanitize(rest),
      addresses:    addresses    ? { create: addresses }    : undefined,
      bankAccounts: bankAccounts ? { create: bankAccounts } : undefined,
    } as any,
    include,
  })
}

export function updateClient(id: string, data: Partial<ClientInput>) {
  const { addresses, bankAccounts, ...rest } = data
  return prisma.client.update({
    where: { id },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    data: {
      ...sanitize(rest),
      ...(addresses !== undefined && {
        addresses: { deleteMany: {}, create: addresses },
      }),
      ...(bankAccounts !== undefined && {
        bankAccounts: { deleteMany: {}, create: bankAccounts },
      }),
    } as any,
    include,
  })
}

export function deleteClient(id: string) {
  return prisma.client.delete({ where: { id } })
}
