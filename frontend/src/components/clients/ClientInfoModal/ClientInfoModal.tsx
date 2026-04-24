import { X } from 'lucide-react'
import { useTranslation } from 'react-i18next'
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
import type { Client } from '../../../api/clients'
import './ClientInfoModal.css'

interface Props {
  client: Client
  onClose: () => void
}

function formatDate(iso?: string, locale = 'es'): string {
  if (!iso) return '—'
  const d = new Date(iso)
  if (isNaN(d.getTime())) return '—'
  return d.toLocaleDateString(locale, { day: '2-digit', month: '2-digit', year: 'numeric' })
}

function Field({ label, value }: { label: string; value?: string | number | null }) {
  return (
    <div className="cim-field">
      <span className="cim-field-label">{label}</span>
      <span className="cim-field-value">{value ?? '—'}</span>
    </div>
  )
}

export default function ClientInfoModal({ client, onClose }: Props) {
  const { t, i18n } = useTranslation()
  const fmt = (iso?: string) => formatDate(iso, i18n.language)

  return (
    <div className="cim-backdrop" onClick={onClose}>
      <div className="cim-modal" role="dialog" aria-modal="true" onClick={(e) => e.stopPropagation()}>

        <div className="cim-header">
          <h2 className="cim-title">{client.name}</h2>
          <button className="icon-btn" onClick={onClose} title={t('common.close')}>
            <X size={18} />
          </button>
        </div>

        <div className="cim-body">

          {/* Identificación */}
          <section className="cim-section">
            <h3 className="form-section-title">{t('clients.sections.identification')}</h3>
            <div className="cim-grid">
              <Field label={t('clients.fields.name')}         value={client.name} />
              <Field label={t('clients.fields.nif')}          value={client.nif} />
              <Field label={t('clients.fields.clientNumber')} value={client.clientNumber} />
            </div>
          </section>

          {/* Documentación */}
          <section className="cim-section">
            <h3 className="form-section-title">{t('clients.sections.personal')}</h3>
            <div className="cim-grid">
              <Field label={t('clients.fields.birthDate')}               value={fmt(client.birthDate)} />
              <Field label={t('clients.fields.dniExpiryDate')}           value={fmt(client.dniExpiryDate)} />
              <Field label={t('clients.fields.drivingLicenseIssueDate')} value={fmt(client.drivingLicenseIssueDate)} />
            </div>
          </section>

          {/* Contacto */}
          <section className="cim-section">
            <h3 className="form-section-title">{t('clients.sections.contact')}</h3>
            <div className="cim-grid">
              <Field label={t('clients.fields.mobilePhone')}    value={client.mobilePhone} />
              <Field label={t('clients.fields.secondaryPhone')} value={client.secondaryPhone} />
              <Field label={t('clients.fields.website')}        value={client.website} />
            </div>
          </section>

          {/* Correos electrónicos */}
          {client.emails && client.emails.length > 0 && (
            <section className="cim-section">
              <h3 className="form-section-title">{t('clients.sections.emails')}</h3>
              <div className="cim-card-list">
                {client.emails.map((em) => (
                  <div key={em.id} className="cim-card">
                    <span className="cim-card-label">
                      {em.label && (
                        <span className="cim-email-label-tag" style={{ background: em.labelColor ?? '#b8a79c' }}>
                          {em.label}
                        </span>
                      )}
                      {em.isPrimary && <span className="cim-card-primary">{t('emailAddress.isPrimary')}</span>}
                    </span>
                    <p>{em.address}</p>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Direcciones */}
          {client.addresses && client.addresses.length > 0 && (
            <section className="cim-section">
              <h3 className="form-section-title">{t('clients.sections.addresses')}</h3>
              <div className="cim-card-list">
                {client.addresses.map((addr) => (
                  <div key={addr.id} className="cim-card">
                    {addr.type && (
                      <span className="cim-card-label">{AddressTypeLabels[addr.type]}</span>
                    )}
                    <p>{[addr.street, addr.postalCode, addr.city, addr.province, addr.country].filter(Boolean).join(', ') || '—'}</p>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Empresa y facturación */}
          <section className="cim-section">
            <h3 className="form-section-title">{t('clients.sections.business')}</h3>
            <div className="cim-grid">
              <Field label={t('clients.fields.employees')}    value={client.employees} />
              <Field label={t('clients.fields.annualRevenue')} value={client.annualRevenue != null ? `${client.annualRevenue.toLocaleString(i18n.language)} €` : undefined} />
              <Field label={t('clients.fields.sicCode')}      value={client.sicCode} />
              <Field label={t('clients.fields.activity')}
                value={client.activity ? ClientActivityLabels[client.activity as ClientActivity] : undefined} />
            </div>
          </section>

          {/* Cuentas bancarias */}
          {client.bankAccounts && client.bankAccounts.length > 0 && (
            <section className="cim-section">
              <h3 className="form-section-title">{t('clients.sections.bankAccounts')}</h3>
              <div className="cim-card-list">
                {client.bankAccounts.map((acc) => (
                  <div key={acc.id} className="cim-card">
                    <span className="cim-card-label">{AccountTypeLabels[acc.type]}</span>
                    <p className="cim-iban">{acc.iban}</p>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Clasificación */}
          <section className="cim-section">
            <h3 className="form-section-title">{t('clients.sections.classification')}</h3>
            <div className="cim-grid">
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
          <section className="cim-section">
            <h3 className="form-section-title">{t('clients.sections.commercial')}</h3>
            <div className="cim-grid">
              <Field label={t('clients.fields.accountOwnerUserId')}    value={client.accountOwnerName} />
              <Field label={t('clients.fields.commercialAgentUserId')} value={client.commercialAgentName} />
            </div>
          </section>

          {/* Jerarquía */}
          {(client.isMainClient || client.mainClientId) && (
            <section className="cim-section">
              <h3 className="form-section-title">{t('clients.sections.hierarchy')}</h3>
              <div className="cim-grid">
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
            <section className="cim-section">
              <h3 className="form-section-title">{t('clients.sections.notes')}</h3>
              <p className="cim-description">{client.description}</p>
            </section>
          )}

        </div>
      </div>
    </div>
  )
}
