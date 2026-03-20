import {
  LayoutDashboard,
  Users,
  TrendingUp,
  Shield,
  Zap,
  AlertCircle,
  Clock,
  LogOut,
} from 'lucide-react'
import { useTranslation } from 'react-i18next'
import logo from '../assets/logo.jpeg'

const navItems = [
  { key: 'nav.home', icon: LayoutDashboard },
  { key: 'nav.clients', icon: Users },
  { key: 'nav.sales', icon: TrendingUp },
  { key: 'nav.policies', icon: Shield },
  { key: 'nav.energy', icon: Zap },
  { key: 'nav.cases', icon: AlertCircle },
  { key: 'nav.timeTracking', icon: Clock },
]

export default function Sidebar() {
  const { t } = useTranslation()

  return (
    <aside className="sidebar">
      <div className="sidebar-logo">
        <img src={logo} alt="Logo" />
      </div>

      <nav className="sidebar-nav">
        <ul>
          {navItems.map((item) => {
            const Icon = item.icon
            return (
              <li key={item.key}>
                <a href="#">
                  <Icon size={20} />
                  <span>{t(item.key)}</span>
                </a>
              </li>
            )
          })}
        </ul>
      </nav>

      <div className="sidebar-footer">
        <button className="sidebar-logout">
          <LogOut size={16} />
          {t('sidebar.logout')}
        </button>
      </div>
    </aside>
  )
}
