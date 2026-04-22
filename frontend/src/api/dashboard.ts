const BASE = `${import.meta.env.VITE_API_URL ?? 'http://localhost:3000'}/dashboard`

async function request<T>(url: string): Promise<T> {
  const res = await fetch(url, { credentials: 'include' })
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  return res.json()
}

export interface MonthKpis {
  toCollectAmount: number
  collectedAmount: number
  newSalesCount: number
  newClientsCount: number
}

export interface DashboardActivity {
  id: string
  type: string
  subject: string
  activityAt: string
  clientName: string | null
  saleTitle: string | null
  userName: string | null
}

export interface DashboardTask {
  id: string
  subject: string
  priority: string
  dueDate: string | null
  clientName: string | null
  assignedToName: string | null
}

export interface DashboardSummary {
  thisMonth: MonthKpis
  lastMonth: MonthKpis
  delta: {
    toCollectAmount: number | null
    collectedAmount: number | null
    newSalesCount: number | null
    newClientsCount: number | null
  }
  pipeline: {
    openCount: number
    openValue: number
    insuranceOpenCount: number
    energyOpenCount: number
  }
  recentActivities: DashboardActivity[]
  pendingTasks: DashboardTask[]
}

export function getDashboardSummary(): Promise<DashboardSummary> {
  return request<DashboardSummary>(`${BASE}/summary`)
}
