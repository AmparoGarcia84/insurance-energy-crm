import { Search, Mail, Bell, User } from 'lucide-react'
import { useTranslation } from 'react-i18next'

export default function TopBar() {
  const { t } = useTranslation()

  return (
    <header className="topbar">
      <div className="topbar-search">
        <Search size={16} />
        <input type="text" placeholder={t('topbar.searchPlaceholder')} />
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
          <div className="topbar-user-info">
            <span className="topbar-user-name">Mila García</span>
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
