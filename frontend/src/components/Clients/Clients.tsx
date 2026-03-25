import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { getClients, deleteClient, type Client } from '../../api/clients'
import ClientsList from '../ClientsList/ClientsList'
import ClientDetail from '../ClientDetail/ClientDetail'
import ClientForm from '../ClientForm/ClientForm'

export default function Clients() {
  const { t } = useTranslation()

  const [clients, setClients] = useState<Client[]>([])
  const [loading, setLoading] = useState(true)
  const [viewing, setViewing] = useState<Client | null>(null)
  // 'new' is a sentinel value that means "open form for a new client"
  const [editing, setEditing] = useState<Client | null | 'new'>(null)

  useEffect(() => {
    getClients().then(setClients).finally(() => setLoading(false))
  }, [])

  // Insert or update the saved client in the list, keeping alphabetical order
  function handleSaved(saved: Client) {
    setClients((prev) => {
      const exists = prev.some((c) => c.id === saved.id)
      const updated = exists
        ? prev.map((c) => (c.id === saved.id ? saved : c))
        : [...prev, saved]
      return updated.sort((a, b) => a.name.localeCompare(b.name))
    })
    setEditing(null)
  }

  async function handleDelete(client: Client) {
    if (!confirm(t('clients.deleteConfirm', { name: client.name }))) return
    await deleteClient(client.id)
    setClients((prev) => prev.filter((c) => c.id !== client.id))
  }

  // Detail view: shown when a row is clicked and no form is open
  if (viewing && editing === null) {
    return (
      <ClientDetail
        client={viewing}
        onBack={() => setViewing(null)}
        onEdit={(client) => { setViewing(null); setEditing(client) }}
      />
    )
  }

  // Form view: shown for both new clients and edits
  if (editing !== null) {
    return (
      <ClientForm
        client={editing === 'new' ? null : editing}
        onSave={handleSaved}
        onCancel={() => setEditing(null)}
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
    />
  )
}
