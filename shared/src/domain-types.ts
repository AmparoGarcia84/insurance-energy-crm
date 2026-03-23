export type UUID = string
export type ISODate = string // YYYY-MM-DD
export type ISODateTime = string // ISO 8601

// ----------------------------------------------------
// Shared / value types
// ----------------------------------------------------

export interface BaseEntity {
  id: UUID
  createdAt: ISODateTime
  updatedAt: ISODateTime
}

export enum AddressType {
  FISCAL = "fiscal",
  BUSINESS = "business",
  PERSONAL = "personal",
}

export const AddressTypeLabels: Record<AddressType, string> = {
  [AddressType.FISCAL]: "Dirección fiscal",
  [AddressType.BUSINESS]: "Dirección de la empresa",
  [AddressType.PERSONAL]: "Dirección particular",
}

export interface Address {
  street?: string      // covers former line1
  postalCode?: string
  city?: string
  province?: string   // covers former state
  country?: string
  type?: AddressType
}

// ----------------------------------------------------
// Client (Customer)
// ----------------------------------------------------

export enum ClientType {
  COMPANY = "COMPANY",
  COMMUNITY_OF_OWNERS = "COMMUNITY_OF_OWNERS",
  INDIVIDUAL = "INDIVIDUAL",
  BUSINESS = "BUSINESS",
  SELF_EMPLOYED = "SELF_EMPLOYED",
  PENSIONER = "PENSIONER",
  RETIRED = "RETIRED",
  COLLABORATOR = "COLLABORATOR",
  PROSPECT = "PROSPECT",
  OTHER = "OTHER",
  SUPPLIER = "SUPPLIER",
}

export const ClientTypeLabels: Record<ClientType, string> = {
  [ClientType.COMPANY]: "Sociedad",
  [ClientType.COMMUNITY_OF_OWNERS]: "Comunidad de propietarios",
  [ClientType.INDIVIDUAL]: "Particular",
  [ClientType.BUSINESS]: "Empresa",
  [ClientType.SELF_EMPLOYED]: "Autónomo",
  [ClientType.PENSIONER]: "Pensionista",
  [ClientType.RETIRED]: "Jubilado",
  [ClientType.COLLABORATOR]: "Colaborador",
  [ClientType.PROSPECT]: "Prospecto",
  [ClientType.OTHER]: "Otro",
  [ClientType.SUPPLIER]: "Proveedor",
}

export enum ClientStatus {
  LEAD = "LEAD",
  ACTIVE = "ACTIVE",
  PROSPECTING = "PROSPECTING",
  PAYMENT_DEFAULT = "PAYMENT_DEFAULT",
  HIGH_CLAIMS = "HIGH_CLAIMS",
  INACTIVE = "INACTIVE",
  LOST = "LOST",
}

export const ClientStatusLabels: Record<ClientStatus, string> = {
  [ClientStatus.LEAD]: "Contacto",
  [ClientStatus.ACTIVE]: "Activo",
  [ClientStatus.PROSPECTING]: "Captación",
  [ClientStatus.PAYMENT_DEFAULT]: "Impagos",
  [ClientStatus.HIGH_CLAIMS]: "Alta siniestralidad",
  [ClientStatus.INACTIVE]: "Baja",
  [ClientStatus.LOST]: "Perdido",
}

export enum ClientQualification {
  NEW_BUSINESS = "NEW_BUSINESS",
  PORTFOLIO = "PORTFOLIO",
  REFERRED_CLIENT = "REFERRED_CLIENT",
  BNI_REFERRAL = "BNI_REFERRAL",
  MARKETING_SOCIAL_MEDIA = "MARKETING_SOCIAL_MEDIA",
  MARKET_LOSS = "MARKET_LOSS",
  PROJECT_CANCELLED = "PROJECT_CANCELLED",
  CANCELLED = "CANCELLED",
  NOT_PROFITABLE = "NOT_PROFITABLE",
  PAYMENT_DEFAULT = "PAYMENT_DEFAULT",
}

