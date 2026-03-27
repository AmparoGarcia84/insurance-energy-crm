import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Plus } from 'lucide-react'
import { useAuth } from '../../auth/AuthContext'
import SaleCard from '../SaleCard/SaleCard'
import SaleForm from '../SaleForm/SaleForm'
import type { Sale } from '../../api/sales'
import { SaleType, InsuranceSaleStage, EnergySaleStage, getSales } from '../../api/sales'
import './Sales.css'

// ── Demo data ──────────────────────────────────────────────────────────────────
const DEMO_SALES: Sale[] = [
  // Insurance
  { id: 'd1', clientId: '', type: SaleType.INSURANCE, title: 'Pedro Gómez',         insuranceBranch: 'Vida',          expectedRevenue: 2100, insuranceStage: InsuranceSaleStage.RESPONSE_PENDING,   nextStep: 'Seguimiento llamada',         createdAt: '', updatedAt: '' },
  { id: 'd2', clientId: '', type: SaleType.INSURANCE, title: 'Restaurante El Puerto', insuranceBranch: 'RC Explotación', expectedRevenue: 1850, insuranceStage: InsuranceSaleStage.RESPONSE_PENDING,   nextStep: 'Llamar mañana',               createdAt: '', updatedAt: '' },
  { id: 'd3', clientId: '', type: SaleType.INSURANCE, title: 'Ana Martínez',         insuranceBranch: 'Hogar',          expectedRevenue: 1200, insuranceStage: InsuranceSaleStage.DOCUMENTS_PENDING,  nextStep: 'Solicitar DNI',               createdAt: '', updatedAt: '' },
  { id: 'd4', clientId: '', type: SaleType.INSURANCE, title: 'Clínica Dental Norte', insuranceBranch: 'Salud',          expectedRevenue: 2600, insuranceStage: InsuranceSaleStage.DOCUMENTS_PENDING,  nextStep: 'Pendiente factura',           createdAt: '', updatedAt: '' },
  { id: 'd5', clientId: '', type: SaleType.INSURANCE, title: 'Carlos Ruiz SA',       insuranceBranch: 'RC Empresa',     expectedRevenue: 3400, insuranceStage: InsuranceSaleStage.SIGNATURE_PENDING,  nextStep: 'Enviar contrato',             createdAt: '', updatedAt: '' },
  { id: 'd6', clientId: '', type: SaleType.INSURANCE, title: 'Sofía Torres',         insuranceBranch: 'Dental',         expectedRevenue: 480,  insuranceStage: InsuranceSaleStage.ISSUANCE_PENDING,   nextStep: 'Esperar emisión',             createdAt: '', updatedAt: '' },
  { id: 'd7', clientId: '', type: SaleType.INSURANCE, title: 'Laura Fernández',      insuranceBranch: 'Hogar',          expectedRevenue: 850,  insuranceStage: InsuranceSaleStage.BILLING_THIS_MONTH, nextStep: 'Cobro pendiente confirmación', createdAt: '', updatedAt: '' },
  // Energy
  { id: 'd8',  clientId: '', type: SaleType.ENERGY, title: 'Pedro Gómez',         companyName: 'Iberdrola', expectedSavingsPerYear: 3200, energyStage: EnergySaleStage.RESPONSE_PENDING,   nextStep: 'Enviar estudio energético',     createdAt: '', updatedAt: '' },
  { id: 'd9',  clientId: '', type: SaleType.ENERGY, title: 'Bar La Terraza',       companyName: 'Endesa',    expectedSavingsPerYear: 1800, energyStage: EnergySaleStage.ACTIVATION_PENDING, nextStep: 'Seguimiento activación',        createdAt: '', updatedAt: '' },
  { id: 'd10', clientId: '', type: SaleType.ENERGY, title: 'Centro Médico Salus',  companyName: 'Naturgy',   expectedSavingsPerYear: 5400, energyStage: EnergySaleStage.BILLING_THIS_MONTH, nextStep: 'Verificar primera factura',     createdAt: '', updatedAt: '' },
]

