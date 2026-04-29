/**
 * Sidebar/Sidebar.tsx — Main navigation sidebar
 *
 * Renders the fixed left-hand navigation present on every authenticated screen.
 * Navigation uses react-router-dom NavLink so the browser URL changes on click
 * and the active item is highlighted automatically based on the current path.
 */
import React from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import {
  LayoutDashboard,
  Users,
  TrendingUp,
  Shield,
  Zap,
  AlertCircle,
  ClipboardList,
  LogOut,
  UserCog,
  Handshake,
  Building2,
} from 'lucide-react'
import { useTranslation } from 'react-i18next'
import logo from '../../../assets/logo.jpeg'
import { useAuth } from '../../../auth/AuthContext'
import { logout as logoutApi } from '../../../api/auth'
import './Sidebar.css'

// Keep Section type exported so existing callers that reference it don't break.
export type Section = 'home' | 'clients' | 'sales' | 'policies' | 'energy' | 'cases' | 'tasks' | 'timeTracking' | 'collaborators' | 'suppliers' | 'userManagement' | 'myAccount'

const navItems: { path: string; key: string; icon: React.ElementType }[] = [
  { path: '/home',          key: 'nav.home',          icon: LayoutDashboard },
  { path: '/clients',       key: 'nav.clients',       icon: Users },
  { path: '/sales',         key: 'nav.sales',         icon: TrendingUp },
  { path: '/policies',      key: 'nav.policies',      icon: Shield },
  { path: '/energy',        key: 'nav.energy',        icon: Zap },
  { path: '/cases',         key: 'nav.cases',         icon: AlertCircle },
  { path: '/tasks',         key: 'nav.tasks',         icon: ClipboardList },
  { path: '/collaborators', key: 'nav.collaborators', icon: Handshake },
  { path: '/suppliers',     key: 'nav.suppliers',     icon: Building2 },
]

export default function Sidebar() {
  const { t } = useTranslation()
  const { user, setUser } = useAuth()
  const location = useLocation()
  const isOwner = user?.role === 'OWNER'

  function isActive(path: string): boolean {
    if (path === '/home') return location.pathname === '/home' || location.pathname === '/'
    return location.pathname.startsWith(path)
  }

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
              <li key={item.path} className={isActive(item.path) ? 'active' : ''}>
                <NavLink to={item.path}>
                  <Icon size={20} />
                  <span>{t(item.key)}</span>
                </NavLink>
              </li>
            )
          })}
          {isOwner && (
            <>
              <li className="sidebar-nav-divider" role="separator" />
              <li className={location.pathname === '/settings/users' ? 'active' : ''}>
                <NavLink to="/settings/users">
                  <UserCog size={20} />
                  <span>{t('nav.userManagement')}</span>
                </NavLink>
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
