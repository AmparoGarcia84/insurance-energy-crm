/**
 * Dashboard/Dashboard.tsx — Authenticated application shell
 *
 * This is the root layout component rendered after a successful login.
 * It composes the persistent chrome (Sidebar on the left, TopBar at the top)
 * around a central content area where individual CRM sections will be mounted.
 *
 * The current content area is a placeholder heading. As feature sections are
 * built (Clients, Sales, Policies, etc.), the router will swap content here
 * based on the active navigation item selected in the Sidebar.
 *
 * Layout is driven by CSS classes defined in App.css so that the sidebar /
 * main split is consistent across all future sub-pages.
 */
import { useTranslation } from 'react-i18next'
import Sidebar from '../Sidebar/Sidebar'
import TopBar from '../TopBar/TopBar'

export default function Dashboard() {
  const { t } = useTranslation()

  return (
    <div className="dashboard">
      {/* Sidebar handles navigation and logout */}
      <Sidebar />

      <div className="dashboard-main">
        {/* TopBar holds search, notifications, and user identity */}
        <TopBar />

        {/* Scrollable content area — individual section components will render here */}
        <main className="dashboard-content">
          <h1>{t('dashboard.home')}</h1>
        </main>
      </div>
    </div>
  )
}
