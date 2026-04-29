import { render, screen } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { MemoryRouter } from 'react-router-dom'
import { AuthProvider } from '../../../auth/AuthContext'
import Dashboard from './Dashboard'

vi.mock('../../../api/auth', () => ({
  getMe: vi.fn().mockResolvedValue(null),
  logout: vi.fn().mockResolvedValue(undefined),
}))

vi.mock('../../../api/clients', () => ({
  getClients: vi.fn().mockResolvedValue([]),
}))

// Home makes an async request — mock it so Dashboard tests stay focused on routing/layout
vi.mock('../../home/Home/Home', () => ({
  default: () => <div data-testid="home-section">Inicio</div>,
}))

// GlobalSearch uses DataContext hooks — stub it so Dashboard tests don't need a DataProvider
vi.mock('../GlobalSearch/GlobalSearch', () => ({
  default: () => <input type="search" aria-label="global-search" />,
}))

function renderDashboard(initialPath = '/home') {
  return render(
    <MemoryRouter initialEntries={[initialPath]}>
      <AuthProvider>
        <Dashboard />
      </AuthProvider>
    </MemoryRouter>
  )
}

describe('Dashboard', () => {
  it('renders sidebar and topbar', () => {
    renderDashboard()
    expect(screen.getByRole('complementary')).toBeInTheDocument() // <aside>
    expect(screen.getByRole('banner')).toBeInTheDocument()        // <header>
  })

  it('renders main content area', () => {
    renderDashboard()
    expect(screen.getByRole('main')).toBeInTheDocument()
  })

  it('shows home section when path is /home', () => {
    renderDashboard('/home')
    expect(screen.getByTestId('home-section')).toBeInTheDocument()
    expect(screen.getByRole('main')).toHaveTextContent('Inicio')
  })

  it('redirects / to /home', () => {
    renderDashboard('/')
    expect(screen.getByTestId('home-section')).toBeInTheDocument()
  })
})
