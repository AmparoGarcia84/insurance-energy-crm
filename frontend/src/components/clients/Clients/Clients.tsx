import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { getClient, deleteClient, importClients, type Client, type ImportResult } from '../../../api/clients'
import ClientsList from '../ClientsList/ClientsList'
import ClientDetail from '../ClientDetail/ClientDetail'
import ClientForm from '../ClientForm/ClientForm'
import SaleDetail from '../../sales/SaleDetail/SaleDetail'
import SaleForm from '../../sales/SaleForm/SaleForm'
import { useClients, useSales } from '../../../context/DataContext'
import type { Sale } from '../../../api/sales'

// ── Navigation stack ──────────────────────────────────────────────────────────

type ClientsView =
  | { kind: 'list' }
  | { kind: 'clientDetail'; client: Client }
  | { kind: 'clientForm';   client: Client | null }   // null = new client
  | { kind: 'saleDetail';   sale: Sale }
  | { kind: 'saleForm';     sale: Sale }

interface Props {
  initialClientId?: string
  onClientOpened?: () => void
}

export default function Clients({ initialClientId, onClientOpened }: Props) {
  const { t } = useTranslation()
  const { clients, loading, upsertClient, removeClient, refreshClients } = useClients()
  const { upsertSale, removeSale } = useSales()

  // When arriving via "Ver ficha cliente", start with empty stack to avoid
  // a one-frame flash of the list before the client detail resolves.
  const [stack, setStack] = useState<ClientsView[]>(() =>
    initialClientId ? [] : [{ kind: 'list' }]
  )

  const push = (v: ClientsView) => setStack(s => [...s, v])
  const pop  = ()               => setStack(s => s.length > 1 ? s.slice(0, -1) : s)

  // ── Cross-section entry: open a specific client directly ──────────────────
  useEffect(() => {
    if (!initialClientId) return
    // Use context cache first to avoid an extra fetch and prevent flash
    const cached = clients.find((c) => c.id === initialClientId)
    if (cached) {
      setStack([{ kind: 'clientDetail', client: cached }])
      onClientOpened?.()
      return
    }
    getClient(initialClientId)
      .then((c) => {
        setStack([{ kind: 'clientDetail', client: c }])
        onClientOpened?.()
      })
      .catch(() => {
        setStack([{ kind: 'list' }])  // client not found — fall back to list
      })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialClientId])

  // ── Client save: pop form, update detail if it's below ───────────────────
  function handleClientSaved(saved: Client) {
    upsertClient(saved)
    setStack((prev) => {
      const without = prev.slice(0, -1)                       // remove clientForm
      const below   = without[without.length - 1]
      if (below?.kind === 'clientDetail') {
        return [...without.slice(0, -1), { kind: 'clientDetail', client: saved }]
      }
      return without
    })
  }

  // ── Sale save: pop form, update saleDetail if it's below ─────────────────
  function handleSaleSaved(saved: Sale) {
    upsertSale(saved)
    setStack((prev) => {
      const without = prev.slice(0, -1)                       // remove saleForm
      const below   = without[without.length - 1]
      if (below?.kind === 'saleDetail') {
        return [...without.slice(0, -1), { kind: 'saleDetail', sale: saved }]
      }
      return without
    })
  }

  // ── Sale delete: pop form + saleDetail ───────────────────────────────────
  function handleSaleDeleted(id: string) {
    removeSale(id)
    setStack((prev) => {
      const withoutForm   = prev.slice(0, -1)
      const below         = withoutForm[withoutForm.length - 1]
      return below?.kind === 'saleDetail' ? withoutForm.slice(0, -1) : withoutForm
    })
  }

  async function handleEditExisting(id: string) {
    const existing = await getClient(id)
    setStack((prev) => [...prev.slice(0, -1), { kind: 'clientForm', client: existing }])
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

  // ── Render: drive entirely from stack top ─────────────────────────────────
  if (stack.length === 0) return null   // waiting for initialClientId to resolve

  const current = stack[stack.length - 1]

  if (current.kind === 'saleForm') {
    return (
      <SaleForm
        sale={current.sale}
        onSave={handleSaleSaved}
        onCancel={pop}
        onDelete={handleSaleDeleted}
      />
    )
  }

  if (current.kind === 'saleDetail') {
    return (
      <SaleDetail
        sale={current.sale}
        onBack={pop}
        onEdit={(s) => push({ kind: 'saleForm', sale: s })}
        onViewClient={() => pop()}
      />
    )
  }

  if (current.kind === 'clientForm') {
    return (
      <ClientForm
        key={current.client?.id ?? 'new'}
        client={current.client}
        onSave={handleClientSaved}
        onCancel={pop}
        onEditExisting={handleEditExisting}
      />
    )
  }

  if (current.kind === 'clientDetail') {
    return (
      <ClientDetail
        client={current.client}
        onBack={pop}
        onEdit={(c) => push({ kind: 'clientForm', client: c })}
        onViewSale={(s) => push({ kind: 'saleDetail', sale: s })}
      />
    )
  }

  // current.kind === 'list'
  return (
    <ClientsList
      clients={clients}
      loading={loading}
      onNew={() => push({ kind: 'clientForm', client: null })}
      onView={(c) => push({ kind: 'clientDetail', client: c })}
      onEdit={(c) => push({ kind: 'clientForm', client: c })}
      onDelete={handleDelete}
      onImport={handleImport}
    />
  )
}
