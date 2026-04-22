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
import React from 'react'
import {
  LayoutDashboard,
  Users,
  TrendingUp,
  Shield,
  Zap,
  AlertCircle,
  LogOut,
  UserCog,
  Handshake,
} from 'lucide-react'
import { useTranslation } from 'react-i18next'
import logo from '../../../assets/logo.jpeg'
import { useAuth } from '../../../auth/AuthContext'
import { logout as logoutApi } from '../../../api/auth'
import './Sidebar.css'

/**
 * Ordered list of top-level CRM sections. The `key` field is both the React
 * list key and the i18next translation key, keeping the definition compact.
 * Icons are lucide-react components passed as references (not JSX) so they
 * can be instantiated with custom props inside the map.
 */
export type Section = 'home' | 'clients' | 'sales' | 'policies' | 'energy' | 'cases' | 'timeTracking' | 'collaborators' | 'userManagement' | 'myAccount'

const navItems: { section: Section; key: string; icon: React.ElementType }[] = [
  { section: 'home',          key: 'nav.home',          icon: LayoutDashboard },
  { section: 'clients',       key: 'nav.clients',       icon: Users },
  { section: 'sales',         key: 'nav.sales',         icon: TrendingUp },
  { section: 'policies',      key: 'nav.policies',      icon: Shield },
  { section: 'energy',        key: 'nav.energy',        icon: Zap },
  { section: 'cases',         key: 'nav.cases',         icon: AlertCircle },
  { section: 'collaborators', key: 'nav.collaborators', icon: Handshake },
]

interface SidebarProps {
  activeSection: Section
  onNavigate: (section: Section) => void
}

export default function Sidebar({ activeSection, onNavigate }: SidebarProps) {
  const { t } = useTranslation()
  const { user, setUser } = useAuth()
  const isOwner = user?.role === 'OWNER'

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
              <li key={item.section} className={activeSection === item.section ? 'active' : ''}>
                <a href="#" onClick={(e) => { e.preventDefault(); onNavigate(item.section) }}>
                  <Icon size={20} />
                  <span>{t(item.key)}</span>
                </a>
              </li>
            )
          })}
          {isOwner && (
            <>
              <li className="sidebar-nav-divider" role="separator" />
              <li className={activeSection === 'userManagement' ? 'active' : ''}>
                <a href="#" onClick={(e) => { e.preventDefault(); onNavigate('userManagement') }}>
                  <UserCog size={20} />
                  <span>{t('nav.userManagement')}</span>
                </a>
              </li>
            </>
          )}
        </ul>
      </nav>

      <div className="sidebar-footer">
        <button className="sidebar-logout" onClick={() => logoutApi().then(() => setUser(null))}>
          <LogOut size={16} />
          {t('sidebar.logout')}
        </button>
      </div>
    </aside>
  )
}
