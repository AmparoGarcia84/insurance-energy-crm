/**
 * context/DataContext.tsx — Session-level data cache
 *
 * Prevents redundant API calls by caching entity lists in memory for the
 * duration of the authenticated session. The cache is destroyed when the user
 * logs out (DataProvider unmounts with the protected route).
 *
 * Strategy:
 *  - Lazy fetch: data is only fetched the first time a component requests it.
 *  - Deduplication: concurrent requests for the same resource share one fetch.
 *  - Optimistic updates: create/update/delete mutate the cache in-place so no
 *    re-fetch is needed after every write.
 *  - Manual refresh: refreshX() forces a re-fetch (e.g. after bulk import).
 *
 * Usage:
 *   const { clients, loading, upsertClient, removeClient } = useClients()
 *   const { sales, loading, upsertSale, removeSale } = useSales()
 *   const { users, loading, upsertUser, removeUser } = useUsers()
 */
import {
  createContext,
  useContext,
  useState,
  useRef,
  useEffect,
  useCallback,
  type ReactNode,
} from 'react'
import { getClients, type Client } from '../api/clients'
import { getSales, type Sale } from '../api/sales'
import { getUsers } from '../api/users'
import { getCollaborators, type Collaborator } from '../api/collaborators'
import { getCases, type Case } from '../api/cases'
import type { AuthUser } from '../api/auth'

// ── Context shape ────────────────────────────────────────────────────────────

interface DataContextValue {
  // Clients
  clients: Client[]
  clientsLoading: boolean
  ensureClients: () => void
  upsertClient: (client: Client) => void
  removeClient: (id: string) => void
  refreshClients: () => Promise<void>

  // Sales
  sales: Sale[]
  salesLoading: boolean
  ensureSales: () => void
  upsertSale: (sale: Sale) => void
  removeSale: (id: string) => void

  // Users
  users: AuthUser[]
  usersLoading: boolean
  ensureUsers: () => void
  upsertUser: (user: AuthUser) => void
  removeUser: (id: string) => void

  // Collaborators
  collaborators: Collaborator[]
  collaboratorsLoading: boolean
  ensureCollaborators: () => void
  upsertCollaborator: (collaborator: Collaborator) => void
  removeCollaborator: (id: string) => void

  // Cases
  cases: Case[]
  casesLoading: boolean
  ensureCases: () => void
  upsertCase: (c: Case) => void
  removeCase: (id: string) => void
}

const DataContext = createContext<DataContextValue | null>(null)

// ── Provider ─────────────────────────────────────────────────────────────────

