import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Plus, Pencil, Trash2, Search } from 'lucide-react'
import { useAuth } from '../../auth/AuthContext'
import { ClientTypeLabels, ClientStatusLabels } from '@crm/shared'
import type { Client } from '../../api/clients'
import './ClientsList.css'

interface Props {
  clients: Client[]
  loading: boolean
  onNew: () => void
  onView: (client: Client) => void
  onEdit: (client: Client) => void
  onDelete: (client: Client) => void
}

export default function ClientsList({ clients, loading, onNew, onView, onEdit, onDelete }: Props) {
  const { t } = useTranslation()
  const { user } = useAuth()
  const canDelete = user?.role === 'OWNER'

  const [search, setSearch] = useState('')

  const filtered = clients.filter((c) => {
    const q = search.toLowerCase()
    return (
      c.name.toLowerCase().includes(q) ||
      c.email?.toLowerCase().includes(q) ||
      c.nif?.toLowerCase().includes(q)
    )
  })

  return (
    <div className="clients-list-view">
      <div className="clients-list-header">
        <h1>{t('clients.title')}</h1>
        <button className="btn-primary" onClick={onNew}>
          <Plus size={16} />
          {t('clients.new')}
        </button>
      </div>

      <div className="clients-search">
        <Search size={16} />
        <input
          id="clients-search" name="clients-search" type="search" autoComplete="off"
          value={search} onChange={(e) => setSearch(e.target.value)}
          placeholder={t('clients.search')}
        />
      </div>

      {loading ? null : filtered.length === 0 ? (
        <p className="clients-empty">
          {search ? t('clients.emptySearch') : t('clients.empty')}
        </p>
      ) : (
        <div className="clients-table-wrap">
          <table className="clients-table">
            <thead>
              <tr>
                <th>{t('clients.fields.name')}</th>
                <th>{t('clients.fields.type')}</th>
                <th>{t('clients.fields.status')}</th>
                <th>{t('clients.fields.accountOwnerUserId')}</th>
                <th>{t('clients.fields.mobilePhone')}</th>
                <th>{t('clients.fields.email')}</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((c) => (
                <tr key={c.id} onClick={() => onView(c)} style={{ cursor: 'pointer' }}>
                  <td>
                    <div className="clients-name">
                      <span>{c.name}</span>
                      <small>{c.nif ?? ''}</small>
                    </div>
                  </td>
                  <td>
                    <span className={`badge badge-type badge-type-${c.type.toLowerCase()}`}>
                      {ClientTypeLabels[c.type]}
                    </span>
                  </td>
                  <td>
                    <span className={`badge badge-status badge-status-${c.status.toLowerCase()}`}>
                      {ClientStatusLabels[c.status]}
                    </span>
                  </td>
                  <td>{c.accountOwnerUserId ?? '—'}</td>
                  <td>{c.mobilePhone ?? '—'}</td>
                  <td>{c.email ?? '—'}</td>
                  <td onClick={(e) => e.stopPropagation()}>
                    <div className="clients-actions">
                      <button className="icon-btn" onClick={() => onEdit(c)} title={t('clients.edit')}>
                        <Pencil size={15} />
                      </button>
                      {canDelete && (
                        <button className="icon-btn icon-btn-danger" onClick={() => onDelete(c)} title={t('clients.actions.delete')}>
                          <Trash2 size={15} />
                        </button>
                      )}
                    </div>
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
