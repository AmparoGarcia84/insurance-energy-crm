import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import Sidebar from './Sidebar'

describe('Sidebar', () => {
  it('renders all nav items', () => {
    render(<Sidebar />)

    expect(screen.getByText('Inicio')).toBeInTheDocument()
    expect(screen.getByText('Clientes')).toBeInTheDocument()
    expect(screen.getByText('Ventas')).toBeInTheDocument()
    expect(screen.getByText('Pólizas')).toBeInTheDocument()
    expect(screen.getByText('Energía')).toBeInTheDocument()
    expect(screen.getByText('Casos')).toBeInTheDocument()
    expect(screen.getByText('Jornada')).toBeInTheDocument()
  })

  it('renders logout button', () => {
    render(<Sidebar />)
    expect(screen.getByRole('button', { name: /cerrar sesión/i })).toBeInTheDocument()
  })
})
