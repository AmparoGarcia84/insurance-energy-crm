/**
 * TopBar/TopBar.tsx — Fixed top navigation bar
 *
 * Shown at the top of every authenticated page, alongside the Sidebar.
 * Provides a global search input, quick-access action buttons (mail,
 * notifications), and a user identity section pulled from AuthContext.
 *
 * Clicking the user name or avatar navigates to the My Account section
 * where the user can change their photo, email and password.
 */
import { Search, Mail, Bell } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../../../auth/AuthContext'
import { type Section } from '../Sidebar/Sidebar'
import Avatar from '../../shared/Avatar/Avatar'
import './TopBar.css'

const API_URL = import.meta.env.VITE_API_URL

interface TopBarProps {
  onNavigate: (section: Section) => void
}

export default function TopBar({ onNavigate }: TopBarProps) {
  const { t } = useTranslation()
  const { user } = useAuth()

  const avatarSrc = user?.avatarUrl
    ? (user.avatarUrl.startsWith('http') ? user.avatarUrl : `${API_URL}${user.avatarUrl}`)
    : null

  return (
    <header className="topbar">
      <div className="topbar-search">
        <Search size={16} />
        <input type="search" id="global-search" name="q" autoComplete="off" placeholder={t('topbar.searchPlaceholder')} />
      </div>

      <div className="topbar-actions">
        <button aria-label={t('topbar.mail')}>
          <Mail size={20} />
        </button>

        <button aria-label={t('topbar.notifications')} className="topbar-btn-notif">
          <Bell size={20} />
          <span className="notif-dot" />
        </button>

        <div className="topbar-user">
          <button
            className="topbar-user-info"
            onClick={() => onNavigate('myAccount')}
            aria-label={t('topbar.myAccount')}
          >
            <span className="topbar-user-name">{user?.displayName}</span>
            <span className="topbar-user-role">{t('topbar.role')}</span>
          </button>

          <button
            className="topbar-avatar"
            aria-label={t('topbar.myAccount')}
            onClick={() => onNavigate('myAccount')}
          >
            <Avatar src={avatarSrc} name={user?.displayName} size={40} />
          </button>
        </div>
      </div>
    </header>
  )
}
