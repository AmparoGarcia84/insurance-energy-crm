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
  [ClientActivity.AGRICULTURE]:                 '0111', // Cultivo de cereales y otros cultivos no permanentes
  [ClientActivity.AIR_CONDITIONING]:            '4322', // Fontanería, calefacción y aire acondicionado
  [ClientActivity.TOURIST_APARTMENTS]:          '5520', // Alojamientos turísticos de corta estancia
  [ClientActivity.ARCHITECTS]:                  '7111', // Servicios técnicos de arquitectura
  [ClientActivity.ENERGY_CONSULTING]:           '7490', // Otras actividades profesionales n.c.o.p.
  [ClientActivity.TAX_ADVISORY]:                '6920', // Contabilidad, auditoría y asesoría fiscal
  [ClientActivity.HOME_CARE_SERVICES]:          '8810', // Servicios sociales sin alojamiento
  [ClientActivity.ASSOCIATIONS]:                '9499', // Otras actividades asociativas n.c.o.p.
  [ClientActivity.BAKERY]:                      '1071', // Fabricación de pan y productos frescos de panadería
  [ClientActivity.BAR_CAFE]:                    '5630', // Establecimientos de bebidas
  [ClientActivity.CARPENTRY]:                   '4332', // Instalación de carpintería
  [ClientActivity.CATERING]:                    '5621', // Provisión de comidas preparadas para eventos
  [ClientActivity.AESTHETIC_CLINICS]:           '9602', // Peluquería y tratamientos de belleza
  [ClientActivity.CHILDCARE]:                   '8891', // Actividades de cuidado diurno de niños
  [ClientActivity.SALES]:                       '4619', // Agentes del comercio no especializado
  [ClientActivity.RETAIL]:                      '4719', // Comercio al por menor no especializado
  [ClientActivity.COMMUNITY_OF_OWNERS]:         '6832', // Gestión de la propiedad
  [ClientActivity.CONSTRUCTION_AND_RENOVATION]: '4399', // Otras actividades de construcción especializada
  [ClientActivity.CONSULTING]:                  '7020', // Consultoría de gestión empresarial
  [ClientActivity.COURIER_LOGISTICS]:           '5320', // Actividades postales y de mensajería
  [ClientActivity.DENTIST]:                     '8623', // Actividades odontológicas
  [ClientActivity.LASER_HAIR_REMOVAL]:          '9602', // Peluquería y tratamientos de belleza
  [ClientActivity.WEB_OR_GRAPHIC_DESIGN]:       '7410', // Actividades de diseño especializado
  [ClientActivity.DRIVING_SCHOOL]:              '8553', // Actividades de escuelas de conducción y pilotaje
  [ClientActivity.EDUCATION_CENTER]:            '8559', // Otras actividades de educación n.c.o.p.
  [ClientActivity.ELECTRICIAN]:                 '4321', // Instalaciones eléctricas
  [ClientActivity.ELECTRONICS_RETAIL]:          '4743', // Comercio al por menor de equipos de sonido e imagen
  [ClientActivity.PLUMBING]:                    '4322', // Fontanería, calefacción y aire acondicionado
  [ClientActivity.FLORIST]:                     '4776', // Comercio al por menor de flores y plantas
  [ClientActivity.FOOD_INDUSTRY]:               '1089', // Elaboración de otros productos alimenticios n.c.o.p.
  [ClientActivity.FOOD_RETAIL]:                 '4711', // Comercio al por menor en establecimientos no especializados
  [ClientActivity.INDUSTRIAL_REFRIGERATION]:    '4322', // Fontanería, calefacción y aire acondicionado
  [ClientActivity.FUNERAL_SERVICES]:            '9603', // Pompas fúnebres y actividades relacionadas
  [ClientActivity.FURNITURE_MANUFACTURING]:     '3100', // Fabricación de muebles
  [ClientActivity.GARDENING]:                   '8130', // Actividades de jardinería
  [ClientActivity.BEAUTY_SALONS]:               '9602', // Peluquería y tratamientos de belleza
  [ClientActivity.GYM_FITNESS]:                 '9311', // Gestión de instalaciones deportivas
  [ClientActivity.HAIRDRESSER]:                 '9602', // Peluquería y tratamientos de belleza
  [ClientActivity.HARDWARE_STORE]:              '4752', // Comercio al por menor de ferretería, pintura y vidrio
  [ClientActivity.HOSPITALITY]:                 '5610', // Restaurantes y puestos de comidas
  [ClientActivity.HOTEL]:                       '5510', // Hoteles y alojamientos similares
  [ClientActivity.COSMETIC_INDUSTRY]:           '2042', // Fabricación de perfumes y cosméticos
  [ClientActivity.PHARMACEUTICAL_INDUSTRY]:     '2110', // Fabricación de productos farmacéuticos básicos
  [ClientActivity.METAL_INDUSTRY]:              '2410', // Fabricación de productos básicos de hierro y acero
  [ClientActivity.IT_AND_TELECOM]:              '6201', // Actividades de programación informática
  [ClientActivity.INSURANCE_BROKER]:            '6622', // Actividades de agentes y corredores de seguros
  [ClientActivity.ENGINEERING]:                 '7112', // Servicios técnicos de ingeniería
  [ClientActivity.PHOTOVOLTAIC_INSTALLATIONS]:  '4321', // Instalaciones eléctricas
  [ClientActivity.INVESTORS]:                   '6420', // Actividades de las sociedades holding
  [ClientActivity.JEWELRY]:                     '4777', // Comercio al por menor de artículos de relojería y joyería
  [ClientActivity.CLEANING_SERVICES]:           '8121', // Limpieza general de edificios
  [ClientActivity.LANGUAGE_SCHOOL]:             '8559', // Otras actividades de educación n.c.o.p.
  [ClientActivity.LAUNDRY]:                     '9601', // Lavado y limpieza de prendas textiles y de piel
  [ClientActivity.DATA_PROTECTION]:             '6311', // Proceso de datos y actividades conexas
  [ClientActivity.LOCKSMITH]:                   '4329', // Otras instalaciones en obras de construcción
  [ClientActivity.MECHANICS]:                   '4520', // Mantenimiento y reparación de vehículos
  [ClientActivity.MUSIC_ACADEMY]:               '8552', // Actividades de educación cultural
  [ClientActivity.OPTICIAN]:                    '4774', // Comercio al por menor de artículos médicos y ortopédicos
  [ClientActivity.PARISHES]:                    '9491', // Actividades de organizaciones religiosas
  [ClientActivity.JOURNALISM_AND_MEDIA]:        '5813', // Edición de periódicos
  [ClientActivity.PAINTING_AND_PLASTERBOARD]:   '4334', // Pintura y acristalamiento
  [ClientActivity.PHYSIOTHERAPY]:               '8690', // Otras actividades sanitarias
  [ClientActivity.PHARMACY]:                    '4773', // Comercio al por menor de productos farmacéuticos
  [ClientActivity.PRINTING_SERVICES]:           '1811', // Artes gráficas y servicios relacionados
  [ClientActivity.PRIVATE_DETECTIVE]:           '8030', // Actividades de investigación
  [ClientActivity.OCCUPATIONAL_RISK_PREVENTION]:'7490', // Otras actividades profesionales n.c.o.p.
  [ClientActivity.REAL_ESTATE_AGENCY]:          '6831', // Agentes de la propiedad inmobiliaria
  [ClientActivity.SALES_REPRESENTATIVE]:        '4619', // Agentes del comercio
  [ClientActivity.NURSING_HOME]:                '8710', // Asistencia residencial con cuidados de enfermería
  [ClientActivity.ROOFING]:                     '4391', // Trabajos de cubiertas
  [ClientActivity.HEALTHCARE]:                  '8621', // Actividades de medicina general
  [ClientActivity.SECURITY_SERVICES]:           '8010', // Actividades de seguridad privada
  [ClientActivity.SPA_WELLNESS]:                '9604', // Actividades de mantenimiento físico
  [ClientActivity.SPORTS_CLUB]:                 '9312', // Actividades de los clubes deportivos
  [ClientActivity.SPORTS_STORE]:                '4764', // Comercio al por menor de artículos de deporte
  [ClientActivity.TRANSPORT]:                   '4941', // Transporte de mercancías por carretera
  [ClientActivity.TEMP_AGENCY]:                 '7820', // Actividades de las empresas de trabajo temporal
  [ClientActivity.TEXTILE_RETAIL]:              '4771', // Comercio al por menor de prendas de vestir
  [ClientActivity.TILING]:                      '4333', // Revestimiento de suelos y paredes
  [ClientActivity.INSPECTION_TECHNICIANS]:      '7120', // Ensayos y análisis técnicos
  [ClientActivity.TRAVEL_AGENCY]:               '7911', // Actividades de las agencias de viajes
  [ClientActivity.VETERINARY]:                  '7500', // Actividades veterinarias
  // PENSIONERS_AND_RETIRED and NOT_SPECIFIED have no applicable CNAE code
}
