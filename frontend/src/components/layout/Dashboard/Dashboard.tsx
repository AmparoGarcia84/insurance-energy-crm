import { Routes, Route, Navigate, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import Sidebar from '../Sidebar/Sidebar'
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
  const navigate = useNavigate()

  return (
    <div className="dashboard">
      <Sidebar />
      <div className="dashboard-main">
        <TopBar />
        <main className="dashboard-content">
          <Routes>
            <Route path="/" element={<Navigate to="/home" replace />} />
            <Route path="/home" element={<Home />} />
            <Route path="/clients/*" element={<Clients />} />
            <Route path="/sales/*" element={<Sales />} />
            <Route path="/policies/*" element={<Policies onNavigateToClient={(id) => navigate(`/clients/${id}`)} />} />
            <Route path="/energy/*" element={<Energy onNavigateToClient={(id) => navigate(`/clients/${id}`)} />} />
            <Route path="/cases/*" element={<Cases />} />
            <Route path="/tasks/*" element={<Tasks />} />
            <Route path="/suppliers/*" element={<Suppliers />} />
            <Route path="/collaborators/*" element={<Collaborators />} />
            <Route path="/settings/users" element={<UserManagement />} />
            <Route path="/settings/my-account" element={<MyAccount />} />
            <Route path="*" element={<div className="page-header"><h1 className="page-title">{t('nav.notFound')}</h1></div>} />
          </Routes>
        </main>
      </div>
    </div>
  )
}
