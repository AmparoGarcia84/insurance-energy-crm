import './FormField.css'

interface SelectFieldProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  id: string
  label: string
  className?: string
  children: React.ReactNode
}

export default function SelectField({ id, label, className, children, ...selectProps }: SelectFieldProps) {
  const wrapClass = className ? `form-field ${className}` : 'form-field'
  return (
    <div className={wrapClass}>
      <label htmlFor={id}>{label}</label>
      <select id={id} {...selectProps}>{children}</select>
    </div>
  )
}