export const ClientQualificationLabels: Record<ClientQualification, string> = {
  [ClientQualification.NEW_BUSINESS]: "Nuevo negocio",
  [ClientQualification.PORTFOLIO]: "Cartera",
  [ClientQualification.REFERRED_CLIENT]: "Cliente referenciado",
  [ClientQualification.BNI_REFERRAL]: "Referencias BNI",
  [ClientQualification.MARKETING_SOCIAL_MEDIA]: "Marketing y RRSS",
  [ClientQualification.MARKET_LOSS]: "Fallo de mercado",
  [ClientQualification.PROJECT_CANCELLED]: "Proyecto cancelado",
  [ClientQualification.CANCELLED]: "Anulado",
  [ClientQualification.NOT_PROFITABLE]: "No rentable",
  [ClientQualification.PAYMENT_DEFAULT]: "Impagos",
}

export enum CollectionManager {
  INSURANCE_COMPANY = "INSURANCE_COMPANY",
  BANK_TRANSFER = "BANK_TRANSFER",
  BROKER = "BROKER",
  CARD_PAYMENT = "CARD_PAYMENT",
  UNPAID = "UNPAID",
}

export const CollectionManagerLabels: Record<CollectionManager, string> = {
  [CollectionManager.INSURANCE_COMPANY]: "Compañía",
  [CollectionManager.BANK_TRANSFER]: "Transferencia bancaria",
  [CollectionManager.BROKER]: "Mediador",
  [CollectionManager.CARD_PAYMENT]: "Pago con tarjeta",
  [CollectionManager.UNPAID]: "Impagados",
}

export enum ClientActivity {
  LAW_FIRM = "LAW_FIRM",
  PROPERTY_MANAGEMENT = "PROPERTY_MANAGEMENT",
  ADMINISTRATIVE_SERVICES = "ADMINISTRATIVE_SERVICES",
  ADVERTISING_AGENCY = "ADVERTISING_AGENCY",
  TOURIST_APARTMENTS = "TOURIST_APARTMENTS",
  ARCHITECTS = "ARCHITECTS",
  ENERGY_CONSULTING = "ENERGY_CONSULTING",
  TAX_ADVISORY = "TAX_ADVISORY",
  HOME_CARE_SERVICES = "HOME_CARE_SERVICES",
  ASSOCIATIONS = "ASSOCIATIONS",
  CARPENTRY = "CARPENTRY",
  AESTHETIC_CLINICS = "AESTHETIC_CLINICS",
  SALES = "SALES",
  RETAIL = "RETAIL",
  COMMUNITY_OF_OWNERS = "COMMUNITY_OF_OWNERS",
  CONSTRUCTION_AND_RENOVATION = "CONSTRUCTION_AND_RENOVATION",
  CONSULTING = "CONSULTING",
  LASER_HAIR_REMOVAL = "LASER_HAIR_REMOVAL",
  WEB_OR_GRAPHIC_DESIGN = "WEB_OR_GRAPHIC_DESIGN",
  ELECTRICIAN = "ELECTRICIAN",
  PLUMBING = "PLUMBING",
  INDUSTRIAL_REFRIGERATION = "INDUSTRIAL_REFRIGERATION",
  FURNITURE_MANUFACTURING = "FURNITURE_MANUFACTURING",
  BEAUTY_SALONS = "BEAUTY_SALONS",
  HOSPITALITY = "HOSPITALITY",
  COSMETIC_INDUSTRY = "COSMETIC_INDUSTRY",
  PHARMACEUTICAL_INDUSTRY = "PHARMACEUTICAL_INDUSTRY",
  IT_AND_TELECOM = "IT_AND_TELECOM",
  ENGINEERING = "ENGINEERING",
  PHOTOVOLTAIC_INSTALLATIONS = "PHOTOVOLTAIC_INSTALLATIONS",
  INVESTORS = "INVESTORS",
  CLEANING_SERVICES = "CLEANING_SERVICES",
  DATA_PROTECTION = "DATA_PROTECTION",
  MECHANICS = "MECHANICS",
  PARISHES = "PARISHES",
  PENSIONERS_AND_RETIRED = "PENSIONERS_AND_RETIRED",
  JOURNALISM_AND_MEDIA = "JOURNALISM_AND_MEDIA",
  PAINTING_AND_PLASTERBOARD = "PAINTING_AND_PLASTERBOARD",
  OCCUPATIONAL_RISK_PREVENTION = "OCCUPATIONAL_RISK_PREVENTION",
  SALES_REPRESENTATIVE = "SALES_REPRESENTATIVE",
  HEALTHCARE = "HEALTHCARE",
  NOT_SPECIFIED = "NOT_SPECIFIED",
  TRANSPORT = "TRANSPORT",
  INSPECTION_TECHNICIANS = "INSPECTION_TECHNICIANS",
}

