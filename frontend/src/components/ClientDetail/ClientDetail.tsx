import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { ArrowLeft, Pencil, Phone, Mail, User } from 'lucide-react'
import {
  ClientActivity,
  ClientSector,
  ClientTypeLabels,
  ClientStatusLabels,
  ClientQualificationLabels,
  CollectionManagerLabels,
  ClientActivityLabels,
  ClientSectorLabels,
  AddressTypeLabels,
  AccountTypeLabels,
} from '@crm/shared'
import type { Client } from '../../api/clients'
import './ClientDetail.css'

interface Props {
  client: Client
  onBack: () => void
  onEdit: (client: Client) => void
}

type Tab = 'info' | 'sales' | 'policies' | 'energy' | 'cases'

function initials(name: string): string {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join('')
}

function formatDate(iso?: string, locale = 'es'): string {
  if (!iso) return '—'
  const d = new Date(iso)
  if (isNaN(d.getTime())) return '—'
  return d.toLocaleDateString(locale, { day: '2-digit', month: '2-digit', year: 'numeric' })
}

function Field({ label, value }: { label: string; value?: string | number | null }) {
  return (
    <div className="cd-field">
      <span className="cd-field-label">{label}</span>
      <span className="cd-field-value">{value ?? '—'}</span>
    </div>
  )
}

