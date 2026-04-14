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
import {
  parseCSV,
  col,
  parseDate,
  parseIBAN,
  mapType,
  mapStatus,
  mapQualification,
  mapCollectionManager,
  mapAddressType,
  C,
} from '../utils/csv-import.js'

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

/**
 * Find the first available 6-digit client number (000001–999999).
 * Numbers are strings with leading zeros. NULLs and gaps left by deleted clients are reused.
 */
async function generateClientNumber(): Promise<string> {
  const existing = await prisma.client.findMany({
    where: { clientNumber: { not: null } },
    select: { clientNumber: true },
    orderBy: { clientNumber: 'asc' },
  })
  const used = new Set(existing.map((c) => c.clientNumber as string))
  for (let i = 1; i <= 999999; i++) {
    const candidate = String(i).padStart(6, '0')
    if (!used.has(candidate)) return candidate
  }
  throw new Error('No available client numbers')
}

export interface ClientInput {
  // Identificación
  name: string
  nif?: string

  // Clasificación
  type?: ClientType
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
  accountOwnerName?: string
  commercialAgentUserId?: string
  commercialAgentName?: string

  // Jerarquía
  isMainClient?: boolean
  mainClientId?: string | null

  // Observaciones
  description?: string

  // Relaciones
  addresses?: ClientAddressInput[]
  bankAccounts?: ClientBankAccountInput[]
}

// Always include related addresses, bank accounts and main client info in every query result
const include = {
  addresses: true,
  bankAccounts: true,
  mainClient: { select: { id: true, name: true, clientNumber: true } },
} satisfies Prisma.ClientInclude

const DATE_FIELDS = ['birthDate', 'drivingLicenseIssueDate', 'dniExpiryDate'] as const

/**
 * Normalize raw form data before passing it to Prisma:
 * - Empty strings → undefined (avoids storing empty strings in optional fields)
 * - Date string fields → Date objects (Prisma DateTime requires a JS Date, not a string)
 */
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

export function findClientByNif(nif: string) {
  return prisma.client.findFirst({ where: { nif }, select: { id: true, name: true, nif: true } })
}

export async function createClient(data: ClientInput) {
  const { addresses, bankAccounts, ...rest } = data
  const clientNumber = await generateClientNumber()
  // ClientUncheckedCreateInput is used instead of ClientCreateInput so that
  // mainClientId can be passed as a plain string rather than a nested relation object
  const createData: Prisma.ClientUncheckedCreateInput = {
    ...(sanitize(rest) as Prisma.ClientUncheckedCreateInput),
    clientNumber,
    addresses:    addresses    ? { create: addresses }    : undefined,
    bankAccounts: bankAccounts ? { create: bankAccounts } : undefined,
  }
  return prisma.client.create({ data: createData, include })
}

