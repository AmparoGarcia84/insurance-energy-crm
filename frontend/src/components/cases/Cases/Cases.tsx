import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Search, Plus, Pencil } from 'lucide-react'
import { normalizeSearch } from '../../../utils/search'
import { useCases } from '../../../context/DataContext'
import { deleteCase, type Case, type CaseStatus } from '../../../api/cases'
import { usePermissions } from '../../../hooks/usePermissions'
import CaseForm from '../CaseForm/CaseForm'
import './Cases.css'

// ── Navigation stack ──────────────────────────────────────────────────────────

type View =
  | { kind: 'list' }
  | { kind: 'form'; case: Case | null }

// ── Status colours ─────────────────────────────────────────────────────────────

const STATUS_CLASS: Record<CaseStatus, string> = {
  OPEN:        'badge-case-open',
  IN_PROGRESS: 'badge-case-in-progress',
  RESOLVED:    'badge-case-resolved',
  CLOSED:      'badge-case-closed',
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function Cases() {
  const { t } = useTranslation()
  const { cases, loading, upsertCase, removeCase } = useCases()
  const { canDelete } = usePermissions()

  const [stack, setStack] = useState<View[]>([{ kind: 'list' }])
  const push = (v: View) => setStack((s) => [...s, v])
  const pop  = ()        => setStack((s) => s.length > 1 ? s.slice(0, -1) : s)

  const [search, setSearch] = useState('')

  const current = stack[stack.length - 1]

  // ── Form view ───────────────────────────────────────────────────────────────
  if (current.kind === 'form') {
    return (
      <CaseForm
        key={current.case?.id ?? 'new'}
        case={current.case}
        onSave={(saved) => { upsertCase(saved); pop() }}
        onCancel={pop}
        onDelete={canDelete ? async (id) => { await deleteCase(id); removeCase(id); setStack([{ kind: 'list' }]) } : undefined}
      />
    )
  }

  // ── List view ────────────────────────────────────────────────────────────────
  const q = normalizeSearch(search)
  const filtered = loading
    ? []
    : cases.filter((c) =>
        normalizeSearch(c.client.name).includes(q) ||
        normalizeSearch(c.title).includes(q) ||
        normalizeSearch(c.description ?? '').includes(q)
      )

  return (
    <div className="cases">
      <div className="page-header">
        <h1 className="page-title">{t('cases.title')}</h1>
        <button className="btn-primary" onClick={() => push({ kind: 'form', case: null })}>
          <Plus size={16} />
          {t('cases.new')}
        </button>
      </div>

      <div className="table-search">
        <Search size={15} />
        <input
          type="search"
          autoComplete="off"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={t('cases.search')}
        />
      </div>

      {loading ? null : filtered.length === 0 ? (
        <div className="cases__empty">
          <p>{search ? t('cases.emptySearch') : t('cases.empty')}</p>
        </div>
      ) : (
        <div className="data-table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>{t('cases.columns.client')}</th>
                <th>{t('cases.columns.title')}</th>
                <th>{t('cases.columns.description')}</th>
                <th>{t('cases.columns.status')}</th>
                <th>{t('cases.columns.updatedAt')}</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {filtered.map((c) => (
                <tr key={c.id} className="cases__row" onClick={() => push({ kind: 'form', case: c })}>
                  <td className="cases__client">{c.client.name}</td>
                  <td className="cases__title">{c.title}</td>
                  <td className="cases__description">
                    {c.description ? (
                      <span className="cases__desc-text">{c.description}</span>
                    ) : '—'}
                  </td>
                  <td>
                    <span className={`badge ${STATUS_CLASS[c.status]}`}>
                      {t(`cases.status.${c.status}`)}
                    </span>
                  </td>
                  <td className="cases__date">
                    {new Date(c.updatedAt).toLocaleDateString('es-ES')}
                  </td>
                  <td className="cases__actions">
                    <button
                      className="icon-btn"
                      onClick={(e) => { e.stopPropagation(); push({ kind: 'form', case: c }) }}
                      title={t('cases.edit')}
                    >
                      <Pencil size={14} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