export default function ClientDetail({ client, onBack, onEdit }: Props) {
  const { t, i18n } = useTranslation()
  const fmt = (iso?: string) => formatDate(iso, i18n.language)
  const [tab, setTab] = useState<Tab>('info')

  const tabs: { id: Tab; label: string }[] = [
    { id: 'info',     label: t('clients.tabs.info') },
    { id: 'sales',    label: t('clients.tabs.sales') },
    { id: 'policies', label: t('clients.tabs.policies') },
    { id: 'energy',   label: t('clients.tabs.energy') },
    { id: 'cases',    label: t('clients.tabs.cases') },
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
              {client.accountOwnerUserId && (
                <span className="cd-meta-item">
                  <User size={13} />
                  {client.accountOwnerUserId}
                </span>
              )}
            </div>
          </div>
        </div>

        <button className="btn-primary" onClick={() => onEdit(client)}>
          <Pencil size={15} />
          {t('clients.detail.edit')}
        </button>
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

        {tab === 'info' && (
          <div className="cd-sections">

            {/* Identificación */}
            <section className="cd-section">
              <h2 className="form-section-title">{t('clients.sections.identification')}</h2>
              <div className="cd-grid">
                <Field label={t('clients.fields.name')}         value={client.name} />
                <Field label={t('clients.fields.nif')}          value={client.nif} />
                <Field label={t('clients.fields.clientNumber')} value={client.clientNumber} />
              </div>
            </section>

            {/* Documentación */}
            <section className="cd-section">
              <h2 className="form-section-title">{t('clients.sections.personal')}</h2>
              <div className="cd-grid">
                <Field label={t('clients.fields.birthDate')}               value={fmt(client.birthDate)} />
                <Field label={t('clients.fields.dniExpiryDate')}           value={fmt(client.dniExpiryDate)} />
                <Field label={t('clients.fields.drivingLicenseIssueDate')} value={fmt(client.drivingLicenseIssueDate)} />
              </div>
            </section>

            {/* Contacto */}
            <section className="cd-section">
              <h2 className="form-section-title">{t('clients.sections.contact')}</h2>
              <div className="cd-grid">
                <Field label={t('clients.fields.mobilePhone')}    value={client.mobilePhone} />
                <Field label={t('clients.fields.secondaryPhone')} value={client.secondaryPhone} />
                <Field label={t('clients.fields.email')}          value={client.email} />
                <Field label={t('clients.fields.website')}        value={client.website} />
              </div>
            </section>

            {/* Direcciones */}
            {client.addresses && client.addresses.length > 0 && (
              <section className="cd-section">
                <h2 className="form-section-title">{t('clients.sections.addresses')}</h2>
                <div className="cd-address-list">
                  {client.addresses.map((addr) => (
                    <div key={addr.id} className="cd-address-card">
                      {addr.type && (
                        <span className="cd-address-type">{AddressTypeLabels[addr.type]}</span>
                      )}
                      <p>{[addr.street, addr.postalCode, addr.city, addr.province, addr.country].filter(Boolean).join(', ') || '—'}</p>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Empresa y facturación */}
            <section className="cd-section">
              <h2 className="form-section-title">{t('clients.sections.business')}</h2>
              <div className="cd-grid">
                <Field label={t('clients.fields.employees')}    value={client.employees} />
                <Field label={t('clients.fields.annualRevenue')} value={client.annualRevenue != null ? `${client.annualRevenue.toLocaleString(i18n.language)} €` : undefined} />
                <Field label={t('clients.fields.sicCode')}      value={client.sicCode} />
                <Field label={t('clients.fields.activity')}
                  value={client.activity ? ClientActivityLabels[client.activity as ClientActivity] : undefined} />
              </div>
            </section>

            {/* Cuentas bancarias */}
            {client.bankAccounts && client.bankAccounts.length > 0 && (
              <section className="cd-section">
                <h2 className="form-section-title">{t('clients.sections.bankAccounts')}</h2>
                <div className="cd-address-list">
                  {client.bankAccounts.map((acc) => (
                    <div key={acc.id} className="cd-address-card">
                      <span className="cd-address-type">{AccountTypeLabels[acc.type]}</span>
                      <p className="cd-iban">{acc.iban}</p>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Clasificación */}
            <section className="cd-section">
              <h2 className="form-section-title">{t('clients.sections.classification')}</h2>
              <div className="cd-grid">
                <Field label={t('clients.fields.type')}
                  value={client.type ? ClientTypeLabels[client.type] : undefined} />
                <Field label={t('clients.fields.status')}
                  value={client.status ? ClientStatusLabels[client.status] : undefined} />
                <Field label={t('clients.fields.qualification')}
                  value={client.qualification ? ClientQualificationLabels[client.qualification] : undefined} />
                <Field label={t('clients.fields.collectionManager')}
                  value={client.collectionManager ? CollectionManagerLabels[client.collectionManager] : undefined} />
                <Field label={t('clients.fields.sector')}
                  value={client.sector ? ClientSectorLabels[client.sector as ClientSector] : undefined} />
              </div>
            </section>

            {/* Gestión comercial */}
            <section className="cd-section">
              <h2 className="form-section-title">{t('clients.sections.commercial')}</h2>
              <div className="cd-grid">
                <Field label={t('clients.fields.accountOwnerUserId')}    value={client.accountOwnerUserId} />
                <Field label={t('clients.fields.commercialAgentUserId')} value={client.commercialAgentUserId} />
              </div>
            </section>

            {/* Jerarquía */}
            {(client.isMainClient || client.mainClientId) && (
              <section className="cd-section">
                <h2 className="form-section-title">{t('clients.sections.hierarchy')}</h2>
                <div className="cd-grid">
                  {client.isMainClient && (
                    <Field label={t('clients.fields.isMainClient')} value={t('clients.fields.isMainClient')} />
                  )}
                  {client.mainClientId && (
                    <Field
                      label={t('clients.fields.mainClientId')}
                      value={client.mainClient
                        ? [client.mainClient.clientNumber, client.mainClient.name].filter(Boolean).join(' · ')
                        : client.mainClientId}
                    />
                  )}
                </div>
              </section>
            )}

            {/* Observaciones */}
            {client.description && (
              <section className="cd-section">
                <h2 className="form-section-title">{t('clients.sections.notes')}</h2>
                <p className="cd-description">{client.description}</p>
              </section>
            )}

          </div>
        )}

        {tab !== 'info' && (
          <div className="cd-placeholder">
            <p>{t('clients.detail.comingSoon')}</p>
          </div>
        )}

      </div>
    </div>
  )
}
