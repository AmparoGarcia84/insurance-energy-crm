/**
 * prisma/seed.ts — Database seed script
 *
 * Creates the initial data needed to start using the CRM in development:
 *   - Two user accounts (OWNER + EMPLOYEE)
 *   - Demo clients and sales that populate the kanban board
 *
 * Run via `npx prisma db seed` (configured in package.json).
 *
 * Uses `upsert` for users (unique by email) so the script is idempotent.
 * Clients are upserted by NIF. Sales are only seeded when the table is empty
 * so running the script twice does not duplicate them.
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
  // ── Users ─────────────────────────────────────────────────────────────────
  const ownerHash    = await bcrypt.hash('owner1234', 10)
  const employeeHash = await bcrypt.hash('employee1234', 10)

  const mila = await prisma.user.upsert({
    where:  { email: 'mila@crm.com' },
    update: {},
    create: { email: 'mila@crm.com', passwordHash: ownerHash, role: 'OWNER', displayName: 'Mila' },
  })

  await prisma.user.upsert({
    where:  { email: 'asesor@crm.com' },
    update: {},
    create: { email: 'asesor@crm.com', passwordHash: employeeHash, role: 'EMPLOYEE', displayName: 'Asesor' },
  })

  // ── Demo clients ──────────────────────────────────────────────────────────
  // Upserted by NIF so re-running the script is safe.
  const [pedro, restaurante, ana, clinica, carlosRuiz, sofia, laura, barTerraza, centroMedico] =
    await Promise.all([
      prisma.client.upsert({ where: { nif: '12345678Z' }, update: {}, create: { name: 'Pedro Gómez',          nif: '12345678Z', type: 'INDIVIDUAL', status: 'ACTIVE' } }),
      prisma.client.upsert({ where: { nif: 'B12345679' }, update: {}, create: { name: 'Restaurante El Puerto', nif: 'B12345679', type: 'COMPANY',    status: 'ACTIVE' } }),
      prisma.client.upsert({ where: { nif: '11111111H' }, update: {}, create: { name: 'Ana Martínez',          nif: '11111111H', type: 'INDIVIDUAL', status: 'ACTIVE' } }),
      prisma.client.upsert({ where: { nif: 'B98765438' }, update: {}, create: { name: 'Clínica Dental Norte',  nif: 'B98765438', type: 'COMPANY',    status: 'ACTIVE' } }),
      prisma.client.upsert({ where: { nif: 'B87654328' }, update: {}, create: { name: 'Carlos Ruiz SA',        nif: 'B87654328', type: 'COMPANY',    status: 'ACTIVE' } }),
      prisma.client.upsert({ where: { nif: '22222222J' }, update: {}, create: { name: 'Sofía Torres',          nif: '22222222J', type: 'INDIVIDUAL', status: 'ACTIVE' } }),
      prisma.client.upsert({ where: { nif: '33333333P' }, update: {}, create: { name: 'Laura Fernández',       nif: '33333333P', type: 'INDIVIDUAL', status: 'ACTIVE' } }),
      prisma.client.upsert({ where: { nif: 'B1111111J' }, update: {}, create: { name: 'Bar La Terraza',        nif: 'B1111111J', type: 'COMPANY',    status: 'ACTIVE' } }),
      prisma.client.upsert({ where: { nif: 'B2222222J' }, update: {}, create: { name: 'Centro Médico Salus',   nif: 'B2222222J', type: 'COMPANY',    status: 'ACTIVE' } }),
    ])

  // ── Demo sales ────────────────────────────────────────────────────────────
  // Only seeded when the table is empty to avoid duplicates on re-runs.
  const salesCount = await prisma.sale.count()
  if (salesCount === 0) {
    await prisma.sale.createMany({
      data: [
        // Insurance
        { clientId: pedro.id,       clientName: 'Pedro Gómez',          ownerUserId: mila.id, ownerUserName: mila.displayName, type: 'INSURANCE', title: 'Vida - Pedro Gómez',              insuranceBranch: 'Vida',           expectedRevenue: 2100, insuranceStage: 'RESPONSE_PENDING',   nextStep: 'Seguimiento llamada' },
        { clientId: restaurante.id, clientName: 'Restaurante El Puerto', ownerUserId: mila.id, ownerUserName: mila.displayName, type: 'INSURANCE', title: 'RC Explotación - El Puerto',      insuranceBranch: 'RC Explotación', expectedRevenue: 1850, insuranceStage: 'RESPONSE_PENDING',   nextStep: 'Llamar mañana' },
        { clientId: ana.id,         clientName: 'Ana Martínez',          ownerUserId: mila.id, ownerUserName: mila.displayName, type: 'INSURANCE', title: 'Hogar - Ana Martínez',            insuranceBranch: 'Hogar',          expectedRevenue: 1200, insuranceStage: 'DOCUMENTS_PENDING',  nextStep: 'Solicitar DNI' },
        { clientId: clinica.id,     clientName: 'Clínica Dental Norte',  ownerUserId: mila.id, ownerUserName: mila.displayName, type: 'INSURANCE', title: 'Salud - Clínica Dental Norte',    insuranceBranch: 'Salud',          expectedRevenue: 2600, insuranceStage: 'DOCUMENTS_PENDING',  nextStep: 'Pendiente factura' },
        { clientId: carlosRuiz.id,  clientName: 'Carlos Ruiz SA',        ownerUserId: mila.id, ownerUserName: mila.displayName, type: 'INSURANCE', title: 'RC Empresa - Carlos Ruiz SA',     insuranceBranch: 'RC Empresa',     expectedRevenue: 3400, insuranceStage: 'SIGNATURE_PENDING',  nextStep: 'Enviar contrato' },
        { clientId: sofia.id,       clientName: 'Sofía Torres',          ownerUserId: mila.id, ownerUserName: mila.displayName, type: 'INSURANCE', title: 'Dental - Sofía Torres',           insuranceBranch: 'Dental',         expectedRevenue:  480, insuranceStage: 'ISSUANCE_PENDING',   nextStep: 'Esperar emisión' },
        { clientId: laura.id,       clientName: 'Laura Fernández',       ownerUserId: mila.id, ownerUserName: mila.displayName, type: 'INSURANCE', title: 'Hogar - Laura Fernández',         insuranceBranch: 'Hogar',          expectedRevenue:  850, insuranceStage: 'BILLING_THIS_MONTH', nextStep: 'Cobro pendiente confirmación' },
        // Energy
        { clientId: pedro.id,       clientName: 'Pedro Gómez',          ownerUserId: mila.id, ownerUserName: mila.displayName, type: 'ENERGY', title: 'Luz - Pedro Gómez',         companyName: 'Iberdrola', expectedSavingsPerYear: 3200, energyStage: 'RESPONSE_PENDING',   nextStep: 'Enviar estudio energético' },
        { clientId: barTerraza.id,  clientName: 'Bar La Terraza',        ownerUserId: mila.id, ownerUserName: mila.displayName, type: 'ENERGY', title: 'Gas + Luz - Bar La Terraza', companyName: 'Endesa',    expectedSavingsPerYear: 1800, energyStage: 'ACTIVATION_PENDING', nextStep: 'Seguimiento activación' },
        { clientId: centroMedico.id,clientName: 'Centro Médico Salus',   ownerUserId: mila.id, ownerUserName: mila.displayName, type: 'ENERGY', title: 'Luz - Centro Médico Salus',  companyName: 'Naturgy',   expectedSavingsPerYear: 5400, energyStage: 'BILLING_THIS_MONTH', nextStep: 'Verificar primera factura' },
      ],
    })
  }

  console.log('Seed completed')
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
