import './FormField.css'

interface InputFieldProps extends React.InputHTMLAttributes<HTMLInputElement> {
  id: string
  label: string
  error?: string
  className?: string
}

export default function InputField({ id, label, error, className, ...inputProps }: InputFieldProps) {
  const wrapClass = ['form-field', className, error ? 'form-field--error' : ''].filter(Boolean).join(' ')
  return (
    <div className={wrapClass}>
      <label htmlFor={id}>{label}</label>
      <input id={id} aria-describedby={error ? `${id}-error` : undefined} {...inputProps} />
      {error && <span id={`${id}-error`} className="form-field__error">{error}</span>}
    </div>
  )
}
