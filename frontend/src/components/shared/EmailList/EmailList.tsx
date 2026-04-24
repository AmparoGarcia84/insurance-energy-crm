import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Plus, Trash2 } from 'lucide-react'
import { type ClientEmailInput } from '@crm/shared'
import { isValidEmail } from '../../../utils/validation'
import InputField from '../FormField/InputField'
import SelectField from '../FormField/SelectField'
import CheckboxField from '../FormField/CheckboxField'
import './EmailList.css'

export const LABEL_COLORS = [
  { value: '#a8d5a2', key: 'green'  },
  { value: '#a8c8e8', key: 'blue'   },
  { value: '#f0e08c', key: 'yellow' },
  { value: '#e8a8a8', key: 'red'    },
  { value: '#d0d0d0', key: 'grey'   },
] as const

const DEFAULT_COLOR = LABEL_COLORS[0].value

const EMPTY_EMAIL: ClientEmailInput = {
  address: '',
  isPrimary: false,
  label: '',
  labelColor: DEFAULT_COLOR,
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
        <div key={index} className="section-card item-list-item email-card">

          {/* ── Fila 1: dirección (3/4) + principal + eliminar ── */}
          <div className="email-card-row1">
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
            <CheckboxField
              id={`email-isPrimary-${index}`}
              label={t('emailAddress.isPrimary')}
              checked={entry.isPrimary}
              onChange={(e) => update(index, { isPrimary: e.target.checked })}
            />
            <button
              type="button"
              className="icon-btn icon-btn-danger email-card-remove"
              onClick={() => remove(index)}
              aria-label={t('emailAddress.remove')}
            >
              <Trash2 size={15} />
            </button>
          </div>

          {/* ── Fila 2: etiqueta (1/2) + color (1/2) ── */}
          <div className="email-card-row2">
            <InputField
              id={`email-label-${index}`}
              label={t('emailAddress.label')}
              name={`emailLabel-${index}`}
              type="text"
              autoComplete="off"
              value={entry.label ?? ''}
              onChange={(e) => update(index, { label: e.target.value || undefined })}
            />
            <div className="email-color-field">
              <SelectField
                id={`email-labelColor-${index}`}
                label={t('emailAddress.labelColor')}
                name={`emailLabelColor-${index}`}
                value={entry.labelColor ?? DEFAULT_COLOR}
                onChange={(e) => update(index, { labelColor: e.target.value })}
              >
                {LABEL_COLORS.map(({ value: hex, key }) => (
                  <option key={hex} value={hex}>
                    {t(`emailAddress.colors.${key}`)}
                  </option>
                ))}
              </SelectField>
              <span
                className="email-color-badge"
                style={{ background: entry.labelColor ?? DEFAULT_COLOR }}
                aria-hidden="true"
              />
            </div>
          </div>

        </div>
      ))}

      <button type="button" className="btn-add-item" onClick={add}>
        <Plus size={15} />
        {t('emailAddress.add')}
      </button>
    </div>
  )
}
