import { useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../../../auth/AuthContext'
import { uploadAvatar, changePassword, changeEmail } from '../../../api/auth'
import AvatarCropModal from '../../shared/AvatarCropModal/AvatarCropModal'
import Avatar from '../../shared/Avatar/Avatar'
import InputField from '../../shared/FormField/InputField'
import './MyAccount.css'

const API_URL = import.meta.env.VITE_API_URL

export default function MyAccount() {
  const { t } = useTranslation()
  const { user, setUser } = useAuth()

  // ── Avatar ────────────────────────────────────────────
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [cropSrc, setCropSrc] = useState<string | null>(null)

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setCropSrc(URL.createObjectURL(file))
    e.target.value = ''
  }

  async function handleCropSave(blob: Blob) {
    const updated = await uploadAvatar(blob)
    setUser(updated)
    closeCropModal()
  }

  function closeCropModal() {
    if (cropSrc) URL.revokeObjectURL(cropSrc)
    setCropSrc(null)
  }

  // ── Email ─────────────────────────────────────────────
  const [emailValue, setEmailValue] = useState(user?.email ?? '')
  const [emailSaving, setEmailSaving] = useState(false)
  const [emailMsg, setEmailMsg] = useState<{ ok: boolean; text: string } | null>(null)

  async function handleEmailSave(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setEmailSaving(true)
    setEmailMsg(null)
    try {
      const updated = await changeEmail(emailValue)
      setUser(updated)
      setEmailMsg({ ok: true, text: t('myAccount.email.success') })
    } catch (err: any) {
      const isDuplicate = err.message?.includes('already in use')
      setEmailMsg({ ok: false, text: isDuplicate ? t('myAccount.email.errorDuplicate') : err.message })
    } finally {
      setEmailSaving(false)
    }
  }

  // ── Password ──────────────────────────────────────────
  const [pwForm, setPwForm] = useState({ current: '', next: '', confirm: '' })
  const [pwSaving, setPwSaving] = useState(false)
  const [pwMsg, setPwMsg] = useState<{ ok: boolean; text: string } | null>(null)

  function handlePwChange(field: keyof typeof pwForm, value: string) {
    setPwForm((prev) => ({ ...prev, [field]: value }))
  }

  async function handlePasswordSave(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setPwMsg(null)
    if (pwForm.next.length < 8) {
      setPwMsg({ ok: false, text: t('myAccount.password.errorLength') })
      return
    }
    if (pwForm.next !== pwForm.confirm) {
      setPwMsg({ ok: false, text: t('myAccount.password.errorMatch') })
      return
    }
    setPwSaving(true)
    try {
      await changePassword(pwForm.current, pwForm.next)
      setPwForm({ current: '', next: '', confirm: '' })
      setPwMsg({ ok: true, text: t('myAccount.password.success') })
    } catch (err: any) {
      const isWrongCurrent = err.message?.includes('Invalid current password')
      setPwMsg({ ok: false, text: isWrongCurrent ? t('myAccount.password.errorCurrent') : err.message })
    } finally {
      setPwSaving(false)
    }
  }

  const avatarSrc = user?.avatarUrl
    ? (user.avatarUrl.startsWith('http') ? user.avatarUrl : `${API_URL}${user.avatarUrl}`)
    : null

  return (
    <div className="my-account">
      <h1 className="my-account-title">{t('myAccount.title')}</h1>

      {/* ── Foto de perfil ── */}
      <section className="my-account-card form-card">
        <h2>{t('myAccount.photo.title')}</h2>
        <div className="my-account-avatar-row">
          <Avatar src={avatarSrc} name={user?.displayName} size={72} />
          <div>
            <p className="my-account-avatar-name">{user?.displayName}</p>
            <button className="btn-secondary" onClick={() => fileInputRef.current?.click()}>
              {t('myAccount.photo.change')}
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="my-account-file-input"
              onChange={handleFileChange}
            />
          </div>
        </div>
      </section>

      {/* ── Correo electrónico ── */}
      <section className="my-account-card form-card">
        <h2>{t('myAccount.email.title')}</h2>
        <form onSubmit={handleEmailSave} className="my-account-form">
          <InputField
            id="ma-email"
            label={t('myAccount.email.new')}
            type="email"
            value={emailValue}
            onChange={(e) => setEmailValue(e.target.value)}
            required
          />
          {emailMsg && (
            <p className={`my-account-msg ${emailMsg.ok ? 'my-account-msg--ok' : 'my-account-msg--error'}`}>
              {emailMsg.text}
            </p>
          )}
          <div className="my-account-form-actions">
            <button type="submit" className="btn-primary" disabled={emailSaving}>
              {emailSaving ? t('common.saving') : t('myAccount.email.save')}
            </button>
          </div>
        </form>
      </section>

      {/* ── Contraseña ── */}
      <section className="my-account-card form-card">
        <h2>{t('myAccount.password.title')}</h2>
        <form onSubmit={handlePasswordSave} className="my-account-form">
          <InputField
            id="ma-pw-current"
            label={t('myAccount.password.current')}
            type="password"
            value={pwForm.current}
            onChange={(e) => handlePwChange('current', e.target.value)}
            required
          />
          <InputField
            id="ma-pw-new"
            label={t('myAccount.password.new')}
            type="password"
            value={pwForm.next}
            onChange={(e) => handlePwChange('next', e.target.value)}
            required
          />
          <InputField
            id="ma-pw-confirm"
            label={t('myAccount.password.confirm')}
            type="password"
            value={pwForm.confirm}
            onChange={(e) => handlePwChange('confirm', e.target.value)}
            required
          />
          {pwMsg && (
            <p className={`my-account-msg ${pwMsg.ok ? 'my-account-msg--ok' : 'my-account-msg--error'}`}>
              {pwMsg.text}
            </p>
          )}
          <div className="my-account-form-actions">
            <button type="submit" className="btn-primary" disabled={pwSaving}>
              {pwSaving ? t('common.saving') : t('myAccount.password.save')}
            </button>
          </div>
        </form>
      </section>

      {cropSrc && (
        <AvatarCropModal
          imageSrc={cropSrc}
          onSave={handleCropSave}
          onClose={closeCropModal}
        />
      )}
    </div>
  )
}
