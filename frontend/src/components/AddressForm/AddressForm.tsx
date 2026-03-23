import { useTranslation } from 'react-i18next'
import type { Address } from '@crm/shared'
import InputField from '../FormField/InputField'
import './AddressForm.css'

interface AddressFormProps {
  value: Partial<Omit<Address, 'type'>>
  onChange: (address: Partial<Omit<Address, 'type'>>) => void
}

export default function AddressForm({ value, onChange }: AddressFormProps) {
  const { t } = useTranslation()

  function set(field: keyof Omit<Address, 'type'>, val: string) {
    onChange({ ...value, [field]: val || undefined })
  }

  return (
    <div className="address-form-grid">
      <InputField id="addr-street" label={t('address.street')} className="addr-col-span-2"
        name="street" type="text" autoComplete="street-address"
        value={value.street ?? ''} onChange={(e) => set('street', e.target.value)} />
      <InputField id="addr-postalCode" label={t('address.postalCode')}
        name="postalCode" type="text" autoComplete="postal-code"
        value={value.postalCode ?? ''} onChange={(e) => set('postalCode', e.target.value)} />
      <InputField id="addr-city" label={t('address.city')}
        name="city" type="text" autoComplete="address-level2"
        value={value.city ?? ''} onChange={(e) => set('city', e.target.value)} />
      <InputField id="addr-province" label={t('address.province')}
        name="province" type="text" autoComplete="address-level1"
        value={value.province ?? ''} onChange={(e) => set('province', e.target.value)} />
      <InputField id="addr-country" label={t('address.country')}
        name="country" type="text" autoComplete="country-name"
        value={value.country ?? ''} onChange={(e) => set('country', e.target.value)} />
    </div>
  )
}
