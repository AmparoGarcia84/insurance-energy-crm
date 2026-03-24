import { useTranslation } from 'react-i18next'
import { Plus, Trash2 } from 'lucide-react'
import { AccountType, AccountTypeLabels, type ClientBankAccountInput } from '@crm/shared'
import SelectField from '../FormField/SelectField'
import InputField from '../FormField/InputField'
import '../AddressList/AddressList.css'
import './BankAccountList.css'

const ACCOUNT_TYPES = Object.values(AccountType)

const EMPTY_ACCOUNT: ClientBankAccountInput = {
  type: AccountType.PERSONAL,
  iban: '',
}

interface BankAccountListProps {
  value: ClientBankAccountInput[]
  onChange: (accounts: ClientBankAccountInput[]) => void
}

export default function BankAccountList({ value, onChange }: BankAccountListProps) {
  const { t } = useTranslation()

  function add() {
    onChange([...value, { ...EMPTY_ACCOUNT }])
  }

  function remove(index: number) {
    onChange(value.filter((_, i) => i !== index))
  }

  function update(index: number, patch: Partial<ClientBankAccountInput>) {
    onChange(value.map((entry, i) => (i === index ? { ...entry, ...patch } : entry)))
  }

  return (
    <div className="address-list">
      {value.map((entry, index) => (
        <div key={index} className="address-list-item">
          <div className="address-list-item-header">
            <SelectField
              id={`account-type-${index}`}
              label={t('bankAccount.type')}
              name={`accountType-${index}`}
              value={entry.type}
              onChange={(e) => update(index, { type: e.target.value as AccountType })}
            >
              {ACCOUNT_TYPES.map((v) => (
                <option key={v} value={v}>{AccountTypeLabels[v]}</option>
              ))}
            </SelectField>
            <button
              type="button"
              className="icon-btn icon-btn-danger"
              onClick={() => remove(index)}
              aria-label={t('bankAccount.remove')}
            >
              <Trash2 size={15} />
            </button>
          </div>
          <InputField
            id={`account-iban-${index}`}
            label={t('bankAccount.iban')}
            name={`iban-${index}`}
            type="text"
            autoComplete="off"
            value={entry.iban}
            onChange={(e) => update(index, { iban: e.target.value })}
          />
        </div>
      ))}

      <button type="button" className="btn-add-item" onClick={add}>
        <Plus size={15} />
        {t('bankAccount.add')}
      </button>
    </div>
  )
}
