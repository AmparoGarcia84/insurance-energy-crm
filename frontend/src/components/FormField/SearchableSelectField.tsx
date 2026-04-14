import { useState, useRef, useEffect } from 'react'
import { ChevronDown } from 'lucide-react'
import './FormField.css'

export interface SelectOption {
  value: string
  label: string
}

interface Props {
  id: string
  label: string
  name: string
  value: string
  options: SelectOption[]
  emptyLabel?: string
  searchPlaceholder?: string
  noResultsLabel?: string
  onChange: (value: string) => void
  className?: string
}

export default function SearchableSelectField({
  id,
  label,
  name,
  value,
  options,
  emptyLabel,
  searchPlaceholder = 'Search...',
  noResultsLabel = 'No results',
  onChange,
  className,
}: Props) {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')
  const containerRef = useRef<HTMLDivElement>(null)
  const searchRef = useRef<HTMLInputElement>(null)

  const selectedLabel = options.find((o) => o.value === value)?.label

  const filtered = search
    ? options.filter((o) => o.label.toLowerCase().includes(search.toLowerCase()))
    : options

  useEffect(() => {
    if (open) searchRef.current?.focus()
  }, [open])

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
        setSearch('')
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  function select(val: string) {
    onChange(val)
    setOpen(false)
    setSearch('')
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Escape') {
      setOpen(false)
      setSearch('')
    }
  }

  const wrapClass = ['form-field', 'searchable-select', className].filter(Boolean).join(' ')

  return (
    <div className={wrapClass} ref={containerRef}>
      <label htmlFor={id}>{label}</label>
      <input type="hidden" id={id} name={name} value={value} />
      <button
        type="button"
        className={`searchable-select__control${open ? ' open' : ''}`}
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => { setOpen((o) => !o); setSearch('') }}
        onKeyDown={handleKeyDown}
      >
        <span className={value ? undefined : 'searchable-select__placeholder'}>
          {selectedLabel ?? emptyLabel ?? ''}
        </span>
        <ChevronDown size={14} className={`searchable-select__chevron${open ? ' open' : ''}`} />
      </button>

      {open && (
        <div className="searchable-select__dropdown" role="listbox" onKeyDown={handleKeyDown}>
          <input
            ref={searchRef}
            type="text"
            className="searchable-select__search"
            placeholder={searchPlaceholder}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <div className="searchable-select__options">
            {emptyLabel && (
              <div
                className={`searchable-select__option${!value ? ' selected' : ''}`}
                role="option"
                aria-selected={!value}
                onClick={() => select('')}
              >
                {emptyLabel}
              </div>
            )}
            {filtered.length === 0 ? (
              <div className="searchable-select__no-results">{noResultsLabel}</div>
            ) : (
              filtered.map((o) => (
                <div
                  key={o.value}
                  className={`searchable-select__option${o.value === value ? ' selected' : ''}`}
                  role="option"
                  aria-selected={o.value === value}
                  onClick={() => select(o.value)}
                >
                  {o.label}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  )
}
