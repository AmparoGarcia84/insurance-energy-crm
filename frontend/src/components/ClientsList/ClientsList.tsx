import { useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Plus, Pencil, Trash2, Search, Upload } from 'lucide-react'
import { usePermissions } from '../../hooks/usePermissions'
import { ClientTypeLabels, ClientStatusLabels } from '@crm/shared'
import type { Client, ImportResult } from '../../api/clients'
import './ClientsList.css'

interface Props {
  clients: Client[]
  loading: boolean
  onNew: () => void
  onView: (client: Client) => void
  onEdit: (client: Client) => void
  onDelete: (client: Client) => void
  onImport: (csvText: string) => Promise<ImportResult>
}

export default function ClientsList({ clients, loading, onNew, onView, onEdit, onDelete, onImport }: Props) {
  const { t } = useTranslation()
  const { canDelete } = usePermissions()

  const [search, setSearch] = useState('')
  const [importing, setImporting] = useState(false)
  const [importResult, setImportResult] = useState<ImportResult | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!fileInputRef.current) return
    fileInputRef.current.value = ''
    if (!file) return

    setImporting(true)
    setImportResult(null)
    try {
      const buffer = await file.arrayBuffer()
      let csvText: string
      try {
        csvText = new TextDecoder('utf-8', { fatal: true }).decode(buffer)
      } catch {
        csvText = new TextDecoder('latin1').decode(buffer)
      }
      const result = await onImport(csvText)
      setImportResult(result)
    } finally {
      setImporting(false)
    }
  }

  const filtered = clients.filter((c) => {
    const q = search.toLowerCase()
    return (
      c.name.toLowerCase().includes(q) ||
      c.email?.toLowerCase().includes(q) ||
      c.nif?.toLowerCase().includes(q) ||
      c.clientNumber?.toLowerCase().includes(q)
    )
  })

  return (
    <div className="clients-list-view">
      <div className="clients-list-header">
        <h1>{t('clients.title')}</h1>
        <div className="clients-list-actions">
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv"
            style={{ display: 'none' }}
            onChange={handleFileChange}
          />
          <button
            className="btn-secondary"
            onClick={() => fileInputRef.current?.click()}
            disabled={importing}
          >
            <Upload size={16} />
            {importing ? t('clients.importing') : t('clients.importCsv')}
          </button>
          <button className="btn-primary" onClick={onNew}>
            <Plus size={16} />
            {t('clients.new')}
          </button>
        </div>
      </div>

      {importResult && (
        <div className={`clients-import-banner${importResult.errors.length > 0 ? ' clients-import-banner--warn' : ''}`}>
          <span>{t('clients.importSuccess', { created: importResult.created, skipped: importResult.skipped })}</span>
          {importResult.errors.length > 0 && (
            <span className="clients-import-errors">
              {t('clients.importErrors', { count: importResult.errors.length })}
            </span>
          )}
          <button className="clients-import-dismiss" onClick={() => setImportResult(null)}>✕</button>
        </div>
      )}

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
                <th>{t('clients.fields.clientNumber')}</th>
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
                  <td className="clients-number">{c.clientNumber ?? '—'}</td>
                  <td>
                    <div className="clients-name">
                      <span>{c.name}</span>
                      <small>{c.nif ?? ''}</small>
                    </div>
                  </td>
                  <td>
                    {c.type && (
                      <span className={`badge badge-type badge-type-${c.type.toLowerCase()}`}>
                        {ClientTypeLabels[c.type]}
                      </span>
                    )}
                  </td>
                  <td>
                    {c.status && (
                      <span className={`badge badge-status badge-status-${c.status.toLowerCase()}`}>
                        {ClientStatusLabels[c.status]}
                      </span>
                    )}
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
