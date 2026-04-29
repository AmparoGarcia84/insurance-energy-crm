import { useState, useRef, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { Search } from 'lucide-react'
import { useClients, useSales, useCases } from '../../../context/DataContext'
import { normalizeSearch } from '../../../utils/search'
import './GlobalSearch.css'

const MAX_PER_GROUP = 5
const MIN_QUERY_LENGTH = 2

export default function GlobalSearch() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [query, setQuery] = useState('')
  const wrapperRef = useRef<HTMLDivElement>(null)

  const { clients } = useClients()
  const { sales }   = useSales()
  const { cases }   = useCases()

  // Close dropdown when clicking outside
  useEffect(() => {
    function onMouseDown(e: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setQuery('')
      }
    }
    document.addEventListener('mousedown', onMouseDown)
    return () => document.removeEventListener('mousedown', onMouseDown)
  }, [])

  const q = normalizeSearch(query)
  const isOpen = q.length >= MIN_QUERY_LENGTH

  const clientResults = isOpen
    ? clients
        .filter((c) =>
          normalizeSearch(c.name).includes(q) ||
          normalizeSearch(c.clientNumber ?? '').includes(q) ||
          normalizeSearch(c.mobilePhone ?? '').includes(q) ||
          normalizeSearch(c.secondaryPhone ?? '').includes(q) ||
          (c.emails?.some((e) => normalizeSearch(e.address).includes(q)) ?? false)
        )
        .slice(0, MAX_PER_GROUP)
    : []

  const saleResults = isOpen
    ? sales
        .filter((s) =>
          normalizeSearch(s.title).includes(q) ||
          normalizeSearch(s.clientName ?? '').includes(q) ||
          normalizeSearch(s.companyName ?? '').includes(q)
        )
        .slice(0, MAX_PER_GROUP)
    : []

  const caseResults = isOpen
    ? cases
        .filter((c) =>
          normalizeSearch(c.name).includes(q) ||
          normalizeSearch(c.client.name).includes(q)
        )
        .slice(0, MAX_PER_GROUP)
    : []

  const hasResults = clientResults.length > 0 || saleResults.length > 0 || caseResults.length > 0

  function handleSelect(path: string) {
    setQuery('')
    navigate(path)
  }

  return (
    <div className="global-search" ref={wrapperRef}>
      <Search size={16} />
      <input
        id="global-search"
        name="q"
        type="search"
        autoComplete="off"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onKeyDown={(e) => { if (e.key === 'Escape') setQuery('') }}
        placeholder={t('topbar.searchPlaceholder')}
      />

      {isOpen && (
        <div className="global-search__dropdown" role="listbox">
          {!hasResults ? (
            <p className="global-search__empty">{t('topbar.searchEmpty')}</p>
          ) : (
            <>
              {clientResults.length > 0 && (
                <div className="global-search__group">
                  <span className="global-search__group-label">{t('nav.clients')}</span>
                  {clientResults.map((c) => (
                    <button
                      key={c.id}
                      role="option"
                      aria-selected="false"
                      className="global-search__item"
                      onClick={() => handleSelect(`/clients/${c.id}`)}
                    >
                      <span className="global-search__item-main">{c.name}</span>
                      {c.clientNumber && (
                        <span className="global-search__item-sub">#{c.clientNumber}</span>
                      )}
                    </button>
                  ))}
                </div>
              )}

              {saleResults.length > 0 && (
                <div className="global-search__group">
                  <span className="global-search__group-label">{t('nav.sales')}</span>
                  {saleResults.map((s) => (
                    <button
                      key={s.id}
                      role="option"
                      aria-selected="false"
                      className="global-search__item"
                      onClick={() => handleSelect(`/sales/${s.id}`)}
                    >
                      <span className="global-search__item-main">{s.title}</span>
                      {s.clientName && (
                        <span className="global-search__item-sub">{s.clientName}</span>
                      )}
                    </button>
                  ))}
                </div>
              )}

              {caseResults.length > 0 && (
                <div className="global-search__group">
                  <span className="global-search__group-label">{t('nav.cases')}</span>
                  {caseResults.map((c) => (
                    <button
                      key={c.id}
                      role="option"
                      aria-selected="false"
                      className="global-search__item"
                      onClick={() => handleSelect(`/cases/${c.id}`)}
                    >
                      <span className="global-search__item-main">{c.name}</span>
                      <span className="global-search__item-sub">{c.client.name}</span>
                    </button>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  )
}
