import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Plus, Pencil } from 'lucide-react'
import { useAuth } from '../../auth/AuthContext'
import { useSales } from '../../context/DataContext'
import SaleForm from '../SaleForm/SaleForm'
import type { Sale } from '../../api/sales'
import {
  SaleType,
  InsuranceSaleStage,
  EnergySaleStage,
  INSURANCE_STAGE_COLORS,
  ENERGY_STAGE_COLORS,
} from '../../api/sales'
import './ClientSalesTab.css'

interface Props {
  clientId: string
  clientName: string
  onViewSale: (sale: Sale) => void
}

function stageInfo(sale: Sale): { label: string; color: string } | null {
  if (sale.type === SaleType.INSURANCE && sale.insuranceStage) {
    return {
      label: sale.insuranceStage,
      color: INSURANCE_STAGE_COLORS[sale.insuranceStage as InsuranceSaleStage] ?? '#909090',
    }
  }
  if (sale.type === SaleType.ENERGY && sale.energyStage) {
    return {
      label: sale.energyStage,
      color: ENERGY_STAGE_COLORS[sale.energyStage as EnergySaleStage] ?? '#909090',
    }
  }
  return null
}

export default function ClientSalesTab({ clientId, clientName, onViewSale }: Props) {
  const { t } = useTranslation()
  const { user } = useAuth()
  const { sales, loading, upsertSale, removeSale } = useSales()
  const [editing, setEditing] = useState<Sale | 'new' | null>(null)

  if (editing !== null) {
    return (
      <SaleForm
        sale={editing === 'new' ? null : editing}
        defaultClientId={editing === 'new' ? clientId : undefined}
        defaultClientName={editing === 'new' ? clientName : undefined}
        onSave={(saved) => { upsertSale(saved); setEditing(null) }}
        onCancel={() => setEditing(null)}
        onDelete={(id) => { removeSale(id); setEditing(null) }}
      />
    )
  }

  const clientSales = loading
    ? []
    : sales
        .filter((s) => s.clientId === clientId)
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())

  const ownerName = user?.displayName ?? ''

  return (
    <div className="cd-sales-tab">
      <div className="cd-sales-tab__toolbar">
        <span className="cd-sales-tab__count">
          {t('sales.opportunitiesCount', { count: clientSales.length })}
        </span>
        <button className="btn-primary" onClick={() => setEditing('new')}>
          <Plus size={15} />
          {t('sales.new')}
        </button>
      </div>

      {loading ? null : clientSales.length === 0 ? (
        <div className="cd-sales-tab__empty">
          <p>{t('clients.salesTab.noSales')}</p>
        </div>
      ) : (
        <div className="data-table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>{t('clients.salesTab.columns.title')}</th>
                <th>{t('clients.salesTab.columns.stage')}</th>
                <th>{t('clients.salesTab.columns.revenue')}</th>
                <th>{t('clients.salesTab.columns.owner')}</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {clientSales.map((sale) => {
                const stage = stageInfo(sale)
                const isEnergy = sale.type === SaleType.ENERGY
                const revenue = isEnergy ? sale.expectedSavingsPerYear : sale.expectedRevenue
                const displayOwner = sale.ownerUserName ?? ownerName

                return (
                  <tr
                    key={sale.id}
                    className="cd-sales-tab__row"
                    onClick={() => onViewSale(sale)}
                  >
                    <td>
                      <div className="cd-sales-tab__title-cell">
                        {!isEnergy && sale.insuranceBranch && (
                          <span className={`badge ${branchClass(sale.insuranceBranch)}`}>
                            {sale.insuranceBranch}
                          </span>
                        )}
                        {isEnergy && sale.companyName && (
                          <span className="badge badge-branch-energy">{sale.companyName}</span>
                        )}
                        <span className="cd-sales-tab__title">{sale.title}</span>
                      </div>
                    </td>
                    <td>
                      {stage && (
                        <span
                          className="cd-sales-tab__stage"
                          style={{ '--stage-color': stage.color } as React.CSSProperties}
                        >
                          <span className="cd-sales-tab__stage-dot" aria-hidden />
                          {t(`sales.stages.${isEnergy ? 'energy' : 'insurance'}.${stage.label}`)}
                        </span>
                      )}
                    </td>
                    <td className="cd-sales-tab__revenue">
                      {revenue != null
                        ? `${revenue.toLocaleString('es-ES')}${isEnergy ? t('sales.card.savingsPerYear') : ' €'}`
                        : '—'}
                    </td>
                    <td className="cd-sales-tab__owner">{displayOwner || '—'}</td>
                    <td className="cd-sales-tab__actions">
                      <button
                        className="icon-btn"
                        onClick={(e) => { e.stopPropagation(); setEditing(sale) }}
                        title={t('sales.edit')}
                      >
                        <Pencil size={14} />
                      </button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

function branchClass(branch: string): string {
  const b = branch.toLowerCase()
  if (b.includes('vida'))   return 'badge-branch-vida'
  if (b.includes('hogar'))  return 'badge-branch-hogar'
  if (b.includes('salud'))  return 'badge-branch-salud'
  if (b.includes('dental')) return 'badge-branch-dental'
  if (b.startsWith('rc'))   return 'badge-branch-rc'
  if (b.includes('auto'))   return 'badge-branch-auto'
  return 'badge-branch-default'
}
