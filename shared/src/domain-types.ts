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
  FISCAL   = "FISCAL",
  BUSINESS = "BUSINESS",
  PERSONAL = "PERSONAL",
}

export const AddressTypeLabels: Record<AddressType, string> = {
  [AddressType.FISCAL]:   "Fiscal",
  [AddressType.BUSINESS]: "Empresa",
  [AddressType.PERSONAL]: "Particular",
}

export interface Address {
  street?: string
  postalCode?: string
  city?: string
  province?: string
  country?: string
  type?: AddressType
}

// ----------------------------------------------------
// Client addresses, bank accounts and emails
// ----------------------------------------------------

export interface ClientAddressInput {
  type: AddressType
  street?: string
  postalCode?: string
  city?: string
  province?: string
  country?: string
}

export interface ClientAddress extends ClientAddressInput {
  id: string
}

export enum AccountType {
  PERSONAL = "PERSONAL",
  BUSINESS = "BUSINESS",
  CLIENTS  = "CLIENTS",
}

export const AccountTypeLabels: Record<AccountType, string> = {
  [AccountType.PERSONAL]: "Personal",
  [AccountType.BUSINESS]: "Empresa",
  [AccountType.CLIENTS]:  "Clientes",
}

export interface ClientBankAccountInput {
  type: AccountType
  iban: string
}

export interface ClientBankAccount extends ClientBankAccountInput {
  id: string
}

export interface ClientEmailInput {
  address: string
  isPrimary: boolean
  label?: string
  labelColor?: string
}