// ── Stage configs ───────────────────────────────────────────────────────────────
const INSURANCE_STAGES: InsuranceSaleStage[] = [
  InsuranceSaleStage.RESPONSE_PENDING,
  InsuranceSaleStage.DOCUMENTS_PENDING,
  InsuranceSaleStage.SIGNATURE_PENDING,
  InsuranceSaleStage.ISSUANCE_PENDING,
  InsuranceSaleStage.BILLING_THIS_MONTH,
  InsuranceSaleStage.BILLING_NEXT_MONTH,
  InsuranceSaleStage.RECURRENT_BILLING,
  InsuranceSaleStage.INVOICE_PENDING_PAYMENT,
  InsuranceSaleStage.WRONG_SETTLEMENT,
  InsuranceSaleStage.BILLED_AND_PAID,
  InsuranceSaleStage.CANCELED_UNPAID,
  InsuranceSaleStage.NOT_INSURABLE,
  InsuranceSaleStage.KO_SCORING,
  InsuranceSaleStage.LOST,
]

const ENERGY_STAGES: EnergySaleStage[] = [
  EnergySaleStage.RESPONSE_PENDING,
  EnergySaleStage.DOCUMENTS_PENDING,
  EnergySaleStage.SIGNATURE_PENDING,
  EnergySaleStage.ACTIVATION_PENDING,
  EnergySaleStage.BILLING_THIS_MONTH,
  EnergySaleStage.BILLED_AND_PAID,
  EnergySaleStage.LOST,
]

const INSURANCE_STAGE_COLORS: Record<InsuranceSaleStage, string> = {
  [InsuranceSaleStage.RESPONSE_PENDING]:        '#d2b87a',
  [InsuranceSaleStage.DOCUMENTS_PENDING]:       '#f0a830',
  [InsuranceSaleStage.SIGNATURE_PENDING]:       '#e06820',
  [InsuranceSaleStage.ISSUANCE_PENDING]:        '#4080d0',
  [InsuranceSaleStage.BILLING_THIS_MONTH]:      '#30a060',
  [InsuranceSaleStage.BILLING_NEXT_MONTH]:      '#20a090',
  [InsuranceSaleStage.RECURRENT_BILLING]:       '#20a090',
  [InsuranceSaleStage.INVOICE_PENDING_PAYMENT]: '#7030c0',
  [InsuranceSaleStage.WRONG_SETTLEMENT]:        '#d04040',
  [InsuranceSaleStage.BILLED_AND_PAID]:         '#208040',
  [InsuranceSaleStage.CANCELED_UNPAID]:         '#c03030',
  [InsuranceSaleStage.NOT_INSURABLE]:           '#a02020',
  [InsuranceSaleStage.KO_SCORING]:              '#707070',
  [InsuranceSaleStage.LOST]:                    '#909090',
}

const ENERGY_STAGE_COLORS: Record<EnergySaleStage, string> = {
  [EnergySaleStage.RESPONSE_PENDING]:   '#d2b87a',
  [EnergySaleStage.DOCUMENTS_PENDING]:  '#f0a830',
  [EnergySaleStage.SIGNATURE_PENDING]:  '#e06820',
  [EnergySaleStage.ACTIVATION_PENDING]: '#4080d0',
  [EnergySaleStage.BILLING_THIS_MONTH]: '#30a060',
  [EnergySaleStage.BILLED_AND_PAID]:    '#208040',
  [EnergySaleStage.LOST]:               '#909090',
}

