import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { ArrowLeft, Pencil, Plus, User, Euro, Calendar, Phone, Mail, Info } from 'lucide-react'
import type { Sale } from '../../../api/sales'
import {
  SaleType,
  INSURANCE_STAGE_COLORS,
  ENERGY_STAGE_COLORS,
} from '../../../api/sales'
import { useClients } from '../../../context/DataContext'
import SaleActivityTab from '../SaleActivityTab/SaleActivityTab'
import SaleTasksTab from '../SaleTasksTab/SaleTasksTab'
import SaleDocumentsTab from '../SaleDocumentsTab/SaleDocumentsTab'
import './SaleDetail.css'

interface Props {
  sale: Sale
  onBack: () => void
  onEdit: (sale: Sale) => void
  onViewClient?: (clientId: string) => void
}

type Tab = 'information' | 'activity' | 'tasks' | 'documents'

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

function formatDate(iso?: string | null): string {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('es-ES', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })
}

function InfoField({ label, value, full }: { label: string; value?: string | null; full?: boolean }) {
  if (!value) return null
  return (
    <div className={`sd-info-row${full ? ' sd-info-row--full' : ''}`}>
      <dt>{label}</dt>
      <dd>{value}</dd>
    </div>
  )
}

export default function SaleDetail({ sale, onBack, onEdit, onViewClient }: Props) {
  const { t } = useTranslation()
  const [tab, setTab] = useState<Tab>('information')
  const [activityFormOpen, setActivityFormOpen] = useState(false)
  const { clients } = useClients()
  const client = clients.find((c) => c.id === sale.clientId)
  const primaryEmail = client?.emails?.find((e) => e.isPrimary) ?? client?.emails?.[0]

  const isEnergy = sale.type === SaleType.ENERGY

  const currentStage = isEnergy ? sale.energyStage : sale.insuranceStage
  const stageLabel = currentStage
    ? t(`sales.stages.${isEnergy ? 'energy' : 'insurance'}.${currentStage}`)
    : null

  const stageColor =
    isEnergy && sale.energyStage
      ? ENERGY_STAGE_COLORS[sale.energyStage]
      : !isEnergy && sale.insuranceStage
        ? INSURANCE_STAGE_COLORS[sale.insuranceStage]
        : undefined

  const revenue = isEnergy ? sale.expectedSavingsPerYear : sale.expectedRevenue

  const tabs: { id: Tab; label: string }[] = [
    { id: 'information', label: t('sales.detail.tabs.information') },
    { id: 'activity',    label: t('sales.detail.tabs.activity') },
    { id: 'tasks',       label: t('sales.detail.tabs.tasks') },
    { id: 'documents',   label: t('sales.detail.tabs.documents') },
  ]

  return (
    <div className="sd-view">

      {/* ── Header ── */}
      <div className="sd-header">
        <div className="sd-header-left">
          <button
            className="icon-btn sd-back"
            onClick={onBack}
            title={t('sales.detail.back')}
          >
            <ArrowLeft size={18} />
          </button>
          <div className="sd-header-info">
            <div className="sd-header-name-row">
              <h1 className="sd-name">{sale.title}</h1>
              {stageLabel && (
                <span
                  className="sd-stage-badge"
                  style={
                    stageColor
                      ? {
                          background:  `${stageColor}22`,
                          color:        stageColor,
                          borderColor: `${stageColor}55`,
                        }
                      : undefined
                  }
                >
                  {stageLabel}
                </span>
              )}
              {!isEnergy && sale.insuranceBranch && (
                <span className={`badge ${branchBadgeClass(sale.insuranceBranch)}`}>
                  {sale.insuranceBranch}
                </span>
              )}
            </div>
            {sale.clientName && (
              <div className="sd-header-meta">{sale.clientName}</div>
            )}
          </div>
        </div>

        <div className="sd-header-actions">
          <button className="btn-secondary" onClick={() => onEdit(sale)}>
            <Pencil size={15} />
            {t('sales.detail.edit')}
          </button>
          <button
            className="btn-primary sd-btn-activity"
            onClick={() => { setTab('activity'); setActivityFormOpen(true) }}
          >
            <Plus size={15} />
            {t('sales.detail.registerActivity')}
          </button>
        </div>
      </div>

      {/* ── 3 info cards ── */}
      <div className="sd-cards">

        {/* Card: Cliente */}
        <div className="section-card sd-card">
          <div className="sd-card-header">
            <User size={15} className="sd-card-icon" />
            <span className="sd-card-title">{t('sales.detail.cards.client')}</span>
          </div>
          <div className="sd-card-body">
            {sale.clientName && (
              <p className="sd-client-name">{sale.clientName}</p>
            )}
            {client?.clientNumber && (
              <p className="sd-client-meta">
                {t('sales.detail.cards.clientId')}: {client.clientNumber}
              </p>
            )}
            {client?.mobilePhone && (
              <p className="sd-client-meta">
                <Phone size={12} />
                {client.mobilePhone}
              </p>
            )}
            {primaryEmail && (
              <p className="sd-client-meta">
                <Mail size={12} />
                {primaryEmail.address}
              </p>
            )}
            <button
              className="sd-view-client-btn"
              onClick={() => onViewClient?.(sale.clientId)}
            >
              {t('sales.detail.cards.viewClient')}
            </button>
          </div>
        </div>

        {/* Card: Valor de la venta */}
        <div className="section-card sd-card">
          <div className="sd-card-header">
            <Euro size={15} className="sd-card-icon" />
            <span className="sd-card-title">{t('sales.detail.cards.value')}</span>
          </div>
          <div className="sd-card-body">
            {revenue != null ? (
              <>
                <p className="sd-revenue">
                  €{revenue.toLocaleString('es-ES')}
                  {isEnergy && <span className="sd-revenue-unit">/año</span>}
                </p>
                <p className="sd-revenue-label">
                  {t('sales.detail.cards.expectedRevenue')}
                </p>
              </>
            ) : (
              <p className="sd-revenue-empty">—</p>
            )}
            {sale.probabilityPercent != null && (
              <div className="sd-probability">
                <span className="sd-probability-label">
                  {t('sales.detail.cards.probability')}: {sale.probabilityPercent}%
                </span>
                <div className="sd-probability-bar" role="progressbar" aria-valuenow={sale.probabilityPercent} aria-valuemin={0} aria-valuemax={100}>
                  <div
                    className="sd-probability-fill"
                    style={{ width: `${sale.probabilityPercent}%` }}
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Card: Fechas importantes */}
        <div className="section-card sd-card">
          <div className="sd-card-header">
            <Calendar size={15} className="sd-card-icon" />
            <span className="sd-card-title">{t('sales.detail.cards.dates')}</span>
          </div>
          <div className="sd-card-body">
            <dl className="sd-dates">
              <div className="sd-date-row">
                <dt>{t('sales.fields.expectedCloseDate')}</dt>
                <dd>{formatDate(sale.expectedCloseDate)}</dd>
              </div>
              <div className="sd-date-row">
                <dt>{t('sales.fields.issueDate')}</dt>
                <dd>{formatDate(sale.issueDate)}</dd>
              </div>
              <div className="sd-date-row">
                <dt>{t('sales.fields.billingDate')}</dt>
                <dd>{formatDate(sale.billingDate)}</dd>
              </div>
            </dl>
          </div>
        </div>

      </div>

      {/* ── Tabs ── */}
      <div className="cd-tabs">
        {tabs.map((tabItem) => (
          <button
            key={tabItem.id}
            className={`cd-tab${tab === tabItem.id ? ' cd-tab-active' : ''}`}
            onClick={() => setTab(tabItem.id)}
          >
            {tabItem.label}
          </button>
        ))}
      </div>

      {/* ── Tab content ── */}
      <div className="cd-content">
        {tab === 'information' && (
          <div className="section-card sd-card sd-info-card">
            <div className="sd-card-header">
              <Info size={15} className="sd-card-icon" />
              <span className="sd-card-title">{t('sales.sections.saleInfo')}</span>
            </div>
            <div className="sd-card-body">
              <dl className="sd-info-fields">
                <InfoField label={t('sales.fields.owner')}          value={sale.ownerUserName} />
                <InfoField label={t('sales.fields.businessType')}   value={sale.businessType ? t(`sales.businessType.${sale.businessType}`) : undefined} />
                <InfoField label={t('sales.fields.company')}        value={sale.companyName} />
                {!isEnergy && <InfoField label={t('sales.fields.branch')} value={sale.insuranceBranch} />}
                <InfoField label={t('sales.fields.amount')}         value={sale.amount != null ? `${sale.amount.toLocaleString('es-ES')} €` : undefined} />
                {!isEnergy && (
                  <InfoField label={t('sales.fields.expectedRevenue')} value={sale.expectedRevenue != null ? `${sale.expectedRevenue.toLocaleString('es-ES')} €` : undefined} />
                )}
                {isEnergy && (
                  <InfoField label={t('sales.fields.expectedSavings')} value={sale.expectedSavingsPerYear != null ? `${sale.expectedSavingsPerYear.toLocaleString('es-ES')} €/año` : undefined} />
                )}
                <InfoField label={t('sales.fields.probabilityPercent')} value={sale.probabilityPercent != null ? `${sale.probabilityPercent}%` : undefined} />
                <InfoField label={t('sales.fields.forecastCategory')} value={sale.forecastCategory ? t(`sales.forecastCategory.${sale.forecastCategory}`) : undefined} />
                <InfoField label={t('sales.fields.channel')}        value={sale.channel} />
                <InfoField label={t('sales.fields.projectSource')}  value={sale.projectSource ? t(`sales.projectSource.${sale.projectSource}`) : undefined} />
                <InfoField label={t('sales.fields.contactName')}    value={sale.contactName} />
                <InfoField label={t('sales.fields.campaignSource')} value={sale.campaignSource} />
                <InfoField label={t('sales.fields.socialLeadId')}   value={sale.socialLeadId} />
                <InfoField label={t('sales.fields.policyNumber')}   value={sale.policyNumber} />
                <InfoField label={t('sales.fields.contractId')}     value={sale.contractId} />
                <InfoField label={t('sales.fields.nextStep')}       value={sale.nextStep} />
                <InfoField label={t('sales.fields.lostReason')}     value={sale.lostReason} />
                <InfoField label={t('sales.fields.description')}    value={sale.description} full />
              </dl>
            </div>
          </div>
        )}

        {tab === 'activity' && (
          <SaleActivityTab
            saleId={sale.id}
            clientId={sale.clientId}
            openFormOnMount={activityFormOpen}
            key={`activity-${activityFormOpen}`}
          />
        )}

        {tab === 'tasks' && (
          <SaleTasksTab
            saleId={sale.id}
            saleTitle={sale.title}
            clientId={sale.clientId}
            clientName={sale.clientName ?? ''}
          />
        )}

        {tab === 'documents' && (
          <SaleDocumentsTab
            saleId={sale.id}
            clientId={sale.clientId}
            clientName={sale.clientName ?? ''}
          />
        )}
      </div>

    </div>
  )
}
