import { ClientActivity } from '@crm/shared'

/**
 * Static mapping from ClientActivity to its primary CNAE-2009 code.
 * Activities with no applicable CNAE code are omitted.
 *
 * Source: CNAE-2009 (INE) — https://www.ine.es/dyngs/INEbase/es/operacion.htm?c=Estadistica_C&cid=1254736177032
 */
export const ACTIVITY_CNAE: Partial<Record<ClientActivity, string>> = {
  [ClientActivity.LAW_FIRM]:                    '6910', // Actividades jurídicas
  [ClientActivity.PROPERTY_MANAGEMENT]:         '6832', // Gestión y administración de la propiedad inmobiliaria
  [ClientActivity.ADMINISTRATIVE_SERVICES]:     '8211', // Servicios administrativos generales
  [ClientActivity.ADVERTISING_AGENCY]:          '7311', // Agencias de publicidad
  [ClientActivity.TOURIST_APARTMENTS]:          '5520', // Alojamientos turísticos de corta estancia
  [ClientActivity.ARCHITECTS]:                  '7111', // Servicios técnicos de arquitectura
  [ClientActivity.ENERGY_CONSULTING]:           '7490', // Otras actividades profesionales n.c.o.p.
  [ClientActivity.TAX_ADVISORY]:                '6920', // Contabilidad, auditoría y asesoría fiscal
  [ClientActivity.HOME_CARE_SERVICES]:          '8810', // Servicios sociales sin alojamiento
  [ClientActivity.ASSOCIATIONS]:                '9499', // Otras actividades asociativas n.c.o.p.
  [ClientActivity.CARPENTRY]:                   '4332', // Instalación de carpintería
  [ClientActivity.AESTHETIC_CLINICS]:           '9602', // Peluquería y tratamientos de belleza
  [ClientActivity.SALES]:                       '4619', // Agentes del comercio no especializado
  [ClientActivity.RETAIL]:                      '4719', // Comercio al por menor no especializado
  [ClientActivity.COMMUNITY_OF_OWNERS]:         '6832', // Gestión de la propiedad
  [ClientActivity.CONSTRUCTION_AND_RENOVATION]: '4399', // Otras actividades de construcción especializada
  [ClientActivity.CONSULTING]:                  '7020', // Consultoría de gestión empresarial
  [ClientActivity.LASER_HAIR_REMOVAL]:          '9602', // Peluquería y tratamientos de belleza
  [ClientActivity.WEB_OR_GRAPHIC_DESIGN]:       '7410', // Actividades de diseño especializado
  [ClientActivity.ELECTRICIAN]:                 '4321', // Instalaciones eléctricas
  [ClientActivity.PLUMBING]:                    '4322', // Fontanería, calefacción y aire acondicionado
  [ClientActivity.INDUSTRIAL_REFRIGERATION]:    '4322', // Fontanería, calefacción y aire acondicionado
  [ClientActivity.FURNITURE_MANUFACTURING]:     '3100', // Fabricación de muebles
  [ClientActivity.BEAUTY_SALONS]:               '9602', // Peluquería y tratamientos de belleza
  [ClientActivity.HOSPITALITY]:                 '5610', // Restaurantes y puestos de comidas
  [ClientActivity.COSMETIC_INDUSTRY]:           '2042', // Fabricación de perfumes y cosméticos
  [ClientActivity.PHARMACEUTICAL_INDUSTRY]:     '2110', // Fabricación de productos farmacéuticos básicos
  [ClientActivity.IT_AND_TELECOM]:              '6201', // Actividades de programación informática
  [ClientActivity.ENGINEERING]:                 '7112', // Servicios técnicos de ingeniería
  [ClientActivity.PHOTOVOLTAIC_INSTALLATIONS]:  '4321', // Instalaciones eléctricas
  [ClientActivity.INVESTORS]:                   '6420', // Actividades de las sociedades holding
  [ClientActivity.CLEANING_SERVICES]:           '8121', // Limpieza general de edificios
  [ClientActivity.DATA_PROTECTION]:             '6311', // Proceso de datos y actividades conexas
  [ClientActivity.MECHANICS]:                   '4520', // Mantenimiento y reparación de vehículos
  [ClientActivity.PARISHES]:                    '9491', // Actividades de organizaciones religiosas
  [ClientActivity.JOURNALISM_AND_MEDIA]:        '5813', // Edición de periódicos
  [ClientActivity.PAINTING_AND_PLASTERBOARD]:   '4334', // Pintura y acristalamiento
  [ClientActivity.OCCUPATIONAL_RISK_PREVENTION]:'7490', // Otras actividades profesionales n.c.o.p.
  [ClientActivity.SALES_REPRESENTATIVE]:        '4619', // Agentes del comercio
  [ClientActivity.HEALTHCARE]:                  '8621', // Actividades de medicina general
  [ClientActivity.TRANSPORT]:                   '4941', // Transporte de mercancías por carretera
  [ClientActivity.INSPECTION_TECHNICIANS]:      '7120', // Ensayos y análisis técnicos
  // PENSIONERS_AND_RETIRED and NOT_SPECIFIED have no applicable CNAE code
}
