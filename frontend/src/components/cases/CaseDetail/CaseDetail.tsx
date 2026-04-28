import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { ArrowLeft, Pencil, User, Calendar, FileText } from 'lucide-react'
import type { Case, CaseStatus, CasePriority } from '../../../api/cases'
import ActivityTab from '../../shared/ActivityTab/ActivityTab'
import TasksTab from '../../shared/TasksTab/TasksTab'
import './CaseDetail.css'

// ── Badge maps (shared with Cases list) ───────────────────────────────────────

const STATUS_CLASS: Record<CaseStatus, string> = {
  NEW:         'badge-case-new',
  ON_HOLD:     'badge-case-on-hold',
  FORWARDED:   'badge-case-forwarded',
  IN_PROGRESS: 'badge-case-in-progress',
  CLOSED:      'badge-case-closed',
}

const PRIORITY_CLASS: Record<CasePriority, string> = {
  HIGH:   'badge-priority-high',
  NORMAL: 'badge-priority-normal',
  LOW:    'badge-priority-low',
}

function formatDatetime(iso?: string | null): string {
  if (!iso) return '—'
  return new Date(iso).toLocaleString('es-ES', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}

function formatDate(iso?: string | null): string {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('es-ES', {
    day: '2-digit', month: '2-digit', year: 'numeric',
  })
}

// ── Props ─────────────────────────────────────────────────────────────────────

interface Props {
  case:    Case
  onBack:  () => void
  onEdit:  (c: Case) => void
  /** Optional: navigate to the associated client's detail. */
  onViewClient?: (clientId: string) => void
  /** Optional: navigate to the associated sale's detail. */
  onViewSale?: (saleId: string) => void
}

type Tab = 'activity' | 'tasks'

// ── Component ─────────────────────────────────────────────────────────────────

export default function CaseDetail({ case: caseItem, onBack, onEdit, onViewClient, onViewSale }: Props) {
  const { t } = useTranslation()
  const [tab, setTab] = useState<Tab>('activity')

  const tabs: { id: Tab; label: string }[] = [
    { id: 'activity', label: t('cases.detail.tabs.activity') },
    { id: 'tasks',    label: t('cases.detail.tabs.tasks') },
  ]

  return (
    <div className="csd-view">

      {/* ── Header ── */}
      <div className="csd-header">
        <div className="csd-header-left">
          <button
            className="icon-btn csd-back"
            onClick={onBack}
            title={t('cases.detail.back')}
          >
            <ArrowLeft size={18} />
          </button>
          <div className="csd-header-info">
            <div className="csd-header-name-row">
              <h1 className="csd-name">{caseItem.name}</h1>
              <span className={`badge ${STATUS_CLASS[caseItem.status]}`}>
                {t(`cases.status.${caseItem.status}`)}
              </span>
              <span className={`badge ${PRIORITY_CLASS[caseItem.priority]}`}>
                {t(`cases.priority.${caseItem.priority}`)}
              </span>
              {caseItem.type && (
                <span className="badge badge-case-type">
                  {t(`cases.type.${caseItem.type}`)}
                </span>
              )}
            </div>
            <div className="csd-header-meta">
              {caseItem.client.name}
              {caseItem.sale && (
                <span className="csd-header-meta-sep">·</span>
              )}
              {caseItem.sale && <span>{caseItem.sale.title}</span>}
            </div>
          </div>
        </div>

        <div className="csd-header-actions">
          <button className="btn-primary" onClick={() => onEdit(caseItem)}>
            <Pencil size={15} />
            {t('cases.detail.edit')}
          </button>
        </div>
      </div>

      {/* ── Info card ── */}
      <div className="section-card csd-info-card">
        <div className="csd-info-card__header">
          <FileText size={15} className="csd-info-card__icon" />
          <span className="csd-info-card__title">{t('cases.detail.cards.info')}</span>
        </div>
        <div className="csd-info-card__body">

          {/* Client */}
          <div className="csd-info-section">
            <div className="csd-info-section__header">
              <User size={13} className="csd-info-section__icon" />
              <span className="csd-info-section__label">{t('cases.detail.cards.client')}</span>
            </div>
            <p className="csd-info-client-name">{caseItem.client.name}</p>
            {onViewClient && (
              <button
                className="csd-link-btn"
                onClick={() => onViewClient(caseItem.clientId)}
              >
                {t('cases.detail.cards.viewClient')}
              </button>
            )}
            {caseItem.sale && onViewSale && (
              <button
                className="csd-link-btn"
                onClick={() => onViewSale(caseItem.saleId!)}
              >
                {t('cases.detail.cards.viewSale')}: {caseItem.sale.title}
              </button>
            )}
          </div>

          {/* Dates */}
          <div className="csd-info-section">
            <div className="csd-info-section__header">
              <Calendar size={13} className="csd-info-section__icon" />
              <span className="csd-info-section__label">{t('cases.fields.occurrenceAt')}</span>
            </div>
            <p className="csd-info-value">{formatDatetime(caseItem.occurrenceAt)}</p>
            <dl className="csd-info-dates">
              <div className="csd-info-date-row">
                <dt>{t('cases.columns.updatedAt')}</dt>
                <dd>{formatDate(caseItem.updatedAt)}</dd>
              </div>
            </dl>
          </div>

          {/* Description & cause */}
          {(caseItem.description || caseItem.cause) && (
            <div className="csd-info-section csd-info-section--full">
              {caseItem.description && (
                <div className="csd-info-text-block">
                  <span className="csd-info-label">{t('cases.fields.description')}</span>
                  <p className="csd-info-text">{caseItem.description}</p>
                </div>
              )}
              {caseItem.cause && (
                <div className="csd-info-text-block">
                  <span className="csd-info-label">{t('cases.fields.cause')}</span>
                  <p className="csd-info-text">{caseItem.cause}</p>
                </div>
              )}
            </div>
          )}

          {/* Supplier */}
          {caseItem.supplier && (
            <div className="csd-info-section">
              <span className="csd-info-label">{t('cases.fields.supplier')}</span>
              <p className="csd-info-value">{caseItem.supplier.name}</p>
            </div>
          )}

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
        {tab === 'activity' && (
          <ActivityTab
            clientId={caseItem.clientId}
            caseId={caseItem.id}
          />
        )}
        {tab === 'tasks' && (
          <TasksTab
            context={{
              lockedClientId:  caseItem.clientId,
              lockedClientName: caseItem.client.name,
              lockedCaseId:    caseItem.id,
              lockedCaseName:  caseItem.name,
            }}
          />
        )}
      </div>

    </div>
  )
}