export const ClientActivityLabels: Record<ClientActivity, string> = {
  [ClientActivity.LAW_FIRM]: "Abogados",
  [ClientActivity.PROPERTY_MANAGEMENT]: "Admin. de fincas",
  [ClientActivity.ADMINISTRATIVE_SERVICES]: "Administrativos",
  [ClientActivity.ADVERTISING_AGENCY]: "Agencias de publicidad",
  [ClientActivity.TOURIST_APARTMENTS]: "Apartamentos turísticos",
  [ClientActivity.ARCHITECTS]: "Arquitectos",
  [ClientActivity.ENERGY_CONSULTING]: "Asesoría energética",
  [ClientActivity.TAX_ADVISORY]: "Asesorías fiscales",
  [ClientActivity.HOME_CARE_SERVICES]: "Asistencia domiciliaria y cuidado de personas",
  [ClientActivity.ASSOCIATIONS]: "Asociaciones",
  [ClientActivity.CARPENTRY]: "Carpinterías",
  [ClientActivity.AESTHETIC_CLINICS]: "Clínicas de estética",
  [ClientActivity.SALES]: "Comerciales",
  [ClientActivity.RETAIL]: "Comercio",
  [ClientActivity.COMMUNITY_OF_OWNERS]: "Comunidad de propietarios",
  [ClientActivity.CONSTRUCTION_AND_RENOVATION]: "Construcción y reformas",
  [ClientActivity.CONSULTING]: "Consultorías",
  [ClientActivity.LASER_HAIR_REMOVAL]: "Depilación láser",
  [ClientActivity.WEB_OR_GRAPHIC_DESIGN]: "Diseño web y/o diseño gráfico",
  [ClientActivity.ELECTRICIAN]: "Electricista",
  [ClientActivity.PLUMBING]: "Fontanería",
  [ClientActivity.INDUSTRIAL_REFRIGERATION]: "Frío industrial",
  [ClientActivity.FURNITURE_MANUFACTURING]: "Fábrica de muebles",
  [ClientActivity.BEAUTY_SALONS]: "Gabinetes de estética",
  [ClientActivity.HOSPITALITY]: "Hostelería",
  [ClientActivity.COSMETIC_INDUSTRY]: "Industria cosmética",
  [ClientActivity.PHARMACEUTICAL_INDUSTRY]: "Industria farmacéutica",
  [ClientActivity.IT_AND_TELECOM]: "Informática y telecomunicaciones",
  [ClientActivity.ENGINEERING]: "Ingenierías",
  [ClientActivity.PHOTOVOLTAIC_INSTALLATIONS]: "Instalaciones fotovoltaicas",
  [ClientActivity.INVESTORS]: "Inversores",
  [ClientActivity.CLEANING_SERVICES]: "Limpieza",
  [ClientActivity.DATA_PROTECTION]: "Lopd",
  [ClientActivity.MECHANICS]: "Mecánica",
  [ClientActivity.PARISHES]: "Parroquias",
  [ClientActivity.PENSIONERS_AND_RETIRED]: "Pensionistas y/o jubilados",
  [ClientActivity.JOURNALISM_AND_MEDIA]: "Periodistas y medios de la comunicación",
  [ClientActivity.PAINTING_AND_PLASTERBOARD]: "Pintura y/o pladur",
  [ClientActivity.OCCUPATIONAL_RISK_PREVENTION]: "Prevención de riesgos laborales",
  [ClientActivity.SALES_REPRESENTATIVE]: "Representante de comercio",
  [ClientActivity.HEALTHCARE]: "Sanitarios",
  [ClientActivity.NOT_SPECIFIED]: "Sin informar",
  [ClientActivity.TRANSPORT]: "Transportes",
  [ClientActivity.INSPECTION_TECHNICIANS]: "Técnicos de inspección",
}

