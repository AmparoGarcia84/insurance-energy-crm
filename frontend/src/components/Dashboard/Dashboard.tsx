import { useTranslation } from 'react-i18next'
import Sidebar from '../Sidebar/Sidebar'
import TopBar from '../TopBar/TopBar'

export default function Dashboard() {
  const { t } = useTranslation()

  return (
    <div className="dashboard">
      <Sidebar />
      <div className="dashboard-main">
        <TopBar />
        <main className="dashboard-content">
          <h1>{t('dashboard.home')}</h1>
        </main>
      </div>
    </div>
  )
}
