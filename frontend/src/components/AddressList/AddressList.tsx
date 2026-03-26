import { useTranslation } from 'react-i18next'
import { Plus, Trash2 } from 'lucide-react'
import { AddressType, AddressTypeLabels, type ClientAddressInput } from '@crm/shared'
import SelectField from '../FormField/SelectField'
import AddressForm from '../AddressForm/AddressForm'
import './AddressList.css'

const ADDRESS_TYPES = Object.values(AddressType)

const EMPTY_ADDRESS: ClientAddressInput = {
  type: AddressType.FISCAL,
}

interface AddressListProps {
  value: ClientAddressInput[]
  onChange: (addresses: ClientAddressInput[]) => void
}

export default function AddressList({ value, onChange }: AddressListProps) {
  const { t } = useTranslation()

  function add() {
    onChange([...value, { ...EMPTY_ADDRESS }])
  }

  function remove(index: number) {
    onChange(value.filter((_, i) => i !== index))
  }

  function update(index: number, patch: Partial<ClientAddressInput>) {
    onChange(value.map((entry, i) => (i === index ? { ...entry, ...patch } : entry)))
  }

  return (
    <div className="address-list">
      {value.map((entry, index) => (
        <div key={index} className="address-list-item">
          <div className="address-list-item-header">
            <SelectField
              id={`addr-type-${index}`}
              label={t('address.type')}
              name={`addressType-${index}`}
              value={entry.type}
              onChange={(e) => update(index, { type: e.target.value as AddressType })}
            >
              {ADDRESS_TYPES.map((v) => (
                <option key={v} value={v}>{AddressTypeLabels[v]}</option>
              ))}
            </SelectField>
            <button
              type="button"
              className="icon-btn icon-btn-danger"
              onClick={() => remove(index)}
              aria-label={t('address.remove')}
            >
              <Trash2 size={15} />
            </button>
          </div>
          <AddressForm
            value={entry}
            onChange={(fields) => update(index, fields)}
            prefix={`addr-${index}`}
          />
        </div>
      ))}

      <button type="button" className="btn-add-item" onClick={add}>
        <Plus size={15} />
        {t('address.add')}
      </button>
    </div>
  )
}