export enum ClientSector {
  PROPERTY_MANAGEMENT = "PROPERTY_MANAGEMENT",
  ADVERTISING_AND_MARKETING = "ADVERTISING_AND_MARKETING",
  INSURANCE_AGENT = "INSURANCE_AGENT",
  ADVISORY_SERVICES = "ADVISORY_SERVICES",
  RELIGIOUS_AND_SOCIAL_ASSOCIATIONS = "RELIGIOUS_AND_SOCIAL_ASSOCIATIONS",
  SPORTS_ASSOCIATIONS = "SPORTS_ASSOCIATIONS",
  METAL_TRADE = "METAL_TRADE",
  COMMUNITY_OF_OWNERS = "COMMUNITY_OF_OWNERS",
  VEHICLE_DEALERSHIPS = "VEHICLE_DEALERSHIPS",
  CONSTRUCTION = "CONSTRUCTION",
  CONSULTING_AND_FINANCIAL_ADVISORY = "CONSULTING_AND_FINANCIAL_ADVISORY",
  EDUCATION_AND_TRAINING = "EDUCATION_AND_TRAINING",
  LARGE_COMPANY = "LARGE_COMPANY",
  SME = "SME",
  STUDENTS = "STUDENTS",
  PHARMACIES = "PHARMACIES",
  COSMETIC_AND_PHARMACEUTICAL_INDUSTRY = "COSMETIC_AND_PHARMACEUTICAL_INDUSTRY",
  WOOD_INDUSTRY = "WOOD_INDUSTRY",
  METAL_INDUSTRY = "METAL_INDUSTRY",
  INDUSTRY = "INDUSTRY",
  REAL_ESTATE = "REAL_ESTATE",
  NON_MANAGEMENT_ISV = "NON_MANAGEMENT_ISV",
  LEGAL_AND_FINANCIAL = "LEGAL_AND_FINANCIAL",
  MEDIA = "MEDIA",
  OFFICES_AND_FIRMS = "OFFICES_AND_FIRMS",
  UNEMPLOYED = "UNEMPLOYED",
  INDIVIDUALS = "INDIVIDUALS",
  PENSIONERS_AND_RETIRED = "PENSIONERS_AND_RETIRED",
  JOURNALISM = "JOURNALISM",
  PROFESSIONALS_AND_INSTALLERS = "PROFESSIONALS_AND_INSTALLERS",
  SERVICE_PROVIDER = "SERVICE_PROVIDER",
  HEALTHCARE = "HEALTHCARE",
  BUSINESS_SERVICES = "BUSINESS_SERVICES",
  PROFESSIONAL_SERVICES = "PROFESSIONAL_SERVICES",
  NOT_SPECIFIED = "NOT_SPECIFIED",
  WORKSHOPS = "WORKSHOPS",
  TECHNOLOGY = "TECHNOLOGY",
  TELECOMMUNICATIONS = "TELECOMMUNICATIONS",
  TRANSPORT = "TRANSPORT",
}

