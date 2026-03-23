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
  COMPANY = "company",
  COMMUNITY_OF_OWNERS = "community_of_owners",
  INDIVIDUAL = "individual",
  SELF_EMPLOYED = "self_employed",
  PENSIONER = "pensioner",
  RETIRED = "retired",
  COLLABORATOR = "collaborator",
  PROSPECT = "prospect",
  OTHER = "other",
  SUPPLIER = "supplier",
}

export enum ClientStatus {
  LEAD = "lead",
  ACTIVE = "active",
  PROSPECTING = "prospecting",
  PAYMENT_DEFAULT = "payment_default",
  HIGH_CLAIMS = "high_claims",
  INACTIVE = "inactive",
}

export const ClientStatusLabels: Record<ClientStatus, string> = {
  [ClientStatus.LEAD]: "Contacto",
  [ClientStatus.ACTIVE]: "Activo",
  [ClientStatus.PROSPECTING]: "Captación",
  [ClientStatus.PAYMENT_DEFAULT]: "Impagos",
  [ClientStatus.HIGH_CLAIMS]: "Alta siniestralidad",
  [ClientStatus.INACTIVE]: "Baja",
}

export enum ClientQualification {
  NEW_BUSINESS = "new_business",
  PORTFOLIO = "portfolio",
  REFERRED_CLIENT = "referred_client",
  BNI_REFERRAL = "bni_referral",
  MARKETING_SOCIAL_MEDIA = "marketing_social_media",
  MARKET_LOSS = "market_loss",
  PROJECT_CANCELLED = "project_cancelled",
  CANCELLED = "cancelled",
  NOT_PROFITABLE = "not_profitable",
  PAYMENT_DEFAULT = "payment_default",
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
  INSURANCE_COMPANY = "insurance_company",
  BANK_TRANSFER = "bank_transfer",
  BROKER = "broker",
  CARD_PAYMENT = "card_payment",
  UNPAID = "unpaid",
}

export const CollectionManagerLabels: Record<CollectionManager, string> = {
  [CollectionManager.INSURANCE_COMPANY]: "Compañía",
  [CollectionManager.BANK_TRANSFER]: "Transferencia bancaria",
  [CollectionManager.BROKER]: "Mediador",
  [CollectionManager.CARD_PAYMENT]: "Pago con tarjeta",
  [CollectionManager.UNPAID]: "Impagados",
}

export enum ClientActivity {
  LAW_FIRM = "law_firm",
  PROPERTY_MANAGEMENT = "property_management",
  ADMINISTRATIVE_SERVICES = "administrative_services",
  ADVERTISING_AGENCY = "advertising_agency",
  TOURIST_APARTMENTS = "tourist_apartments",
  ARCHITECTS = "architects",
  ENERGY_CONSULTING = "energy_consulting",
  TAX_ADVISORY = "tax_advisory",
  HOME_CARE_SERVICES = "home_care_services",
  ASSOCIATIONS = "associations",
  CARPENTRY = "carpentry",
  AESTHETIC_CLINICS = "aesthetic_clinics",
  SALES = "sales",
  RETAIL = "retail",
  COMMUNITY_OF_OWNERS = "community_of_owners",
  CONSTRUCTION_AND_RENOVATION = "construction_and_renovation",
  CONSULTING = "consulting",
  LASER_HAIR_REMOVAL = "laser_hair_removal",
  WEB_OR_GRAPHIC_DESIGN = "web_or_graphic_design",
  ELECTRICIAN = "electrician",
  PLUMBING = "plumbing",
  INDUSTRIAL_REFRIGERATION = "industrial_refrigeration",
  FURNITURE_MANUFACTURING = "furniture_manufacturing",
  BEAUTY_SALONS = "beauty_salons",
  HOSPITALITY = "hospitality",
  COSMETIC_INDUSTRY = "cosmetic_industry",
  PHARMACEUTICAL_INDUSTRY = "pharmaceutical_industry",
  IT_AND_TELECOM = "it_and_telecom",
  ENGINEERING = "engineering",
  PHOTOVOLTAIC_INSTALLATIONS = "photovoltaic_installations",
  INVESTORS = "investors",
  CLEANING_SERVICES = "cleaning_services",
  DATA_PROTECTION = "data_protection",
  MECHANICS = "mechanics",
  PARISHES = "parishes",
  PENSIONERS_AND_RETIRED = "pensioners_and_retired",
  JOURNALISM_AND_MEDIA = "journalism_and_media",
  PAINTING_AND_PLASTERBOARD = "painting_and_plasterboard",
  OCCUPATIONAL_RISK_PREVENTION = "occupational_risk_prevention",
  SALES_REPRESENTATIVE = "sales_representative",
  HEALTHCARE = "healthcare",
  NOT_SPECIFIED = "not_specified",
  TRANSPORT = "transport",
  INSPECTION_TECHNICIANS = "inspection_technicians",
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
  PROPERTY_MANAGEMENT = "property_management",
  ADVERTISING_AND_MARKETING = "advertising_and_marketing",
  INSURANCE_AGENT = "insurance_agent",
  ADVISORY_SERVICES = "advisory_services",
  RELIGIOUS_AND_SOCIAL_ASSOCIATIONS = "religious_and_social_associations",
  SPORTS_ASSOCIATIONS = "sports_associations",
  METAL_TRADE = "metal_trade",
  COMMUNITY_OF_OWNERS = "community_of_owners",
  VEHICLE_DEALERSHIPS = "vehicle_dealerships",
  CONSTRUCTION = "construction",
  CONSULTING_AND_FINANCIAL_ADVISORY = "consulting_and_financial_advisory",
  EDUCATION_AND_TRAINING = "education_and_training",
  LARGE_COMPANY = "large_company",
  SME = "sme",
  STUDENTS = "students",
  PHARMACIES = "pharmacies",
  COSMETIC_AND_PHARMACEUTICAL_INDUSTRY = "cosmetic_and_pharmaceutical_industry",
  WOOD_INDUSTRY = "wood_industry",
  METAL_INDUSTRY = "metal_industry",
  INDUSTRY = "industry",
  REAL_ESTATE = "real_estate",
  NON_MANAGEMENT_ISV = "non_management_isv",
  LEGAL_AND_FINANCIAL = "legal_and_financial",
  MEDIA = "media",
  OFFICES_AND_FIRMS = "offices_and_firms",
  UNEMPLOYED = "unemployed",
  INDIVIDUALS = "individuals",
  PENSIONERS_AND_RETIRED = "pensioners_and_retired",
  JOURNALISM = "journalism",
  PROFESSIONALS_AND_INSTALLERS = "professionals_and_installers",
  SERVICE_PROVIDER = "service_provider",
  HEALTHCARE = "healthcare",
  BUSINESS_SERVICES = "business_services",
  PROFESSIONAL_SERVICES = "professional_services",
  NOT_SPECIFIED = "not_specified",
  WORKSHOPS = "workshops",
  TECHNOLOGY = "technology",
  TELECOMMUNICATIONS = "telecommunications",
  TRANSPORT = "transport",
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
