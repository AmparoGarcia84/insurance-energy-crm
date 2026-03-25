import prisma from '../db/prisma.js'
import { Prisma } from '../generated/prisma/client.js'
import type {
  ClientType,
  ClientStatus,
  ClientQualification,
  CollectionManager,
  AddressType,
  AccountType,
} from '../generated/prisma/enums.js'

export interface ClientAddressInput {
  type: AddressType
  street?: string
  postalCode?: string
  city?: string
  province?: string
  country?: string
}

export interface ClientBankAccountInput {
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

const include = { addresses: true, bankAccounts: true } satisfies Prisma.ClientInclude

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
  const createData: Prisma.ClientUncheckedCreateInput = {
    ...(sanitize(rest) as Prisma.ClientUncheckedCreateInput),
    addresses:    addresses    ? { create: addresses }    : undefined,
    bankAccounts: bankAccounts ? { create: bankAccounts } : undefined,
  }
  return prisma.client.create({ data: createData, include })
}

export function updateClient(id: string, data: Partial<ClientInput>) {
  const { addresses, bankAccounts, ...rest } = data
  const updateData: Prisma.ClientUncheckedUpdateInput = {
    ...(sanitize(rest) as Prisma.ClientUncheckedUpdateInput),
    ...(addresses !== undefined && {
      addresses: { deleteMany: {}, create: addresses },
    }),
    ...(bankAccounts !== undefined && {
      bankAccounts: { deleteMany: {}, create: bankAccounts },
    }),
  }
  return prisma.client.update({ where: { id }, data: updateData, include })
}

export function deleteClient(id: string) {
  return prisma.client.delete({ where: { id } })
}
