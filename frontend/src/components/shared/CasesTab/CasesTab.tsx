import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Plus, Pencil } from 'lucide-react'
import { normalizeSearch } from '../../../utils/search'
import { useCases } from '../../../context/DataContext'
import { deleteCase, type Case, type CaseStatus, type CasePriority } from '../../../api/cases'
import { usePermissions } from '../../../hooks/usePermissions'
import BasicSearch from '../BasicSearch/BasicSearch'
import CaseForm from '../../cases/CaseForm/CaseForm'
import './CasesTab.css'

// ── Badge maps ────────────────────────────────────────────────────────────────

const STATUS_CLASS: Record<CaseStatus, string> = {
  NEW:         'badge-case-new',
  ON_HOLD:     'badge-case-on-hold',
  FORWARDED:   'badge-case-forwarded',
  IN_PROGRESS: 'badge-case-in-progress',
  CLOSED:      'badge-case-closed',
}

const PRIORITY_CLASS: Record<CasePriority, string> = {
  HIGH:   'badge-priority-high',
  NORMAL: 'badge-priority-normal',
  LOW:    'badge-priority-low',
}

// ── Props ─────────────────────────────────────────────────────────────────────

interface Props {
  clientId:    string
  clientName:  string
  /** If provided, cases are filtered by saleId instead of clientId. */
  saleId?:     string
  saleName?:   string
  /** Called when the user clicks a case row — parent handles navigation to detail. */
  onViewCase:  (c: Case) => void
}

// ── Navigation (list ↔ form only — detail is lifted to the parent) ─────────────

type View =
  | { kind: 'list' }
  | { kind: 'form'; case: Case | null }

// ── Component ─────────────────────────────────────────────────────────────────

export default function CasesTab({ clientId, clientName, saleId, saleName, onViewCase }: Props) {
  const { t } = useTranslation()
  const { cases, loading, upsertCase, removeCase } = useCases()
  const { canDelete } = usePermissions()

  const [view, setView] = useState<View>({ kind: 'list' })
  const [search, setSearch] = useState('')

  // ── Form view ────────────────────────────────────────────────────────────────
  if (view.kind === 'form') {
    return (
      <CaseForm
        key={view.case?.id ?? 'new'}
        case={view.case}
        initialClientId={view.case === null ? (saleId ? undefined : clientId) : undefined}
        initialSaleId={view.case === null ? saleId : undefined}
        onSave={(saved) => { upsertCase(saved); setView({ kind: 'list' }) }}
        onCancel={() => setView({ kind: 'list' })}
        onDelete={canDelete
          ? async (id) => { await deleteCase(id); removeCase(id); setView({ kind: 'list' }) }
          : undefined}
      />
    )
  }

  // ── List view ─────────────────────────────────────────────────────────────────
  const tabCases = loading
    ? []
    : cases
        .filter((c) => saleId ? c.saleId === saleId : c.clientId === clientId)
        .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())

  const q = normalizeSearch(search)
  const filtered = tabCases.filter((c) =>
    normalizeSearch(c.name).includes(q) ||
    normalizeSearch(c.description ?? '').includes(q)
  )

  return (
    <div className="cases-tab">
      <div className="cases-tab__toolbar">
        <span className="cases-tab__count">
          {tabCases.length > 0 ? tabCases.length : ''}
        </span>
        <button
          className="btn-primary"
          onClick={() => setView({ kind: 'form', case: null })}
        >
          <Plus size={15} />
          {t('cases.casesTab.new')}
        </button>
      </div>

      {tabCases.length > 0 && (
        <BasicSearch
          value={search}
          onChange={setSearch}
          placeholder={t('cases.search')}
        />
      )}

      {loading ? null : filtered.length === 0 ? (
        <div className="cases-tab__empty">
          <p>{search ? t('cases.casesTab.emptySearch') : t('cases.casesTab.noCases')}</p>
        </div>
      ) : (
        <div className="data-table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>{t('cases.columns.name')}</th>
                <th>{t('cases.columns.status')}</th>
                <th>{t('cases.columns.priority')}</th>
                <th>{t('cases.columns.occurrenceAt')}</th>
                <th>{t('cases.columns.updatedAt')}</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {filtered.map((c) => (
                <tr
                  key={c.id}
                  className="cases-tab__row"
                  onClick={() => onViewCase(c)}
                >
                  <td className="cases-tab__name">{c.name}</td>
                  <td>
                    <span className={`badge ${STATUS_CLASS[c.status]}`}>
                      {t(`cases.status.${c.status}`)}
                    </span>
                  </td>
                  <td>
                    <span className={`badge ${PRIORITY_CLASS[c.priority]}`}>
                      {t(`cases.priority.${c.priority}`)}
                    </span>
                  </td>
                  <td className="cases-tab__date">
                    {c.occurrenceAt
                      ? new Date(c.occurrenceAt).toLocaleString('es-ES', {
                          day: '2-digit', month: '2-digit', year: 'numeric',
                          hour: '2-digit', minute: '2-digit',
                        })
                      : '—'}
                  </td>
                  <td className="cases-tab__date">
                    {new Date(c.updatedAt).toLocaleDateString('es-ES')}
                  </td>
                  <td className="cases-tab__actions">
                    <button
                      className="icon-btn"
                      onClick={(e) => { e.stopPropagation(); setView({ kind: 'form', case: c }) }}
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
