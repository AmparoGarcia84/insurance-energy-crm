import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import Home from './Home'
import type { DashboardSummary } from '../../../api/dashboard'

// ── Mocks ─────────────────────────────────────────────────────────────────────

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, opts?: Record<string, unknown>) => {
      const map: Record<string, string> = {
        'home.greeting':                    'Bienvenida',
        'home.loadingError':                'No se pudo cargar el resumen',
        'home.kpi.toCollect':               'A cobrar este mes',
        'home.kpi.collected':               'Cobrado este mes',
        'home.kpi.newSales':                'Nuevas ventas',
        'home.kpi.newClients':              'Nuevos clientes',
        'home.kpi.vsLastMonth':             'vs mes anterior',
        'home.kpi.noComparison':            'Sin datos mes anterior',
        'home.pipeline.title':              'Pipeline activo',
        'home.pipeline.empty':              'Sin oportunidades abiertas',
        'home.pipeline.insurance':          'Seguros',
        'home.pipeline.energy':             'Energía',
        'home.pipeline.openValue':          'Valor estimado',
        'home.recentActivity.title':        'Actividad reciente',
        'home.recentActivity.empty':        'Sin actividad registrada',
        'home.pendingTasks.title':          'Tareas pendientes',
        'home.pendingTasks.empty':          'Sin tareas pendientes',
        'home.pendingTasks.overdue':        'Vencida',
        'home.pendingTasks.noDueDate':      'Sin fecha',
        'home.activityType.CALL':           'Llamada',
        'home.activityType.EMAIL':          'Email',
      }
      if (key === 'home.pipeline.openSales' && opts) return `${opts.count} oportunidades abiertas`
      return map[key] ?? key
    },
  }),
}))

vi.mock('../../../auth/AuthContext', () => ({
  useAuth: () => ({ user: { displayName: 'Mila García', role: 'OWNER' } }),
}))

const mockGetDashboardSummary = vi.fn()
vi.mock('../../../api/dashboard', () => ({
  getDashboardSummary: (...args: unknown[]) => mockGetDashboardSummary(...args),
}))

// ── Fixtures ──────────────────────────────────────────────────────────────────

const emptySummary: DashboardSummary = {
  thisMonth: { toCollectAmount: 0, collectedAmount: 0, newSalesCount: 0, newClientsCount: 0 },
  lastMonth: { toCollectAmount: 0, collectedAmount: 0, newSalesCount: 0, newClientsCount: 0 },
  delta: { toCollectAmount: null, collectedAmount: null, newSalesCount: null, newClientsCount: null },
  pipeline: { openCount: 0, openValue: 0, insuranceOpenCount: 0, energyOpenCount: 0 },
  recentActivities: [],
  pendingTasks: [],
}

