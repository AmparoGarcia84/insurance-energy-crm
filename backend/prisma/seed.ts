/**
 * prisma/seed.ts — Database seed script
 *
 * Creates the initial user accounts needed to start using the CRM.
 * Run via `npx prisma db seed` (configured in package.json).
 *
 * Uses `upsert` instead of `create` so the script is idempotent — running it
 * multiple times will not duplicate records or fail with unique-constraint errors.
 * The `update: {}` clause means existing users are left untouched if they already
 * exist, which is safe after the first run.
 *
 * IMPORTANT: The plain-text passwords here are for development only.
 * Production credentials must be changed and should never live in source control.
 */
import 'dotenv/config'
import bcrypt from 'bcrypt'
import { PrismaPg } from '@prisma/adapter-pg'
import { PrismaClient } from '../src/generated/prisma/client.js'

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! })
const prisma = new PrismaClient({ adapter })

async function main() {
  // Hash the passwords with bcrypt (cost factor 10) before storing — never
  // save plain-text passwords in the database
  const ownerHash = await bcrypt.hash('owner1234', 10)
  const employeeHash = await bcrypt.hash('employee1234', 10)

  // Mila — the business owner, has full access including destructive operations
  await prisma.user.upsert({
    where: { email: 'mila@crm.com' },
    update: {},   // no-op if user already exists
    create: {
      email: 'mila@crm.com',
      passwordHash: ownerHash,
      role: 'OWNER',
      displayName: 'Mila',
    },
  })

  // Asesor — a sales advisor, read/write access but no delete permissions
  await prisma.user.upsert({
    where: { email: 'asesor@crm.com' },
    update: {},   // no-op if user already exists
    create: {
      email: 'asesor@crm.com',
      passwordHash: employeeHash,
      role: 'EMPLOYEE',
      displayName: 'Asesor',
    },
  })

  console.log('Seed completed')
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