export const ClientSectorLabels: Record<ClientSector, string> = {
  [ClientSector.PROPERTY_MANAGEMENT]: "Administraciones de fincas",
  [ClientSector.ADVERTISING_AND_MARKETING]: "Agencias de publicidad y marketing",
  [ClientSector.INSURANCE_AGENT]: "Agente de seguros",
  [ClientSector.ADVISORY_SERVICES]: "Asesorías",
  [ClientSector.RELIGIOUS_AND_SOCIAL_ASSOCIATIONS]: "Asociaciones de culto y sociales",
  [ClientSector.SPORTS_ASSOCIATIONS]: "Asociaciones deportivas",
  [ClientSector.METAL_TRADE]: "Comercio del metal",
  [ClientSector.COMMUNITY_OF_OWNERS]: "Comunidades de propietarios",
  [ClientSector.VEHICLE_DEALERSHIPS]: "Concesionarios de vehículos",
  [ClientSector.CONSTRUCTION]: "Construcción",
  [ClientSector.CONSULTING_AND_FINANCIAL_ADVISORY]: "Consultorías, economistas y asesorías",
  [ClientSector.EDUCATION_AND_TRAINING]: "Educación y formación",
  [ClientSector.LARGE_COMPANY]: "Empresa grande",
  [ClientSector.SME]: "Empresa pequeña/mediana",
  [ClientSector.STUDENTS]: "Estudiantes",
  [ClientSector.PHARMACIES]: "Farmacias",
  [ClientSector.COSMETIC_AND_PHARMACEUTICAL_INDUSTRY]: "Industria cosmética y farmacéutica",
  [ClientSector.WOOD_INDUSTRY]: "Industria de la madera",
  [ClientSector.METAL_INDUSTRY]: "Industria del metal",
  [ClientSector.INDUSTRY]: "Industrias",
  [ClientSector.REAL_ESTATE]: "Inmobiliarias",
  [ClientSector.NON_MANAGEMENT_ISV]: "ISV de no gestión",
  [ClientSector.LEGAL_AND_FINANCIAL]: "Legal y financiero",
  [ClientSector.MEDIA]: "Medios de comunicación",
  [ClientSector.OFFICES_AND_FIRMS]: "Oficinas y despachos",
  [ClientSector.UNEMPLOYED]: "Parados",
  [ClientSector.INDIVIDUALS]: "Particulares",
  [ClientSector.PENSIONERS_AND_RETIRED]: "Pensionistas y/o jubilados",
  [ClientSector.JOURNALISM]: "Periodismo",
  [ClientSector.PROFESSIONALS_AND_INSTALLERS]: "Profesionales e instaladores",
  [ClientSector.SERVICE_PROVIDER]: "Proveedor de servicios",
  [ClientSector.HEALTHCARE]: "Sanitario",
  [ClientSector.BUSINESS_SERVICES]: "Servicios para empresas",
  [ClientSector.PROFESSIONAL_SERVICES]: "Servicios profesionales",
  [ClientSector.NOT_SPECIFIED]: "Sin informar",
  [ClientSector.WORKSHOPS]: "Talleres",
  [ClientSector.TECHNOLOGY]: "Tecnología",
  [ClientSector.TELECOMMUNICATIONS]: "Telecomunicaciones",
  [ClientSector.TRANSPORT]: "Transportes",
}

export interface ConsentRecord {
  consentGiven?: boolean
  consentAt?: ISODateTime
  source?: string // BNI, web, RRSS...
}

export interface TypedAddress extends Address {
  type?: AddressType
}

export interface ClientContactInfo {
  mobilePhone?: string
  phone?: string
  secondaryPhone?: string
  email?: string
  fax?: string
  website?: string
}

export interface Client {
  // Identificación
  id: string
  clientNumber?: string
  name: string
  nif?: string

  // Campos incorporados desde Customer (eliminado)
  displayName?: string
  legalName?: string
  tags?: string[]
  consent?: ConsentRecord

  // Integraciones / sistemas externos
  contractsCounterpartyId?: string

  // Clasificación
  type?: ClientType
  status?: ClientStatus
  qualification?: ClientQualification
  activity?: ClientActivity
  sector?: ClientSector

  // Fechas / documentos
  birthDate?: ISODate
  drivingLicenseIssueDate?: ISODate
  dniExpiryDate?: ISODate

  // Contacto
  contact?: ClientContactInfo

  // Direcciones
  mainAddress?: Address
  secondaryAddress?: TypedAddress
  billingAddress?: Address

  // Facturación
  iban?: string // array con iban personal y empresa

  // Empresa
  employees?: number
  annualRevenue?: number
  sicCode?: string

  // Gestión comercial
  accountOwnerUserId?: string
  commercialAgentUserId?: string
  gexbrokExecutiveUserId?: string // dato que no nos interesa pero se descarga, ignorar?
  collectionManager?: CollectionManager

  // Jerarquía (para agrupar contactos bajo una empresa/cliente principal)
  isMainClient?: boolean
  mainClientId?: string

  // Observaciones
  description?: string
}

// ----------------------------------------------------
// Sale (Venta / Opportunity)
// ----------------------------------------------------

export enum SaleType {
  INSURANCE = "INSURANCE",
  ENERGY = "ENERGY",
}

