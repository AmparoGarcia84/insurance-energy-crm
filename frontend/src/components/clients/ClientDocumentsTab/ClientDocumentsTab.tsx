import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Plus, ExternalLink, Trash2 } from 'lucide-react'
import { normalizeSearch } from '../../../utils/search'
import BasicSearch from '../../shared/BasicSearch/BasicSearch'
import {
  getDocuments,
  deleteDocument,
  DocumentGroup,
  DocumentType,
  DocumentStatus,
  type DocumentRecord,
} from '../../../api/documents'
import { usePermissions } from '../../../hooks/usePermissions'
import DocumentUploadModal from '../../shared/DocumentUploadModal/DocumentUploadModal'
import ConfirmModal from '../../shared/ConfirmModal/ConfirmModal'
import './ClientDocumentsTab.css'

interface Props {
  clientId:   string
  clientName: string
}

// ── Badge colour by status ─────────────────────────────────────────────────────

const STATUS_CLASS: Record<DocumentStatus, string> = {
  [DocumentStatus.PENDING_SIGNATURE]: 'doc-status--pending',
  [DocumentStatus.EXPIRED]:           'doc-status--expired',
  [DocumentStatus.UPDATED]:           'doc-status--updated',
  [DocumentStatus.UNDER_REVIEW]:      'doc-status--review',
}

export default function ClientDocumentsTab({ clientId, clientName }: Props) {
  const { t }          = useTranslation()
  const { canDelete }  = usePermissions()

  const [docs,          setDocs]          = useState<DocumentRecord[]>([])
  const [loading,       setLoading]       = useState(true)
  const [search,        setSearch]        = useState('')
  const [showUpload,    setShowUpload]    = useState(false)
  const [toDelete,      setToDelete]      = useState<DocumentRecord | null>(null)
  const [deleting,      setDeleting]      = useState(false)

  useEffect(() => {
    setLoading(true)
    getDocuments(clientId)
      .then(setDocs)
      .finally(() => setLoading(false))
  }, [clientId])

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

  const backendBase = 'http://localhost:3000'

  const filtered = docs.filter((doc) => {
    const q = normalizeSearch(search)
    return (
      normalizeSearch(doc.name).includes(q) ||
      (doc.sale?.title ? normalizeSearch(doc.sale.title).includes(q) : false)
    )
  })

  return (
    <div className="cd-docs-tab">

      {/* ── Toolbar ── */}
      <div className="cd-docs-tab__toolbar">
        <span className="cd-docs-tab__count">
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
        <div className="cd-docs-tab__empty">
          <p>{search ? t('documents.table.emptySearch') : t('documents.table.empty')}</p>
        </div>
      ) : (
        <div className="data-table-wrap">
          <table className="data-table cd-docs-tab__table">
            <thead>
              <tr>
                <th>{t('documents.table.name')}</th>
                <th>{t('documents.table.type')}</th>
                <th>{t('documents.table.group')}</th>
                <th>{t('documents.table.status')}</th>
                <th>{t('documents.table.sale')}</th>
                <th>{t('documents.table.expiryDate')}</th>
                <th>{t('documents.table.file')}</th>
                {canDelete && <th />}
              </tr>
            </thead>
            <tbody>
              {filtered.map((doc) => (
                <tr key={doc.id}>
                  <td className="cd-docs-tab__name">{doc.name}</td>
                  <td>{t(`documents.documentType.${doc.documentType as DocumentType}`)}</td>
                  <td>
                    {doc.group
                      ? t(`documents.group.${doc.group as DocumentGroup}`)
                      : '—'}
                  </td>
                  <td>
                    <span className={`cd-docs-tab__status ${STATUS_CLASS[doc.status as DocumentStatus]}`}>
                      {t(`documents.status.${doc.status as DocumentStatus}`)}
                    </span>
                  </td>
                  <td className="cd-docs-tab__sale">
                    {doc.sale?.title ?? '—'}
                  </td>
                  <td className="cd-docs-tab__expiry">
                    {doc.expiryDate
                      ? new Date(doc.expiryDate).toLocaleDateString('es-ES')
                      : '—'}
                  </td>
                  <td>
                    {doc.fileUrl ? (
                      <a
                        href={doc.fileUrl.startsWith('http') ? doc.fileUrl : `${backendBase}${doc.fileUrl}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="cd-docs-tab__file-link"
                        title={t('documents.actions.viewFile')}
                      >
                        <ExternalLink size={14} />
                        <span>{t('documents.actions.viewFile')}</span>
                      </a>
                    ) : (
                      <span className="cd-docs-tab__no-file">—</span>
                    )}
                  </td>
                  {canDelete && (
                    <td className="cd-docs-tab__actions">
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