export function updateClient(id: string, data: Partial<ClientInput>) {
  const { addresses, bankAccounts, ...rest } = data
  // Replace all addresses/bankAccounts on each update (deleteMany + create)
  // so the stored list always matches exactly what the form submitted
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

export interface ImportResult {
  created: number
  skipped: number
  errors: string[]
}

export async function importClientsFromCsv(csvText: string): Promise<ImportResult> {
  const rows = parseCSV(csvText)
  // Row 0 = header, Row 1 = Zoho label/template row — skip both
  const dataRows = rows.slice(2).filter(r => r.some(cell => cell.trim() !== ''))

  const existingNifs = await prisma.client.findMany({
    where: { nif: { not: null } },
    select: { nif: true },
  })
  const existingNifSet = new Set(existingNifs.map(c => c.nif!.toUpperCase()))

  const existingNumbers = new Set(
    (await prisma.client.findMany({
      where: { clientNumber: { not: null } },
      select: { clientNumber: true },
    })).map(c => c.clientNumber!)
  )

  let nextAuto = 1
  while (existingNumbers.has(String(nextAuto).padStart(6, '0'))) nextAuto++

  const idMap = new Map<string, string>()
  let created = 0
  let skipped = 0
  const errors: string[] = []

  for (const row of dataRows) {
    const oldId = col(row, C.ID)
    const name  = col(row, C.NAME)
    if (!name) {
      console.log('Skipping row because name is empty', row)
      skipped++; continue
    }

    const nifRaw = col(row, C.NIF).replace(/-/g, '')
    const nif = nifRaw || undefined

    if (nif && existingNifSet.has(nif.toUpperCase())) {
      console.log('Skipping row because NIF is already in use', row)
      skipped++
      continue
    }

    // clientNumber: use CSV value if non-zero, otherwise auto-generate
    const csvNum = col(row, C.CLIENT_NUMBER)
    let clientNumber: string
    if (csvNum && csvNum !== '0') {
      const padded = csvNum.padStart(6, '0')
      clientNumber = existingNumbers.has(padded)
        ? String(nextAuto++).padStart(6, '0')
        : padded
    } else {
      clientNumber = String(nextAuto++).padStart(6, '0')
    }
    existingNumbers.add(clientNumber)

    const addresses: { type: AddressType; street?: string; postalCode?: string; city?: string; province?: string; country?: string }[] = []

    const mainStreet = col(row, C.MAIN_STREET)
    const mainCity   = col(row, C.MAIN_CITY)
    const mainPostal = col(row, C.MAIN_POSTAL)
    if (mainStreet || mainCity || mainPostal) {
      addresses.push({
        type:       mapAddressType(col(row, C.ADDRESS_TYPE)),
        street:     mainStreet || undefined,
        postalCode: mainPostal || undefined,
        city:       mainCity   || undefined,
      })
    }

    const billStreet   = col(row, C.BILLING_STREET)
    const billCity     = col(row, C.BILLING_CITY)
    const billProvince = col(row, C.BILLING_PROVINCE)
    const billPostal   = col(row, C.BILLING_POSTAL)
    const billCountry  = col(row, C.BILLING_COUNTRY)
    if (billStreet || billCity || billPostal) {
      addresses.push({
        type:       'FISCAL',
        street:     billStreet   || undefined,
        postalCode: billPostal   || undefined,
        city:       billCity     || undefined,
        province:   billProvince || undefined,
        country:    billCountry  || undefined,
      })
    }

    const bankAccounts: { type: AccountType; iban: string }[] = []
    const iban = parseIBAN(col(row, C.IBAN))
    if (iban) bankAccounts.push({ type: 'PERSONAL', iban })

    const employees    = col(row, C.EMPLOYEES)    ? parseInt(col(row, C.EMPLOYEES), 10)    || undefined : undefined
    const annualRevenue = col(row, C.ANNUAL_REVENUE) ? parseFloat(col(row, C.ANNUAL_REVENUE)) || undefined : undefined

    try {
      const result = await prisma.client.create({
        data: {
          clientNumber,
          name,
          nif,
          type:                  mapType(col(row, C.TYPE)),
          status:                mapStatus(col(row, C.STATUS)),
          qualification:         mapQualification(col(row, C.QUALIFICATION)),
          collectionManager:     mapCollectionManager(col(row, C.COLLECTION_MANAGER)),
          activity:              col(row, C.ACTIVITY)    || undefined,
          sector:                col(row, C.SECTOR)      || undefined,
          accountOwnerUserId:    col(row, C.ACCOUNT_OWNER)    || undefined,
          commercialAgentUserId: col(row, C.COMMERCIAL_AGENT) || undefined,
          mobilePhone:           col(row, C.MOBILE_PHONE) || col(row, C.PHONE) || undefined,
          secondaryPhone:        col(row, C.SECONDARY_PHONE) || undefined,
          email:                 col(row, C.EMAIL)       || undefined,
          website:               col(row, C.WEBSITE)     || undefined,
          employees:             employees    ?? null,
          annualRevenue:         annualRevenue ?? null,
          sicCode:               col(row, C.SIC_CODE)    || undefined,
          birthDate:             parseDate(col(row, C.BIRTH_DATE)),
          drivingLicenseIssueDate: parseDate(col(row, C.DRIVING_LICENSE_DATE)),
          dniExpiryDate:         parseDate(col(row, C.DNI_EXPIRY)),
          description:           col(row, C.DESCRIPTION) || undefined,
          addresses:    addresses.length    > 0 ? { create: addresses }    : undefined,
          bankAccounts: bankAccounts.length > 0 ? { create: bankAccounts } : undefined,
        },
      })
      idMap.set(oldId, result.id)
      if (nif) existingNifSet.add(nif.toUpperCase())
      created++
    } catch (err) {
      errors.push(`"${name}" (NIF: ${nif ?? '—'}): ${(err as Error).message}`)
      console.log('Skipping row because of error', row)
      skipped++
    }
  }

  // Second pass: resolve mainClientId hierarchy
  for (const row of dataRows) {
    const oldId           = col(row, C.ID)
    const mainClientOldId = col(row, C.MAIN_CLIENT_OLD_ID)
    if (!mainClientOldId || mainClientOldId === oldId) continue

    const newId     = idMap.get(oldId)
    const mainNewId = idMap.get(mainClientOldId)
    if (!newId || !mainNewId) continue

    try {
      await prisma.client.update({ where: { id: newId }, data: { mainClientId: mainNewId } })
    } catch {
      // Non-critical — skip silently
    }
  }

  return { created, skipped, errors }
}
