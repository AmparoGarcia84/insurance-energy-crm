import { useTranslation } from 'react-i18next'
import './App.css'
import Sidebar from './components/Sidebar'
import TopBar from './components/TopBar'

function App() {
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

export default App
