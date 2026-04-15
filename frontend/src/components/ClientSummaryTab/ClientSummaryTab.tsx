import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import {
  Phone, Mail, MessageCircle, Users, ArrowRightLeft,
  FileText, Download, Plus, Pencil, type LucideIcon,
} from 'lucide-react'
import { useAuth } from '../../auth/AuthContext'
import { useSales } from '../../context/DataContext'
import SaleCard from '../SaleCard/SaleCard'
import SaleForm from '../SaleForm/SaleForm'
import type { Sale } from '../../api/sales'
import { SaleType, InsuranceSaleStage, EnergySaleStage } from '../../api/sales'
import type { ActivityLog } from '@crm/shared'
import { ActivityType } from '@crm/shared'
import './ClientSummaryTab.css'

// ── Open-stage helpers ────────────────────────────────────────────────────────

const INSURANCE_OPEN_STAGES = new Set<string>([
  InsuranceSaleStage.RESPONSE_PENDING,
  InsuranceSaleStage.DOCUMENTS_PENDING,
  InsuranceSaleStage.SIGNATURE_PENDING,
  InsuranceSaleStage.ISSUANCE_PENDING,
  InsuranceSaleStage.BILLING_THIS_MONTH,
  InsuranceSaleStage.BILLING_NEXT_MONTH,
  InsuranceSaleStage.RECURRENT_BILLING,
  InsuranceSaleStage.INVOICE_PENDING_PAYMENT,
  InsuranceSaleStage.WRONG_SETTLEMENT,
])

const ENERGY_OPEN_STAGES = new Set<string>([
  EnergySaleStage.RESPONSE_PENDING,
  EnergySaleStage.DOCUMENTS_PENDING,
  EnergySaleStage.SIGNATURE_PENDING,
  EnergySaleStage.ACTIVATION_PENDING,
  EnergySaleStage.BILLING_THIS_MONTH,
])

function isOpenSale(sale: Sale): boolean {
  if (sale.type === SaleType.INSURANCE) {
    return sale.insuranceStage != null && INSURANCE_OPEN_STAGES.has(sale.insuranceStage)
  }
  return sale.energyStage != null && ENERGY_OPEN_STAGES.has(sale.energyStage)
}

// ── Activity helpers ──────────────────────────────────────────────────────────

const ACTIVITY_ICON: Record<ActivityType, LucideIcon> = {
  [ActivityType.CALL]:          Phone,
  [ActivityType.EMAIL]:         Mail,
  [ActivityType.WHATSAPP_NOTE]: MessageCircle,
  [ActivityType.MEETING]:       Users,
  [ActivityType.STAGE_CHANGED]: ArrowRightLeft,
  [ActivityType.DOC_UPLOADED]:  FileText,
  [ActivityType.EXPORT]:        Download,
  [ActivityType.CREATED]:       Plus,
  [ActivityType.UPDATED]:       Pencil,
}

export function relativeDate(isoDate: string): string {
  const diff = Date.now() - new Date(isoDate).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1)   return 'ahora'
  if (mins < 60)  return `hace ${mins} min`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `hace ${hours}h`
  const days = Math.floor(hours / 24)
  if (days === 1) return 'ayer'
  if (days < 30)  return `hace ${days} días`
  const months = Math.floor(days / 30)
  return months === 1 ? 'hace 1 mes' : `hace ${months} meses`
}

// ── Component ─────────────────────────────────────────────────────────────────

interface Props {
  clientId: string
}

export default function ClientSummaryTab({ clientId }: Props) {
  const { t } = useTranslation()
  const { user } = useAuth()
  const ownerName = user?.displayName ?? ''
  const { sales, loading, upsertSale, removeSale } = useSales()
  const [editingSale, setEditingSale] = useState<Sale | null>(null)

  if (editingSale) {
    return (
      <SaleForm
        sale={editingSale}
        onSave={(saved) => { upsertSale(saved); setEditingSale(null) }}
        onCancel={() => setEditingSale(null)}
        onDelete={(id) => { removeSale(id); setEditingSale(null) }}
      />
    )
  }

  const openSales = loading
    ? []
    : sales.filter((s) => s.clientId === clientId && isOpenSale(s))

  // TODO: replace with DataContext when client activities are implemented
  const activities: ActivityLog[] = []

  return (
    <div className="cd-summary">

      {/* Card 1: Open opportunities */}
      <div className="section-card cd-summary__card">
        <div className="cd-summary__card-header">
          <h3 className="cd-summary__card-title">
            {t('clients.summary.openOpportunities')}
          </h3>
          {openSales.length > 0 && (
            <span className="cd-summary__card-count">
              {t('sales.opportunitiesCount', { count: openSales.length })}
            </span>
          )}
        </div>
        <div className="cd-summary__card-body">
          {loading ? null : openSales.length === 0 ? (
            <p className="cd-summary__empty">{t('clients.summary.noSales')}</p>
          ) : (
            <div className="cd-summary__sales-list">
              {openSales.map((sale) => (
                <SaleCard
                  key={sale.id}
                  sale={sale}
                  ownerName={ownerName}
                  onClick={setEditingSale}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Card 2: Pending tasks */}
      <div className="section-card cd-summary__card">
        <div className="cd-summary__card-header">
          <h3 className="cd-summary__card-title">{t('clients.summary.pendingTasks')}</h3>
        </div>
        <div className="cd-summary__card-body">
          <p className="cd-summary__empty">{t('clients.summary.noTasks')}</p>
        </div>
      </div>

      {/* Card 3: Recent activity */}
      <div className="section-card cd-summary__card">
        <div className="cd-summary__card-header">
          <h3 className="cd-summary__card-title">{t('clients.summary.recentActivity')}</h3>
        </div>
        <div className="cd-summary__card-body">
          {activities.length === 0 ? (
            <p className="cd-summary__empty">{t('clients.summary.noActivity')}</p>
          ) : (
            <ul className="cd-summary__activity-list">
              {activities.map((entry) => {
                const Icon = ACTIVITY_ICON[entry.type] ?? Pencil
                return (
                  <li key={entry.id} className="cd-summary__activity-item">
                    <span className="cd-summary__activity-icon" aria-hidden>
                      <Icon size={14} />
                    </span>
                    <span className="cd-summary__activity-text">{entry.summary}</span>
                    <span className="cd-summary__activity-date">
                      {relativeDate(entry.createdAt)}
                    </span>
                  </li>
                )
              })}
            </ul>
          )}
        </div>
      </div>

    </div>
  )
}