export interface ClientEmail extends ClientEmailInput {
  id: string
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
  AGRICULTURE = "AGRICULTURE",
  AIR_CONDITIONING = "AIR_CONDITIONING",
  TOURIST_APARTMENTS = "TOURIST_APARTMENTS",
  ARCHITECTS = "ARCHITECTS",
  ENERGY_CONSULTING = "ENERGY_CONSULTING",
  TAX_ADVISORY = "TAX_ADVISORY",
  HOME_CARE_SERVICES = "HOME_CARE_SERVICES",
  ASSOCIATIONS = "ASSOCIATIONS",
  BAKERY = "BAKERY",
  BAR_CAFE = "BAR_CAFE",
  CARPENTRY = "CARPENTRY",
  CATERING = "CATERING",
  AESTHETIC_CLINICS = "AESTHETIC_CLINICS",
  CHILDCARE = "CHILDCARE",
  SALES = "SALES",
  RETAIL = "RETAIL",
  COMMUNITY_OF_OWNERS = "COMMUNITY_OF_OWNERS",
  CONSTRUCTION_AND_RENOVATION = "CONSTRUCTION_AND_RENOVATION",
  CONSULTING = "CONSULTING",
  COURIER_LOGISTICS = "COURIER_LOGISTICS",
  DENTIST = "DENTIST",
  LASER_HAIR_REMOVAL = "LASER_HAIR_REMOVAL",
  WEB_OR_GRAPHIC_DESIGN = "WEB_OR_GRAPHIC_DESIGN",
  DRIVING_SCHOOL = "DRIVING_SCHOOL",
  EDUCATION_CENTER = "EDUCATION_CENTER",
  ELECTRICIAN = "ELECTRICIAN",
  ELECTRONICS_RETAIL = "ELECTRONICS_RETAIL",
  PLUMBING = "PLUMBING",
  FLORIST = "FLORIST",
  FOOD_INDUSTRY = "FOOD_INDUSTRY",
  FOOD_RETAIL = "FOOD_RETAIL",
  INDUSTRIAL_REFRIGERATION = "INDUSTRIAL_REFRIGERATION",
  FUNERAL_SERVICES = "FUNERAL_SERVICES",
  FURNITURE_MANUFACTURING = "FURNITURE_MANUFACTURING",
  GARDENING = "GARDENING",
  BEAUTY_SALONS = "BEAUTY_SALONS",
  GYM_FITNESS = "GYM_FITNESS",
  HAIRDRESSER = "HAIRDRESSER",
  HARDWARE_STORE = "HARDWARE_STORE",
  HOSPITALITY = "HOSPITALITY",
  HOTEL = "HOTEL",
  COSMETIC_INDUSTRY = "COSMETIC_INDUSTRY",
  PHARMACEUTICAL_INDUSTRY = "PHARMACEUTICAL_INDUSTRY",
  IT_AND_TELECOM = "IT_AND_TELECOM",
  INSURANCE_BROKER = "INSURANCE_BROKER",
  ENGINEERING = "ENGINEERING",
  PHOTOVOLTAIC_INSTALLATIONS = "PHOTOVOLTAIC_INSTALLATIONS",
  INVESTORS = "INVESTORS",
  JEWELRY = "JEWELRY",
  CLEANING_SERVICES = "CLEANING_SERVICES",
  LANGUAGE_SCHOOL = "LANGUAGE_SCHOOL",
  LAUNDRY = "LAUNDRY",
  DATA_PROTECTION = "DATA_PROTECTION",
  LOCKSMITH = "LOCKSMITH",
  MECHANICS = "MECHANICS",
  METAL_INDUSTRY = "METAL_INDUSTRY",
  MUSIC_ACADEMY = "MUSIC_ACADEMY",
  PARISHES = "PARISHES",
  PENSIONERS_AND_RETIRED = "PENSIONERS_AND_RETIRED",
  JOURNALISM_AND_MEDIA = "JOURNALISM_AND_MEDIA",
  NURSING_HOME = "NURSING_HOME",
  OPTICIAN = "OPTICIAN",
  PAINTING_AND_PLASTERBOARD = "PAINTING_AND_PLASTERBOARD",
  PHARMACY = "PHARMACY",
  PHOTOGRAPHY = "PHOTOGRAPHY",
  PHYSIOTHERAPY = "PHYSIOTHERAPY",
  PRINTING_SERVICES = "PRINTING_SERVICES",
  PRIVATE_DETECTIVE = "PRIVATE_DETECTIVE",
  OCCUPATIONAL_RISK_PREVENTION = "OCCUPATIONAL_RISK_PREVENTION",
  REAL_ESTATE_AGENCY = "REAL_ESTATE_AGENCY",
  SALES_REPRESENTATIVE = "SALES_REPRESENTATIVE",
  HEALTHCARE = "HEALTHCARE",
  ROOFING = "ROOFING",
  SECURITY_SERVICES = "SECURITY_SERVICES",
  NOT_SPECIFIED = "NOT_SPECIFIED",
  SPA_WELLNESS = "SPA_WELLNESS",
  SPORTS_CLUB = "SPORTS_CLUB",
  SPORTS_STORE = "SPORTS_STORE",
  TRANSPORT = "TRANSPORT",
  TEMP_AGENCY = "TEMP_AGENCY",
  TEXTILE_RETAIL = "TEXTILE_RETAIL",
  TILING = "TILING",
  INSPECTION_TECHNICIANS = "INSPECTION_TECHNICIANS",
  TRAVEL_AGENCY = "TRAVEL_AGENCY",
  VETERINARY = "VETERINARY",
}