export function DataProvider({ children }: { children: ReactNode }) {
  // ── Clients ──
  const [clients, setClients] = useState<Client[]>([])
  const [clientsLoading, setClientsLoading] = useState(false)
  const clientsFetched = useRef(false)

  const ensureClients = useCallback(() => {
    if (clientsFetched.current) return
    clientsFetched.current = true
    setClientsLoading(true)
    getClients()
      .then(setClients)
      .catch(() => { clientsFetched.current = false }) // allow retry on error
      .finally(() => setClientsLoading(false))
  }, [])

  const upsertClient = useCallback((client: Client) => {
    setClients((prev) => {
      const exists = prev.some((c) => c.id === client.id)
      const updated = exists
        ? prev.map((c) => (c.id === client.id ? client : c))
        : [...prev, client]
      return updated.sort((a, b) => a.name.localeCompare(b.name))
    })
  }, [])

  const removeClient = useCallback((id: string) => {
    setClients((prev) => prev.filter((c) => c.id !== id))
  }, [])

  const refreshClients = useCallback(async () => {
    clientsFetched.current = false
    setClientsLoading(true)
    try {
      setClients(await getClients())
      clientsFetched.current = true
    } finally {
      setClientsLoading(false)
    }
  }, [])

  // ── Sales ──
  const [sales, setSales] = useState<Sale[]>([])
  const [salesLoading, setSalesLoading] = useState(false)
  const salesFetched = useRef(false)

  const ensureSales = useCallback(() => {
    if (salesFetched.current) return
    salesFetched.current = true
    setSalesLoading(true)
    getSales()
      .then(setSales)
      .catch(() => { salesFetched.current = false })
      .finally(() => setSalesLoading(false))
  }, [])

  const upsertSale = useCallback((sale: Sale) => {
    setSales((prev) => {
      const exists = prev.some((s) => s.id === sale.id)
      return exists
        ? prev.map((s) => (s.id === sale.id ? sale : s))
        : [...prev, sale]
    })
  }, [])

  const removeSale = useCallback((id: string) => {
    setSales((prev) => prev.filter((s) => s.id !== id))
  }, [])

  // ── Users ──
  const [users, setUsers] = useState<AuthUser[]>([])
  const [usersLoading, setUsersLoading] = useState(false)
  const usersFetched = useRef(false)

  const ensureUsers = useCallback(() => {
    if (usersFetched.current) return
    usersFetched.current = true
    setUsersLoading(true)
    getUsers()
      .then(setUsers)
      .catch(() => { usersFetched.current = false })
      .finally(() => setUsersLoading(false))
  }, [])

  const upsertUser = useCallback((user: AuthUser) => {
    setUsers((prev) => {
      const exists = prev.some((u) => u.id === user.id)
      return exists
        ? prev.map((u) => (u.id === user.id ? user : u))
        : [...prev, user]
    })
  }, [])

  const removeUser = useCallback((id: string) => {
    setUsers((prev) => prev.filter((u) => u.id !== id))
  }, [])

  // ── Collaborators ──
  const [collaborators, setCollaborators] = useState<Collaborator[]>([])
  const [collaboratorsLoading, setCollaboratorsLoading] = useState(false)
  const collaboratorsFetched = useRef(false)

  const ensureCollaborators = useCallback(() => {
    if (collaboratorsFetched.current) return
    collaboratorsFetched.current = true
    setCollaboratorsLoading(true)
    getCollaborators()
      .then(setCollaborators)
      .catch(() => { collaboratorsFetched.current = false })
      .finally(() => setCollaboratorsLoading(false))
  }, [])

  const upsertCollaborator = useCallback((collaborator: Collaborator) => {
    setCollaborators((prev) => {
      const exists = prev.some((c) => c.id === collaborator.id)
      const updated = exists
        ? prev.map((c) => (c.id === collaborator.id ? collaborator : c))
        : [...prev, collaborator]
      return updated.sort((a, b) => a.name.localeCompare(b.name))
    })
  }, [])

  const removeCollaborator = useCallback((id: string) => {
    setCollaborators((prev) => prev.filter((c) => c.id !== id))
  }, [])

  // ── Cases ──
  const [cases, setCases] = useState<Case[]>([])
  const [casesLoading, setCasesLoading] = useState(false)
  const casesFetched = useRef(false)

  const ensureCases = useCallback(() => {
    if (casesFetched.current) return
    casesFetched.current = true
    setCasesLoading(true)
    getCases()
      .then(setCases)
      .catch(() => { casesFetched.current = false })
      .finally(() => setCasesLoading(false))
  }, [])

  const upsertCase = useCallback((c: Case) => {
    setCases((prev) => {
      const exists = prev.some((x) => x.id === c.id)
      return exists
        ? prev.map((x) => (x.id === c.id ? c : x))
        : [c, ...prev]
    })
  }, [])

  const removeCase = useCallback((id: string) => {
    setCases((prev) => prev.filter((c) => c.id !== id))
  }, [])

  return (
    <DataContext.Provider value={{
      clients, clientsLoading, ensureClients, upsertClient, removeClient, refreshClients,
      sales, salesLoading, ensureSales, upsertSale, removeSale,
      users, usersLoading, ensureUsers, upsertUser, removeUser,
      collaborators, collaboratorsLoading, ensureCollaborators, upsertCollaborator, removeCollaborator,
      cases, casesLoading, ensureCases, upsertCase, removeCase,
    }}>
      {children}
    </DataContext.Provider>
  )
}

// ── Internal hook ────────────────────────────────────────────────────────────

function useDataContext(): DataContextValue {
  const ctx = useContext(DataContext)
  if (!ctx) throw new Error('useDataContext must be used within DataProvider')
  return ctx
}

// ── Public hooks — each triggers a lazy fetch on first mount ─────────────────

export function useClients() {
  const ctx = useDataContext()
  useEffect(() => { ctx.ensureClients() }, [ctx.ensureClients])
  return {
    clients: ctx.clients,
    loading: ctx.clientsLoading,
    upsertClient: ctx.upsertClient,
    removeClient: ctx.removeClient,
    refreshClients: ctx.refreshClients,
  }
}

export function useSales() {
  const ctx = useDataContext()
  useEffect(() => { ctx.ensureSales() }, [ctx.ensureSales])
  return {
    sales: ctx.sales,
    loading: ctx.salesLoading,
    upsertSale: ctx.upsertSale,
    removeSale: ctx.removeSale,
  }
}

export function useUsers() {
  const ctx = useDataContext()
  useEffect(() => { ctx.ensureUsers() }, [ctx.ensureUsers])
  return {
    users: ctx.users,
    loading: ctx.usersLoading,
    upsertUser: ctx.upsertUser,
    removeUser: ctx.removeUser,
  }
}

export function useCollaborators() {
  const ctx = useDataContext()
  useEffect(() => { ctx.ensureCollaborators() }, [ctx.ensureCollaborators])
  return {
    collaborators: ctx.collaborators,
    loading: ctx.collaboratorsLoading,
    upsertCollaborator: ctx.upsertCollaborator,
    removeCollaborator: ctx.removeCollaborator,
  }
}

export function useCases() {
  const ctx = useDataContext()
  useEffect(() => { ctx.ensureCases() }, [ctx.ensureCases])
  return {
    cases: ctx.cases,
    loading: ctx.casesLoading,
    upsertCase: ctx.upsertCase,
    removeCase: ctx.removeCase,
  }
}
