import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Plus } from 'lucide-react'
import { useAuth } from '../../../auth/AuthContext'
import SaleCard from '../SaleCard/SaleCard'
import SaleForm from '../SaleForm/SaleForm'
import SaleDetail from '../SaleDetail/SaleDetail'
import SaleTypeToggle from '../SaleTypeToggle/SaleTypeToggle'
import type { Sale } from '../../../api/sales'
import {
  SaleType,
  InsuranceSaleStage,
  EnergySaleStage,
  INSURANCE_STAGES,
  ENERGY_STAGES,
  INSURANCE_STAGE_COLORS,
  ENERGY_STAGE_COLORS,
} from '../../../api/sales'
import { useSales } from '../../../context/DataContext'
import './Sales.css'

// ── Navigation stack ──────────────────────────────────────────────────────────

type SalesView =
  | { kind: 'board' }
  | { kind: 'saleDetail'; sale: Sale }
  | { kind: 'saleForm';   sale: Sale | null }   // null = new sale

interface Props {
  onNavigateToClient?: (clientId: string) => void
}

export default function Sales({ onNavigateToClient }: Props) {
  const { t } = useTranslation()
  const { user } = useAuth()
  const ownerName = user?.displayName ?? ''

  const [saleType, setSaleType] = useState<SaleType>(SaleType.INSURANCE)
  const { sales, loading: salesLoading, upsertSale, removeSale } = useSales()
  const displaySales = salesLoading ? [] : sales

  // Stack: last item is what's shown. push/pop are the only mutations.
  const [stack, setStack] = useState<SalesView[]>([{ kind: 'board' }])
  const push      = (v: SalesView) => setStack(s => [...s, v])
  const pop       = ()             => setStack(s => s.length > 1 ? s.slice(0, -1) : s)
  const goToBoard = ()             => setStack([{ kind: 'board' }])

  const current = stack[stack.length - 1]

  // ── Sale form view ──────────────────────────────────────────────────────────
  if (current.kind === 'saleForm') {
    return (
      <SaleForm
        sale={current.sale}
        onSave={(saved) => { upsertSale(saved); goToBoard() }}
        onCancel={pop}
        onDelete={(id) => { removeSale(id); goToBoard() }}
      />
    )
  }

  // ── Sale detail view ────────────────────────────────────────────────────────
  if (current.kind === 'saleDetail') {
    return (
      <SaleDetail
        sale={current.sale}
        onBack={pop}
        onEdit={(s) => push({ kind: 'saleForm', sale: s })}
        onViewClient={onNavigateToClient}
      />
    )
  }

  // ── Board view ──────────────────────────────────────────────────────────────
  const filtered    = displaySales.filter((s) => s.type === saleType)
  const stages      = saleType === SaleType.INSURANCE ? INSURANCE_STAGES : ENERGY_STAGES
  const stageColors = saleType === SaleType.INSURANCE ? INSURANCE_STAGE_COLORS : ENERGY_STAGE_COLORS

  function stageLabel(stage: InsuranceSaleStage | EnergySaleStage): string {
    return saleType === SaleType.INSURANCE
      ? t(`sales.stages.insurance.${stage}`)
      : t(`sales.stages.energy.${stage}`)
  }

  function columnSales(stage: InsuranceSaleStage | EnergySaleStage): Sale[] {
    return saleType === SaleType.INSURANCE
      ? filtered.filter((s) => s.insuranceStage === stage)
      : filtered.filter((s) => s.energyStage === stage)
  }

  function columnTotal(stageSales: Sale[]): number {
    const key = saleType === SaleType.INSURANCE ? 'expectedRevenue' : 'expectedSavingsPerYear'
    return stageSales.reduce((sum, s) => sum + (s[key] ?? 0), 0)
  }

  return (
    <div className="sales">
      <div className="page-header">
        <h1 className="page-title">{t('sales.title')}</h1>
        <button className="btn-primary" onClick={() => push({ kind: 'saleForm', sale: null })}>
          <Plus size={16} />
          {t('sales.new')}
        </button>
      </div>

      <SaleTypeToggle
        value={saleType}
        onChange={setSaleType}
        insuranceLabel={t('sales.toggleInsurance')}
        energyLabel={t('sales.toggleEnergy')}
      />

      <div className="sales-board">
        {(stages as (InsuranceSaleStage | EnergySaleStage)[]).map((stage) => {
          const stageSales = columnSales(stage)
          const total      = columnTotal(stageSales)
          const color      = (stageColors as Record<string, string>)[stage]

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
                    {total.toLocaleString('es-ES')} €
                  </span>
                )}
              </div>

              <div className="sales-column__cards">
                {stageSales.map((sale) => (
                  <SaleCard
                    key={sale.id}
                    sale={sale}
                    ownerName={ownerName}
                    onClick={(s) => push({ kind: 'saleDetail', sale: s })}
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
