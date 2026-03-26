import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import type { Address } from '@crm/shared'
import { lookupPostalCode } from '../../utils/postalCode'
import InputField from '../FormField/InputField'
import './AddressForm.css'

interface AddressFormProps {
  value: Partial<Omit<Address, 'type'>>
  onChange: (address: Partial<Omit<Address, 'type'>>) => void
  prefix?: string
}

export default function AddressForm({ value, onChange, prefix = 'addr' }: AddressFormProps) {
  const { t } = useTranslation()
  const [lookingUp, setLookingUp] = useState(false)

  function set(field: keyof Omit<Address, 'type'>, val: string) {
    onChange({ ...value, [field]: val || undefined })
  }

  async function handlePostalCodeBlur(code: string) {
    if (!code) return
    setLookingUp(true)
    const info = await lookupPostalCode(code)
    setLookingUp(false)
    if (info) {
      onChange({
        ...value,
        postalCode: code || undefined,
        city:     info.city     || value.city,
        province: info.province || value.province,
        country:  info.country  || value.country,
      })
    }
  }

  return (
    <div className="form-grid">
      <InputField id={`${prefix}-street`} label={t('address.street')} className="col-span-2"
        name="street" type="text" autoComplete="street-address"
        value={value.street ?? ''} onChange={(e) => set('street', e.target.value)} />
      <InputField id={`${prefix}-postalCode`} label={t('address.postalCode')}
        name="postalCode" type="text" autoComplete="postal-code"
        value={value.postalCode ?? ''} onChange={(e) => set('postalCode', e.target.value)}
        onBlur={(e) => handlePostalCodeBlur(e.target.value)} />
      <InputField id={`${prefix}-city`} label={t('address.city')}
        name="city" type="text" autoComplete="address-level2"
        value={value.city ?? ''} onChange={(e) => set('city', e.target.value)}
        disabled={lookingUp} />
      <InputField id={`${prefix}-province`} label={t('address.province')}
        name="province" type="text" autoComplete="address-level1"
        value={value.province ?? ''} onChange={(e) => set('province', e.target.value)}
        disabled={lookingUp} />
      <InputField id={`${prefix}-country`} label={t('address.country')}
        name="country" type="text" autoComplete="country-name"
        value={value.country ?? ''} onChange={(e) => set('country', e.target.value)}
        disabled={lookingUp} />
    </div>
  )
}
