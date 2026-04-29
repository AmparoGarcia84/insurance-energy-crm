import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi } from 'vitest'
import { MemoryRouter } from 'react-router-dom'
import TopBar from './TopBar'

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}))

vi.mock('../../../api/auth', () => ({
  uploadAvatar: vi.fn(),
}))

vi.mock('../../../auth/AuthContext', () => ({
  useAuth: () => ({ user: { displayName: 'Mila García', role: 'OWNER' }, setUser: vi.fn() }),
}))

// GlobalSearch uses DataContext hooks — stub it out in TopBar tests.
// GlobalSearch has its own test file for full interaction coverage.
vi.mock('../GlobalSearch/GlobalSearch', () => ({
  default: () => <input type="search" aria-label="global-search" />,
}))

const mockNavigate = vi.fn()
vi.mock('react-router-dom', async (importOriginal) => {
  const actual = await importOriginal<typeof import('react-router-dom')>()
  return { ...actual, useNavigate: () => mockNavigate }
})

function renderTopBar() {
  return render(
    <MemoryRouter>
      <TopBar />
    </MemoryRouter>
  )
}

describe('TopBar', () => {
  it('renders search input', () => {
    renderTopBar()
    expect(screen.getByRole('searchbox')).toBeInTheDocument()
  })

  it('renders mail and notifications buttons', () => {
    renderTopBar()
    expect(screen.getByRole('button', { name: 'topbar.mail' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'topbar.notifications' })).toBeInTheDocument()
  })

  it('renders the logged-in user display name', () => {
    renderTopBar()
    expect(screen.getByText('Mila García')).toBeInTheDocument()
  })

  it('navigates to /settings/my-account when the user name is clicked', async () => {
    renderTopBar()
    await userEvent.click(screen.getByText('Mila García'))
    expect(mockNavigate).toHaveBeenCalledWith('/settings/my-account')
  })
})
