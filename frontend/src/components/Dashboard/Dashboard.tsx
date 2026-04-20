import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import Sidebar, { Section } from '../Sidebar/Sidebar'
import TopBar from '../TopBar/TopBar'
import Clients from '../Clients/Clients'
import Sales from '../Sales/Sales'
import UserManagement from '../UserManagement/UserManagement'
import MyAccount from '../MyAccount/MyAccount'
import Collaborators from '../Collaborators/Collaborators'

export default function Dashboard() {
  const { t } = useTranslation()
  const [activeSection, setActiveSection] = useState<Section>('home')

  function renderSection() {
    switch (activeSection) {
      case 'clients':        return <Clients />
      case 'sales':          return <Sales />
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