export enum InsuranceSaleStage {
  RESPONSE_PENDING = "RESPONSE_PENDING",       // Pte. respuesta
  DOCUMENTS_PENDING = "DOCUMENTS_PENDING",     // Pte. documentación
  SIGNATURE_PENDING = "SIGNATURE_PENDING",     // Pte. firma
  ISSUANCE_PENDING = "ISSUANCE_PENDING",       // Firmado / Pte. emisión
  BILLING_THIS_MONTH = "BILLING_THIS_MONTH",   // Cobro este MES
  BILLING_NEXT_MONTH = "BILLING_NEXT_MONTH",   // Cobro MES SIGUIENTE
  RECURRENT_BILLING = "RECURRENT_BILLING",     // Pte. cobro vtos. RECURRENTES
  WRONG_SETTLEMENT = "WRONG_SETTLEMENT",       // Liquidación errónea Pte.
  BILLED_AND_PAID = "BILLED_AND_PAID",         // Cobrado y facturado
  CANCELED_UNPAID = "CANCELED_UNPAID",         // Anulado por impago
  NOT_INSURABLE = "NOT_INSURABLE",             // Anulado no asegurable
  KO_SCORING = "KO_SCORING",                  // KO scoring
  LOST = "LOST",                               // Perdido
  INVOICE_PENDING_PAYMENT = "INVOICE_PENDING_PAYMENT", // Factura emitida pte. cobro
}

export enum EnergySaleStage {
  RESPONSE_PENDING = "RESPONSE_PENDING",
  DOCUMENTS_PENDING = "DOCUMENTS_PENDING",
  SIGNATURE_PENDING = "SIGNATURE_PENDING",
  ACTIVATION_PENDING = "ACTIVATION_PENDING",
  BILLING_THIS_MONTH = "BILLING_THIS_MONTH",
  BILLED_AND_PAID = "BILLED_AND_PAID",
  LOST = "LOST",
}

export interface Sale extends BaseEntity {
  clientId: UUID

  type: SaleType

  /** Name shown in pipeline and detail views. */
  title: string // e.g. "Home Insurance - Ana Martínez"

  /** Company/insurer for insurance; retailer for energy. */
  companyName?: string

  /** Branch / line of business (Home, Auto, Life, etc.). */
  insuranceBranch?: string

  /** Free text like 'New policy', 'Renewal', 'Cross-sell'. */
  saleKind?: string

  /** Monetary value or yearly premium (for insurance). */
  expectedRevenue?: number

  /** Expected savings per year (for energy). */
  expectedSavingsPerYear?: number

  /** Probability (0–100) used in dashboard and deal detail. */
  probabilityPercent?: number

  /** Current stage in the pipeline. */
  insuranceStage?: InsuranceSaleStage
  energyStage?: EnergySaleStage

  /** Important dates. */
  expectedCloseDate?: ISODate
  issueDate?: ISODate
  billingDate?: ISODate

  /** Links to related entities. */
  policyNumber?: string
  contractId?: string

  /** Owner / advisor responsible for this sale. */
  ownerUserId?: UUID

  /** Next action shown in sale detail. */
  nextStep?: string

  /** Reason the sale was lost (from Deal). */
  lostReason?: string

  /** Long description used in forms and detail view. */
  description?: string
}

// ----------------------------------------------------
// Case (Caso / Incident / Claim)
// ----------------------------------------------------

export enum CaseStatus {
  NEW = "NEW",
  ON_HOLD = "ON_HOLD",
  FORWARDED = "FORWARDED",
  CLOSED = "CLOSED",
}

export enum CasePriority {
  HIGH = "HIGH",
  MEDIUM = "MEDIUM",
  LOW = "LOW",
}

export enum CaseOrigin {
  CLAIMS = "CLAIMS",                   // SINIESTROS
  DATA_CHANGE = "DATA_CHANGE",         // CAMBIO DE DATOS
  GAS_DISTRIBUTION = "GAS_DISTRIBUTION", // DISTRIBUCIÓN GAS
  ACTIVATIONS = "ACTIVATIONS",         // ACTIVACIONES
  POWER_DISTRIBUTION = "POWER_DISTRIBUTION", // DISTRIBUCIÓN LUZ
  POWER_CHANGE = "POWER_CHANGE",       // POTENCIA
  VIRTUAL_BATTERY = "VIRTUAL_BATTERY", // BATERÍA VIRTUAL
  BROKER_CHANGE = "BROKER_CHANGE",     // CAMBIO DE MEDIADOR
  SELF_CONSUMPTION = "SELF_CONSUMPTION", // AUTOCONSUMO
  HIGH_BILL = "HIGH_BILL",             // FACTURA ELEVADA
}

