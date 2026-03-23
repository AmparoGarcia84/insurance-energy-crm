/**
 * Sidebar/Sidebar.tsx — Main navigation sidebar
 *
 * Renders the fixed left-hand navigation present on every authenticated screen.
 * It lists all CRM sections and provides the logout action.
 *
 * Navigation is currently rendered as plain anchor tags (href="#") because
 * client-side routing has not been wired up yet. Once a router is added,
 * each navItem entry should gain a `path` field and the <a> tags should be
 * replaced with the router's <Link> component.
 *
 * Logout is performed by calling setAuth(null), which clears the in-memory
 * token and causes App.tsx to unmount the Dashboard and render Login instead.
 */
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
import logo from '../../assets/logo.jpeg'
import { useAuth } from '../../auth/AuthContext'
import { logout as logoutApi } from '../../api/auth'
import './Sidebar.css'

/**
 * Ordered list of top-level CRM sections. The `key` field is both the React
 * list key and the i18next translation key, keeping the definition compact.
 * Icons are lucide-react components passed as references (not JSX) so they
 * can be instantiated with custom props inside the map.
 */
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
  const { setUser } = useAuth()

  return (
    <aside className="sidebar">
      <div className="sidebar-logo">
        <img src={logo} alt="Logo" />
      </div>

      <nav className="sidebar-nav">
        <ul>
          {navItems.map((item) => {
            // Capitalise the component reference so React treats it as JSX
            const Icon = item.icon
            return (
              <li key={item.key}>
                {/* TODO: replace with <Link> once routing is implemented */}
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
        {/* Call backend to clear the httpOnly cookie, then clear local state */}
        <button className="sidebar-logout" onClick={() => logoutApi().then(() => setUser(null))}>
          <LogOut size={16} />
          {t('sidebar.logout')}
        </button>
      </div>
    </aside>
  )
}
