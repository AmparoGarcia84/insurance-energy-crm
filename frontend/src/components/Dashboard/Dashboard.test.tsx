import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import Dashboard from './Dashboard'

describe('Dashboard', () => {
  it('renders sidebar and topbar', () => {
    render(<Dashboard />)
    expect(screen.getByRole('complementary')).toBeInTheDocument() // <aside>
    expect(screen.getByRole('banner')).toBeInTheDocument()        // <header>
  })

  it('renders main content area', () => {
    render(<Dashboard />)
    expect(screen.getByRole('main')).toBeInTheDocument()
  })
})
