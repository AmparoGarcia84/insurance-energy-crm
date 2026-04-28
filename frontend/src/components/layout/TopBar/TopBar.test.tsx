import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi } from 'vitest'
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

function renderTopBar(overrides: Partial<Parameters<typeof TopBar>[0]> = {}) {
  const props = {
    onNavigate:   vi.fn(),
    onOpenClient: vi.fn(),
    onOpenSale:   vi.fn(),
    onOpenCase:   vi.fn(),
    ...overrides,
  }
  return { ...props, ...render(<TopBar {...props} />) }
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

  it('navigates to myAccount when the user name is clicked', async () => {
    const { onNavigate } = renderTopBar()
    await userEvent.click(screen.getByText('Mila García'))
    expect(onNavigate).toHaveBeenCalledWith('myAccount')
  })
})
