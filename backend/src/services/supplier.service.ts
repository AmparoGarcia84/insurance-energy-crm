import prisma from '../db/prisma.js'
import type { AddressType } from '../generated/prisma/enums.js'

export interface SupplierAddressInput {
  type: AddressType
  street?: string
  postalCode?: string
  city?: string
  province?: string
  country?: string
}

export interface SupplierEmailInput {
  address: string
  isPrimary: boolean
  label?: string
  labelColor?: string
}

export interface SupplierInput {
  name: string
  cif?: string
  phone?: string
  secondaryPhone?: string
  addresses?: SupplierAddressInput[]
  emails?: SupplierEmailInput[]
}

const supplierInclude = {
  addresses: true,
  emails: true,
} as const

export function listSuppliers() {
  return prisma.supplier.findMany({
    include: supplierInclude,
    orderBy: { name: 'asc' },
  })
}

export function getSupplierById(id: string) {
  return prisma.supplier.findUnique({
    where: { id },
    include: supplierInclude,
  })
}

export function createSupplier(data: SupplierInput) {
  const { addresses = [], emails = [], ...fields } = data
  return prisma.supplier.create({
    data: {
      ...fields,
      addresses: { create: addresses },
      emails:    { create: emails },
    },
    include: supplierInclude,
  })
}

export async function updateSupplier(id: string, data: Partial<SupplierInput>) {
  const { addresses, emails, ...fields } = data

  return prisma.$transaction(async (tx) => {
    // Replace addresses when provided
    if (addresses !== undefined) {
      await tx.supplierAddress.deleteMany({ where: { supplierId: id } })
      if (addresses.length > 0) {
        await tx.supplierAddress.createMany({
          data: addresses.map((a) => ({ ...a, supplierId: id })),
        })
      }
    }

    // Replace emails when provided
    if (emails !== undefined) {
      await tx.supplierEmail.deleteMany({ where: { supplierId: id } })
      if (emails.length > 0) {
        await tx.supplierEmail.createMany({
          data: emails.map((e) => ({ ...e, supplierId: id })),
        })
      }
    }

    return tx.supplier.update({
      where: { id },
      data: fields,
      include: supplierInclude,
    })
  })
}

export function deleteSupplier(id: string) {
  return prisma.supplier.delete({ where: { id } })
}
