import { Search } from 'lucide-react'

interface BasicSearchProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  id?: string
  name?: string
  className?: string
}

export default function BasicSearch({ value, onChange, placeholder, id, name, className }: BasicSearchProps) {
  const wrapClass = ['table-search', className].filter(Boolean).join(' ')
  return (
    <div className={wrapClass}>
      <Search size={15} />
      <input
        id={id}
        name={name}
        type="search"
        autoComplete="off"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
      />
    </div>
  )
}
