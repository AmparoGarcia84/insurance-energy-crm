import { SaleType } from '../../../api/sales'
import './SaleTypeToggle.css'

interface SaleTypeToggleProps {
  value: SaleType
  onChange: (value: SaleType) => void
  insuranceLabel: string
  energyLabel: string
  label?: string
  className?: string
}

export default function SaleTypeToggle({
  value,
  onChange,
  insuranceLabel,
  energyLabel,
  label,
  className,
}: SaleTypeToggleProps) {
  const rootClass = ['sale-type-toggle', className].filter(Boolean).join(' ')
  const controls = (
    <div className="sale-type-toggle__group" role="group" aria-label={label ?? 'Sale type'}>
      <button
        type="button"
        className={value === SaleType.INSURANCE ? 'sale-type-toggle__btn sale-type-toggle__btn--active' : 'sale-type-toggle__btn'}
        onClick={() => onChange(SaleType.INSURANCE)}
      >
        {insuranceLabel}
      </button>
      <button
        type="button"
        className={value === SaleType.ENERGY ? 'sale-type-toggle__btn sale-type-toggle__btn--active' : 'sale-type-toggle__btn'}
        onClick={() => onChange(SaleType.ENERGY)}
      >
        {energyLabel}
      </button>
    </div>
  )

  if (!label) {
    return <div className={rootClass}>{controls}</div>
  }

  return (
    <fieldset className={rootClass}>
      <legend className="sale-type-toggle__legend">{label}</legend>
      {controls}
    </fieldset>
  )
}
