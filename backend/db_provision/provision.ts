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
import { EnergySaleStage, InsuranceSaleStage, PrismaClient, SaleType } from '../src/generated/prisma/client.js'

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
    create: { email: 'asesor@crm.com', passwordHash: employeeHash, role: 'EMPLOYEE', displayName: 'Asesor' },
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
      {
        clientNumber: '000001',
        type: 'INDIVIDUAL', status: 'ACTIVE',
        name: 'Carmen López Martínez',
        nif: '12345678A', mobilePhone: '612 345 678', email: 'carmen.lopez@gmail.com',
      },
      {
        clientNumber: '000002',
        type: 'INDIVIDUAL', status: 'ACTIVE',
        name: 'Francisco Ruiz Sánchez',
        nif: '87654321B', mobilePhone: '623 456 789', email: 'fran.ruiz@hotmail.com',
      },
      {
        clientNumber: '000003',
        type: 'INDIVIDUAL', status: 'ACTIVE',
        name: 'Elena Moreno Fernández',
        nif: '11223344C', mobilePhone: '634 567 890', email: 'elena.moreno@gmail.com',
      },
      {
        clientNumber: '000004',
        type: 'INDIVIDUAL', status: 'ACTIVE',
        name: 'Antonio García Pérez',
        nif: '44332211D', mobilePhone: '645 678 901', email: 'antonio.garcia@outlook.com',
      },
      {
        clientNumber: '000005',
        type: 'INDIVIDUAL', status: 'ACTIVE',
        name: 'Lucía Hernández Jiménez',
        nif: '55667788E', mobilePhone: '656 789 012', email: 'lucia.hdz@gmail.com',
      },
      // Individuals — LEAD
      {
        clientNumber: '000006',
        type: 'INDIVIDUAL', status: 'LEAD',
        name: 'Roberto Díaz Torres',
        mobilePhone: '667 890 123', email: 'roberto.diaz@gmail.com',
      },
      {
        clientNumber: '000007',
        type: 'INDIVIDUAL', status: 'LEAD',
        name: 'María Sanz Romero',
        mobilePhone: '678 901 234', email: 'maria.sanz@icloud.com',
      },
      // Individuals — INACTIVE / LOST
      {
        clientNumber: '000008',
        type: 'INDIVIDUAL', status: 'INACTIVE',
        name: 'Pablo Navarro Gil',
        nif: '99887766F', mobilePhone: '689 012 345', email: 'pablo.navarro@gmail.com',
      },
      {
        clientNumber: '000009',
        type: 'INDIVIDUAL', status: 'LOST',
        name: 'Sara Muñoz Delgado',
        mobilePhone: '690 123 456', email: 'sara.munoz@gmail.com',
      },
      // Businesses — ACTIVE
      {
        clientNumber: '000010',
        type: 'BUSINESS', status: 'ACTIVE',
        name: 'Talleres Rápidos S.L.',
        nif: 'B12345678', mobilePhone: '91 234 56 78', email: 'info@talleresrapidos.es',
      },
      {
        clientNumber: '000011',
        type: 'BUSINESS', status: 'ACTIVE',
        name: 'Restaurante El Patio',
        nif: 'B87654321', mobilePhone: '95 678 12 34', email: 'reservas@restauranteelpatio.com',
      },
      {
        clientNumber: '000012',
        type: 'BUSINESS', status: 'ACTIVE',
        name: 'Clínica DentalCare',
        nif: 'B11223344', mobilePhone: '93 456 78 90', email: 'admin@dentalcare.es',
      },
      {
        clientNumber: '000013',
        type: 'BUSINESS', status: 'LEAD',
        name: 'Academia Lingua',
        nif: 'J44332211', mobilePhone: '96 789 01 23', email: 'info@academia-lingua.es',
      },
      {
        clientNumber: '000014',
        type: 'BUSINESS', status: 'INACTIVE',
        name: 'Construcciones Vega',
        nif: 'A55667788', mobilePhone: '91 890 12 34',
      },
    ],
  })

  console.log(`  ✓ Clients (${clients.length})`)

  // Helper: find client by name
  const c = (name: string) => clients.find(cl => cl.name === name)!

  // ─── Sales ────────────────────────────────────────────────────────────────
  await prisma.sale.createMany({
    data: [
      { clientId: c('Carmen López Martínez').id, title: 'Seguro de hogar multirriesgo',        insuranceStage: InsuranceSaleStage.DOCUMENTS_PENDING,    amount: 420, type: SaleType.INSURANCE },
      { clientId: c('Carmen López Martínez').id, title: 'Estudio contrato energía eléctrica',   energyStage: EnergySaleStage.DOCUMENTS_PENDING,   amount: null, type: SaleType.ENERGY },
      { clientId: c('Francisco Ruiz Sánchez').id, title: 'Seguro de vida riesgo',               insuranceStage: InsuranceSaleStage.INVOICE_PENDING_PAYMENT,    amount: 380, type: SaleType.INSURANCE },
      { clientId: c('Francisco Ruiz Sánchez').id, title: 'Ampliación póliza accidentes',        insuranceStage: InsuranceSaleStage.RECURRENT_BILLING,   amount: 150, type: SaleType.INSURANCE },
      { clientId: c('Elena Moreno Fernández').id, title: 'Seguro de salud familiar',            insuranceStage: InsuranceSaleStage.BILLED_AND_PAID,    amount: 1200, type: SaleType.INSURANCE },
      { clientId: c('Antonio García Pérez').id,   title: 'Seguro de coche turismo',             insuranceStage: InsuranceSaleStage.INVOICE_PENDING_PAYMENT,    amount: 650, type: SaleType.INSURANCE },
      { clientId: c('Antonio García Pérez').id,   title: 'Cambio de compañía eléctrica',        energyStage: EnergySaleStage.ACTIVATION_PENDING,    amount: null, type: SaleType.ENERGY },
      { clientId: c('Lucía Hernández Jiménez').id,title: 'Seguro responsabilidad civil',       insuranceStage: InsuranceSaleStage.DOCUMENTS_PENDING,   amount: 280, type: SaleType.INSURANCE },
      { clientId: c('Roberto Díaz Torres').id,    title: 'Presupuesto seguro hogar',            insuranceStage: InsuranceSaleStage.RESPONSE_PENDING,   amount: null, type: SaleType.INSURANCE },
      { clientId: c('María Sanz Romero').id,      title: 'Consulta seguro de salud',            insuranceStage: InsuranceSaleStage.BILLED_AND_PAID,   amount: null, type: SaleType.INSURANCE },
      { clientId: c('Pablo Navarro Gil').id,       title: 'Renovación seguro de vida',          insuranceStage: InsuranceSaleStage.BILLING_NEXT_MONTH, amount: 320, type: SaleType.INSURANCE },
      { clientId: c('Sara Muñoz Delgado').id,     title: 'Seguro dental',                       insuranceStage: InsuranceSaleStage.BILLING_THIS_MONTH,   amount: 200, type: SaleType.INSURANCE },
      { clientId: c('Talleres Rápidos S.L.').id,  title: 'Seguro multirriesgo industrial',      insuranceStage: InsuranceSaleStage.CANCELED_UNPAID,    amount: 2400, type: SaleType.INSURANCE },
      { clientId: c('Talleres Rápidos S.L.').id,  title: 'Contrato suministro gas natural',     energyStage: EnergySaleStage.BILLED_AND_PAID,    amount: null, type: SaleType.ENERGY },
      { clientId: c('Restaurante El Patio').id,   title: 'Seguro multirriesgo hostelería',      insuranceStage: InsuranceSaleStage.SIGNATURE_PENDING,    amount: 1800, type: SaleType.INSURANCE },
      { clientId: c('Restaurante El Patio').id,   title: 'Optimización contrato eléctrico',     energyStage: EnergySaleStage.BILLING_THIS_MONTH,   amount: null, type: SaleType.ENERGY },
      { clientId: c('Clínica DentalCare').id,     title: 'Seguro responsabilidad civil sanitaria', insuranceStage: InsuranceSaleStage.KO_SCORING, amount: 3200, type: SaleType.INSURANCE },
      { clientId: c('Academia Lingua').id,        title: 'Seguro multirriesgo oficinas',        insuranceStage: InsuranceSaleStage.LOST,   amount: 900, type: SaleType.INSURANCE },
      { clientId: c('Construcciones Vega').id,    title: 'Seguro obras y construcción',         insuranceStage: InsuranceSaleStage.WRONG_SETTLEMENT, amount: 5500, type: SaleType.INSURANCE },
    ],
  })

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
  await prisma.case.createMany({
    data: [
      {
        clientId: c('Carmen López Martínez').id,
        title: 'Siniestro agua en vivienda',
        description: 'Rotura de tubería en baño principal. Daños en suelo y pared. Expediente abierto con Mapfre nº SIN-2024-00123.',
        status: 'IN_PROGRESS',
      },
      {
        clientId: c('Antonio García Pérez').id,
        title: 'Accidente de tráfico — reclamación a tercero',
        description: 'Colisión por alcance en autovía A-3. El tercero reconoce culpa. Pendiente de peritación del vehículo.',
        status: 'IN_PROGRESS',
      },
      {
        clientId: c('Antonio García Pérez').id,
        title: 'Consulta cambio de vehículo asegurado',
        description: 'El cliente quiere traspasar la póliza al nuevo vehículo pendiente de compra.',
        status: 'OPEN',
      },
      {
        clientId: c('Elena Moreno Fernández').id,
        title: 'Reclamación denegación cobertura Sanitas',
        description: 'Sanitas deniega intervención de rodilla por preexistencia. Se requiere informe médico para recurso.',
        status: 'OPEN',
      },
      {
        clientId: c('Talleres Rápidos S.L.').id,
        title: 'Siniestro robo en instalaciones',
        description: 'Robo de herramienta y maquinaria durante fin de semana. Denuncia presentada. Perito visitará el lunes.',
        status: 'IN_PROGRESS',
      },
      {
        clientId: c('Talleres Rápidos S.L.').id,
        title: 'Incidencia facturación eléctrica',
        description: 'Factura de enero con consumo anormalmente alto. Solicitada revisión a Repsol.',
        status: 'RESOLVED',
      },
      {
        clientId: c('Restaurante El Patio').id,
        title: 'Actualización valor continente',
        description: 'Tras reforma del local, el cliente solicita revisar el valor asegurado del continente.',
        status: 'OPEN',
      },
      {
        clientId: c('Francisco Ruiz Sánchez').id,
        title: 'Revisión anual póliza de vida',
        description: 'Revisión periódica de cobertura y actualización de beneficiarios.',
        status: 'RESOLVED',
      },
      {
        clientId: c('Pablo Navarro Gil').id,
        title: 'Gestión baja por impago',
        description: 'Póliza cancelada tras 3 recibos devueltos. Se comunica al cliente y se cierra el expediente.',
        status: 'CLOSED',
      },
      {
        clientId: c('Clínica DentalCare').id,
        title: 'Ampliación RC a nuevo profesional',
        description: 'Incorporación de nueva dentista al equipo. Pendiente de comunicar datos a Asisa para incluirla en póliza.',
        status: 'OPEN',
      },
    ],
  })

  console.log('  ✓ Cases')

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
  console.log('Database provisioning complete.')
}

main()
  .catch(e => {
    console.error('Provisioning failed:', e)
    process.exitCode = 1 // exit 1 after .finally so the shell && chain breaks
  })
  .finally(() => prisma.$disconnect())
