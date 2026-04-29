import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Routes, Route, useNavigate, useParams } from 'react-router-dom'
import { Plus } from 'lucide-react'
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  useDroppable,
  useDraggable,
  type DragStartEvent,
  type DragEndEvent,
} from '@dnd-kit/core'
import { CSS } from '@dnd-kit/utilities'
import { useAuth } from '../../../auth/AuthContext'
import SaleCard from '../SaleCard/SaleCard'
import SaleForm from '../SaleForm/SaleForm'
import SaleDetail from '../SaleDetail/SaleDetail'
import SaleTypeToggle from '../SaleTypeToggle/SaleTypeToggle'
import type { Sale } from '../../../api/sales'
import {
  SaleType,
  InsuranceSaleStage,
  EnergySaleStage,
  INSURANCE_STAGES,
  ENERGY_STAGES,
  INSURANCE_STAGE_COLORS,
  ENERGY_STAGE_COLORS,
  updateSale,
} from '../../../api/sales'
import { useSales } from '../../../context/DataContext'
import './Sales.css'

// ── Draggable sale card wrapper ────────────────────────────────────────────────

interface DraggableCardProps {
  sale:      Sale
  ownerName: string
  isDragging: boolean
  onClick:   (sale: Sale) => void
}

function DraggableSaleCard({ sale, ownerName, isDragging, onClick }: DraggableCardProps) {
  const { attributes, listeners, setNodeRef, transform } = useDraggable({
    id:   sale.id,
    data: { saleType: sale.type, insuranceStage: sale.insuranceStage, energyStage: sale.energyStage },
  })

  const style: React.CSSProperties = {
    transform: CSS.Translate.toString(transform),
    opacity:   isDragging ? 0.35 : 1,
  }

  return (
    <div ref={setNodeRef} style={style} {...listeners} {...attributes}>
      <SaleCard sale={sale} ownerName={ownerName} onClick={onClick} />
    </div>
  )
}

// ── Droppable kanban column ────────────────────────────────────────────────────

interface ColumnProps {
  stage:      InsuranceSaleStage | EnergySaleStage
  color:      string
  label:      string
  sales:      Sale[]
  total:      number
  totalLabel: string
  ownerName:  string
  draggingId: string | null
  onClickSale: (sale: Sale) => void
}

function SalesColumn({ stage, color, label, sales, total, totalLabel, ownerName, draggingId, onClickSale }: ColumnProps) {
  const { t }                  = useTranslation()
  const { setNodeRef, isOver } = useDroppable({ id: stage })

  return (
    <div
      ref={setNodeRef}
      className={`sales-column${isOver ? ' sales-column--over' : ''}`}
      style={{ '--column-color': color } as React.CSSProperties}
    >
      <div className="sales-column__header">
        <span className="sales-column__name">{label}</span>
        <span className="sales-column__count">
          {t('sales.opportunitiesCount', { count: sales.length })}
        </span>
        {total > 0 && (
          <span className="sales-column__total">
            {total.toLocaleString('es-ES')} {totalLabel}
          </span>
        )}
      </div>

      <div className="sales-column__cards">
        {sales.map((sale) => (
          <DraggableSaleCard
            key={sale.id}
            sale={sale}
            ownerName={ownerName}
            isDragging={sale.id === draggingId}
            onClick={onClickSale}
          />
        ))}
      </div>
    </div>
  )
}

// ── /sales (board) ─────────────────────────────────────────────────────────────

