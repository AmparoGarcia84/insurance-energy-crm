import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { ArrowLeft, Pencil, Eye, Phone, Mail, User } from 'lucide-react'
import {
  ClientTypeLabels,
  ClientStatusLabels,
} from '@crm/shared'
import type { Client } from '../../api/clients'
import ClientInfoModal from '../ClientInfoModal/ClientInfoModal'
import ClientSummaryTab from '../ClientSummaryTab/ClientSummaryTab'
import ClientSalesTab from '../ClientSalesTab/ClientSalesTab'
import ClientDocumentsTab from '../ClientDocumentsTab/ClientDocumentsTab'
import './ClientDetail.css'

interface Props {
  client: Client
  onBack: () => void
  onEdit: (client: Client) => void
}

type Tab = 'summary' | 'activity' | 'sales' | 'mail' | 'documents'

function initials(name: string): string {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join('')
}

export default function ClientDetail({ client, onBack, onEdit }: Props) {
  const { t } = useTranslation()
  const [tab, setTab] = useState<Tab>('summary')
  const [showInfo, setShowInfo] = useState(false)

  const tabs: { id: Tab; label: string }[] = [
    { id: 'summary',   label: t('clients.tabs.summary') },
    { id: 'activity',  label: t('clients.tabs.activity') },
    { id: 'sales',     label: t('clients.tabs.sales') },
    { id: 'mail',      label: t('clients.tabs.mail') },
    { id: 'documents', label: t('clients.tabs.documents') },
  ]

  return (
    <div className="cd-view">

      {/* ── Header card ── */}
      <div className="cd-header">
        <div className="cd-header-left">
          <button className="icon-btn cd-back" onClick={onBack} title={t('clients.detail.back')}>
            <ArrowLeft size={18} />
          </button>

          <div className="cd-avatar">
            {initials(client.name)}
          </div>

          <div className="cd-header-info">
            <div className="cd-header-name-row">
              <h1 className="cd-name">{client.name}</h1>
              {client.type && (
                <span className={`badge badge-type badge-type-${client.type.toLowerCase()}`}>
                  {ClientTypeLabels[client.type]}
                </span>
              )}
              {client.status && (
                <span className={`badge badge-status badge-status-${client.status.toLowerCase()}`}>
                  {ClientStatusLabels[client.status]}
                </span>
              )}
            </div>
            <div className="cd-header-meta">
              {client.nif && <span>{client.nif}</span>}
              {client.mobilePhone && (
                <span className="cd-meta-item">
                  <Phone size={13} />
                  {client.mobilePhone}
                </span>
              )}
              {client.email && (
                <span className="cd-meta-item">
                  <Mail size={13} />
                  {client.email}
                </span>
              )}
              {client.accountOwnerName && (
                <span className="cd-meta-item">
                  <User size={13} />
                  {client.accountOwnerName}
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="cd-header-actions">
          <button className="btn-secondary" onClick={() => setShowInfo(true)}>
            <Eye size={15} />
            {t('clients.detail.view')}
          </button>
          <button className="btn-primary" onClick={() => onEdit(client)}>
            <Pencil size={15} />
            {t('clients.detail.edit')}
          </button>
        </div>
      </div>

      {/* ── Tabs ── */}
      <div className="cd-tabs">
        {tabs.map((t) => (
          <button
            key={t.id}
            className={`cd-tab${tab === t.id ? ' cd-tab-active' : ''}`}
            onClick={() => setTab(t.id)}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* ── Tab content ── */}
      <div className="cd-content">
        {tab === 'summary' ? (
          <ClientSummaryTab clientId={client.id} />
        ) : tab === 'sales' ? (
          <ClientSalesTab clientId={client.id} clientName={client.name} />
        ) : tab === 'documents' ? (
          <ClientDocumentsTab clientId={client.id} clientName={client.name} />
        ) : (
          <div className="cd-placeholder">
            <p>{t('clients.detail.comingSoon')}</p>
          </div>
        )}
      </div>

      {/* ── Info modal ── */}
      {showInfo && (
        <ClientInfoModal client={client} onClose={() => setShowInfo(false)} />
      )}
    </div>
  )
}
