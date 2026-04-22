import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { UserPlus, Trash2 } from 'lucide-react'
import { createUser, deleteUser, type NewUserData } from '../../../api/users'
import { useAuth } from '../../../auth/AuthContext'
import InputField from '../../shared/FormField/InputField'
import SelectField from '../../shared/FormField/SelectField'
import Avatar from '../../shared/Avatar/Avatar'
import { useUsers } from '../../../context/DataContext'
import './UserManagement.css'

const API_URL = import.meta.env.VITE_API_URL

const emptyForm: NewUserData = { displayName: '', email: '', role: 'EMPLOYEE', password: '' }

export default function UserManagement() {
  const { t } = useTranslation()
  const { user: currentUser } = useAuth()
  const { users, loading, upsertUser, removeUser } = useUsers()
  const [showForm, setShowForm] = useState(false)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState<NewUserData>(emptyForm)
  const [deleteError, setDeleteError] = useState<string | null>(null)

  function handleChange(field: keyof NewUserData, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  function handleCancel() {
    setShowForm(false)
    setForm(emptyForm)
  }

  async function handleCreate(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setSaving(true)
    try {
      const created = await createUser(form)
      upsertUser(created)
      handleCancel()
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(u: AuthUser) {
    if (!confirm(t('userManagement.deleteConfirm', { name: u.displayName }))) return
    setDeleteError(null)
    try {
      await deleteUser(u.id)
      removeUser(u.id)
    } catch {
      setDeleteError(t('userManagement.deleteError'))
    }
  }

  if (loading) return null

  return (
    <div className="user-management">
      <div className="user-management-header">
        <h1>{t('nav.userManagement')}</h1>
        {!showForm && (
          <button className="btn-primary" onClick={() => setShowForm(true)}>
            <UserPlus size={16} />
            {t('userManagement.newUser')}
          </button>
        )}
      </div>

      {showForm && (
        <form className="user-management-form form-card" onSubmit={handleCreate}>
          <h2>{t('userManagement.newUser')}</h2>
          <div className="user-management-form-fields">
            <InputField
              id="um-name"
              label={t('userManagement.fields.displayName')}
              value={form.displayName}
              onChange={(e) => handleChange('displayName', e.target.value)}
              required
            />
            <InputField
              id="um-email"
              label={t('userManagement.fields.email')}
              type="email"
              value={form.email}
              onChange={(e) => handleChange('email', e.target.value)}
              required
            />
            <SelectField
              id="um-role"
              label={t('userManagement.fields.role')}
              value={form.role}
              onChange={(e) => handleChange('role', e.target.value)}
            >
              <option value="EMPLOYEE">{t('userManagement.roles.EMPLOYEE')}</option>
              <option value="OWNER">{t('userManagement.roles.OWNER')}</option>
            </SelectField>
            <InputField
              id="um-password"
              label={t('userManagement.fields.password')}
              type="password"
              value={form.password}
              onChange={(e) => handleChange('password', e.target.value)}
              required
            />
          </div>
          <div className="user-management-form-actions">
            <button type="button" className="btn-secondary" onClick={handleCancel}>
              {t('common.cancel')}
            </button>
            <button type="submit" className="btn-primary" disabled={saving}>
              {saving ? t('common.saving') : t('common.save')}
            </button>
          </div>
        </form>
      )}

      {deleteError && (
        <p className="user-management-delete-error">{deleteError}</p>
      )}

      <ul className="user-management-list">
        {users.map((u) => {
          const avatarSrc = u.avatarUrl ? `${API_URL}${u.avatarUrl}` : null
          return (
            <li key={u.id} className="user-management-item">
              <Avatar src={avatarSrc} name={u.displayName} size={38} />
              <div className="user-management-info">
                <span className="user-management-name">{u.displayName}</span>
                <span className="user-management-email">{u.email}</span>
              </div>
              <span className={`badge user-management-role--${u.role.toLowerCase()}`}>
                {t(`userManagement.roles.${u.role}`)}
              </span>
              {u.id !== currentUser?.id && (
                <button
                  className="icon-btn icon-btn-danger"
                  onClick={() => handleDelete(u)}
                  aria-label={t('userManagement.delete')}
                >
                  <Trash2 size={16} />
                </button>
              )}
            </li>
          )
        })}
        {users.length === 0 && (
          <li className="user-management-empty">{t('userManagement.empty')}</li>
        )}
      </ul>
    </div>
  )
}
