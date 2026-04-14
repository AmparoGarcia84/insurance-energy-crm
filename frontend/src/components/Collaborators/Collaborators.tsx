import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Plus, Pencil, Trash2, Search, X } from 'lucide-react'
import { useCollaborators } from '../../context/DataContext'
import { usePermissions } from '../../hooks/usePermissions'
import { createCollaborator, updateCollaborator, deleteCollaborator, type Collaborator, type CollaboratorInput } from '../../api/collaborators'
import InputField from '../FormField/InputField'
import ConfirmModal from '../ConfirmModal/ConfirmModal'
import './Collaborators.css'

const EMPTY: CollaboratorInput = { name: '', phone: '' }

export default function Collaborators() {
  const { t } = useTranslation()
  const { collaborators, loading, upsertCollaborator, removeCollaborator } = useCollaborators()
  const { canDelete } = usePermissions()

  const [search, setSearch] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<Collaborator | null>(null)
  const [form, setForm] = useState<CollaboratorInput>(EMPTY)
  const [saving, setSaving] = useState(false)
  const [toDelete, setToDelete] = useState<Collaborator | null>(null)

  function openNew() {
    setEditing(null)
    setForm(EMPTY)
    setModalOpen(true)
  }

  function openEdit(c: Collaborator) {
    setEditing(c)
    setForm({ name: c.name, phone: c.phone })
    setModalOpen(true)
  }

  function closeModal() {
    setModalOpen(false)
    setEditing(null)
    setForm(EMPTY)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    try {
      if (editing) {
        const updated = await updateCollaborator(editing.id, form)
        upsertCollaborator(updated)
      } else {
        const created = await createCollaborator(form)
        upsertCollaborator(created)
      }
      closeModal()
    } finally {
      setSaving(false)
    }
  }

  async function confirmDelete() {
    if (!toDelete) return
    await deleteCollaborator(toDelete.id)
    removeCollaborator(toDelete.id)
    setToDelete(null)
  }

  const filtered = collaborators.filter((c) => {
    const q = search.toLowerCase()
    return c.name.toLowerCase().includes(q) || c.phone.toLowerCase().includes(q)
  })

  return (
    <div className="collaborators">
      <div className="collaborators-header">
        <h1>{t('collaborators.title')}</h1>
        <button className="btn-primary" onClick={openNew}>
          <Plus size={16} />
          {t('collaborators.new')}
        </button>
      </div>

      <div className="collaborators-search">
        <Search size={16} />
        <input
          id="collaborators-search"
          name="collaborators-search"
          type="search"
          autoComplete="off"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={t('collaborators.search')}
        />
      </div>

      {loading ? null : filtered.length === 0 ? (
        <p className="collaborators-empty">
          {search ? t('collaborators.emptySearch') : t('collaborators.empty')}
        </p>
      ) : (
        <div className="collaborators-table-wrap">
          <table className="collaborators-table">
            <thead>
              <tr>
                <th>{t('collaborators.fields.name')}</th>
                <th>{t('collaborators.fields.phone')}</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((c) => (
                <tr key={c.id}>
                  <td>{c.name}</td>
                  <td>{c.phone}</td>
                  <td>
                    <div className="collaborators-actions">
                      <button
                        className="icon-btn"
                        onClick={() => openEdit(c)}
                        title={t('collaborators.edit')}
                      >
                        <Pencil size={15} />
                      </button>
                      {canDelete && (
                        <button
                          className="icon-btn icon-btn-danger"
                          onClick={() => setToDelete(c)}
                          title={t('collaborators.actions.delete')}
                        >
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

      {modalOpen && (
        <div className="collaborator-modal-backdrop" onClick={closeModal}>
          <div
            className="collaborator-modal"
            role="dialog"
            aria-modal="true"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="collaborator-modal-header">
              <h2>{editing ? t('collaborators.edit') : t('collaborators.new')}</h2>
              <button className="icon-btn" onClick={closeModal} aria-label={t('collaborators.actions.cancel')}>
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="collaborator-modal-form">
              <InputField
                id="collab-name"
                label={t('collaborators.fields.name')}
                value={form.name}
                onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
                required
              />
              <InputField
                id="collab-phone"
                label={t('collaborators.fields.phone')}
                value={form.phone}
                onChange={(e) => setForm((prev) => ({ ...prev, phone: e.target.value }))}
                required
              />
              <div className="collaborator-modal-actions">
                <button type="button" className="btn-secondary" onClick={closeModal}>
                  {t('collaborators.actions.cancel')}
                </button>
                <button type="submit" className="btn-primary" disabled={saving}>
                  {saving ? t('collaborators.actions.saving') : t('collaborators.actions.save')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {toDelete && (
        <ConfirmModal
          title={t('collaborators.actions.delete')}
          message={t('collaborators.deleteConfirm', { name: toDelete.name })}
          onClose={() => setToDelete(null)}
          actions={[
            { label: t('collaborators.actions.cancel'), onClick: () => setToDelete(null), variant: 'secondary' },
            { label: t('collaborators.actions.delete'), onClick: confirmDelete, variant: 'primary' },
          ]}
        />
      )}
    </div>
  )
}
