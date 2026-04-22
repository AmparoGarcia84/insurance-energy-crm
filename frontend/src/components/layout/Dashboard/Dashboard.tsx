import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import Sidebar, { Section } from '../Sidebar/Sidebar'
import TopBar from '../TopBar/TopBar'
import Clients from '../../clients/Clients/Clients'
import Sales from '../../sales/Sales/Sales'
import UserManagement from '../../settings/UserManagement/UserManagement'
import MyAccount from '../../settings/MyAccount/MyAccount'
import Collaborators from '../../settings/Collaborators/Collaborators'

export default function Dashboard() {
  const { t } = useTranslation()
  const [activeSection, setActiveSection] = useState<Section>('home')
  const [pendingClientId, setPendingClientId] = useState<string | null>(null)

  function navigateToClient(clientId: string) {
    setPendingClientId(clientId)
    setActiveSection('clients')
  }

  function renderSection() {
    switch (activeSection) {
      case 'clients':        return <Clients initialClientId={pendingClientId ?? undefined} onClientOpened={() => setPendingClientId(null)} />
      case 'sales':          return <Sales onNavigateToClient={navigateToClient} />
      case 'collaborators':  return <Collaborators />
      case 'userManagement': return <UserManagement />
      case 'myAccount':      return <MyAccount />
      default:               return <div className="page-header"><h1 className="page-title">{t(`nav.${activeSection}`)}</h1></div>
    }
  }

  return (
    <div className="dashboard">
      <Sidebar activeSection={activeSection} onNavigate={setActiveSection} />
      <div className="dashboard-main">
        <TopBar onNavigate={setActiveSection} />
        <main className="dashboard-content">
          {renderSection()}
        </main>
      </div>
    </div>
  )
}
