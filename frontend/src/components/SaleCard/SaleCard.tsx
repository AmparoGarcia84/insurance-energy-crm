import { useTranslation } from 'react-i18next'
import type { Sale } from '../../api/sales'
import { SaleType } from '../../api/sales'
import Avatar from '../Avatar/Avatar'
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


export default function SaleCard({ sale, ownerName, onClick }: Props) {
  const { t } = useTranslation()
  const isEnergy = sale.type === SaleType.ENERGY
  const revenue = isEnergy ? sale.expectedSavingsPerYear : sale.expectedRevenue
  const displayOwner = sale.ownerUserName ?? ownerName

  return (
    <div className="sale-card" role="button" tabIndex={0} onClick={() => onClick(sale)} onKeyDown={(e) => e.key === 'Enter' && onClick(sale)}>
      <div className="sale-card__header">
        <div className="sale-card__identity">
          <span className="sale-card__client">{sale.clientName || sale.title}</span>
          {sale.clientName && <span className="sale-card__title">{sale.title}</span>}
        </div>
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
            {isEnergy ? t('sales.card.savingsPerYear') : '€'}
          </span>
        </div>
      )}

      <div className="sale-card__footer">
        {displayOwner && (
          <Avatar name={displayOwner} size={26} className="sale-card__avatar" title={displayOwner} />
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