export enum CaseType {
  ISSUE = "ISSUE",                         // Problema
  FEATURE_REQUEST = "FEATURE_REQUEST",     // Solicitud de característica
  QUESTION = "QUESTION",                   // Pregunta
}

export interface Case extends BaseEntity {
  /** Human readable case id, e.g. CAS-SEG-001. */
  caseNumber: string

  clientId: UUID
  /** Optional link to the related sale/opportunity. */
  saleId?: UUID

  status: CaseStatus
  priority: CasePriority
  origin: CaseOrigin
  type: CaseType

  /** People involved. */
  ownerUserId: UUID       // Case owner (propietario de caso)
  reportedByName?: string // Informado por
  reportedByPhone?: string
  reportedByEmail?: string

  /** High level information. */
  subject: string        // Asunto
  productName?: string   // Nombre de producto
  saleName?: string      // Nombre de venta

  /** Narrative fields. */
  description?: string
  internalComments?: string
  resolution?: string
}

// ----------------------------------------------------
// Task
// ----------------------------------------------------

export enum TaskStatus {
  TODO = "TODO",
  DOING = "DOING",
  DONE = "DONE",
  CANCELED = "CANCELED",
}

export interface Task extends BaseEntity {
  title: string
  status: TaskStatus
  priority?: "LOW" | "MEDIUM" | "HIGH"
  dueAt?: ISODateTime
  clientId?: UUID
  dealId?: UUID
  assignedToUserId?: UUID
}

// ----------------------------------------------------
// Policy
// ----------------------------------------------------

export enum InsuranceBranch {
  HOGAR = "HOGAR",
  AUTO = "AUTO",
  VIDA = "VIDA",
  SALUD = "SALUD",
  RC = "RC",
  COMERCIO = "COMERCIO",
  INDUSTRIAL = "INDUSTRIAL",
  OTROS = "OTROS",
}

export enum PolicyStatus {
  ACTIVE = "ACTIVE",
  PENDING_DOCS = "PENDING_DOCS",
  CANCELED = "CANCELED",
  EXPIRED = "EXPIRED",
}

export enum PaymentFrequency {
  MONTHLY = "MONTHLY",
  QUARTERLY = "QUARTERLY",
  SEMIANNUAL = "SEMIANNUAL",
  ANNUAL = "ANNUAL",
}

export interface Policy extends BaseEntity {
  clientId: UUID
  dealId?: UUID
  insurer?: string
  branch: InsuranceBranch
  policyNumber?: string
  status: PolicyStatus
  startDate?: ISODate
  endDate?: ISODate
  renewalDate?: ISODate
  paymentFrequency?: PaymentFrequency
  premiumAmount?: number
  commissionAmount?: number
}

// ----------------------------------------------------
// Claim
// ----------------------------------------------------

export enum ClaimStage {
  OPENED = "OPENED",
  DOCUMENTATION = "DOCUMENTATION",
  PROCESSING = "PROCESSING",
  EXPERT_REVIEW = "EXPERT_REVIEW",
  RESOLVED = "RESOLVED",
  CLOSED = "CLOSED",
}

export interface Claim extends BaseEntity {
  clientId: UUID
  dealId?: UUID
  policyId?: UUID
  stage: ClaimStage
  incidentDate: ISODate
  reportedDate?: ISODate
  description?: string
  referenceNumber?: string
  nextActionAt?: ISODateTime
}

// ----------------------------------------------------
// Energy
// ----------------------------------------------------

export enum SupplyType {
  ELECTRICITY = "ELECTRICITY",
  GAS = "GAS",
}

export enum EnergyContractStatus {
  IN_PROGRESS = "IN_PROGRESS",
  ACTIVE = "ACTIVE",
  CANCELED = "CANCELED",
}

export enum EnergyStudyStatus {
  DRAFT = "DRAFT",
  IN_PROGRESS = "IN_PROGRESS",
  OFFER_SENT = "OFFER_SENT",
  APPROVED = "APPROVED",
  REJECTED = "REJECTED",
}

