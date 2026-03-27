import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import Sidebar, { Section } from '../Sidebar/Sidebar'
import TopBar from '../TopBar/TopBar'
import Clients from '../Clients/Clients'
import UserManagement from '../UserManagement/UserManagement'
import MyAccount from '../MyAccount/MyAccount'

export default function Dashboard() {
  const { t } = useTranslation()
  const [activeSection, setActiveSection] = useState<Section>('home')

  function renderSection() {
    switch (activeSection) {
      case 'clients':        return <Clients />
      case 'userManagement': return <UserManagement />
      case 'myAccount':      return <MyAccount />
      default:               return <h1>{t(`nav.${activeSection}`)}</h1>
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
