/**
 * TopBar/TopBar.tsx — Fixed top navigation bar
 *
 * Shown at the top of every authenticated page, alongside the Sidebar.
 * Provides a global search input, quick-access action buttons (mail,
 * notifications), and a user identity section pulled from AuthContext.
 *
 * Clicking the avatar opens a file picker. Once a file is selected the
 * AvatarCropModal opens so the user can pan and zoom before confirming.
 * The cropped Blob is uploaded to POST /auth/avatar and the context updates.
 *
 * The notification dot on the Bell icon is always visible for now — it will
 * need to be driven by real unread-count data when notifications are built.
 */
import { useState, useRef } from 'react'
import { Search, Mail, Bell, User } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../../auth/AuthContext'
import { uploadAvatar } from '../../api/auth'
import AvatarCropModal from '../AvatarCropModal/AvatarCropModal'
import './TopBar.css'

const API_URL = import.meta.env.VITE_API_URL

export default function TopBar() {
  const { t } = useTranslation()
  const { user, setUser } = useAuth()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [cropSrc, setCropSrc] = useState<string | null>(null)

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    // Create an object URL and open the crop modal
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

  const avatarSrc = user?.avatarUrl ? `${API_URL}${user.avatarUrl}` : null

  return (
    <>
      <header className="topbar">
        {/* Global search — functionality to be implemented */}
        <div className="topbar-search">
          <Search size={16} />
          <input type="search" id="global-search" name="q" autoComplete="off" placeholder={t('topbar.searchPlaceholder')} />
        </div>

        <div className="topbar-actions">
          {/* Mail shortcut — click behaviour to be wired up */}
          <button aria-label={t('topbar.mail')}>
            <Mail size={20} />
          </button>

          {/* Notification bell — the dot indicates unread items (static for now) */}
          <button aria-label={t('topbar.notifications')} className="topbar-btn-notif">
            <Bell size={20} />
            <span className="notif-dot" />
          </button>

          <div className="topbar-user">
            <div className="topbar-user-info">
              <span className="topbar-user-name">{user?.displayName}</span>
              <span className="topbar-user-role">{t('topbar.role')}</span>
            </div>

            {/* Clicking the avatar opens the file picker → crop modal */}
            <button
              className="topbar-avatar"
              aria-label={t('topbar.changeAvatar')}
              onClick={() => fileInputRef.current?.click()}
            >
              {avatarSrc
                ? <img src={avatarSrc} alt={user?.displayName} className="topbar-avatar-img" />
                : <User size={20} />
              }
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="topbar-avatar-input"
              onChange={handleFileChange}
            />
          </div>
        </div>
      </header>

      {cropSrc && (
        <AvatarCropModal
          imageSrc={cropSrc}
          onSave={handleCropSave}
          onClose={closeCropModal}
        />
      )}
    </>
  )
}
