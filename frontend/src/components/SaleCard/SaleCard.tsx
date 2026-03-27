import { useTranslation } from 'react-i18next'
import type { Sale } from '../../api/sales'
import { SaleType } from '../../api/sales'
import './SaleCard.css'

interface Props {
  sale: Sale
  ownerName?: string
  onClick: (sale: Sale) => void
}

function branchBadgeClass(branch: string): string {
  const b = branch.toLowerCase()
  if (b.includes('vida'))   return 'badge-branch-vida'
  if (b.includes('hogar'))  return 'badge-branch-hogar'
  if (b.includes('salud'))  return 'badge-branch-salud'
  if (b.includes('dental')) return 'badge-branch-dental'
  if (b.startsWith('rc'))   return 'badge-branch-rc'
  if (b.includes('auto'))   return 'badge-branch-auto'
  return 'badge-branch-default'
}

function nameInitials(name: string): string {
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? '')
    .join('')
}

export default function SaleCard({ sale, ownerName, onClick }: Props) {
  const { t } = useTranslation()
  const isEnergy = sale.type === SaleType.ENERGY
  const revenue = isEnergy ? sale.expectedSavingsPerYear : sale.expectedRevenue

  return (
    <div className="sale-card" role="button" tabIndex={0} onClick={() => onClick(sale)} onKeyDown={(e) => e.key === 'Enter' && onClick(sale)}>
      <div className="sale-card__header">
        <span className="sale-card__client">{sale.title}</span>
        {!isEnergy && sale.insuranceBranch && (
          <span className={`badge sale-card__badge ${branchBadgeClass(sale.insuranceBranch)}`}>
            {sale.insuranceBranch}
          </span>
        )}
        {isEnergy && sale.companyName && (
          <span className="badge badge-branch-energy">{sale.companyName}</span>
        )}
      </div>

      {revenue != null && (
        <div className="sale-card__revenue">
          <span className="sale-card__revenue-icon">€</span>
          <span className="sale-card__revenue-value">
            {revenue.toLocaleString('es-ES')}
            {isEnergy ? t('sales.card.savingsPerYear') : t('sales.card.perYear')}
          </span>
        </div>
      )}

      <div className="sale-card__footer">
        {ownerName && (
          <span className="sale-card__avatar" title={ownerName}>
            {nameInitials(ownerName)}
          </span>
        )}
        {sale.nextStep && (
          <span className="sale-card__next-step" title={sale.nextStep}>
            {sale.nextStep}
          </span>
        )}
      </div>
    </div>
  )
}