function SalesBoardPage() {
  const { t }      = useTranslation()
  const { user }   = useAuth()
  const navigate   = useNavigate()
  const ownerName  = user?.displayName ?? ''

  const [saleType, setSaleType] = useState<SaleType>(SaleType.INSURANCE)
  const { sales, loading: salesLoading, upsertSale } = useSales()
  const displaySales = salesLoading ? [] : sales

  const [draggingId, setDraggingId] = useState<string | null>(null)

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } })
  )

  const filtered    = displaySales.filter((s) => s.type === saleType)
  const stages      = saleType === SaleType.INSURANCE ? INSURANCE_STAGES : ENERGY_STAGES
  const stageColors = saleType === SaleType.INSURANCE ? INSURANCE_STAGE_COLORS : ENERGY_STAGE_COLORS

  function stageLabel(stage: InsuranceSaleStage | EnergySaleStage): string {
    return saleType === SaleType.INSURANCE
      ? t(`sales.stages.insurance.${stage}`)
      : t(`sales.stages.energy.${stage}`)
  }

  function columnSales(stage: InsuranceSaleStage | EnergySaleStage): Sale[] {
    return saleType === SaleType.INSURANCE
      ? filtered.filter((s) => s.insuranceStage === stage)
      : filtered.filter((s) => s.energyStage    === stage)
  }

  function columnTotal(stageSales: Sale[]): number {
    const key = saleType === SaleType.INSURANCE ? 'expectedRevenue' : 'expectedSavingsPerYear'
    return stageSales.reduce((sum, s) => sum + (s[key] ?? 0), 0)
  }

  function totalLabel(): string {
    return saleType === SaleType.INSURANCE ? '€' : t('sales.card.savingsPerYear')
  }

  function handleDragStart(event: DragStartEvent) {
    setDraggingId(event.active.id as string)
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    setDraggingId(null)

    if (!over) return
    const saleId   = active.id as string
    const newStage = over.id as InsuranceSaleStage | EnergySaleStage
    const sale     = displaySales.find((s) => s.id === saleId)
    if (!sale) return

    const currentStage = saleType === SaleType.INSURANCE ? sale.insuranceStage : sale.energyStage
    if (currentStage === newStage) return

    const stageField = saleType === SaleType.INSURANCE ? 'insuranceStage' : 'energyStage'

    upsertSale({ ...sale, [stageField]: newStage })

    updateSale(saleId, { [stageField]: newStage }).then(upsertSale).catch(() => {
      upsertSale(sale)
    })
  }

  const draggingSale = draggingId ? displaySales.find((s) => s.id === draggingId) : null

  return (
    <div className="sales">
      <div className="page-header">
        <h1 className="page-title">{t('sales.title')}</h1>
        <button className="btn-primary" onClick={() => navigate('/sales/new')}>
          <Plus size={16} />
          {t('sales.new')}
        </button>
      </div>

      <SaleTypeToggle
        value={saleType}
        onChange={setSaleType}
        insuranceLabel={t('sales.toggleInsurance')}
        energyLabel={t('sales.toggleEnergy')}
      />

      <DndContext
        sensors={sensors}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div className="sales-board">
          {(stages as (InsuranceSaleStage | EnergySaleStage)[]).map((stage) => {
            const stageSales = columnSales(stage)
            const total      = columnTotal(stageSales)
            const color      = (stageColors as Record<string, string>)[stage]

            return (
              <SalesColumn
                key={stage}
                stage={stage}
                color={color}
                label={stageLabel(stage)}
                sales={stageSales}
                total={total}
                totalLabel={totalLabel()}
                ownerName={ownerName}
                draggingId={draggingId}
                onClickSale={(s) => navigate(`/sales/${s.id}`)}
              />
            )
          })}
        </div>

        <DragOverlay>
          {draggingSale && (
            <div className="sales-card-overlay">
              <SaleCard
                sale={draggingSale}
                ownerName={ownerName}
                onClick={() => {/* overlay only */}}
              />
            </div>
          )}
        </DragOverlay>
      </DndContext>
    </div>
  )
}

// ── /sales/:saleId (detail) ────────────────────────────────────────────────────

function SaleDetailPage() {
  const { saleId } = useParams<{ saleId: string }>()
  const navigate   = useNavigate()
  const { sales }  = useSales()

  const sale = sales.find((s) => s.id === saleId)
  if (!sale) return null

  return (
    <SaleDetail
      sale={sale}
      onBack={() => navigate(-1)}
      onEdit={() => navigate(`/sales/${saleId}/edit`)}
      onViewClient={(clientId) => navigate(`/clients/${clientId}`)}
    />
  )
}

// ── /sales/new  and  /sales/:saleId/edit (form) ───────────────────────────────

function SaleFormPage() {
  const { saleId } = useParams<{ saleId?: string }>()
  const navigate   = useNavigate()
  const { sales, upsertSale, removeSale } = useSales()

  const existing = saleId ? sales.find((s) => s.id === saleId) ?? null : null

  return (
    <SaleForm
      sale={existing}
      onSave={(saved) => {
        upsertSale(saved)
        navigate(`/sales/${saved.id}`)
      }}
      onCancel={() => navigate(-1)}
      onDelete={(id) => { removeSale(id); navigate('/sales') }}
    />
  )
}

// ── Module router ─────────────────────────────────────────────────────────────

export default function Sales() {
  return (
    <Routes>
      <Route index element={<SalesBoardPage />} />
      <Route path="new" element={<SaleFormPage />} />
      <Route path=":saleId" element={<SaleDetailPage />} />
      <Route path=":saleId/edit" element={<SaleFormPage />} />
    </Routes>
  )
}
