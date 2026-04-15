import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { getClient, deleteClient, importClients, type Client, type ImportResult } from '../../api/clients'
import ClientsList from '../ClientsList/ClientsList'
import ClientDetail from '../ClientDetail/ClientDetail'
import ClientForm from '../ClientForm/ClientForm'
import { useClients } from '../../context/DataContext'

export default function Clients() {
  const { t } = useTranslation()

  const { clients, loading, upsertClient, removeClient, refreshClients } = useClients()
  const [viewing, setViewing] = useState<Client | null>(null)
  // 'new' is a sentinel value that means "open form for a new client"
  const [editing, setEditing] = useState<Client | null | 'new'>(null)

  async function handleEditExisting(id: string) {
    const existing = await getClient(id)
    setEditing(existing)
  }

  // Insert or update the saved client in the list, keeping alphabetical order.
  // If the edit was opened from the detail view, return there with updated data.
  function handleSaved(saved: Client) {
    upsertClient(saved)
    setEditing(null)
    if (viewing) setViewing(saved)
  }

  async function handleImport(csvText: string): Promise<ImportResult> {
    const result = await importClients(csvText)
    await refreshClients()
    return result
  }

  async function handleDelete(client: Client) {
    if (!confirm(t('clients.deleteConfirm', { name: client.name }))) return
    await deleteClient(client.id)
    removeClient(client.id)
  }

  // Detail view: shown when a row is clicked and no form is open
  if (viewing && editing === null) {
    return (
      <ClientDetail
        client={viewing}
        onBack={() => setViewing(null)}
        onEdit={(client) => { setEditing(client) }}
      />
    )
  }

  // Form view: shown for both new clients and edits
  if (editing !== null) {
    return (
      <ClientForm
        key={editing === 'new' ? 'new' : editing.id}
        client={editing === 'new' ? null : editing}
        onSave={handleSaved}
        onCancel={() => setEditing(null)}
        onEditExisting={handleEditExisting}
      />
    )
  }

  return (
    <ClientsList
      clients={clients}
      loading={loading}
      onNew={() => setEditing('new')}
      onView={setViewing}
      onEdit={setEditing}
      onDelete={handleDelete}
      onImport={handleImport}
    />
  )
}
