/**
 * FormField/FormField.tsx — Reusable labeled input field
 *
 * Wraps a label + input pair into a single component to avoid repeating the
 * same structure across every form in the app (Login, Client, Policy, etc.).
 *
 * Accepts all standard HTML input attributes via React.InputHTMLAttributes
 * so it works as a drop-in wherever a plain <input> would be used.
 */
import './FormField.css'

interface FormFieldProps extends React.InputHTMLAttributes<HTMLInputElement> {
  id: string
  label: string
}

/**
 * Renders a label and an input bound by the shared `id`.
 * All extra props (type, value, onChange, placeholder, required…) are
 * forwarded directly to the underlying <input> element.
 */
export default function FormField({ id, label, ...inputProps }: FormFieldProps) {
  return (
    <div className="form-field">
      <label htmlFor={id}>{label}</label>
      <input id={id} {...inputProps} />
    </div>
  )
}
