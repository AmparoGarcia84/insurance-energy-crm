import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Plus } from 'lucide-react'
import { useAuth } from '../../auth/AuthContext'
import SaleCard from '../SaleCard/SaleCard'
import SaleForm from '../SaleForm/SaleForm'
import type { Sale } from '../../api/sales'
import {
  SaleType,
  InsuranceSaleStage,
  EnergySaleStage,
  INSURANCE_STAGES,
  ENERGY_STAGES,
  INSURANCE_STAGE_COLORS,
  ENERGY_STAGE_COLORS,
} from '../../api/sales'

import { useSales } from '../../context/DataContext'
import './Sales.css'


export default function Sales() {
  const { t } = useTranslation()
  const { user } = useAuth()
  const ownerName = user?.displayName ?? ''

  const [saleType, setSaleType] = useState<SaleType>(SaleType.INSURANCE)
  const { sales, loading: salesLoading, upsertSale, removeSale } = useSales()
  const displaySales = salesLoading ? [] : sales
  const [editing, setEditing] = useState<Sale | null | 'new'>(null)

  function handleSaved(saved: Sale) {
    upsertSale(saved)
    setEditing(null)
  }

  function handleDelete(id: string) {
    removeSale(id)
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

  const filtered = displaySales.filter((s) => s.type === saleType)
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
