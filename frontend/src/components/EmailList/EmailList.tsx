import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Plus, Trash2 } from 'lucide-react'
import { EmailType, EmailTypeLabels, type ClientEmailInput } from '@crm/shared'
import { isValidEmail } from '../../utils/validation'
import SelectField from '../FormField/SelectField'
import InputField from '../FormField/InputField'
import CheckboxField from '../FormField/CheckboxField'
import './EmailList.css'

const EMAIL_TYPES = Object.values(EmailType)

const EMPTY_EMAIL: ClientEmailInput = {
  type: EmailType.PERSONAL,
  address: '',
  isPrimary: false,
  label: '',
}

interface EmailListProps {
  value: ClientEmailInput[]
  onChange: (emails: ClientEmailInput[]) => void
}

export default function EmailList({ value, onChange }: EmailListProps) {
  const { t } = useTranslation()
  const [errors, setErrors] = useState<Record<number, string>>({})

  function setError(index: number, msg: string) {
    setErrors((e) => ({ ...e, [index]: msg }))
  }

  function add() {
    onChange([...value, { ...EMPTY_EMAIL }])
  }

  function remove(index: number) {
    const next = value.filter((_, i) => i !== index)
    // If the removed entry was primary and there's still at least one left,
    // promote the first entry to primary automatically
    if (value[index].isPrimary && next.length > 0) {
      next[0] = { ...next[0], isPrimary: true }
    }
    onChange(next)
    setErrors((e) => {
      const shifted: Record<number, string> = {}
      Object.entries(e).forEach(([k, v]) => {
        const n = Number(k)
        if (n < index) shifted[n] = v
        else if (n > index) shifted[n - 1] = v
      })
      return shifted
    })
  }

  function update(index: number, patch: Partial<ClientEmailInput>) {
    let updated = value.map((entry, i) => (i === index ? { ...entry, ...patch } : entry))
    // Enforce single primary: if this entry is being set as primary, clear the others
    if (patch.isPrimary) {
      updated = updated.map((entry, i) => (i === index ? entry : { ...entry, isPrimary: false }))
    }
    onChange(updated)
  }

  return (
    <div className="item-list">
      {value.map((entry, index) => (
        <div key={index} className="section-card item-list-item">
          <div className="item-list-item-header">
            <SelectField
              id={`email-type-${index}`}
              label={t('emailAddress.type')}
              name={`emailType-${index}`}
              value={entry.type}
              onChange={(e) => update(index, { type: e.target.value as EmailType })}
            >
              {EMAIL_TYPES.map((v) => (
                <option key={v} value={v}>{EmailTypeLabels[v]}</option>
              ))}
            </SelectField>
            <button
              type="button"
              className="icon-btn icon-btn-danger"
              onClick={() => remove(index)}
              aria-label={t('emailAddress.remove')}
            >
              <Trash2 size={15} />
            </button>
          </div>
          <InputField
            id={`email-address-${index}`}
            label={t('emailAddress.address')}
            name={`emailAddress-${index}`}
            type="email"
            autoComplete="off"
            value={entry.address}
            onChange={(e) => update(index, { address: e.target.value })}
            onBlur={(e) => setError(index, isValidEmail(e.target.value) ? '' : t('validation.email'))}
            error={errors[index]}
          />
          <InputField
            id={`email-label-${index}`}
            label={t('emailAddress.label')}
            name={`emailLabel-${index}`}
            type="text"
            autoComplete="off"
            value={entry.label ?? ''}
            onChange={(e) => update(index, { label: e.target.value || undefined })}
          />
          <CheckboxField
            id={`email-isPrimary-${index}`}
            label={t('emailAddress.isPrimary')}
            checked={entry.isPrimary}
            onChange={(e) => update(index, { isPrimary: e.target.checked })}
          />
        </div>
      ))}

      <button type="button" className="btn-add-item" onClick={add}>
        <Plus size={15} />
        {t('emailAddress.add')}
      </button>
    </div>
  )
}