export interface EnergyContract extends BaseEntity {
  clientId: UUID
  dealId?: UUID
  supplyType: SupplyType
  cups?: string
  tariff?: string
  retailer?: string
  distributor?: string
  status: EnergyContractStatus
  startDate?: ISODate
  endDate?: ISODate
  hasPermanence?: boolean
  permanenceEndDate?: ISODate
}

export interface EnergyStudy extends BaseEntity {
  clientId: UUID
  dealId?: UUID
  cups?: string
  status: EnergyStudyStatus
  currentTariff?: string
  proposedTariff?: string
  estimatedAnnualSavings?: number
  recommendations?: string
}

export interface EnergyStudyInput extends BaseEntity {
  energyStudyId: UUID
  period: string
  kwh?: number
  kwMax?: number
  reactiveKvarh?: number
}

// ----------------------------------------------------
// Workday / HR
// ----------------------------------------------------

export enum WorkMode {
  REMOTE = "REMOTE",
}

export enum WorkdayStatus {
  OPEN = "OPEN",
  CLOSED = "CLOSED",
  RECTIFIED = "RECTIFIED",
}

export enum SegmentType {
  WORK = "WORK",
  BREAK = "BREAK",
}

export enum AdjustmentReason {
  FORGOT = "FORGOT",
  INTERNET = "INTERNET",
  APPOINTMENT = "APPOINTMENT",
  OTHER = "OTHER",
}

export enum AdjustmentStatus {
  PENDING = "PENDING",
  APPROVED = "APPROVED",
  REJECTED = "REJECTED",
}

export interface Employee extends BaseEntity {
  displayName: string
  email?: string
  weeklyHours: number
  workingDays?: number[]
  mode: WorkMode
}

export interface Workday extends BaseEntity {
  employeeId: UUID
  date: ISODate
  status: WorkdayStatus
  totalWorkMinutes: number
  totalBreakMinutes: number
}

export interface WorkSegment extends BaseEntity {
  workdayId: UUID
  type: SegmentType
  startAt: ISODateTime
  endAt?: ISODateTime
  durationMinutes: number
}

export interface WorkAdjustmentRequest extends BaseEntity {
  employeeId: UUID
  workdayId: UUID
  segmentId?: UUID
  reason: AdjustmentReason
  proposedStartAt?: ISODateTime
  proposedEndAt?: ISODateTime
  status: AdjustmentStatus
  reviewedByUserId: UUID
  reviewedAt?: ISODateTime
  auditBefore?: Record<string, unknown>
  auditAfter?: Record<string, unknown>
}

// ----------------------------------------------------
// Notes, Attachments, Activity
// ----------------------------------------------------

export enum EntityType {
  CLIENT = "CLIENT",
  TASK = "TASK",
  POLICY = "POLICY",
  CLAIM = "CLAIM",
  ENERGY_CONTRACT = "ENERGY_CONTRACT",
  ENERGY_STUDY = "ENERGY_STUDY",
  WORKDAY = "WORKDAY",
  WORK_SEGMENT = "WORK_SEGMENT",
}

export enum ActivityType {
  CALL = "CALL",
  EMAIL = "EMAIL",
  WHATSAPP_NOTE = "WHATSAPP_NOTE",
  MEETING = "MEETING",
  STAGE_CHANGED = "STAGE_CHANGED",
  DOC_UPLOADED = "DOC_UPLOADED",
  EXPORT = "EXPORT",
  CREATED = "CREATED",
  UPDATED = "UPDATED",
}

export interface Note extends BaseEntity {
  entityType: EntityType
  entityId: UUID
  body: string
  createdByUserId?: UUID
}

export interface Attachment extends BaseEntity {
  entityType: EntityType
  entityId: UUID
  filename: string
  url: string
  mimeType?: string
  sizeBytes?: number
}

export interface ActivityLog extends BaseEntity {
  entityType: EntityType
  entityId: UUID
  type: ActivityType
  summary: string
  metadata?: Record<string, unknown>
}

// ----------------------------------------------------
// User
// ----------------------------------------------------

export enum UserRole {
  OWNER = "OWNER",
  EMPLOYEE = "EMPLOYEE",
}

export interface User extends BaseEntity {
  role: UserRole
  displayName: string
  email: string
}