const fullSummary: DashboardSummary = {
  thisMonth: { toCollectAmount: 12500, collectedAmount: 4200, newSalesCount: 7, newClientsCount: 3 },
  lastMonth: { toCollectAmount: 10000, collectedAmount: 3000, newSalesCount: 5, newClientsCount: 2 },
  delta: { toCollectAmount: 25, collectedAmount: 40, newSalesCount: 40, newClientsCount: 50 },
  pipeline: { openCount: 14, openValue: 85000, insuranceOpenCount: 10, energyOpenCount: 4 },
  recentActivities: [
    {
      id: 'a-1',
      type: 'CALL',
      subject: 'Seguimiento póliza hogar',
      activityAt: new Date().toISOString(),
      clientName: 'Ana Martínez',
      saleTitle: null,
      userName: 'Mila García',
    },
    {
      id: 'a-2',
      type: 'EMAIL',
      subject: 'Envío documentación',
      activityAt: new Date().toISOString(),
      clientName: 'Carlos López',
      saleTitle: null,
      userName: 'Mila García',
    },
  ],
  pendingTasks: [
    {
      id: 't-1',
      subject: 'Llamar cliente para renovación',
      priority: 'HIGH',
      dueDate: new Date(Date.now() + 86400000).toISOString(),
      clientName: 'Ana Martínez',
      assignedToName: 'Mila García',
    },
    {
      id: 't-2',
      subject: 'Enviar presupuesto energía',
      priority: 'NORMAL',
      dueDate: null,
      clientName: null,
      assignedToName: null,
    },
  ],
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('Home', () => {
  beforeEach(() => {
    mockGetDashboardSummary.mockReset()
  })

  it('shows loading spinner while fetching', () => {
    mockGetDashboardSummary.mockReturnValue(new Promise(() => {}))
    render(<Home />)
    expect(document.querySelector('.home-loading__spinner')).toBeTruthy()
  })

  it('shows error state when fetch fails', async () => {
    mockGetDashboardSummary.mockRejectedValue(new Error('network'))
    render(<Home />)
    await waitFor(() => {
      expect(screen.getByText('No se pudo cargar el resumen')).toBeInTheDocument()
    })
  })

  it('renders greeting with user first name', async () => {
    mockGetDashboardSummary.mockResolvedValue(emptySummary)
    render(<Home />)
    await waitFor(() => {
      expect(screen.getByText(/Bienvenida, Mila/)).toBeInTheDocument()
    })
  })

  it('renders all four KPI card labels', async () => {
    mockGetDashboardSummary.mockResolvedValue(emptySummary)
    render(<Home />)
    await waitFor(() => {
      expect(screen.getByText('A cobrar este mes')).toBeInTheDocument()
      expect(screen.getByText('Cobrado este mes')).toBeInTheDocument()
      expect(screen.getByText('Nuevas ventas')).toBeInTheDocument()
      expect(screen.getByText('Nuevos clientes')).toBeInTheDocument()
    })
  })

  it('renders formatted amounts in KPI cards', async () => {
    mockGetDashboardSummary.mockResolvedValue(fullSummary)
    render(<Home />)
    await waitFor(() => {
      // Amounts rendered as formatted strings — use partial match via getAllByRole container
      const valueEls = document.querySelectorAll('.home-kpi-card__value')
      const texts = Array.from(valueEls).map(el => el.textContent ?? '')
      expect(texts.some(t => t.includes('12'))).toBe(true)
      expect(texts.some(t => t.includes('4'))).toBe(true)
    })
  })

  it('shows delta percentage when available', async () => {
    mockGetDashboardSummary.mockResolvedValue(fullSummary)
    render(<Home />)
    await waitFor(() => {
      expect(screen.getByText(/\+25% vs mes anterior/)).toBeInTheDocument()
    })
  })

  it('shows "no comparison" label when delta is null', async () => {
    mockGetDashboardSummary.mockResolvedValue(emptySummary)
    render(<Home />)
    await waitFor(() => {
      const noData = screen.getAllByText('Sin datos mes anterior')
      expect(noData.length).toBeGreaterThan(0)
    })
  })

  it('renders pipeline with insurance and energy counts', async () => {
    mockGetDashboardSummary.mockResolvedValue(fullSummary)
    render(<Home />)
    await waitFor(() => {
      expect(screen.getByText('14 oportunidades abiertas')).toBeInTheDocument()
      expect(screen.getByText('Seguros')).toBeInTheDocument()
      expect(screen.getByText('Energía')).toBeInTheDocument()
    })
  })

  it('shows empty state for pipeline when no open sales', async () => {
    mockGetDashboardSummary.mockResolvedValue(emptySummary)
    render(<Home />)
    await waitFor(() => {
      expect(screen.getByText('Sin oportunidades abiertas')).toBeInTheDocument()
    })
  })

  it('renders recent activities', async () => {
    mockGetDashboardSummary.mockResolvedValue(fullSummary)
    render(<Home />)
    await waitFor(() => {
      // Subject text lives in a <span class="home-activity-item__subject">
      const subjectEls = document.querySelectorAll('.alc__subject')
      const texts = Array.from(subjectEls).map(el => el.textContent ?? '')
      expect(texts.some(t => t.includes('Seguimiento póliza hogar'))).toBe(true)
      expect(texts.some(t => t.includes('Envío documentación'))).toBe(true)
    })
  })

  it('shows empty state for activities when none exist', async () => {
    mockGetDashboardSummary.mockResolvedValue(emptySummary)
    render(<Home />)
    await waitFor(() => {
      expect(screen.getByText('Sin actividad registrada')).toBeInTheDocument()
    })
  })

  it('renders pending tasks', async () => {
    mockGetDashboardSummary.mockResolvedValue(fullSummary)
    render(<Home />)
    await waitFor(() => {
      expect(screen.getByText('Llamar cliente para renovación')).toBeInTheDocument()
      expect(screen.getByText('Enviar presupuesto energía')).toBeInTheDocument()
    })
  })

  it('shows "no due date" label for tasks without dueDate', async () => {
    mockGetDashboardSummary.mockResolvedValue(fullSummary)
    render(<Home />)
    await waitFor(() => {
      expect(screen.getByText('Sin fecha')).toBeInTheDocument()
    })
  })

  it('shows empty state for tasks when none exist', async () => {
    mockGetDashboardSummary.mockResolvedValue(emptySummary)
    render(<Home />)
    await waitFor(() => {
      expect(screen.getByText('Sin tareas pendientes')).toBeInTheDocument()
    })
  })
})
