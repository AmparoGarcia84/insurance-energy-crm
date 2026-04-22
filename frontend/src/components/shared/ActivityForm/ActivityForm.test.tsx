import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { I18nextProvider } from 'react-i18next'
import i18n from '../../../i18n'
import ActivityForm from './ActivityForm'
import type { ActivityWithRelations } from '../../../api/activities'
import { ActivityType } from '../../../api/activities'

const STUB_ACTIVITY: ActivityWithRelations = {
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
  activityAt:  '2026-04-21T10:00:00.000Z',
  createdAt:   '2026-04-21T10:00:00.000Z',
  updatedAt:   '2026-04-21T10:00:00.000Z',
}

function renderForm(props?: Partial<React.ComponentProps<typeof ActivityForm>>) {
  const onSave   = vi.fn()
  const onCancel = vi.fn()
  const onSubmit = vi.fn().mockResolvedValue(STUB_ACTIVITY)

  render(
    <I18nextProvider i18n={i18n}>
      <ActivityForm
        clientId="c-1"
        onSave={onSave}
        onCancel={onCancel}
        onSubmit={onSubmit}
        {...props}
      />
    </I18nextProvider>
  )

  return { onSave, onCancel, onSubmit }
}

beforeEach(() => vi.clearAllMocks())

describe('ActivityForm', () => {
  it('renders form fields', () => {
    renderForm()
    expect(screen.getByLabelText(/asunto|subject/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/tipo|type/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/fecha|date/i)).toBeInTheDocument()
  })

  it('disables save when subject is empty', () => {
    renderForm()
    const saveBtn = screen.getByRole('button', { name: /guardar|save/i })
    expect(saveBtn).toBeDisabled()
  })

  it('enables save when subject is filled', () => {
    renderForm()
    fireEvent.change(screen.getByLabelText(/asunto|subject/i), { target: { value: 'Test call' } })
    const saveBtn = screen.getByRole('button', { name: /guardar|save/i })
    expect(saveBtn).not.toBeDisabled()
  })

  it('calls onCancel when cancel button is clicked', () => {
    const { onCancel } = renderForm()
    fireEvent.click(screen.getByRole('button', { name: /cancelar|cancel/i }))
    expect(onCancel).toHaveBeenCalledOnce()
  })

  it('calls onSubmit with correct payload on save', async () => {
    const { onSubmit, onSave } = renderForm()
    fireEvent.change(screen.getByLabelText(/asunto|subject/i), { target: { value: 'Test call' } })
    fireEvent.click(screen.getByRole('button', { name: /guardar|save/i }))

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledWith(
        expect.objectContaining({
          clientId: 'c-1',
          type:     ActivityType.CALL,
          subject:  'Test call',
        })
      )
      expect(onSave).toHaveBeenCalledWith(STUB_ACTIVITY)
    })
  })

  it('pre-fills fields when editing an existing activity', () => {
    renderForm({ initial: STUB_ACTIVITY })
    expect(screen.getByLabelText<HTMLInputElement>(/asunto|subject/i).value).toBe('Initial call')
  })

  it('shows error when submission fails', async () => {
    const onSubmit = vi.fn().mockRejectedValue(new Error('Network error'))
    const { onSave } = renderForm({ onSubmit })

    fireEvent.change(screen.getByLabelText(/asunto|subject/i), { target: { value: 'x' } })
    fireEvent.click(screen.getByRole('button', { name: /guardar|save/i }))

    await waitFor(() => {
      expect(screen.getByText(/error/i)).toBeInTheDocument()
      expect(onSave).not.toHaveBeenCalled()
    })
  })
})
