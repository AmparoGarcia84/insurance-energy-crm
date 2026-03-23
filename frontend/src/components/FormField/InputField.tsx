import './FormField.css'

interface InputFieldProps extends React.InputHTMLAttributes<HTMLInputElement> {
  id: string
  label: string
  className?: string
}

export default function InputField({ id, label, className, ...inputProps }: InputFieldProps) {
  const wrapClass = className ? `form-field ${className}` : 'form-field'
  return (
    <div className={wrapClass}>
      <label htmlFor={id}>{label}</label>
      <input id={id} {...inputProps} />
    </div>
  )
}
