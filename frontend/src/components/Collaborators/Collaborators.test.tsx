import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { AuthProvider } from '../../auth/AuthContext'
import { DataProvider } from '../../context/DataContext'
import Collaborators from './Collaborators'

const collaboratorA = { id: '1', name: 'Acme S.L.', phone: '600111222', createdAt: '', updatedAt: '' }
const collaboratorB = { id: '2', name: 'Beta Corp', phone: '611333444', createdAt: '', updatedAt: '' }

vi.mock('../../api/auth', () => ({
  getMe: vi.fn().mockResolvedValue({ id: '1', displayName: 'Mila', email: 'mila@example.com', role: 'OWNER', avatarUrl: null }),
}))

vi.mock('../../api/collaborators', () => ({
  getCollaborators:    vi.fn().mockResolvedValue([]),
  createCollaborator:  vi.fn().mockResolvedValue({ id: '3', name: 'Nueva S.L.', phone: '699000111', createdAt: '', updatedAt: '' }),
  updateCollaborator:  vi.fn().mockResolvedValue({ id: '1', name: 'Acme Actualizado', phone: '600111222', createdAt: '', updatedAt: '' }),
  deleteCollaborator:  vi.fn().mockResolvedValue(undefined),
}))

// DataContext also fetches clients, sales and users — mock them to avoid network calls
vi.mock('../../api/clients', () => ({ getClients: vi.fn().mockResolvedValue([]) }))
vi.mock('../../api/sales',   () => ({ getSales:   vi.fn().mockResolvedValue([]) }))
vi.mock('../../api/users',   () => ({ getUsers:   vi.fn().mockResolvedValue([]) }))

import { getCollaborators, createCollaborator, deleteCollaborator } from '../../api/collaborators'

function renderComponent() {
  return render(
    <AuthProvider>
      <DataProvider>
        <Collaborators />
      </DataProvider>
    </AuthProvider>
  )
}

describe('Collaborators', () => {
  beforeEach(() => {
    vi.mocked(getCollaborators).mockResolvedValue([])
  })

  it('renders the section heading', async () => {
    renderComponent()
    await waitFor(() => {
      expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Colaboradores')
    })
  })

  it('shows "Nuevo colaborador" button', async () => {
    renderComponent()
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /nuevo colaborador/i })).toBeInTheDocument()
    })
  })

  it('shows empty state when there are no collaborators', async () => {
    renderComponent()
    await waitFor(() => {
      expect(screen.getByText('No hay colaboradores')).toBeInTheDocument()
    })
  })

  it('shows collaborators in the table', async () => {
    vi.mocked(getCollaborators).mockResolvedValue([collaboratorA, collaboratorB])
    renderComponent()
    await waitFor(() => {
      expect(screen.getByText('Acme S.L.')).toBeInTheDocument()
      expect(screen.getByText('Beta Corp')).toBeInTheDocument()
      expect(screen.getByText('600111222')).toBeInTheDocument()
    })
  })

  it('opens modal when "Nuevo colaborador" is clicked', async () => {
    renderComponent()
    await waitFor(() => screen.getByRole('button', { name: /nuevo colaborador/i }))
    await userEvent.click(screen.getByRole('button', { name: /nuevo colaborador/i }))
    expect(screen.getByRole('dialog')).toBeInTheDocument()
    expect(screen.getByLabelText(/nombre \/ razón social/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/teléfono/i)).toBeInTheDocument()
  })

  it('closes modal when cancel is clicked', async () => {
    renderComponent()
    await waitFor(() => screen.getByRole('button', { name: /nuevo colaborador/i }))
    await userEvent.click(screen.getByRole('button', { name: /nuevo colaborador/i }))
    // click the text "Cancelar" button (not the X icon button with aria-label="Cancelar")
    await userEvent.click(screen.getByText('Cancelar'))
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('calls createCollaborator and adds the row on submit', async () => {
    renderComponent()
    await waitFor(() => screen.getByRole('button', { name: /nuevo colaborador/i }))
    await userEvent.click(screen.getByRole('button', { name: /nuevo colaborador/i }))

    await userEvent.type(screen.getByLabelText(/nombre \/ razón social/i), 'Nueva S.L.')
    await userEvent.type(screen.getByLabelText(/teléfono/i), '699000111')
    await userEvent.click(screen.getByRole('button', { name: /^guardar$/i }))

    await waitFor(() => expect(createCollaborator).toHaveBeenCalledWith({ name: 'Nueva S.L.', phone: '699000111' }))
    expect(screen.getByText('Nueva S.L.')).toBeInTheDocument()
  })

  it('opens modal with existing data when edit is clicked', async () => {
    vi.mocked(getCollaborators).mockResolvedValue([collaboratorA])
    renderComponent()
    await waitFor(() => screen.getByText('Acme S.L.'))
    await userEvent.click(screen.getByTitle(/editar colaborador/i))
    const nameInput = screen.getByLabelText(/nombre \/ razón social/i) as HTMLInputElement
    expect(nameInput.value).toBe('Acme S.L.')
  })

  it('shows delete button only for OWNER and opens confirm modal', async () => {
    vi.mocked(getCollaborators).mockResolvedValue([collaboratorA])
    renderComponent()
    await waitFor(() => screen.getByText('Acme S.L.'))
    await userEvent.click(screen.getByTitle(/eliminar/i))
    const dialog = screen.getByRole('dialog')
    expect(dialog).toBeInTheDocument()
    expect(within(dialog).getByText(/Acme S\.L\./)).toBeInTheDocument()
  })

  it('calls deleteCollaborator and removes the row on confirm', async () => {
    vi.mocked(getCollaborators).mockResolvedValue([collaboratorA])
    renderComponent()
    await waitFor(() => screen.getByText('Acme S.L.'))
    await userEvent.click(screen.getByTitle(/eliminar/i))
    // click the "Eliminar" button inside the confirm dialog (not the table row button)
    const dialog = screen.getByRole('dialog')
    await userEvent.click(within(dialog).getByRole('button', { name: /^eliminar$/i }))
    await waitFor(() => expect(deleteCollaborator).toHaveBeenCalledWith(collaboratorA.id))
    expect(screen.queryByText('Acme S.L.')).not.toBeInTheDocument()
  })

  it('filters the list by search term', async () => {
    vi.mocked(getCollaborators).mockResolvedValue([collaboratorA, collaboratorB])
    renderComponent()
    await waitFor(() => screen.getByText('Acme S.L.'))
    await userEvent.type(screen.getByRole('searchbox'), 'beta')
    expect(screen.queryByText('Acme S.L.')).not.toBeInTheDocument()
    expect(screen.getByText('Beta Corp')).toBeInTheDocument()
  })
})