export const ClientActivityLabels: Record<ClientActivity, string> = {
  [ClientActivity.LAW_FIRM]: "Abogados",
  [ClientActivity.PROPERTY_MANAGEMENT]: "Admin. de fincas",
  [ClientActivity.ADMINISTRATIVE_SERVICES]: "Administrativos",
  [ClientActivity.ADVERTISING_AGENCY]: "Agencias de publicidad",
  [ClientActivity.AGRICULTURE]: "Agricultura",
  [ClientActivity.AIR_CONDITIONING]: "Climatización y aire acondicionado",
  [ClientActivity.TOURIST_APARTMENTS]: "Apartamentos turísticos",
  [ClientActivity.ARCHITECTS]: "Arquitectos",
  [ClientActivity.ENERGY_CONSULTING]: "Asesoría energética",
  [ClientActivity.TAX_ADVISORY]: "Asesorías fiscales",
  [ClientActivity.HOME_CARE_SERVICES]: "Asistencia domiciliaria y cuidado de personas",
  [ClientActivity.ASSOCIATIONS]: "Asociaciones",
  [ClientActivity.DRIVING_SCHOOL]: "Autoescuela",
  [ClientActivity.BAR_CAFE]: "Bar y cafetería",
  [ClientActivity.CARPENTRY]: "Carpinterías",
  [ClientActivity.CATERING]: "Catering",
  [ClientActivity.AESTHETIC_CLINICS]: "Clínicas de estética",
  [ClientActivity.DENTIST]: "Clínica dental",
  [ClientActivity.SPORTS_CLUB]: "Club deportivo",
  [ClientActivity.SALES]: "Comerciales",
  [ClientActivity.RETAIL]: "Comercio",
  [ClientActivity.ELECTRONICS_RETAIL]: "Comercio de electrónica",
  [ClientActivity.TEXTILE_RETAIL]: "Comercio textil",
  [ClientActivity.COMMUNITY_OF_OWNERS]: "Comunidad de propietarios",
  [ClientActivity.CONSTRUCTION_AND_RENOVATION]: "Construcción y reformas",
  [ClientActivity.CONSULTING]: "Consultorías",
  [ClientActivity.COURIER_LOGISTICS]: "Mensajería y logística",
  [ClientActivity.INSURANCE_BROKER]: "Correduría de seguros",
  [ClientActivity.CHILDCARE]: "Guardería y centro infantil",
  [ClientActivity.LASER_HAIR_REMOVAL]: "Depilación láser",
  [ClientActivity.WEB_OR_GRAPHIC_DESIGN]: "Diseño web y/o diseño gráfico",
  [ClientActivity.ELECTRICIAN]: "Electricista",
  [ClientActivity.TEMP_AGENCY]: "Empresa de trabajo temporal",
  [ClientActivity.EDUCATION_CENTER]: "Centro de formación",
  [ClientActivity.HARDWARE_STORE]: "Ferretería",
  [ClientActivity.FLORIST]: "Floristería",
  [ClientActivity.PHOTOGRAPHY]: "Fotografía",
  [ClientActivity.PLUMBING]: "Fontanería",
  [ClientActivity.INDUSTRIAL_REFRIGERATION]: "Frío industrial",
  [ClientActivity.FUNERAL_SERVICES]: "Servicios funerarios",
  [ClientActivity.FURNITURE_MANUFACTURING]: "Fábrica de muebles",
  [ClientActivity.BEAUTY_SALONS]: "Gabinetes de estética",
  [ClientActivity.GYM_FITNESS]: "Gimnasio y centro deportivo",
  [ClientActivity.HAIRDRESSER]: "Peluquería",
  [ClientActivity.HOSPITALITY]: "Hostelería",
  [ClientActivity.HOTEL]: "Hotel",
  [ClientActivity.FOOD_RETAIL]: "Alimentación y supermercado",
  [ClientActivity.COSMETIC_INDUSTRY]: "Industria cosmética",
  [ClientActivity.FOOD_INDUSTRY]: "Industria alimentaria",
  [ClientActivity.PHARMACEUTICAL_INDUSTRY]: "Industria farmacéutica",
  [ClientActivity.METAL_INDUSTRY]: "Industria del metal",
  [ClientActivity.IT_AND_TELECOM]: "Informática y telecomunicaciones",
  [ClientActivity.ENGINEERING]: "Ingenierías",
  [ClientActivity.PHOTOVOLTAIC_INSTALLATIONS]: "Instalaciones fotovoltaicas",
  [ClientActivity.INVESTORS]: "Inversores",
  [ClientActivity.GARDENING]: "Jardinería",
  [ClientActivity.JEWELRY]: "Joyería y relojería",
  [ClientActivity.LANGUAGE_SCHOOL]: "Academia de idiomas",
  [ClientActivity.LAUNDRY]: "Lavandería y tintorería",
  [ClientActivity.CLEANING_SERVICES]: "Limpieza",
  [ClientActivity.LOCKSMITH]: "Cerrajería",
  [ClientActivity.DATA_PROTECTION]: "Lopd",
  [ClientActivity.MECHANICS]: "Mecánica",
  [ClientActivity.MUSIC_ACADEMY]: "Academia de música",
  [ClientActivity.OPTICIAN]: "Óptica",
  [ClientActivity.BAKERY]: "Panadería y pastelería",
  [ClientActivity.PARISHES]: "Parroquias",
  [ClientActivity.PENSIONERS_AND_RETIRED]: "Pensionistas y/o jubilados",
  [ClientActivity.JOURNALISM_AND_MEDIA]: "Periodistas y medios de la comunicación",
  [ClientActivity.PAINTING_AND_PLASTERBOARD]: "Pintura y/o pladur",
  [ClientActivity.PHYSIOTHERAPY]: "Fisioterapia y rehabilitación",
  [ClientActivity.PHARMACY]: "Farmacia",
  [ClientActivity.PRINTING_SERVICES]: "Artes gráficas e impresión",
  [ClientActivity.PRIVATE_DETECTIVE]: "Detective privado",
  [ClientActivity.OCCUPATIONAL_RISK_PREVENTION]: "Prevención de riesgos laborales",
  [ClientActivity.REAL_ESTATE_AGENCY]: "Agencia inmobiliaria",
  [ClientActivity.SALES_REPRESENTATIVE]: "Representante de comercio",
  [ClientActivity.NURSING_HOME]: "Residencia de mayores",
  [ClientActivity.ROOFING]: "Cubiertas y tejados",
  [ClientActivity.HEALTHCARE]: "Sanitarios",
  [ClientActivity.SECURITY_SERVICES]: "Seguridad privada",
  [ClientActivity.NOT_SPECIFIED]: "Sin informar",
  [ClientActivity.SPA_WELLNESS]: "Spa y centro de bienestar",
  [ClientActivity.SPORTS_STORE]: "Tienda de deporte",
  [ClientActivity.TILING]: "Solados y alicatados",
  [ClientActivity.TRANSPORT]: "Transportes",
  [ClientActivity.TRAVEL_AGENCY]: "Agencia de viajes",
  [ClientActivity.VETERINARY]: "Veterinaria",
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

export interface Client {
  // Identificación
  id: string
  clientNumber?: string
  name: string
  nif?: string

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
  mobilePhone?: string
  secondaryPhone?: string
  website?: string

  // Correos electrónicos
  emails?: ClientEmail[]

  // Direcciones
  addresses?: ClientAddress[]

  // Cuentas bancarias
  bankAccounts?: ClientBankAccount[]

  // Empresa
  employees?: number
  annualRevenue?: number
  sicCode?: string

  // Gestión comercial
  accountOwnerUserId?: string
  accountOwnerName?: string
  commercialAgentUserId?: string
  commercialAgentName?: string
  collectionManager?: CollectionManager

  // Jerarquía
  isMainClient?: boolean
  mainClientId?: string

  // Observaciones
  description?: string
}

// ----------------------------------------------------
// Sale (Venta / Opportunity)
// ----------------------------------------------------

/** Determines which stage pipeline (insurance vs energy) applies. */
export enum SaleType {
  INSURANCE = "INSURANCE",
  ENERGY = "ENERGY",
}

/** Whether this is a new prospect or an existing client portfolio deal. */
export enum SaleBusinessType {
  NEW_BUSINESS = "NEW_BUSINESS",           // Nuevo negocio
  EXISTING_BUSINESS = "EXISTING_BUSINESS", // Negocios existentes
}

export const SaleBusinessTypeLabels: Record<SaleBusinessType, string> = {
  [SaleBusinessType.NEW_BUSINESS]: "Nuevo negocio",
  [SaleBusinessType.EXISTING_BUSINESS]: "Negocios existentes",
}

export enum SaleProjectSource {
  NONE = "NONE",
  NOTICE = "NOTICE",                         // Aviso
  COLD_CALL = "COLD_CALL",                   // Llamada no solicitada
  EMPLOYEE_REFERRAL = "EMPLOYEE_REFERRAL",   // Recomendación de empleado
  EXTERNAL_REFERRAL = "EXTERNAL_REFERRAL",   // Recomendación externa
  PARTNER = "PARTNER",                       // Socio
  ONLINE_STORE = "ONLINE_STORE",             // Tienda en línea
  PUBLIC_RELATIONS = "PUBLIC_RELATIONS",     // Relaciones públicas
  TRADE_SHOW = "TRADE_SHOW",                 // Exposición comercial
  SALES_EMAIL_ALIAS = "SALES_EMAIL_ALIAS",   // Alias del correo electrónico de ventas
  SEMINAR_PARTNER = "SEMINAR_PARTNER",       // Socio de seminarios
  INTERNAL_SEMINAR = "INTERNAL_SEMINAR",     // Seminario interno
  WEB_DOWNLOAD = "WEB_DOWNLOAD",             // Descargar web
  WEB_RESEARCH = "WEB_RESEARCH",             // Investigación web
  CHAT = "CHAT",                             // Chat
}

export const SaleProjectSourceLabels: Record<SaleProjectSource, string> = {
  [SaleProjectSource.NONE]: "-None-",
  [SaleProjectSource.NOTICE]: "Aviso",
  [SaleProjectSource.COLD_CALL]: "Llamada no solicitada",
  [SaleProjectSource.EMPLOYEE_REFERRAL]: "Recomendación de empleado",
  [SaleProjectSource.EXTERNAL_REFERRAL]: "Recomendación externa",
  [SaleProjectSource.PARTNER]: "Socio",
  [SaleProjectSource.ONLINE_STORE]: "Tienda en línea",
  [SaleProjectSource.PUBLIC_RELATIONS]: "Relaciones públicas",
  [SaleProjectSource.TRADE_SHOW]: "Exposición comercial",
  [SaleProjectSource.SALES_EMAIL_ALIAS]: "Alias del correo electrónico de ventas",
  [SaleProjectSource.SEMINAR_PARTNER]: "Socio de seminarios",
  [SaleProjectSource.INTERNAL_SEMINAR]: "Seminario interno",
  [SaleProjectSource.WEB_DOWNLOAD]: "Descargar web",
  [SaleProjectSource.WEB_RESEARCH]: "Investigación web",
  [SaleProjectSource.CHAT]: "Chat",
}

export enum SaleForecastCategory {
  CHANNEL = "CHANNEL",       // Canal
  BEST_CASE = "BEST_CASE",   // El mejor caso
  CONFIRMED = "CONFIRMED",   // Confirmado
}

export const SaleForecastCategoryLabels: Record<SaleForecastCategory, string> = {
  [SaleForecastCategory.CHANNEL]: "Canal",
  [SaleForecastCategory.BEST_CASE]: "El mejor caso",
  [SaleForecastCategory.CONFIRMED]: "Confirmado",
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
  // --- Core classification ---
  type: SaleType           // INSURANCE | ENERGY — determines which stage pipeline applies
  businessType?: SaleBusinessType  // New business vs existing portfolio

  // --- Client (denormalized: store name alongside ID to avoid extra fetches in lists/kanban) ---
  clientId: UUID
  clientName?: string      // snapshot of client.name — update when client name changes

  // --- Sale identity ---
  title: string            // e.g. "Hogar - Ana Martínez"
  companyName?: string     // Insurer (insurance) or retailer (energy)
  insuranceBranch?: string // Branch / line of business (Hogar, Auto, Vida…)

  // --- Pipeline stage ---
  insuranceStage?: InsuranceSaleStage
  energyStage?: EnergySaleStage

  // --- Financials ---
  amount?: number                  // Importe — actual contracted/deal amount (editable)
  /** Calculated/read-only in UI — set by backend based on policy premium or energy contract. */
  expectedRevenue?: number
  /** Expected savings per year (energy only). */
  expectedSavingsPerYear?: number
  /** Probability 0–100 used in dashboard and forecasting. */
  probabilityPercent?: number
  forecastCategory?: SaleForecastCategory

  // --- Key dates ---
  expectedCloseDate?: ISODate  // Fecha de cierre
  issueDate?: ISODate           // Fecha de emisión / actualización
  billingDate?: ISODate         // Fecha de cobro

  // --- Origin & marketing ---
  projectSource?: SaleProjectSource  // Fuente de proyecto
  channel?: string                   // e.g. "Standard"
  campaignSource?: string            // Fuente de campaña
  socialLeadId?: string

  // --- People (denormalized display names) ---
  ownerUserId?: UUID
  ownerUserName?: string   // snapshot of user.displayName
  contactName?: string     // free-text contact name (no separate entity yet)

  // --- Related entities ---
  policyNumber?: string
  contractId?: string

  // --- Follow-up & notes ---
  nextStep?: string
  lostReason?: string
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
  /** Every case must belong to a sale. clientId is denormalized for direct querying. */
  saleId: UUID

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
  NOT_STARTED       = "NOT_STARTED",
  DEFERRED          = "DEFERRED",
  IN_PROGRESS       = "IN_PROGRESS",
  COMPLETED         = "COMPLETED",
  WAITING_FOR_INPUT = "WAITING_FOR_INPUT",
  UNLOGGED          = "UNLOGGED",
}

export enum TaskPriority {
  LOWEST  = "LOWEST",
  LOW     = "LOW",
  NORMAL  = "NORMAL",
  HIGH    = "HIGH",
  HIGHEST = "HIGHEST",
}

export enum TaskContextType {
  PROJECT = "PROJECT",
  CONTACT = "CONTACT",
}

export enum RelatedEntityType {
  CLIENT        = "CLIENT",
  SALE          = "SALE",
  QUOTE         = "QUOTE",
  PROJECT       = "PROJECT",
  SALES_ORDER   = "SALES_ORDER",
  PURCHASE_ORDER = "PURCHASE_ORDER",
  INVOICE       = "INVOICE",
  CAMPAIGN      = "CAMPAIGN",
  SUPPLIER      = "SUPPLIER",
  CASE          = "CASE",
  CONTRACT      = "CONTRACT",
  PERSONAL_DATA = "PERSONAL_DATA",
}

export enum ReminderChannel {
  EMAIL  = "EMAIL",
  IN_APP = "IN_APP",
}

export enum ReminderRecurrence {
  NONE    = "NONE",
  DAILY   = "DAILY",
  WEEKLY  = "WEEKLY",
  MONTHLY = "MONTHLY",
  YEARLY  = "YEARLY",
}

export interface Task extends BaseEntity {
  subject:             string
  description?:        string
  status:              TaskStatus
  priority?:           TaskPriority
  contextType?:        TaskContextType
  dueDate?:            ISODate
  assignedToUserId?:   UUID
  // Hierarchy: can be linked at any level — client only, client+sale, or client+sale+case.
  // When caseId is set, saleId and clientId are auto-populated from the case hierarchy.
  // When saleId is set (no case), clientId is auto-populated from the sale.
  clientId?:           UUID
  saleId?:             UUID
  caseId?:             UUID
  // Supplier FK (optional — links to a Supplier record for tasks owned by a supplier)
  supplierId?:           UUID
  // Provider: registered supplier that will execute this task
  providerSupplierId?:   UUID
  // Reminder
  hasReminder:         boolean
  reminderAt?:         ISODateTime
  reminderChannel?:    ReminderChannel
  reminderRecurrence?: ReminderRecurrence
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

// User-facing client follow-up interaction types (subset of ActivityType used for Activity records)
export const CLIENT_ACTIVITY_TYPES = [
  ActivityType.CALL,
  ActivityType.EMAIL,
  ActivityType.WHATSAPP_NOTE,
  ActivityType.MEETING,
] as const satisfies readonly ActivityType[]

export enum ActivityDirection {
  INBOUND  = "INBOUND",
  OUTBOUND = "OUTBOUND",
}

export const ActivityDirectionLabels: Record<ActivityDirection, string> = {
  [ActivityDirection.INBOUND]:  "Inbound",
  [ActivityDirection.OUTBOUND]: "Outbound",
}

/** Client follow-up / business interaction record (distinct from ActivityLog audit trail) */
export interface Activity extends BaseEntity {
  userId:      UUID
  // Hierarchy: when caseId is set, saleId and clientId are auto-populated from the case.
  // When saleId is set (no case), clientId is auto-populated from the sale.
  clientId:    UUID
  saleId?:     UUID
  caseId?:     UUID
  type:        ActivityType
  direction?:  ActivityDirection
  subject:     string
  description?: string
  outcome?:    string
  nextStep?:   string
  activityAt:  ISODateTime
}

// ----------------------------------------------------
// Supplier (Proveedor)
// ----------------------------------------------------

export interface SupplierAddressInput {
  type: AddressType
  street?: string
  postalCode?: string
  city?: string
  province?: string
  country?: string
}

export interface SupplierAddress extends SupplierAddressInput {
  id: string
}

export interface SupplierEmailInput {
  address: string
  isPrimary: boolean
  label?: string
  labelColor?: string
}

export interface SupplierEmail extends SupplierEmailInput {
  id: string
}

export interface Supplier extends BaseEntity {
  name: string
  cif?: string
  phone?: string
  secondaryPhone?: string
  addresses?: SupplierAddress[]
  emails?: SupplierEmail[]
}

export interface SupplierInput {
  name: string
  cif?: string
  phone?: string
  secondaryPhone?: string
  addresses?: SupplierAddressInput[]
  emails?: SupplierEmailInput[]
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
