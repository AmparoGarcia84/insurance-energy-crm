import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import type { ClientAddressInput, ClientEmailInput } from '@crm/shared'
import InputField from '../../shared/FormField/InputField'
import AddressList from '../../shared/AddressList/AddressList'
import EmailList from '../../shared/EmailList/EmailList'
import type { Supplier, SupplierInput } from '../../../api/suppliers'
import './SupplierForm.css'

interface Props {
  supplier: Supplier | null   // null = new
  onSave:   (saved: Supplier) => void
  onCancel: () => void
  onSubmit: (data: SupplierInput) => Promise<Supplier>
}

const EMPTY: SupplierInput = {
  name: '',
  cif: '',
  phone: '',
  secondaryPhone: '',
  addresses: [],
  emails: [],
}

function toInput(s: Supplier): SupplierInput {
  return {
    name:           s.name,
    cif:            s.cif            ?? '',
    phone:          s.phone          ?? '',
    secondaryPhone: s.secondaryPhone ?? '',
    addresses: s.addresses?.map(({ type, street, postalCode, city, province, country }) => ({
      type, street, postalCode, city, province, country,
    })) ?? [],
    emails: s.emails?.map(({ address, isPrimary, label, labelColor }) => ({
      address, isPrimary, label, labelColor,
    })) ?? [],
  }
}

export default function SupplierForm({ supplier, onSave, onCancel, onSubmit }: Props) {
  const { t } = useTranslation()
  const [form, setForm]     = useState<SupplierInput>(() => supplier ? toInput(supplier) : EMPTY)
  const [saving, setSaving] = useState(false)
  const [error, setError]   = useState<string | null>(null)

  function set<K extends keyof SupplierInput>(field: K, value: SupplierInput[K]) {
    setForm((prev) => ({ ...prev, [field]: value }))
    setError(null)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.name.trim()) {
      setError(t('suppliers.errors.nameRequired'))
      return
    }
    setSaving(true)
    setError(null)
    try {
      const payload: SupplierInput = {
        name:           form.name.trim(),
        cif:            form.cif?.trim()            || undefined,
        phone:          form.phone?.trim()          || undefined,
        secondaryPhone: form.secondaryPhone?.trim() || undefined,
        addresses:      form.addresses ?? [],
        emails:         (form.emails ?? []).filter((em) => em.address.trim() !== ''),
      }
      const saved = await onSubmit(payload)
      onSave(saved)
    } catch (err: unknown) {
      const e = err as { body?: { error?: string }; status?: number }
      if (e?.status === 400 && e?.body?.error?.includes('CIF')) {
        setError(t('suppliers.errors.cifInvalid'))
      } else if (e?.status === 409) {
        setError(t('suppliers.errors.cifDuplicate'))
      } else {
        setError(String(err))
      }
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="supplier-form-view">
      <div className="page-header">
        <h1 className="page-title">
          {supplier ? t('suppliers.edit') : t('suppliers.new')}
        </h1>
      </div>

      <form className="supplier-form form-card" onSubmit={handleSubmit} noValidate>

        {/* ── Datos generales ── */}
        <section className="form-section">
          <h2 className="form-section-title">{t('suppliers.sections.general')}</h2>
          <div className="form-grid">
            <InputField
              id="sup-name"
              label={`${t('suppliers.fields.name')} *`}
              value={form.name}
              onChange={(e) => set('name', e.target.value)}
              className="col-span-2"
              autoComplete="off"
            />
            <InputField
              id="sup-cif"
              label={t('suppliers.fields.cif')}
              value={form.cif ?? ''}
              onChange={(e) => set('cif', e.target.value)}
              placeholder="A12345678"
              autoComplete="off"
            />
            <InputField
              id="sup-phone"
              label={t('suppliers.fields.phone')}
              value={form.phone ?? ''}
              onChange={(e) => set('phone', e.target.value)}
              type="tel"
              autoComplete="off"
            />
            <InputField
              id="sup-secondary-phone"
              label={t('suppliers.fields.secondaryPhone')}
              value={form.secondaryPhone ?? ''}
              onChange={(e) => set('secondaryPhone', e.target.value)}
              type="tel"
              autoComplete="off"
            />
          </div>
        </section>

        {/* ── Correos electrónicos ── */}
        <section className="form-section">
          <h2 className="form-section-title">{t('suppliers.sections.emails')}</h2>
          <EmailList
            value={(form.emails ?? []) as ClientEmailInput[]}
            onChange={(emails) => set('emails', emails)}
          />
        </section>

        {/* ── Direcciones ── */}
        <section className="form-section">
          <h2 className="form-section-title">{t('suppliers.sections.addresses')}</h2>
          <AddressList
            value={(form.addresses ?? []) as ClientAddressInput[]}
            onChange={(addresses) => set('addresses', addresses)}
          />
        </section>

        {error && <p className="supplier-form-error">{error}</p>}

        <div className="supplier-form-actions">
          <button type="button" className="btn-secondary" onClick={onCancel}>
            {t('suppliers.actions.cancel')}
          </button>
          <button type="submit" className="btn-primary" disabled={saving}>
            {saving ? t('suppliers.actions.saving') : t('suppliers.actions.save')}
          </button>
        </div>

      </form>
    </div>
  )
}
