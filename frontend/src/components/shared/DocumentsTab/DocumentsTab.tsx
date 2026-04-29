import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Plus, ExternalLink, Trash2 } from 'lucide-react'
import { normalizeSearch } from '../../../utils/search'
import BasicSearch from '../BasicSearch/BasicSearch'
import {
  getDocuments,
  deleteDocument,
  DocumentGroup,
  DocumentType,
  DocumentStatus,
  type DocumentRecord,
} from '../../../api/documents'
import { usePermissions } from '../../../hooks/usePermissions'
import DocumentUploadModal from '../DocumentUploadModal/DocumentUploadModal'
import ConfirmModal from '../ConfirmModal/ConfirmModal'
import './DocumentsTab.css'

// ── Status badge map ──────────────────────────────────────────────────────────

const STATUS_CLASS: Record<DocumentStatus, string> = {
  [DocumentStatus.PENDING_SIGNATURE]: 'doc-status--pending',
  [DocumentStatus.EXPIRED]:           'doc-status--expired',
  [DocumentStatus.UPDATED]:           'doc-status--updated',
  [DocumentStatus.UNDER_REVIEW]:      'doc-status--review',
}

const BACKEND_BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:3000'

// ── Props ─────────────────────────────────────────────────────────────────────

interface Props {
  clientId:    string
  clientName:  string
  /**
   * When provided, documents are filtered by this saleId.
   * The "Sale" column is hidden (redundant in a sale context).
   */
  saleId?: string
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function DocumentsTab({ clientId, clientName, saleId }: Props) {
  const { t }         = useTranslation()
  const { canDelete } = usePermissions()

  const [docs,       setDocs]       = useState<DocumentRecord[]>([])
  const [loading,    setLoading]    = useState(true)
  const [search,     setSearch]     = useState('')
  const [showUpload, setShowUpload] = useState(false)
  const [toDelete,   setToDelete]   = useState<DocumentRecord | null>(null)
  const [deleting,   setDeleting]   = useState(false)

  useEffect(() => {
    setLoading(true)
    getDocuments(clientId, saleId)
      .then(setDocs)
      .finally(() => setLoading(false))
  }, [clientId, saleId])

  function handleSaved(doc: DocumentRecord) {
    setDocs((prev) => [doc, ...prev])
  }

  async function handleDeleteConfirm() {
    if (!toDelete) return
    setDeleting(true)
    try {
      await deleteDocument(toDelete.id)
      setDocs((prev) => prev.filter((d) => d.id !== toDelete.id))
    } finally {
      setDeleting(false)
      setToDelete(null)
    }
  }

  // In client context, search by name + sale title; in sale context, name only
  const filtered = docs.filter((doc) => {
    const q = normalizeSearch(search)
    return (
      normalizeSearch(doc.name).includes(q) ||
      (!saleId && doc.sale?.title ? normalizeSearch(doc.sale.title).includes(q) : false)
    )
  })

  const showSaleColumn = !saleId

  return (
    <div className="docs-tab">

      {/* ── Toolbar ── */}
      <div className="docs-tab__toolbar">
        <span className="docs-tab__count">
          {t('documents.table.count', { count: docs.length })}
        </span>
        <button className="btn-primary" onClick={() => setShowUpload(true)}>
          <Plus size={15} />
          {t('documents.actions.add')}
        </button>
      </div>

      {/* ── Search ── */}
      {!loading && docs.length > 0 && (
        <BasicSearch
          value={search}
          onChange={setSearch}
          placeholder={t('documents.table.search')}
        />
      )}

      {/* ── Table / empty ── */}
      {loading ? null : filtered.length === 0 ? (
        <div className="docs-tab__empty">
          <p>{search ? t('documents.table.emptySearch') : t('documents.table.empty')}</p>
        </div>
      ) : (
        <div className="data-table-wrap">
          <table className="data-table docs-tab__table">
            <thead>
              <tr>
                <th>{t('documents.table.name')}</th>
                <th>{t('documents.table.type')}</th>
                <th>{t('documents.table.group')}</th>
                <th>{t('documents.table.status')}</th>
                {showSaleColumn && <th>{t('documents.table.sale')}</th>}
                <th>{t('documents.table.expiryDate')}</th>
                <th>{t('documents.table.file')}</th>
                {canDelete && <th />}
              </tr>
            </thead>
            <tbody>
              {filtered.map((doc) => (
                <tr key={doc.id}>
                  <td className="docs-tab__name">{doc.name}</td>
                  <td>{t(`documents.documentType.${doc.documentType as DocumentType}`)}</td>
                  <td>
                    {doc.group
                      ? t(`documents.group.${doc.group as DocumentGroup}`)
                      : '—'}
                  </td>
                  <td>
                    <span className={`docs-tab__status ${STATUS_CLASS[doc.status as DocumentStatus]}`}>
                      {t(`documents.status.${doc.status as DocumentStatus}`)}
                    </span>
                  </td>
                  {showSaleColumn && (
                    <td className="docs-tab__sale">
                      {doc.sale?.title ?? '—'}
                    </td>
                  )}
                  <td className="docs-tab__expiry">
                    {doc.expiryDate
                      ? new Date(doc.expiryDate).toLocaleDateString('es-ES')
                      : '—'}
                  </td>
                  <td>
                    {doc.fileUrl ? (
                      <a
                        href={doc.fileUrl.startsWith('http') ? doc.fileUrl : `${BACKEND_BASE}${doc.fileUrl}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="docs-tab__file-link"
                        title={t('documents.actions.viewFile')}
                      >
                        <ExternalLink size={14} />
                        <span>{t('documents.actions.viewFile')}</span>
                      </a>
                    ) : (
                      <span className="docs-tab__no-file">—</span>
                    )}
                  </td>
                  {canDelete && (
                    <td className="docs-tab__actions">
                      <button
                        className="icon-btn icon-btn-danger"
                        onClick={() => setToDelete(doc)}
                        title={t('documents.actions.delete')}
                      >
                        <Trash2 size={15} />
                      </button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ── Upload modal ── */}
      {showUpload && (
        <DocumentUploadModal
          defaultClientId={clientId}
          defaultSaleId={saleId}
          onClose={() => setShowUpload(false)}
          onSaved={handleSaved}
        />
      )}

      {/* ── Delete confirmation ── */}
      {toDelete && (
        <ConfirmModal
          title={t('documents.actions.delete')}
          message={t('documents.deleteConfirm', { name: toDelete.name })}
          onClose={() => setToDelete(null)}
          actions={[
            {
              label: t('common.cancel'),
              variant: 'secondary',
              onClick: () => setToDelete(null),
            },
            {
              label: deleting ? t('common.saving') : t('documents.actions.delete'),
              variant: 'primary',
              onClick: handleDeleteConfirm,
            },
          ]}
        />
      )}
    </div>
  )
}
