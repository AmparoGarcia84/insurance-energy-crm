import bcrypt from 'bcrypt'
import prisma from '../db/prisma'

export async function listUsers() {
  return prisma.user.findMany({
    select: { id: true, email: true, role: true, displayName: true, avatarUrl: true },
    orderBy: { displayName: 'asc' },
  })
}

export async function createUser(data: {
  displayName: string
  email: string
  role: 'OWNER' | 'EMPLOYEE'
  password: string
}) {
  const passwordHash = await bcrypt.hash(data.password, 10)
  return prisma.user.create({
    data: { displayName: data.displayName, email: data.email, role: data.role, passwordHash },
    select: { id: true, email: true, role: true, displayName: true, avatarUrl: true },
  })
}

export async function deleteUser(id: string) {
  await prisma.user.delete({ where: { id } })
}
