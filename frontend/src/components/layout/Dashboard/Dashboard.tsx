import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import Sidebar, { Section } from '../Sidebar/Sidebar'
import TopBar from '../TopBar/TopBar'
import Home from '../../home/Home/Home'
import Clients from '../../clients/Clients/Clients'
import Sales from '../../sales/Sales/Sales'
import Policies from '../../policies/Policies/Policies'
import Energy from '../../energy/Energy/Energy'
import UserManagement from '../../settings/UserManagement/UserManagement'
import MyAccount from '../../settings/MyAccount/MyAccount'
import Collaborators from '../../settings/Collaborators/Collaborators'
import Cases from '../../cases/Cases/Cases'
import Tasks from '../../tasks/Tasks/Tasks'
import Suppliers from '../../suppliers/Suppliers/Suppliers'

export default function Dashboard() {
  const { t } = useTranslation()
  const [activeSection, setActiveSection] = useState<Section>('home')
  const [pendingClientId, setPendingClientId] = useState<string | null>(null)
  const [pendingSaleId,   setPendingSaleId]   = useState<string | null>(null)
  const [pendingCaseId,   setPendingCaseId]   = useState<string | null>(null)

  function navigateToClient(clientId: string) {
    setPendingClientId(clientId)
    setActiveSection('clients')
  }

  function navigateToSale(saleId: string) {
    setPendingSaleId(saleId)
    setActiveSection('sales')
  }

  function navigateToCase(caseId: string) {
    setPendingCaseId(caseId)
    setActiveSection('cases')
  }

  function renderSection() {
    switch (activeSection) {
      case 'home':           return <Home />
      case 'clients':        return <Clients initialClientId={pendingClientId ?? undefined} onClientOpened={() => setPendingClientId(null)} />
      case 'sales':          return <Sales onNavigateToClient={navigateToClient} initialSaleId={pendingSaleId ?? undefined} onSaleOpened={() => setPendingSaleId(null)} />
      case 'policies':       return <Policies onNavigateToClient={navigateToClient} />
      case 'energy':         return <Energy onNavigateToClient={navigateToClient} />
      case 'cases':          return <Cases initialCaseId={pendingCaseId ?? undefined} onCaseOpened={() => setPendingCaseId(null)} />
      case 'tasks':          return <Tasks />
      case 'collaborators':  return <Collaborators />
      case 'suppliers':      return <Suppliers />
      case 'userManagement': return <UserManagement />
      case 'myAccount':      return <MyAccount />
      default:               return <div className="page-header"><h1 className="page-title">{t(`nav.${activeSection}`)}</h1></div>
    }
  }

  return (
    <div className="dashboard">
      <Sidebar activeSection={activeSection} onNavigate={setActiveSection} />
      <div className="dashboard-main">
        <TopBar
          onNavigate={setActiveSection}
          onOpenClient={navigateToClient}
          onOpenSale={navigateToSale}
          onOpenCase={navigateToCase}
        />
        <main className="dashboard-content">
          {renderSection()}
        </main>
      </div>
    </div>
  )
}
