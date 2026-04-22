import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { I18nextProvider } from 'react-i18next'
import i18n from '../../../i18n'
import ActivityCard from './ActivityCard'
import { ActivityType } from '../../../api/activities'
import type { ActivityWithRelations } from '../../../api/activities'

const STUB: ActivityWithRelations = {
  id:          'act-001',
  userId:      'u-1',
  clientId:    'c-1',
  saleId:      undefined,
  type:        ActivityType.CALL,
  direction:   undefined,
  subject:     'Initial call',
  description: undefined,
  outcome:     undefined,
  nextStep:    undefined,
  activityAt:  '2026-04-22T10:00:00.000Z',
  createdAt:   '2026-04-22T10:00:00.000Z',
  updatedAt:   '2026-04-22T10:00:00.000Z',
  user:        { id: 'u-1', displayName: 'Mila' },
}

function renderCard(
  overrides: Partial<ActivityWithRelations> = {},
  options: { canDelete?: boolean } = {}
) {
  const activity = { ...STUB, ...overrides }
  const onEdit   = vi.fn()
  const onDelete = vi.fn()
  const result = render(
    <I18nextProvider i18n={i18n}>
      <ul>
        <ActivityCard
          activity={activity}
          canDelete={options.canDelete ?? true}
          onEdit={onEdit}
          onDelete={onDelete}
        />
      </ul>
    </I18nextProvider>
  )
  return { ...result, onEdit, onDelete }
}

describe('ActivityCard', () => {
  it('renders the activity subject', () => {
    renderCard()
    expect(screen.getByText('Initial call')).toBeInTheDocument()
  })

  it('renders the formatted date', () => {
    renderCard()
    // date should be present somewhere in the card
    expect(screen.getByText(/2026/)).toBeInTheDocument()
  })

  it('renders the user display name', () => {
    renderCard()
    expect(screen.getByText('Mila')).toBeInTheDocument()
  })

  it('renders description when present', () => {
    renderCard({ description: 'Discussed renewal options' })
    expect(screen.getByText('Discussed renewal options')).toBeInTheDocument()
  })

  it('does not render description when absent', () => {
    renderCard({ description: undefined })
    expect(screen.queryByText('Discussed renewal options')).not.toBeInTheDocument()
  })

  it('renders outcome when present', () => {
    renderCard({ outcome: 'Agreed to follow up' })
    expect(screen.getByText(/Agreed to follow up/)).toBeInTheDocument()
  })

  it('renders nextStep when present', () => {
    renderCard({ nextStep: 'Send quote by Friday' })
    expect(screen.getByText(/Send quote by Friday/)).toBeInTheDocument()
  })

  it('calls onEdit when the edit button is clicked', () => {
    const { onEdit } = renderCard()
    fireEvent.click(screen.getByTitle(/editar|edit/i))
    expect(onEdit).toHaveBeenCalledWith(STUB)
  })

  it('shows delete button when canDelete is true', () => {
    renderCard({}, { canDelete: true })
    expect(screen.getByTitle(/eliminar|delete/i)).toBeInTheDocument()
  })

  it('hides delete button when canDelete is false', () => {
    renderCard({}, { canDelete: false })
    expect(screen.queryByTitle(/eliminar|delete/i)).not.toBeInTheDocument()
  })

  it('calls onDelete when the delete button is clicked', () => {
    const { onDelete } = renderCard({}, { canDelete: true })
    fireEvent.click(screen.getByTitle(/eliminar|delete/i))
    expect(onDelete).toHaveBeenCalledWith(STUB)
  })
})
