/**
 * TopBar/TopBar.tsx — Fixed top navigation bar
 *
 * Shown at the top of every authenticated page, alongside the Sidebar.
 * Provides a global search input, quick-access action buttons (mail,
 * notifications), and a user identity section pulled from AuthContext.
 *
 * The notification dot on the Bell icon is always visible for now — it will
 * need to be driven by real unread-count data when notifications are built.
 */
import { Search, Mail, Bell, User } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../../auth/AuthContext'
import './TopBar.css'

export default function TopBar() {
  const { t } = useTranslation()
  const { user } = useAuth()

  return (
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
          <div className="topbar-avatar">
            <User size={20} />
          </div>
        </div>
      </div>
    </header>
  )
}