export default function Sales() {
  const { t } = useTranslation()
  const { user } = useAuth()
  const ownerName = user?.displayName ?? ''

  const [saleType, setSaleType] = useState<SaleType>(SaleType.INSURANCE)
  const [sales, setSales] = useState<Sale[]>(DEMO_SALES)
  const [editing, setEditing] = useState<Sale | null | 'new'>(null)

  useEffect(() => {
    getSales()
      .then((data) => { if (data.length > 0) setSales(data) })
      .catch(() => { /* backend not ready — keep demo data */ })
  }, [])

  function handleSaved(saved: Sale) {
    setSales((prev) => {
      const exists = prev.some((s) => s.id === saved.id)
      return exists ? prev.map((s) => (s.id === saved.id ? saved : s)) : [...prev, saved]
    })
    setEditing(null)
  }

  function handleDelete(id: string) {
    setSales((prev) => prev.filter((s) => s.id !== id))
    setEditing(null)
  }

  if (editing !== null) {
    return (
      <SaleForm
        sale={editing === 'new' ? null : editing}
        onSave={handleSaved}
        onCancel={() => setEditing(null)}
        onDelete={handleDelete}
      />
    )
  }

  const filtered = sales.filter((s) => s.type === saleType)
  const stages = saleType === SaleType.INSURANCE ? INSURANCE_STAGES : ENERGY_STAGES
  const stageColors = saleType === SaleType.INSURANCE ? INSURANCE_STAGE_COLORS : ENERGY_STAGE_COLORS

  function stageLabel(stage: InsuranceSaleStage | EnergySaleStage): string {
    if (saleType === SaleType.INSURANCE) {
      return t(`sales.stages.insurance.${stage}`)
    }
    return t(`sales.stages.energy.${stage}`)
  }

  function columnSales(stage: InsuranceSaleStage | EnergySaleStage): Sale[] {
    if (saleType === SaleType.INSURANCE) {
      return filtered.filter((s) => s.insuranceStage === stage)
    }
    return filtered.filter((s) => s.energyStage === stage)
  }

  function columnTotal(stageSales: Sale[]): number {
    const key = saleType === SaleType.INSURANCE ? 'expectedRevenue' : 'expectedSavingsPerYear'
    return stageSales.reduce((sum, s) => sum + (s[key] ?? 0), 0)
  }

  return (
    <div className="sales">
      <div className="sales__header">
        <div>
          <h1 className="sales__title">{t('sales.title')}</h1>
          <p className="sales__subtitle">{t('sales.subtitle')}</p>
        </div>
        <button className="btn-primary" onClick={() => setEditing('new')}>
          <Plus size={16} />
          {t('sales.new')}
        </button>
      </div>

      <div className="sales__toggle">
        <button
          className={saleType === SaleType.INSURANCE ? 'sales__toggle-btn sales__toggle-btn--active' : 'sales__toggle-btn'}
          onClick={() => setSaleType(SaleType.INSURANCE)}
        >
          {t('sales.toggleInsurance')}
        </button>
        <button
          className={saleType === SaleType.ENERGY ? 'sales__toggle-btn sales__toggle-btn--active' : 'sales__toggle-btn'}
          onClick={() => setSaleType(SaleType.ENERGY)}
        >
          {t('sales.toggleEnergy')}
        </button>
      </div>

      <div className="sales-board">
        {(stages as (InsuranceSaleStage | EnergySaleStage)[]).map((stage) => {
          const stageSales = columnSales(stage)
          const total = columnTotal(stageSales)
          const color = (stageColors as Record<string, string>)[stage]

          return (
            <div
              key={stage}
              className="sales-column"
              style={{ '--column-color': color } as React.CSSProperties}
            >
              <div className="sales-column__header">
                <span className="sales-column__name">{stageLabel(stage)}</span>
                <span className="sales-column__count">
                  {t('sales.opportunitiesCount', { count: stageSales.length })}
                </span>
                {total > 0 && (
                  <span className="sales-column__total">
                    {total.toLocaleString('es-ES')} €/año
                  </span>
                )}
              </div>

              <div className="sales-column__cards">
                {stageSales.map((sale) => (
                  <SaleCard
                    key={sale.id}
                    sale={sale}
                    ownerName={ownerName}
                    onClick={(s) => setEditing(s)}
                  />
                ))}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
