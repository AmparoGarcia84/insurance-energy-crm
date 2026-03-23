import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import Sidebar, { Section } from '../Sidebar/Sidebar'
import TopBar from '../TopBar/TopBar'
import Clients from '../Clients/Clients'

export default function Dashboard() {
  const { t } = useTranslation()
  const [activeSection, setActiveSection] = useState<Section>('home')

  function renderSection() {
    switch (activeSection) {
      case 'clients': return <Clients />
      default:        return <h1>{t(`nav.${activeSection}`)}</h1>
    }
  }

  return (
    <div className="dashboard">
      <Sidebar activeSection={activeSection} onNavigate={setActiveSection} />
      <div className="dashboard-main">
        <TopBar />
        <main className="dashboard-content">
          {renderSection()}
        </main>
      </div>
    </div>
  )
}
