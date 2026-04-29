import { useTranslation } from 'react-i18next'
import { Routes, Route, useNavigate, useParams } from 'react-router-dom'
import { getClient, deleteClient, importClients, type Client, type ImportResult } from '../../../api/clients'
import ClientsList from '../ClientsList/ClientsList'
import ClientDetail from '../ClientDetail/ClientDetail'
import ClientForm from '../ClientForm/ClientForm'
import { useClients, useSales } from '../../../context/DataContext'
import { usePermissions } from '../../../hooks/usePermissions'

// ── /clients (list) ───────────────────────────────────────────────────────────

function ClientsListPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { clients, loading, refreshClients, removeClient } = useClients()
  const { canDelete } = usePermissions()

  async function handleDelete(client: Client) {
    if (!canDelete) return
    if (!confirm(t('clients.deleteConfirm', { name: client.name }))) return
    await deleteClient(client.id)
    removeClient(client.id)
  }

  async function handleImport(csvText: string): Promise<ImportResult> {
    const result = await importClients(csvText)
    await refreshClients()
    return result
  }

  return (
    <ClientsList
      clients={clients}
      loading={loading}
      onNew={() => navigate('/clients/new')}
      onView={(c) => navigate(`/clients/${c.id}`)}
      onEdit={(c) => navigate(`/clients/${c.id}/edit`)}
      onDelete={handleDelete}
      onImport={handleImport}
    />
  )
}

// ── /clients/:clientId (detail) ───────────────────────────────────────────────

function ClientDetailPage() {
  const { clientId } = useParams<{ clientId: string }>()
  const navigate = useNavigate()
  const { clients } = useClients()

  const client = clients.find((c) => c.id === clientId)
  if (!client) return null

  return (
    <ClientDetail
      client={client}
      onBack={() => navigate(-1)}
      onEdit={() => navigate(`/clients/${clientId}/edit`)}
      onViewSale={(sale) => navigate(`/sales/${sale.id}`)}
    />
  )
}

// ── /clients/new  and  /clients/:clientId/edit (form) ─────────────────────────

function ClientFormPage() {
  const { clientId } = useParams<{ clientId?: string }>()
  const navigate = useNavigate()
  const { clients, upsertClient } = useClients()
  const { upsertSale } = useSales()

  const existing = clientId ? clients.find((c) => c.id === clientId) ?? null : null

  async function handleEditExisting(id: string) {
    const c = await getClient(id)
    navigate(`/clients/${c.id}/edit`)
  }

  return (
    <ClientForm
      key={clientId ?? 'new'}
      client={existing}
      onSave={(saved) => {
        upsertClient(saved)
        navigate(`/clients/${saved.id}`)
      }}
      onCancel={() => navigate(-1)}
      onEditExisting={handleEditExisting}
    />
  )
}

// ── Module router ─────────────────────────────────────────────────────────────

export default function Clients() {
  return (
    <Routes>
      <Route index element={<ClientsListPage />} />
      <Route path="new" element={<ClientFormPage />} />
      <Route path=":clientId" element={<ClientDetailPage />} />
      <Route path=":clientId/edit" element={<ClientFormPage />} />
    </Routes>
  )
}
