import './FormField.css'

interface TextareaFieldProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  id: string
  label: string
  className?: string
}

export default function TextareaField({ id, label, className, ...textareaProps }: TextareaFieldProps) {
  const wrapClass = className ? `form-field ${className}` : 'form-field'
  return (
    <div className={wrapClass}>
      <label htmlFor={id}>{label}</label>
      <textarea id={id} {...textareaProps} />
    </div>
  )
}
