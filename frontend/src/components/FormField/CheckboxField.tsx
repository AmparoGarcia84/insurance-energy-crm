import './FormField.css'

interface CheckboxFieldProps extends React.InputHTMLAttributes<HTMLInputElement> {
  id: string
  label: string
  className?: string
}

export default function CheckboxField({ id, label, className, ...inputProps }: CheckboxFieldProps) {
  const wrapClass = ['form-field', 'form-field--checkbox', className].filter(Boolean).join(' ')
  return (
    <div className={wrapClass}>
      <label htmlFor={id}>
        <input id={id} type="checkbox" {...inputProps} />
        {label}
      </label>
    </div>
  )
}
