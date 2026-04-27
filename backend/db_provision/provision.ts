/**
 * db_provision/provision.ts — Full demo data provisioning script
 *
 * Populates all tables with realistic demo data for an insurance & energy brokerage.
 * Safe to run multiple times (idempotent via upsert / skip-if-exists logic).
 *
 * Usage:  npm run provision
 * Docker: executed automatically on container startup after prisma migrate deploy
 */
import 'dotenv/config'
import bcrypt from 'bcrypt'
import { PrismaPg } from '@prisma/adapter-pg'
import {
  EnergySaleStage, InsuranceSaleStage, PrismaClient,
  SaleBusinessType, SaleForecastCategory, SaleProjectSource, SaleType,
  TaskStatus, TaskPriority, TaskContextType,
  ReminderChannel, ReminderRecurrence,
  DocumentGroup, DocumentType, DocumentStatus,
  ActivityType, ActivityDirection,
} from '../src/generated/prisma/client.js'

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! })
const prisma = new PrismaClient({ adapter })

async function main() {
  console.log('Starting database provisioning...')

  // ─── Users ────────────────────────────────────────────────────────────────
  const ownerHash    = await bcrypt.hash('owner1234', 10)
  const employeeHash = await bcrypt.hash('employee1234', 10)

  const mila = await prisma.user.upsert({
    where:  { email: 'mila@crm.com' },
    update: {},
    create: { email: 'mila@crm.com', passwordHash: ownerHash,    role: 'OWNER',    displayName: 'Mila' },
  })

  const asesor = await prisma.user.upsert({
    where:  { email: 'asesor@crm.com' },
    update: {},
    create: { email: 'asesor@crm.com', passwordHash: employeeHash, role: 'EMPLOYEE', displayName: 'Nuria' },
  })

  console.log('  ✓ Users')

  // ─── Clients ──────────────────────────────────────────────────────────────
  // Skip provisioning data if clients already exist
  const existingClients = await prisma.client.count()
  if (existingClients > 0) {
    console.log('  ℹ Data already provisioned — skipping.')
    return
  }

  const clients = await prisma.client.createManyAndReturn({
    data: [
      // Individuals — ACTIVE
      { clientNumber: '000001', type: 'INDIVIDUAL', status: 'ACTIVE', name: 'Carmen López Martínez',    nif: '12345678A', mobilePhone: '612 345 678' },
      { clientNumber: '000002', type: 'INDIVIDUAL', status: 'ACTIVE', name: 'Francisco Ruiz Sánchez',   nif: '87654321B', mobilePhone: '623 456 789' },
      { clientNumber: '000003', type: 'INDIVIDUAL', status: 'ACTIVE', name: 'Elena Moreno Fernández',   nif: '11223344C', mobilePhone: '634 567 890' },
      { clientNumber: '000004', type: 'INDIVIDUAL', status: 'ACTIVE', name: 'Antonio García Pérez',     nif: '44332211D', mobilePhone: '645 678 901' },
      { clientNumber: '000005', type: 'INDIVIDUAL', status: 'ACTIVE', name: 'Lucía Hernández Jiménez',  nif: '55667788E', mobilePhone: '656 789 012' },
      // Individuals — LEAD
      { clientNumber: '000006', type: 'INDIVIDUAL', status: 'LEAD',   name: 'Roberto Díaz Torres',      mobilePhone: '667 890 123' },
      { clientNumber: '000007', type: 'INDIVIDUAL', status: 'LEAD',   name: 'María Sanz Romero',        mobilePhone: '678 901 234' },
      // Individuals — INACTIVE / LOST
      { clientNumber: '000008', type: 'INDIVIDUAL', status: 'INACTIVE', name: 'Pablo Navarro Gil',      nif: '99887766F', mobilePhone: '689 012 345' },
      { clientNumber: '000009', type: 'INDIVIDUAL', status: 'LOST',   name: 'Sara Muñoz Delgado',       mobilePhone: '690 123 456' },
      // Businesses — ACTIVE
      { clientNumber: '000010', type: 'BUSINESS', status: 'ACTIVE',   name: 'Talleres Rápidos S.L.',    nif: 'B12345678', mobilePhone: '91 234 56 78' },
      { clientNumber: '000011', type: 'BUSINESS', status: 'ACTIVE',   name: 'Restaurante El Patio',     nif: 'B87654321', mobilePhone: '95 678 12 34' },
      { clientNumber: '000012', type: 'BUSINESS', status: 'ACTIVE',   name: 'Clínica DentalCare',       nif: 'B11223344', mobilePhone: '93 456 78 90' },
      { clientNumber: '000013', type: 'BUSINESS', status: 'LEAD',     name: 'Academia Lingua',          nif: 'J44332211', mobilePhone: '96 789 01 23' },
      { clientNumber: '000014', type: 'BUSINESS', status: 'INACTIVE', name: 'Construcciones Vega',      nif: 'A55667788', mobilePhone: '91 890 12 34' },
    ],
  })

  console.log(`  ✓ Clients (${clients.length})`)

  // Helper: find client by name
  const c = (name: string) => clients.find(cl => cl.name === name)!

  // ─── Client emails ─────────────────────────────────────────────────────────
  await prisma.clientEmail.createMany({
    data: [
      { clientId: c('Carmen López Martínez').id,   address: 'carmen.lopez@gmail.com',           isPrimary: true },
      { clientId: c('Francisco Ruiz Sánchez').id,  address: 'fran.ruiz@hotmail.com',            isPrimary: true },
      { clientId: c('Elena Moreno Fernández').id,  address: 'elena.moreno@gmail.com',           isPrimary: true },
      { clientId: c('Antonio García Pérez').id,    address: 'antonio.garcia@outlook.com',       isPrimary: true },
      { clientId: c('Lucía Hernández Jiménez').id, address: 'lucia.hdz@gmail.com',              isPrimary: true },
      { clientId: c('Roberto Díaz Torres').id,     address: 'roberto.diaz@gmail.com',           isPrimary: true },
      { clientId: c('María Sanz Romero').id,       address: 'maria.sanz@icloud.com',            isPrimary: true },
      { clientId: c('Pablo Navarro Gil').id,       address: 'pablo.navarro@gmail.com',          isPrimary: true },
      { clientId: c('Sara Muñoz Delgado').id,      address: 'sara.munoz@gmail.com',             isPrimary: true },
      { clientId: c('Talleres Rápidos S.L.').id,   address: 'info@talleresrapidos.es',          isPrimary: true },
      { clientId: c('Restaurante El Patio').id,    address: 'reservas@restauranteelpatio.com',  isPrimary: true },
      { clientId: c('Clínica DentalCare').id,      address: 'admin@dentalcare.es',              isPrimary: true },
      { clientId: c('Academia Lingua').id,         address: 'info@academia-lingua.es',          isPrimary: true },
    ],
  })

  console.log('  ✓ Client emails (13)')

  // ─── Sales ────────────────────────────────────────────────────────────────
  const sales = await prisma.sale.createManyAndReturn({
    data: [
      {
        clientId: c('Carmen López Martínez').id,
        clientName: 'Carmen López Martínez',
        type: SaleType.INSURANCE,
        businessType: SaleBusinessType.NEW_BUSINESS,
        title: 'Seguro de hogar multirriesgo',
        companyName: 'Mapfre',
        insuranceBranch: 'Hogar',
        insuranceStage: InsuranceSaleStage.DOCUMENTS_PENDING,
        amount: 420,
        expectedRevenue: 420,
        probabilityPercent: 70,
        forecastCategory: SaleForecastCategory.BEST_CASE,
        expectedCloseDate: new Date('2026-04-30'),
        projectSource: SaleProjectSource.EMPLOYEE_REFERRAL,
        ownerUserId: mila.id,
        ownerUserName: 'Mila',
        contactName: 'Carmen López Martínez',
        nextStep: 'Solicitar documentación al cliente',
      },
      {
        clientId: c('Carmen López Martínez').id,
        clientName: 'Carmen López Martínez',
        type: SaleType.ENERGY,
        businessType: SaleBusinessType.NEW_BUSINESS,
        title: 'Estudio contrato energía eléctrica',
        companyName: 'Iberdrola',
        energyStage: EnergySaleStage.DOCUMENTS_PENDING,
        amount: null,
        expectedSavingsPerYear: 180,
        probabilityPercent: 60,
        forecastCategory: SaleForecastCategory.CHANNEL,
        expectedCloseDate: new Date('2026-05-15'),
        projectSource: SaleProjectSource.COLD_CALL,
        ownerUserId: mila.id,
        ownerUserName: 'Mila',
        contactName: 'Carmen López Martínez',
        nextStep: 'Recibir últimas facturas para análisis',
      },
      {
        clientId: c('Francisco Ruiz Sánchez').id,
        clientName: 'Francisco Ruiz Sánchez',
        type: SaleType.INSURANCE,
        businessType: SaleBusinessType.EXISTING_BUSINESS,
        title: 'Seguro de vida riesgo',
        companyName: 'Allianz',
        insuranceBranch: 'Vida',
        insuranceStage: InsuranceSaleStage.INVOICE_PENDING_PAYMENT,
        amount: 380,
        expectedRevenue: 380,
        probabilityPercent: 90,
        forecastCategory: SaleForecastCategory.CONFIRMED,
        expectedCloseDate: new Date('2026-04-10'),
        issueDate: new Date('2026-03-20'),
        billingDate: new Date('2026-04-01'),
        projectSource: SaleProjectSource.NONE,
        ownerUserId: mila.id,
        ownerUserName: 'Mila',
        contactName: 'Francisco Ruiz Sánchez',
        policyNumber: 'VID-2026-00101',
        nextStep: 'Confirmar cobro del recibo',
      },
      {
        clientId: c('Francisco Ruiz Sánchez').id,
        clientName: 'Francisco Ruiz Sánchez',
        type: SaleType.INSURANCE,
        businessType: SaleBusinessType.EXISTING_BUSINESS,
        title: 'Ampliación póliza accidentes',
        companyName: 'AXA',
        insuranceBranch: 'Accidentes',
        insuranceStage: InsuranceSaleStage.RECURRENT_BILLING,
        amount: 150,
        expectedRevenue: 150,
        probabilityPercent: 100,
        forecastCategory: SaleForecastCategory.CONFIRMED,
        issueDate: new Date('2024-01-01'),
        billingDate: new Date('2026-01-01'),
        projectSource: SaleProjectSource.NONE,
        ownerUserId: mila.id,
        ownerUserName: 'Mila',
        contactName: 'Francisco Ruiz Sánchez',
        policyNumber: 'ACC-2024-00210',
      },
      {
        clientId: c('Elena Moreno Fernández').id,
        clientName: 'Elena Moreno Fernández',
        type: SaleType.INSURANCE,
        businessType: SaleBusinessType.EXISTING_BUSINESS,
        title: 'Seguro de salud familiar',
        companyName: 'Sanitas',
        insuranceBranch: 'Salud',
        insuranceStage: InsuranceSaleStage.BILLED_AND_PAID,
        amount: 1200,
        expectedRevenue: 1200,
        probabilityPercent: 100,
        forecastCategory: SaleForecastCategory.CONFIRMED,
        issueDate: new Date('2021-06-01'),
        billingDate: new Date('2026-06-01'),
        projectSource: SaleProjectSource.EXTERNAL_REFERRAL,
        ownerUserId: mila.id,
        ownerUserName: 'Mila',
        contactName: 'Elena Moreno Fernández',
        policyNumber: 'SAL-2021-01234',
        description: 'Cubre a 4 beneficiarios. Renovación anual.',
      },
      {
        clientId: c('Antonio García Pérez').id,
        clientName: 'Antonio García Pérez',
        type: SaleType.INSURANCE,
        businessType: SaleBusinessType.EXISTING_BUSINESS,
        title: 'Seguro de coche turismo',
        companyName: 'Generali',
        insuranceBranch: 'Automóvil',
        insuranceStage: InsuranceSaleStage.INVOICE_PENDING_PAYMENT,
        amount: 650,
        expectedRevenue: 650,
        probabilityPercent: 85,
        forecastCategory: SaleForecastCategory.BEST_CASE,
        expectedCloseDate: new Date('2026-04-20'),
        issueDate: new Date('2026-03-25'),
        billingDate: new Date('2026-04-01'),
        projectSource: SaleProjectSource.NONE,
        ownerUserId: mila.id,
        ownerUserName: 'Mila',
        contactName: 'Antonio García Pérez',
        policyNumber: 'AUT-2026-04567',
        nextStep: 'Verificar cobro del recibo domiciliado',
        description: 'Renovación anual. Vehículo: VW Golf 2020.',
      },
      {
        clientId: c('Antonio García Pérez').id,
        clientName: 'Antonio García Pérez',
        type: SaleType.ENERGY,
        businessType: SaleBusinessType.NEW_BUSINESS,
        title: 'Cambio de compañía eléctrica',
        companyName: 'Endesa',
        energyStage: EnergySaleStage.ACTIVATION_PENDING,
        amount: null,
        expectedSavingsPerYear: 220,
        probabilityPercent: 75,
        forecastCategory: SaleForecastCategory.BEST_CASE,
        expectedCloseDate: new Date('2026-05-01'),
        projectSource: SaleProjectSource.COLD_CALL,
        ownerUserId: mila.id,
        ownerUserName: 'Mila',
        contactName: 'Antonio García Pérez',
        nextStep: 'Confirmar activación con distribuidora',
      },
      {
        clientId: c('Lucía Hernández Jiménez').id,
        clientName: 'Lucía Hernández Jiménez',
        type: SaleType.INSURANCE,
        businessType: SaleBusinessType.NEW_BUSINESS,
        title: 'Seguro responsabilidad civil',
        companyName: 'Zurich',
        insuranceBranch: 'Responsabilidad Civil',
        insuranceStage: InsuranceSaleStage.DOCUMENTS_PENDING,
        amount: 280,
        expectedRevenue: 280,
        probabilityPercent: 65,
        forecastCategory: SaleForecastCategory.CHANNEL,
        expectedCloseDate: new Date('2026-05-10'),
        projectSource: SaleProjectSource.EMPLOYEE_REFERRAL,
        ownerUserId: mila.id,
        ownerUserName: 'Mila',
        contactName: 'Lucía Hernández Jiménez',
        nextStep: 'Recoger documentación profesional',
      },
      {
        clientId: c('Roberto Díaz Torres').id,
        clientName: 'Roberto Díaz Torres',
        type: SaleType.INSURANCE,
        businessType: SaleBusinessType.NEW_BUSINESS,
        title: 'Presupuesto seguro hogar',
        companyName: 'Mutua Madrileña',
        insuranceBranch: 'Hogar',
        insuranceStage: InsuranceSaleStage.RESPONSE_PENDING,
        amount: null,
        expectedRevenue: 380,
        probabilityPercent: 40,
        forecastCategory: SaleForecastCategory.CHANNEL,
        expectedCloseDate: new Date('2026-05-31'),
        projectSource: SaleProjectSource.WEB_RESEARCH,
        ownerUserId: mila.id,
        ownerUserName: 'Mila',
        contactName: 'Roberto Díaz Torres',
        nextStep: 'Enviar comparativa de presupuestos',
      },
      {
        clientId: c('María Sanz Romero').id,
        clientName: 'María Sanz Romero',
        type: SaleType.INSURANCE,
        businessType: SaleBusinessType.NEW_BUSINESS,
        title: 'Consulta seguro de salud',
        companyName: 'Adeslas',
        insuranceBranch: 'Salud',
        insuranceStage: InsuranceSaleStage.RESPONSE_PENDING,
        amount: null,
        expectedRevenue: 600,
        probabilityPercent: 35,
        forecastCategory: SaleForecastCategory.CHANNEL,
        expectedCloseDate: new Date('2026-06-15'),
        projectSource: SaleProjectSource.ONLINE_STORE,
        ownerUserId: mila.id,
        ownerUserName: 'Mila',
        contactName: 'María Sanz Romero',
        nextStep: 'Llamar para hacer estudio de necesidades',
      },
      {
        clientId: c('Pablo Navarro Gil').id,
        clientName: 'Pablo Navarro Gil',
        type: SaleType.INSURANCE,
        businessType: SaleBusinessType.EXISTING_BUSINESS,
        title: 'Renovación seguro de vida',
        companyName: 'Allianz',
        insuranceBranch: 'Vida',
        insuranceStage: InsuranceSaleStage.BILLING_NEXT_MONTH,
        amount: 320,
        expectedRevenue: 320,
        probabilityPercent: 80,
        forecastCategory: SaleForecastCategory.BEST_CASE,
        expectedCloseDate: new Date('2026-05-01'),
        billingDate: new Date('2026-05-01'),
        projectSource: SaleProjectSource.NONE,
        ownerUserId: mila.id,
        ownerUserName: 'Mila',
        contactName: 'Pablo Navarro Gil',
        policyNumber: 'VID-2026-00456',
        nextStep: 'Confirmar datos bancarios actualizados',
      },
      {
        clientId: c('Sara Muñoz Delgado').id,
        clientName: 'Sara Muñoz Delgado',
        type: SaleType.INSURANCE,
        businessType: SaleBusinessType.NEW_BUSINESS,
        title: 'Seguro dental',
        companyName: 'Asisa',
        insuranceBranch: 'Dental',
        insuranceStage: InsuranceSaleStage.BILLING_THIS_MONTH,
        amount: 200,
        expectedRevenue: 200,
        probabilityPercent: 90,
        forecastCategory: SaleForecastCategory.CONFIRMED,
        expectedCloseDate: new Date('2026-04-15'),
        billingDate: new Date('2026-04-15'),
        projectSource: SaleProjectSource.EXTERNAL_REFERRAL,
        ownerUserId: mila.id,
        ownerUserName: 'Mila',
        contactName: 'Sara Muñoz Delgado',
        nextStep: 'Emitir recibo del primer mes',
      },
      {
        clientId: c('Talleres Rápidos S.L.').id,
        clientName: 'Talleres Rápidos S.L.',
        type: SaleType.INSURANCE,
        businessType: SaleBusinessType.EXISTING_BUSINESS,
        title: 'Seguro multirriesgo industrial',
        companyName: 'Mapfre',
        insuranceBranch: 'Multirriesgo Empresa',
        insuranceStage: InsuranceSaleStage.CANCELED_UNPAID,
        amount: 2400,
        expectedRevenue: 2400,
        probabilityPercent: 0,
        forecastCategory: SaleForecastCategory.CHANNEL,
        issueDate: new Date('2022-07-01'),
        projectSource: SaleProjectSource.NONE,
        ownerUserId: mila.id,
        ownerUserName: 'Mila',
        contactName: 'Talleres Rápidos S.L.',
        policyNumber: 'IND-2022-00321',
        lostReason: 'Cancelada por impago de 3 recibos consecutivos',
        description: 'Cubre continente, contenido y RC patronal',
      },
      {
        clientId: c('Talleres Rápidos S.L.').id,
        clientName: 'Talleres Rápidos S.L.',
        type: SaleType.ENERGY,
        businessType: SaleBusinessType.EXISTING_BUSINESS,
        title: 'Contrato suministro gas natural',
        companyName: 'Repsol',
        energyStage: EnergySaleStage.BILLED_AND_PAID,
        amount: null,
        expectedSavingsPerYear: 400,
        probabilityPercent: 100,
        forecastCategory: SaleForecastCategory.CONFIRMED,
        issueDate: new Date('2021-03-01'),
        billingDate: new Date('2026-03-01'),
        projectSource: SaleProjectSource.NONE,
        ownerUserId: mila.id,
        ownerUserName: 'Mila',
        contactName: 'Talleres Rápidos S.L.',
        contractId: 'GAS-ES4200200567891234KL',
        description: 'Gas natural industrial. Tarifa 3.0TD.',
      },
      {
        clientId: c('Restaurante El Patio').id,
        clientName: 'Restaurante El Patio',
        type: SaleType.INSURANCE,
        businessType: SaleBusinessType.NEW_BUSINESS,
        title: 'Seguro multirriesgo hostelería',
        companyName: 'Helvetia',
        insuranceBranch: 'Multirriesgo Empresa',
        insuranceStage: InsuranceSaleStage.SIGNATURE_PENDING,
        amount: 1800,
        expectedRevenue: 1800,
        probabilityPercent: 80,
        forecastCategory: SaleForecastCategory.BEST_CASE,
        expectedCloseDate: new Date('2026-04-25'),
        projectSource: SaleProjectSource.PARTNER,
        ownerUserId: mila.id,
        ownerUserName: 'Mila',
        contactName: 'Restaurante El Patio',
        nextStep: 'Enviar propuesta para firma digital',
        description: 'Cubre local, contenido, rotura de cristales y RC explotación',
      },
      {
        clientId: c('Restaurante El Patio').id,
        clientName: 'Restaurante El Patio',
        type: SaleType.ENERGY,
        businessType: SaleBusinessType.EXISTING_BUSINESS,
        title: 'Optimización contrato eléctrico',
        companyName: 'Naturgy',
        energyStage: EnergySaleStage.BILLING_THIS_MONTH,
        amount: null,
        expectedSavingsPerYear: 650,
        probabilityPercent: 95,
        forecastCategory: SaleForecastCategory.CONFIRMED,
        billingDate: new Date('2026-04-01'),
        projectSource: SaleProjectSource.NONE,
        ownerUserId: mila.id,
        ownerUserName: 'Mila',
        contactName: 'Restaurante El Patio',
        contractId: 'ELEC-ES0021000099988877MN',
        description: '2.0TD — 11,5 kW. Tarifa PYME hostelería optimizada',
      },
      {
        clientId: c('Clínica DentalCare').id,
        clientName: 'Clínica DentalCare',
        type: SaleType.INSURANCE,
        businessType: SaleBusinessType.EXISTING_BUSINESS,
        title: 'Seguro responsabilidad civil sanitaria',
        companyName: 'Asisa',
        insuranceBranch: 'Responsabilidad Civil',
        insuranceStage: InsuranceSaleStage.KO_SCORING,
        amount: 3200,
        expectedRevenue: 3200,
        probabilityPercent: 10,
        forecastCategory: SaleForecastCategory.CHANNEL,
        expectedCloseDate: new Date('2026-05-30'),
        projectSource: SaleProjectSource.NONE,
        ownerUserId: mila.id,
        ownerUserName: 'Mila',
        contactName: 'Clínica DentalCare',
        policyNumber: 'RCS-2021-00900',
        lostReason: 'KO en scoring por siniestralidad histórica elevada',
        nextStep: 'Buscar aseguradora alternativa',
        description: 'Incluye RC del centro y de 3 profesionales',
      },
      {
        clientId: c('Academia Lingua').id,
        clientName: 'Academia Lingua',
        type: SaleType.INSURANCE,
        businessType: SaleBusinessType.NEW_BUSINESS,
        title: 'Seguro multirriesgo oficinas',
        companyName: 'AXA',
        insuranceBranch: 'Multirriesgo Empresa',
        insuranceStage: InsuranceSaleStage.LOST,
        amount: 900,
        expectedRevenue: 900,
        probabilityPercent: 0,
        forecastCategory: SaleForecastCategory.CHANNEL,
        expectedCloseDate: new Date('2026-03-01'),
        projectSource: SaleProjectSource.COLD_CALL,
        ownerUserId: mila.id,
        ownerUserName: 'Mila',
        contactName: 'Academia Lingua',
        lostReason: 'Cliente contrató con otra correduría',
      },
      {
        clientId: c('Construcciones Vega').id,
        clientName: 'Construcciones Vega',
        type: SaleType.INSURANCE,
        businessType: SaleBusinessType.NEW_BUSINESS,
        title: 'Seguro obras y construcción',
        companyName: 'Caser',
        insuranceBranch: 'Construcción',
        insuranceStage: InsuranceSaleStage.WRONG_SETTLEMENT,
        amount: 5500,
        expectedRevenue: 5500,
        probabilityPercent: 50,
        forecastCategory: SaleForecastCategory.BEST_CASE,
        expectedCloseDate: new Date('2026-04-30'),
        issueDate: new Date('2026-02-15'),
        projectSource: SaleProjectSource.PARTNER,
        ownerUserId: mila.id,
        ownerUserName: 'Mila',
        contactName: 'Construcciones Vega',
        nextStep: 'Revisar liquidación con Caser y corregir errores',
        description: 'Póliza de RC y todo riesgo construcción para obra en Getafe',
      },
    ],
  })

  // Helper: find sale by title
  const s = (title: string) => sales.find(sl => sl.title === title)!

  console.log('  ✓ Sales')

  // ─── Policies ─────────────────────────────────────────────────────────────
  await prisma.policy.createMany({
    data: [
      {
        clientId: c('Carmen López Martínez').id,
        policyNumber: 'HOG-2023-00145', insurer: 'Mapfre', product: 'Hogar Multirriesgo',
        status: 'ACTIVE', startDate: new Date('2023-09-01'), endDate: new Date('2024-09-01'), premium: 420,
      },
      {
        clientId: c('Francisco Ruiz Sánchez').id,
        policyNumber: 'VID-2022-00832', insurer: 'Allianz', product: 'Vida Riesgo',
        status: 'ACTIVE', startDate: new Date('2022-03-15'), endDate: new Date('2032-03-15'), premium: 380,
        notes: 'Capital asegurado: 150.000 €',
      },
      {
        clientId: c('Francisco Ruiz Sánchez').id,
        policyNumber: 'ACC-2023-00210', insurer: 'AXA', product: 'Accidentes Personal',
        status: 'PENDING', startDate: new Date('2024-01-01'), premium: 150,
      },
      {
        clientId: c('Elena Moreno Fernández').id,
        policyNumber: 'SAL-2021-01234', insurer: 'Sanitas', product: 'Salud Familiar',
        status: 'ACTIVE', startDate: new Date('2021-06-01'), endDate: new Date('2025-06-01'), premium: 1200,
        notes: 'Cubre a 4 beneficiarios',
      },
      {
        clientId: c('Antonio García Pérez').id,
        policyNumber: 'AUT-2023-04567', insurer: 'Generali', product: 'Automóvil Todo Riesgo',
        status: 'ACTIVE', startDate: new Date('2023-11-20'), endDate: new Date('2024-11-20'), premium: 650,
        notes: 'Vehículo: Volkswagen Golf 2020, matrícula 1234-BCF',
      },
      {
        clientId: c('Antonio García Pérez').id,
        policyNumber: 'AUT-2020-01100', insurer: 'Mutua Madrileña', product: 'Automóvil Terceros',
        status: 'EXPIRED', startDate: new Date('2020-01-01'), endDate: new Date('2022-01-01'), premium: 480,
      },
      {
        clientId: c('Lucía Hernández Jiménez').id,
        policyNumber: 'RC-2024-00089', insurer: 'Zurich', product: 'Responsabilidad Civil General',
        status: 'PENDING', startDate: new Date('2024-02-01'), premium: 280,
      },
      {
        clientId: c('Pablo Navarro Gil').id,
        policyNumber: 'VID-2019-00456', insurer: 'Allianz', product: 'Vida Riesgo',
        status: 'CANCELLED', startDate: new Date('2019-05-01'), endDate: new Date('2023-05-01'), premium: 320,
        notes: 'Cancelada por impago',
      },
      {
        clientId: c('Talleres Rápidos S.L.').id,
        policyNumber: 'IND-2022-00321', insurer: 'Mapfre', product: 'Multirriesgo Industrial',
        status: 'ACTIVE', startDate: new Date('2022-07-01'), endDate: new Date('2025-07-01'), premium: 2400,
        notes: 'Cubre continente, contenido y RC patronal',
      },
      {
        clientId: c('Restaurante El Patio').id,
        policyNumber: 'COM-2023-00567', insurer: 'Helvetia', product: 'Multirriesgo Hostelería',
        status: 'ACTIVE', startDate: new Date('2023-04-01'), endDate: new Date('2025-04-01'), premium: 1800,
      },
      {
        clientId: c('Clínica DentalCare').id,
        policyNumber: 'RCS-2021-00900', insurer: 'Asisa', product: 'RC Sanitaria',
        status: 'ACTIVE', startDate: new Date('2021-01-01'), endDate: new Date('2026-01-01'), premium: 3200,
        notes: 'Incluye RC del centro y de 3 profesionales',
      },
    ],
  })

  console.log('  ✓ Policies')

  // ─── Energy Contracts ─────────────────────────────────────────────────────
  await prisma.energyContract.createMany({
    data: [
      {
        clientId: c('Antonio García Pérez').id,
        supplier: 'Iberdrola', cups: 'ES0021000012345678AB', status: 'ACTIVE',
        startDate: new Date('2023-06-01'),
        notes: '2.0TD — 3,45 kW potencia contratada',
      },
      {
        clientId: c('Carmen López Martínez').id,
        supplier: 'Endesa', cups: 'ES0031000098765432CD', status: 'PENDING',
        startDate: new Date('2024-02-01'),
        notes: 'Pendiente de activación por cambio de comercializadora',
      },
      {
        clientId: c('Elena Moreno Fernández').id,
        supplier: 'Naturgy', cups: 'ES0021000055544433EF', status: 'ACTIVE',
        startDate: new Date('2022-10-01'),
      },
      {
        clientId: c('Elena Moreno Fernández').id,
        supplier: 'Naturgy', cups: 'ES4200100101234567GH', status: 'ACTIVE',
        startDate: new Date('2022-10-01'),
        notes: 'Suministro gas natural — tarifa doméstica',
      },
      {
        clientId: c('Talleres Rápidos S.L.').id,
        supplier: 'Repsol', cups: 'ES0021000011122233IJ', status: 'ACTIVE',
        startDate: new Date('2021-03-01'),
        notes: '3.0TD — 45 kW. Incluye discriminación horaria',
      },
      {
        clientId: c('Talleres Rápidos S.L.').id,
        supplier: 'Endesa', cups: 'ES4200200567891234KL', status: 'ACTIVE',
        startDate: new Date('2021-03-01'),
        notes: 'Gas natural industrial',
      },
      {
        clientId: c('Restaurante El Patio').id,
        supplier: 'Naturgy', cups: 'ES0021000099988877MN', status: 'ACTIVE',
        startDate: new Date('2023-04-01'),
        notes: '2.0TD — 11,5 kW. Tarifa PYME hostelería',
      },
      {
        clientId: c('Pablo Navarro Gil').id,
        supplier: 'Iberdrola', cups: 'ES0031000066655544OP', status: 'CANCELLED',
        startDate: new Date('2020-01-01'), endDate: new Date('2023-01-01'),
        notes: 'Rescindido por impago',
      },
      {
        clientId: c('Academia Lingua').id,
        supplier: 'EDP', cups: 'ES0021000033322211QR', status: 'PENDING',
        startDate: new Date('2024-03-01'),
        notes: 'Gestión de cambio en curso',
      },
    ],
  })

  console.log('  ✓ Energy Contracts')

  // ─── Cases ────────────────────────────────────────────────────────────────
  // clientId is required. saleId is optional; when provided, clientId must match.
  const caseRecords = await prisma.case.createManyAndReturn({
    data: [
      {
        saleId:      s('Seguro de hogar multirriesgo').id,
        clientId:    c('Carmen López Martínez').id,
        name:        'Siniestro agua en vivienda',
        occurrenceAt: new Date('2024-03-08T07:30:00Z'),
        description: 'Rotura de tubería en baño principal. Daños en suelo y pared. Expediente abierto con Mapfre nº SIN-2024-00123.',
        cause:       'Envejecimiento de la instalación de fontanería',
        type:        'CLAIM',
        status:      'IN_PROGRESS',
        priority:    'HIGH',
      },
      {
        saleId:      s('Seguro de coche turismo').id,
        clientId:    c('Antonio García Pérez').id,
        name:        'Accidente de tráfico — reclamación a tercero',
        occurrenceAt: new Date('2024-03-17T16:45:00Z'),
        description: 'Colisión por alcance en autovía A-3. El tercero reconoce culpa. Pendiente de peritación del vehículo.',
        cause:       'Distracción del conductor del vehículo contrario',
        type:        'CLAIM',
        status:      'IN_PROGRESS',
        priority:    'HIGH',
      },
      {
        saleId:      s('Seguro de coche turismo').id,
        clientId:    c('Antonio García Pérez').id,
        name:        'Consulta cambio de vehículo asegurado',
        description: 'El cliente quiere traspasar la póliza al nuevo vehículo pendiente de compra.',
        type:        'CLAIM',
        status:      'NEW',
        priority:    'NORMAL',
      },
      {
        saleId:      s('Seguro de salud familiar').id,
        clientId:    c('Elena Moreno Fernández').id,
        name:        'Reclamación denegación cobertura Sanitas',
        occurrenceAt: new Date('2024-03-22T10:00:00Z'),
        description: 'Sanitas deniega intervención de rodilla por preexistencia. Se requiere informe médico para recurso.',
        cause:       'Preexistencia no declarada en el momento de la contratación',
        type:        'CLAIM',
        status:      'ON_HOLD',
        priority:    'HIGH',
      },
      {
        saleId:      s('Seguro multirriesgo industrial').id,
        clientId:    c('Talleres Rápidos S.L.').id,
        name:        'Siniestro robo en instalaciones',
        occurrenceAt: new Date('2024-02-18T03:00:00Z'),
        description: 'Robo de herramienta y maquinaria durante fin de semana. Denuncia presentada. Perito visitará el lunes.',
        cause:       'Ausencia de sistema de alarma conectado en la zona de almacén',
        type:        'CLAIM',
        status:      'IN_PROGRESS',
        priority:    'HIGH',
      },
      {
        clientId:    c('Talleres Rápidos S.L.').id,
        name:        'Liquidación errónea — factura enero Repsol',
        occurrenceAt: new Date('2024-02-04T00:00:00Z'),
        description: 'Factura de enero con consumo anormalmente alto. Solicitada revisión a Repsol.',
        cause:       'Error en la lectura del contador por parte del distribuidor',
        type:        'WRONG_SETTLEMENT',
        status:      'FORWARDED',
        priority:    'NORMAL',
      },
      {
        saleId:      s('Seguro multirriesgo hostelería').id,
        clientId:    c('Restaurante El Patio').id,
        name:        'Actualización valor continente tras reforma',
        description: 'Tras reforma del local, el cliente solicita revisar el valor asegurado del continente.',
        type:        'ACTIVATION',
        status:      'NEW',
        priority:    'LOW',
      },
      {
        clientId:    c('Francisco Ruiz Sánchez').id,
        name:        'Revisión anual póliza de vida',
        description: 'Revisión periódica de cobertura y actualización de beneficiarios.',
        type:        'CLAIM',
        status:      'CLOSED',
        priority:    'LOW',
      },
      {
        clientId:    c('Pablo Navarro Gil').id,
        name:        'Gestión baja por impago',
        occurrenceAt: new Date('2023-11-01T00:00:00Z'),
        description: 'Póliza cancelada tras 3 recibos devueltos. Se comunica al cliente y se cierra el expediente.',
        cause:       'Impago reiterado de recibos',
        type:        'CLAIM',
        status:      'CLOSED',
        priority:    'NORMAL',
      },
      {
        saleId:      s('Seguro responsabilidad civil sanitaria').id,
        clientId:    c('Clínica DentalCare').id,
        name:        'Ampliación RC a nuevo profesional',
        description: 'Incorporación de nueva dentista al equipo. Pendiente de comunicar datos a Asisa para incluirla en póliza.',
        type:        'ACTIVATION',
        status:      'ON_HOLD',
        priority:    'NORMAL',
      },
    ],
  })

  // Helper: find case by name
  const ca = (name: string) => caseRecords.find(cr => cr.name === name)!

  console.log('  ✓ Cases')

  // ─── Tasks ────────────────────────────────────────────────────────────────
  // Hierarchy rules (applied by the service at runtime; here we set all FKs directly):
  //   caseId set   → saleId + clientId derived from case
  //   saleId set   → clientId derived from sale
  //   clientId only → pure client-level task
  await prisma.task.createMany({
    data: [
      // ── Mila (OWNER) ──────────────────────────────────────────────────────

      // 1 — siniestro agua Carmen López (linked to case)
      {
        subject:           'Gestionar expediente siniestro agua — Carmen López',
        description:       'Coordinar con Mapfre la visita del perito y recopilar fotos de los daños del cliente.',
        status:            TaskStatus.IN_PROGRESS,
        priority:          TaskPriority.HIGH,
        contextType:       TaskContextType.CONTACT,
        caseId:            ca('Siniestro agua en vivienda').id,
        saleId:            s('Seguro de hogar multirriesgo').id,
        clientId:          c('Carmen López Martínez').id,
        dueDate:           new Date('2026-04-17'),
        assignedToUserId:  mila.id,
        hasReminder:       true,
        reminderAt:        new Date('2026-04-17T09:00:00'),
        reminderChannel:   ReminderChannel.IN_APP,
        reminderRecurrence: ReminderRecurrence.NONE,
      },
      // 2 — enviar documentación seguro hogar Carmen López (linked to sale)
      {
        subject:           'Solicitar documentación seguro hogar — Carmen López',
        description:       'Pedir DNI, escrituras y último recibo de contribución para completar la solicitud de Mapfre.',
        status:            TaskStatus.NOT_STARTED,
        priority:          TaskPriority.NORMAL,
        contextType:       TaskContextType.CONTACT,
        saleId:            s('Seguro de hogar multirriesgo').id,
        clientId:          c('Carmen López Martínez').id,
        dueDate:           new Date('2026-04-22'),
        assignedToUserId:  mila.id,
        hasReminder:       false,
      },
      // 3 — comparativa hogar Roberto Díaz (linked to sale)
      {
        subject:           'Enviar comparativa seguros de hogar — Roberto Díaz',
        description:       'Preparar comparativa Mutua Madrileña vs Mapfre vs Generali y enviar por email.',
        status:            TaskStatus.NOT_STARTED,
        priority:          TaskPriority.NORMAL,
        contextType:       TaskContextType.CONTACT,
        saleId:            s('Presupuesto seguro hogar').id,
        clientId:          c('Roberto Díaz Torres').id,
        dueDate:           new Date('2026-04-24'),
        assignedToUserId:  mila.id,
        hasReminder:       false,
      },
      // 4 — liquidación Caser urgente (linked to sale)
      {
        subject:           'Revisar liquidación errónea con Caser — Construcciones Vega',
        description:       'Detectado error en liquidación de póliza de construcción. Contactar con el área técnica de Caser para corrección.',
        status:            TaskStatus.IN_PROGRESS,
        priority:          TaskPriority.HIGHEST,
        contextType:       TaskContextType.CONTACT,
        saleId:            s('Seguro obras y construcción').id,
        clientId:          c('Construcciones Vega').id,
        dueDate:           new Date('2026-04-16'),
        assignedToUserId:  mila.id,
        hasReminder:       true,
        reminderAt:        new Date('2026-04-16T08:30:00'),
        reminderChannel:   ReminderChannel.EMAIL,
        reminderRecurrence: ReminderRecurrence.NONE,
      },
      // 5 — renovar póliza vida Francisco Ruiz (linked to sale)
      {
        subject:           'Gestionar renovación póliza de vida — Francisco Ruiz',
        description:       'La póliza VID-2022-00832 vence en marzo 2032 pero el cliente quiere revisar condiciones y capital asegurado.',
        status:            TaskStatus.NOT_STARTED,
        priority:          TaskPriority.HIGH,
        contextType:       TaskContextType.CONTACT,
        saleId:            s('Seguro de vida riesgo').id,
        clientId:          c('Francisco Ruiz Sánchez').id,
        dueDate:           new Date('2026-05-01'),
        assignedToUserId:  mila.id,
        hasReminder:       false,
      },
      // 6 — confirmar cobro recibo Antonio García (linked to sale)
      {
        subject:           'Verificar cobro recibo domiciliado — Antonio García',
        description:       'Confirmar con el cliente que el recibo de la póliza AUT-2026-04567 ha sido cargado correctamente.',
        status:            TaskStatus.IN_PROGRESS,
        priority:          TaskPriority.NORMAL,
        contextType:       TaskContextType.CONTACT,
        saleId:            s('Seguro de coche turismo').id,
        clientId:          c('Antonio García Pérez').id,
        dueDate:           new Date('2026-04-18'),
        assignedToUserId:  mila.id,
        hasReminder:       true,
        reminderAt:        new Date('2026-04-18T10:00:00'),
        reminderChannel:   ReminderChannel.IN_APP,
        reminderRecurrence: ReminderRecurrence.NONE,
      },
      // 7 — firma digital Restaurante El Patio (linked to sale)
      {
        subject:           'Enviar propuesta para firma digital — Restaurante El Patio',
        description:       'Preparar documento de seguro multirriesgo hostelería en formato digital y enviar enlace de firma.',
        status:            TaskStatus.NOT_STARTED,
        priority:          TaskPriority.HIGH,
        contextType:       TaskContextType.CONTACT,
        saleId:            s('Seguro multirriesgo hostelería').id,
        clientId:          c('Restaurante El Patio').id,
        dueDate:           new Date('2026-04-25'),
        assignedToUserId:  mila.id,
        hasReminder:       false,
      },
      // 8 — informe médico Elena Moreno (linked to case)
      {
        subject:           'Solicitar informe médico para recurso Sanitas — Elena Moreno',
        description:       'Recopilar historial clínico y solicitar informe al médico tratante para presentar recurso a Sanitas.',
        status:            TaskStatus.NOT_STARTED,
        priority:          TaskPriority.HIGH,
        contextType:       TaskContextType.CONTACT,
        caseId:            ca('Reclamación denegación cobertura Sanitas').id,
        saleId:            s('Seguro de salud familiar').id,
        clientId:          c('Elena Moreno Fernández').id,
        dueDate:           new Date('2026-04-30'),
        assignedToUserId:  mila.id,
        hasReminder:       false,
      },
      // 9 — aseguradora alternativa Clínica DentalCare (client-level only)
      {
        subject:           'Buscar aseguradora alternativa RC sanitaria — Clínica DentalCare',
        description:       'KO en scoring con Asisa por siniestralidad. Consultar condiciones con Zurich y AXA.',
        status:            TaskStatus.DEFERRED,
        priority:          TaskPriority.LOW,
        contextType:       TaskContextType.CONTACT,
        clientId:          c('Clínica DentalCare').id,
        dueDate:           new Date('2026-05-15'),
        assignedToUserId:  mila.id,
        hasReminder:       false,
      },
      // 10 — activación suministro eléctrico Antonio García (linked to sale)
      {
        subject:           'Seguimiento activación contrato eléctrico — Antonio García',
        description:       'Confirmar con Endesa el estado de la solicitud de cambio de comercializadora.',
        status:            TaskStatus.IN_PROGRESS,
        priority:          TaskPriority.NORMAL,
        contextType:       TaskContextType.CONTACT,
        saleId:            s('Cambio de compañía eléctrica').id,
        clientId:          c('Antonio García Pérez').id,
        dueDate:           new Date('2026-04-20'),
        assignedToUserId:  mila.id,
        hasReminder:       true,
        reminderAt:        new Date('2026-04-20T09:30:00'),
        reminderChannel:   ReminderChannel.IN_APP,
        reminderRecurrence: ReminderRecurrence.NONE,
      },
      // 11 — actualizar valor continente Restaurante El Patio (linked to case)
      {
        subject:           'Revisar valor asegurado continente tras reforma — Restaurante El Patio',
        description:       'El cliente ha reformado el local. Pendiente de recibir presupuesto de obra para actualizar el valor continente en póliza.',
        status:            TaskStatus.WAITING_FOR_INPUT,
        priority:          TaskPriority.NORMAL,
        contextType:       TaskContextType.CONTACT,
        caseId:            ca('Actualización valor continente tras reforma').id,
        saleId:            s('Seguro multirriesgo hostelería').id,
        clientId:          c('Restaurante El Patio').id,
        dueDate:           new Date('2026-04-28'),
        assignedToUserId:  mila.id,
        hasReminder:       false,
      },
      // 12 — nueva dentista Clínica DentalCare (linked to case)
      {
        subject:           'Comunicar a Asisa datos de nueva dentista — Clínica DentalCare',
        description:       'Recopilar datos profesionales (nombre, número de colegiada, fecha de incorporación) y enviarlos a Asisa.',
        status:            TaskStatus.NOT_STARTED,
        priority:          TaskPriority.HIGH,
        contextType:       TaskContextType.CONTACT,
        caseId:            ca('Ampliación RC a nuevo profesional').id,
        saleId:            s('Seguro responsabilidad civil sanitaria').id,
        clientId:          c('Clínica DentalCare').id,
        dueDate:           new Date('2026-04-23'),
        assignedToUserId:  mila.id,
        hasReminder:       false,
      },
      // 13 — emitir recibo Sara Muñoz (linked to sale)
      {
        subject:           'Emitir recibo primer mes seguro dental — Sara Muñoz',
        description:       'Gestionar emisión del primer recibo de Asisa para la póliza dental de Sara Muñoz.',
        status:            TaskStatus.IN_PROGRESS,
        priority:          TaskPriority.HIGHEST,
        contextType:       TaskContextType.CONTACT,
        saleId:            s('Seguro dental').id,
        clientId:          c('Sara Muñoz Delgado').id,
        dueDate:           new Date('2026-04-10'),
        assignedToUserId:  mila.id,
        hasReminder:       false,
      },
      // 14 — estudio energético Carmen López (linked to sale)
      {
        subject:           'Enviar estudio energético — Carmen López',
        description:       'Preparar análisis de consumo con las últimas facturas y enviar propuesta de ahorro con Iberdrola.',
        status:            TaskStatus.NOT_STARTED,
        priority:          TaskPriority.NORMAL,
        contextType:       TaskContextType.CONTACT,
        saleId:            s('Estudio contrato energía eléctrica').id,
        clientId:          c('Carmen López Martínez').id,
        dueDate:           new Date('2026-04-21'),
        assignedToUserId:  mila.id,
        hasReminder:       false,
      },
      // 15 — incidencia factura Talleres Rápidos (linked to case, completed)
      {
        subject:           'Revisar factura eléctrica con consumo anormal — Talleres Rápidos',
        description:       'Revisión completada con Repsol. Error de lectura del contador. Emitida factura rectificativa.',
        status:            TaskStatus.COMPLETED,
        priority:          TaskPriority.NORMAL,
        contextType:       TaskContextType.CONTACT,
        caseId:            ca('Liquidación errónea — factura enero Repsol').id,
        saleId:            s('Contrato suministro gas natural').id,
        clientId:          c('Talleres Rápidos S.L.').id,
        assignedToUserId:  mila.id,
        hasReminder:       false,
      },

      // ── Asesor (EMPLOYEE) ─────────────────────────────────────────────────

      // 16 — documentación RC Lucía Hernández (linked to sale)
      {
        subject:           'Recoger documentación póliza RC — Lucía Hernández',
        description:       'Solicitar al cliente el certificado de actividad profesional y el justificante de formación requerido por Zurich.',
        status:            TaskStatus.IN_PROGRESS,
        priority:          TaskPriority.HIGH,
        contextType:       TaskContextType.CONTACT,
        saleId:            s('Seguro responsabilidad civil').id,
        clientId:          c('Lucía Hernández Jiménez').id,
        dueDate:           new Date('2026-04-18'),
        assignedToUserId:  asesor.id,
        hasReminder:       true,
        reminderAt:        new Date('2026-04-18T08:00:00'),
        reminderChannel:   ReminderChannel.EMAIL,
        reminderRecurrence: ReminderRecurrence.NONE,
      },
      // 17 — llamar María Sanz (client-level only)
      {
        subject:           'Llamar para estudio de necesidades — María Sanz',
        description:       'Primera llamada de captación. Identificar necesidades de salud y dependientes a cargo.',
        status:            TaskStatus.NOT_STARTED,
        priority:          TaskPriority.NORMAL,
        contextType:       TaskContextType.CONTACT,
        clientId:          c('María Sanz Romero').id,
        dueDate:           new Date('2026-04-22'),
        assignedToUserId:  asesor.id,
        hasReminder:       false,
      },
      // 18 — datos bancarios Pablo Navarro (client-level only)
      {
        subject:           'Confirmar datos bancarios actualizados — Pablo Navarro',
        description:       'El cliente indicó que cambió de banco. Recoger nuevo IBAN para domiciliar próximo recibo de vida.',
        status:            TaskStatus.WAITING_FOR_INPUT,
        priority:          TaskPriority.HIGH,
        contextType:       TaskContextType.CONTACT,
        clientId:          c('Pablo Navarro Gil').id,
        dueDate:           new Date('2026-04-17'),
        assignedToUserId:  asesor.id,
        hasReminder:       false,
      },
      // 19 — nueva propuesta Academia Lingua (client-level only)
      {
        subject:           'Preparar nueva propuesta de seguro — Academia Lingua',
        description:       'La oferta anterior fue perdida. Estudiar si hay margen con otra aseguradora antes de descartar al cliente.',
        status:            TaskStatus.DEFERRED,
        priority:          TaskPriority.LOW,
        contextType:       TaskContextType.CONTACT,
        clientId:          c('Academia Lingua').id,
        dueDate:           new Date('2026-05-20'),
        assignedToUserId:  asesor.id,
        hasReminder:       false,
      },
      // 20 — seguimiento comercializadora Academia Lingua (client-level only)
      {
        subject:           'Seguimiento cambio comercializadora eléctrica — Academia Lingua',
        description:       'El proceso de cambio a EDP lleva semanas pendiente. Contactar con distribuidora para resolver bloqueo.',
        status:            TaskStatus.NOT_STARTED,
        priority:          TaskPriority.NORMAL,
        contextType:       TaskContextType.CONTACT,
        clientId:          c('Academia Lingua').id,
        dueDate:           new Date('2026-04-29'),
        assignedToUserId:  asesor.id,
        hasReminder:       false,
      },
      // 21 — revisión contrato eléctrico Carmen López (linked to sale)
      {
        subject:           'Revisar contrato eléctrico Endesa — Carmen López',
        description:       'El contrato CUPS ES0031000098765432CD lleva meses en estado pendiente. Verificar activación con Endesa.',
        status:            TaskStatus.IN_PROGRESS,
        priority:          TaskPriority.NORMAL,
        contextType:       TaskContextType.CONTACT,
        saleId:            s('Estudio contrato energía eléctrica').id,
        clientId:          c('Carmen López Martínez').id,
        dueDate:           new Date('2026-04-25'),
        assignedToUserId:  asesor.id,
        hasReminder:       true,
        reminderAt:        new Date('2026-04-25T09:00:00'),
        reminderChannel:   ReminderChannel.IN_APP,
        reminderRecurrence: ReminderRecurrence.NONE,
      },
      // 22 — peritación robo Talleres Rápidos (linked to case)
      {
        subject:           'Seguimiento visita perito — siniestro robo Talleres Rápidos',
        description:       'Confirmar que el perito de Mapfre realizó la visita y recoger número de expediente asignado.',
        status:            TaskStatus.IN_PROGRESS,
        priority:          TaskPriority.HIGH,
        contextType:       TaskContextType.CONTACT,
        caseId:            ca('Siniestro robo en instalaciones').id,
        saleId:            s('Seguro multirriesgo industrial').id,
        clientId:          c('Talleres Rápidos S.L.').id,
        dueDate:           new Date('2026-04-16'),
        assignedToUserId:  asesor.id,
        hasReminder:       false,
      },
      // 23 — actualizar beneficiarios Francisco Ruiz (linked to sale, completed)
      {
        subject:           'Actualizar beneficiarios póliza de vida — Francisco Ruiz',
        description:       'Beneficiarios actualizados en Allianz según instrucciones del cliente. Confirmación recibida por email.',
        status:            TaskStatus.COMPLETED,
        priority:          TaskPriority.LOW,
        contextType:       TaskContextType.CONTACT,
        saleId:            s('Seguro de vida riesgo').id,
        clientId:          c('Francisco Ruiz Sánchez').id,
        assignedToUserId:  asesor.id,
        hasReminder:       false,
      },
      // 24 — cerrar expediente impago Pablo Navarro (linked to case, completed)
      {
        subject:           'Cerrar expediente baja por impago — Pablo Navarro',
        description:       'Comunicación de baja enviada al cliente y expediente cerrado. Póliza cancelada en sistema.',
        status:            TaskStatus.COMPLETED,
        priority:          TaskPriority.LOW,
        contextType:       TaskContextType.CONTACT,
        caseId:            ca('Gestión baja por impago').id,
        saleId:            s('Renovación seguro de vida').id,
        clientId:          c('Pablo Navarro Gil').id,
        assignedToUserId:  asesor.id,
        hasReminder:       false,
      },
      // 25 — contactar Construcciones Vega seguimiento póliza (linked to sale)
      {
        subject:           'Contactar para seguimiento póliza obras — Construcciones Vega',
        description:       'La póliza de construcción tiene liquidación errónea. Asesor debe coordinar con cliente la documentación pendiente.',
        status:            TaskStatus.NOT_STARTED,
        priority:          TaskPriority.NORMAL,
        contextType:       TaskContextType.CONTACT,
        saleId:            s('Seguro obras y construcción').id,
        clientId:          c('Construcciones Vega').id,
        dueDate:           new Date('2026-04-28'),
        assignedToUserId:  asesor.id,
        hasReminder:       false,
      },
    ],
  })

  console.log('  ✓ Tasks (25)')

  // ─── Workdays ─────────────────────────────────────────────────────────────
  // Last 10 working days for Mila, last 8 for Asesor
  type WorkdayInput = {
    userId: string
    date: Date
    clockIn: Date
    clockOut: Date
    notes?: string
  }

  const workdays: WorkdayInput[] = []

  const addWorkday = (
    userId: string,
    dateStr: string,
    inTime: string,
    outTime: string,
    notes?: string,
  ) => {
    workdays.push({
      userId,
      date:     new Date(dateStr),
      clockIn:  new Date(`${dateStr}T${inTime}:00`),
      clockOut: new Date(`${dateStr}T${outTime}:00`),
      notes,
    })
  }

  // Mila (OWNER) — last 10 working days
  addWorkday(mila.id, '2026-03-09', '08:45', '18:30', 'Reunión con Mapfre por la tarde')
  addWorkday(mila.id, '2026-03-10', '09:00', '18:00')
  addWorkday(mila.id, '2026-03-11', '08:30', '17:45')
  addWorkday(mila.id, '2026-03-12', '09:15', '19:00', 'Visita cliente Talleres Rápidos')
  addWorkday(mila.id, '2026-03-13', '09:00', '14:00', 'Media jornada — tarde libre')
  addWorkday(mila.id, '2026-03-16', '08:45', '18:30')
  addWorkday(mila.id, '2026-03-17', '09:00', '18:00')
  addWorkday(mila.id, '2026-03-18', '09:00', '18:15')
  addWorkday(mila.id, '2026-03-19', '08:30', '17:30')
  addWorkday(mila.id, '2026-03-20', '09:00', '14:30', 'Viernes jornada intensiva')

  // Asesor (EMPLOYEE) — last 8 working days
  addWorkday(asesor.id, '2026-03-11', '09:00', '18:00')
  addWorkday(asesor.id, '2026-03-12', '09:10', '18:05')
  addWorkday(asesor.id, '2026-03-13', '09:00', '18:00')
  addWorkday(asesor.id, '2026-03-16', '08:55', '18:10')
  addWorkday(asesor.id, '2026-03-17', '09:00', '18:00')
  addWorkday(asesor.id, '2026-03-18', '09:05', '18:00')
  addWorkday(asesor.id, '2026-03-19', '09:00', '17:50')
  addWorkday(asesor.id, '2026-03-20', '09:00', '14:00', 'Jornada intensiva viernes')

  const createdWorkdays = await prisma.workday.createManyAndReturn({ data: workdays })

  // One pending adjustment request from Asesor
  const asesorWorkday = createdWorkdays.find(
    w => w.userId === asesor.id && w.date.toISOString().startsWith('2026-03-18'),
  )
  if (asesorWorkday) {
    await prisma.workAdjustmentRequest.create({
      data: {
        workdayId:         asesorWorkday.id,
        reason:            'Me olvidé de fichar la salida correctamente. Salí a las 18:30.',
        requestedClockIn:  new Date('2026-03-18T09:05:00'),
        requestedClockOut: new Date('2026-03-18T18:30:00'),
        status:            'PENDING',
      },
    })
  }

  console.log(`  ✓ Workdays (${createdWorkdays.length}) + 1 adjustment request`)

  // ─── Collaborators ────────────────────────────────────────────────────────
  await prisma.collaborator.createMany({
    data: [
      { name: 'Gestoría López & Asociados',        phone: '952 100 200' },
      { name: 'Taller Mecánico Hermanos Ruiz',      phone: '654 321 098' },
      { name: 'Clínica Veterinaria Pata y Cola',    phone: '671 889 900' },
      { name: 'Inmobiliaria Costa Sur S.L.',        phone: '952 445 566' },
      { name: 'Farmacia Dr. Medina',                phone: '612 778 899' },
    ],
  })
  console.log('  ✓ Collaborators (5)')

  // ─── Documents ────────────────────────────────────────────────────────────
  await prisma.document.createMany({
    data: [
      // 1 — Póliza hogar Carmen López (actualizada)
      {
        name:            'Póliza Hogar Multirriesgo — Carmen López 2023',
        group:           DocumentGroup.INSURANCE,
        documentType:    DocumentType.POLICY,
        status:          DocumentStatus.UPDATED,
        includedAt:      new Date('2023-09-01'),
        expiryDate:      new Date('2024-09-01'),
        clientId:        c('Carmen López Martínez').id,
        saleId:          s('Seguro de hogar multirriesgo').id,
        uploadedByUserId: mila.id,
      },
      // 2 — Contrato electricidad Carmen López (pendiente firma)
      {
        name:            'Contrato Suministro Eléctrico Iberdrola — Carmen López',
        group:           DocumentGroup.ENERGY,
        documentType:    DocumentType.CONTRACT,
        status:          DocumentStatus.PENDING_SIGNATURE,
        includedAt:      new Date('2026-03-10'),
        expiryDate:      new Date('2028-03-10'),
        clientId:        c('Carmen López Martínez').id,
        saleId:          s('Estudio contrato energía eléctrica').id,
        uploadedByUserId: mila.id,
      },
      // 3 — Póliza vida Francisco Ruiz (actualizada)
      {
        name:            'Póliza Vida Riesgo Allianz — Francisco Ruiz 2022',
        group:           DocumentGroup.INSURANCE,
        documentType:    DocumentType.POLICY,
        status:          DocumentStatus.UPDATED,
        includedAt:      new Date('2022-03-15'),
        expiryDate:      new Date('2032-03-15'),
        clientId:        c('Francisco Ruiz Sánchez').id,
        saleId:          s('Seguro de vida riesgo').id,
        uploadedByUserId: mila.id,
      },
      // 4 — Factura recibo vida Francisco Ruiz (en revisión)
      {
        name:            'Factura Recibo Anual Vida — Francisco Ruiz 2026',
        group:           DocumentGroup.INSURANCE,
        documentType:    DocumentType.INVOICE,
        status:          DocumentStatus.UNDER_REVIEW,
        includedAt:      new Date('2026-03-20'),
        clientId:        c('Francisco Ruiz Sánchez').id,
        saleId:          s('Seguro de vida riesgo').id,
        uploadedByUserId: mila.id,
      },
      // 5 — Póliza salud Elena Moreno (actualizada)
      {
        name:            'Póliza Salud Familiar Sanitas — Elena Moreno 2021',
        group:           DocumentGroup.INSURANCE,
        documentType:    DocumentType.POLICY,
        status:          DocumentStatus.UPDATED,
        includedAt:      new Date('2021-06-01'),
        expiryDate:      new Date('2025-06-01'),
        clientId:        c('Elena Moreno Fernández').id,
        saleId:          s('Seguro de salud familiar').id,
        uploadedByUserId: mila.id,
      },
      // 6 — Contrato gas Talleres Rápidos (actualizado)
      {
        name:            'Contrato Suministro Gas Natural Repsol — Talleres Rápidos',
        group:           DocumentGroup.ENERGY,
        documentType:    DocumentType.CONTRACT,
        status:          DocumentStatus.UPDATED,
        includedAt:      new Date('2021-03-01'),
        expiryDate:      new Date('2026-03-01'),
        clientId:        c('Talleres Rápidos S.L.').id,
        saleId:          s('Contrato suministro gas natural').id,
        uploadedByUserId: mila.id,
      },
      // 7 — Proyecto multirriesgo hostelería Restaurante El Patio (pendiente firma)
      {
        name:            'Propuesta Seguro Multirriesgo Hostelería Helvetia — El Patio',
        group:           DocumentGroup.INSURANCE,
        documentType:    DocumentType.PROJECT,
        status:          DocumentStatus.PENDING_SIGNATURE,
        includedAt:      new Date('2026-04-01'),
        expiryDate:      new Date('2026-05-01'),
        clientId:        c('Restaurante El Patio').id,
        saleId:          s('Seguro multirriesgo hostelería').id,
        uploadedByUserId: mila.id,
      },
      // 8 — Factura electricidad Restaurante El Patio (actualizada)
      {
        name:            'Factura Eléctrica Naturgy abril 2026 — Restaurante El Patio',
        group:           DocumentGroup.ENERGY,
        documentType:    DocumentType.INVOICE,
        status:          DocumentStatus.UPDATED,
        includedAt:      new Date('2026-04-01'),
        clientId:        c('Restaurante El Patio').id,
        saleId:          s('Optimización contrato eléctrico').id,
        uploadedByUserId: asesor.id,
      },
      // 9 — Documentación RC Lucía Hernández (en revisión)
      {
        name:            'Certificado Actividad Profesional — Lucía Hernández',
        group:           DocumentGroup.INSURANCE,
        documentType:    DocumentType.DOCUMENTATION,
        status:          DocumentStatus.UNDER_REVIEW,
        includedAt:      new Date('2026-04-05'),
        clientId:        c('Lucía Hernández Jiménez').id,
        saleId:          s('Seguro responsabilidad civil').id,
        uploadedByUserId: asesor.id,
      },
      // 10 — Contrato obras Construcciones Vega (en revisión)
      {
        name:            'Contrato Póliza Obras y Construcción Caser — Construcciones Vega',
        group:           DocumentGroup.INSURANCE,
        documentType:    DocumentType.CONTRACT,
        status:          DocumentStatus.UNDER_REVIEW,
        includedAt:      new Date('2026-02-15'),
        expiryDate:      new Date('2027-02-15'),
        clientId:        c('Construcciones Vega').id,
        saleId:          s('Seguro obras y construcción').id,
        uploadedByUserId: mila.id,
      },
      // 11 — Póliza RC sanitaria Clínica DentalCare (caducada)
      {
        name:            'Póliza RC Sanitaria Asisa — Clínica DentalCare 2021',
        group:           DocumentGroup.INSURANCE,
        documentType:    DocumentType.POLICY,
        status:          DocumentStatus.EXPIRED,
        includedAt:      new Date('2021-01-01'),
        expiryDate:      new Date('2025-12-31'),
        clientId:        c('Clínica DentalCare').id,
        saleId:          s('Seguro responsabilidad civil sanitaria').id,
        uploadedByUserId: mila.id,
      },
      // 12 — Póliza automóvil Antonio García (actualizada, sin venta)
      {
        name:            'Póliza Automóvil Todo Riesgo Generali — Antonio García 2023',
        group:           DocumentGroup.INSURANCE,
        documentType:    DocumentType.POLICY,
        status:          DocumentStatus.UPDATED,
        includedAt:      new Date('2023-11-20'),
        expiryDate:      new Date('2024-11-20'),
        clientId:        c('Antonio García Pérez').id,
        saleId:          s('Seguro de coche turismo').id,
        uploadedByUserId: mila.id,
      },
    ],
  })

  console.log('  ✓ Documents (12)')

  // ─── Activities ────────────────────────────────────────────────────────────
  await prisma.activity.createMany({
    data: [
      // Carmen López — seguimiento seguro hogar
      {
        userId:      mila.id,
        clientId:    c('Carmen López Martínez').id,
        saleId:      s('Seguro de hogar multirriesgo').id,
        type:        ActivityType.CALL,
        direction:   ActivityDirection.OUTBOUND,
        subject:     'Llamada de seguimiento — documentación pendiente',
        description: 'La cliente confirmó que tiene las escrituras. Pendiente de escanear y enviar.',
        outcome:     'Positivo — documentación en camino',
        nextStep:    'Esperar documentación antes del 30 de abril',
        activityAt:  new Date('2026-04-20T10:30:00'),
      },
      {
        userId:      mila.id,
        clientId:    c('Carmen López Martínez').id,
        saleId:      s('Seguro de hogar multirriesgo').id,
        type:        ActivityType.EMAIL,
        direction:   ActivityDirection.OUTBOUND,
        subject:     'Envío de comparativa de coberturas hogar',
        description: 'Se adjuntó PDF con tres opciones de cobertura y precios actualizados de Mapfre.',
        outcome:     undefined,
        nextStep:    'Esperar respuesta del cliente',
        activityAt:  new Date('2026-04-15T09:00:00'),
      },
      // Francisco Ruiz — estudio energético
      {
        userId:      mila.id,
        clientId:    c('Francisco Ruiz Sánchez').id,
        saleId:      s('Estudio contrato energía eléctrica').id,
        type:        ActivityType.MEETING,
        direction:   ActivityDirection.INBOUND,
        subject:     'Reunión presencial — revisión facturas eléctricas',
        description: 'Análisis de los últimos 12 meses de consumo. Alto consumo en horas punta detectado.',
        outcome:     'Recomendado cambio a tarifa con discriminación horaria',
        nextStep:    'Tramitar cambio con la comercializadora',
        activityAt:  new Date('2026-04-14T16:00:00'),
      },
      {
        userId:      asesor.id,
        clientId:    c('Francisco Ruiz Sánchez').id,
        type:        ActivityType.CALL,
        direction:   ActivityDirection.OUTBOUND,
        subject:     'Llamada de presentación del estudio energético',
        description: 'Primera toma de contacto para explicar el servicio de estudio energético gratuito.',
        outcome:     'Interesado — acepta reunión presencial',
        nextStep:    'Confirmar fecha de reunión',
        activityAt:  new Date('2026-04-08T11:00:00'),
      },
      // Elena Moreno — siniestro vehículo
      {
        userId:      mila.id,
        clientId:    c('Elena Moreno Fernández').id,
        type:        ActivityType.WHATSAPP_NOTE,
        direction:   ActivityDirection.INBOUND,
        subject:     'WhatsApp: duda sobre parte amistoso digital',
        description: 'La cliente pregunta si el parte amistoso digital tiene la misma validez que en papel.',
        outcome:     'Confirmado: vale digital con firma electrónica',
        nextStep:    undefined,
        activityAt:  new Date('2026-04-19T14:15:00'),
      },
      // Antonio García — seguro vida
      {
        userId:      mila.id,
        clientId:    c('Antonio García Pérez').id,
        type:        ActivityType.CALL,
        direction:   ActivityDirection.INBOUND,
        subject:     'Llamada recibida — actualización de beneficiarios',
        description: 'El cliente llama para cambiar los beneficiarios del seguro de vida. Se toman los nuevos datos.',
        outcome:     'Datos actualizados en expediente',
        nextStep:    'Enviar endoso firmado al cliente',
        activityAt:  new Date('2026-04-18T11:00:00'),
      },
      // Lucía Fernández — primer contacto
      {
        userId:      asesor.id,
        clientId:    c('Lucía Hernández Jiménez').id,
        type:        ActivityType.CALL,
        direction:   ActivityDirection.OUTBOUND,
        subject:     'Primer contacto — seguro de salud',
        description: 'Llamada de captación. La clienta muestra interés en un seguro de salud para toda la familia.',
        outcome:     'Interesada — solicita comparativa',
        nextStep:    'Preparar comparativa Sanitas / Adeslas y enviar por email',
        activityAt:  new Date('2026-04-17T10:00:00'),
      },
      // Roberto Jiménez — sin respuesta
      {
        userId:      asesor.id,
        clientId:    c('Roberto Díaz Torres').id,
        type:        ActivityType.CALL,
        direction:   ActivityDirection.OUTBOUND,
        subject:     'Intento de contacto — renovación seguro coche',
        description: 'No contesta. Se deja mensaje en el buzón de voz.',
        outcome:     'Sin respuesta',
        nextStep:    'Reintentar llamada en 3 días',
        activityAt:  new Date('2026-04-16T09:30:00'),
      },
    ],
  })

  console.log('  ✓ Activities (8)')

  // ─── Suppliers ────────────────────────────────────────────────────────────
  await prisma.supplier.createMany({
    data: [
      {
        name:           'Mapfre España S.A.',
        cif:            'A11111110',
        phone:          '91 581 91 00',
        secondaryPhone: '900 100 128',
      },
      {
        name:  'Endesa Energía S.A.U.',
        cif:   'B22222220',
        phone: '900 760 760',
      },
      {
        name:  'Línea Directa Aseguradora S.A.',
        cif:   'C33333330',
        phone: '91 547 49 00',
      },
    ],
  })

  const suppliers = await prisma.supplier.findMany()
  const sup = (name: string) => suppliers.find(s => s.name === name)!

  await prisma.supplierAddress.createMany({
    data: [
      {
        supplierId: sup('Mapfre España S.A.').id,
        type: 'FISCAL',
        street: 'Carretera de Pozuelo, 52',
        postalCode: '28222',
        city: 'Majadahonda',
        province: 'Madrid',
        country: 'España',
      },
      {
        supplierId: sup('Endesa Energía S.A.U.').id,
        type: 'FISCAL',
        street: 'Ribera del Loira, 60',
        postalCode: '28042',
        city: 'Madrid',
        province: 'Madrid',
        country: 'España',
      },
    ],
  })

  await prisma.supplierEmail.createMany({
    data: [
      {
        supplierId: sup('Mapfre España S.A.').id,
        address:   'mediadores@mapfre.com',
        isPrimary: true,
        label:     'Mediadores',
      },
      {
        supplierId: sup('Endesa Energía S.A.U.').id,
        address:   'canales@endesa.com',
        isPrimary: true,
        label:     'Canales',
      },
      {
        supplierId: sup('Línea Directa Aseguradora S.A.').id,
        address:   'mediadores@lineadirecta.com',
        isPrimary: true,
        label:     'Mediadores',
      },
    ],
  })

  console.log(`  ✓ Suppliers (${suppliers.length})`)

  console.log('Database provisioning complete.')
}

main()
  .catch(e => {
    console.error('Provisioning failed:', e)
    process.exitCode = 1 // exit 1 after .finally so the shell && chain breaks
  })
  .finally(() => prisma.$disconnect())
