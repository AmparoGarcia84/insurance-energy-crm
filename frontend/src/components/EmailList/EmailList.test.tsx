import { render, screen, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi } from 'vitest'
import { EmailType } from '@crm/shared'
import EmailList from './EmailList'

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}))

describe('EmailList', () => {
  it('renders the add button when empty', () => {
    render(<EmailList value={[]} onChange={vi.fn()} />)
    expect(screen.getByRole('button', { name: /emailAddress\.add/i })).toBeInTheDocument()
  })

  it('renders one card per email', () => {
    render(
      <EmailList
        value={[
          { type: EmailType.PERSONAL, address: 'personal@example.com', isPrimary: true },
          { type: EmailType.BUSINESS, address: 'work@company.com', isPrimary: false },
        ]}
        onChange={vi.fn()}
      />
    )
    expect(screen.getAllByRole('combobox')).toHaveLength(2)
    expect(screen.getByDisplayValue('personal@example.com')).toBeInTheDocument()
    expect(screen.getByDisplayValue('work@company.com')).toBeInTheDocument()
  })

  it('calls onChange with a new empty entry when add is clicked', async () => {
    const onChange = vi.fn()
    render(<EmailList value={[]} onChange={onChange} />)
    await userEvent.click(screen.getByRole('button', { name: /emailAddress\.add/i }))
    expect(onChange).toHaveBeenCalledWith([
      { type: EmailType.PERSONAL, address: '', isPrimary: false, label: '' },
    ])
  })

  it('calls onChange without the removed entry when remove is clicked', async () => {
    const onChange = vi.fn()
    render(
      <EmailList
        value={[
          { type: EmailType.PERSONAL, address: 'a@a.com', isPrimary: false },
          { type: EmailType.BUSINESS, address: 'b@b.com', isPrimary: false },
        ]}
        onChange={onChange}
      />
    )
    const removeButtons = screen.getAllByRole('button', { name: /emailAddress\.remove/i })
    await userEvent.click(removeButtons[0])
    expect(onChange).toHaveBeenCalledWith([
      { type: EmailType.BUSINESS, address: 'b@b.com', isPrimary: false },
    ])
  })

  it('promotes first remaining entry to primary when the primary entry is removed', async () => {
    const onChange = vi.fn()
    render(
      <EmailList
        value={[
          { type: EmailType.PERSONAL, address: 'a@a.com', isPrimary: true },
          { type: EmailType.BUSINESS, address: 'b@b.com', isPrimary: false },
        ]}
        onChange={onChange}
      />
    )
    const removeButtons = screen.getAllByRole('button', { name: /emailAddress\.remove/i })
    await userEvent.click(removeButtons[0])
    expect(onChange).toHaveBeenCalledWith([
      { type: EmailType.BUSINESS, address: 'b@b.com', isPrimary: true },
    ])
  })

  it('clears isPrimary on other entries when one is set as primary', async () => {
    const onChange = vi.fn()
    render(
      <EmailList
        value={[
          { type: EmailType.PERSONAL, address: 'a@a.com', isPrimary: true },
          { type: EmailType.BUSINESS, address: 'b@b.com', isPrimary: false },
        ]}
        onChange={onChange}
      />
    )
    const checkboxes = screen.getAllByRole('checkbox')
    await userEvent.click(checkboxes[1])
    expect(onChange).toHaveBeenCalledWith([
      expect.objectContaining({ address: 'a@a.com', isPrimary: false }),
      expect.objectContaining({ address: 'b@b.com', isPrimary: true }),
    ])
  })

  it('calls onChange with updated type when type select changes', async () => {
    const onChange = vi.fn()
    render(
      <EmailList
        value={[{ type: EmailType.PERSONAL, address: 'a@a.com', isPrimary: false }]}
        onChange={onChange}
      />
    )
    await userEvent.selectOptions(screen.getByRole('combobox'), EmailType.BUSINESS)
    expect(onChange).toHaveBeenCalledWith([
      expect.objectContaining({ type: EmailType.BUSINESS }),
    ])
  })

  it('calls onChange with updated address when field changes', async () => {
    const onChange = vi.fn()
    render(
      <EmailList
        value={[{ type: EmailType.PERSONAL, address: '', isPrimary: false }]}
        onChange={onChange}
      />
    )
    await userEvent.type(screen.getByLabelText(/emailAddress\.address/i), 'x')
    expect(onChange).toHaveBeenLastCalledWith([
      expect.objectContaining({ address: 'x' }),
    ])
  })

  it('shows no error for a valid email on blur', () => {
    render(
      <EmailList
        value={[{ type: EmailType.PERSONAL, address: 'valid@example.com', isPrimary: false }]}
        onChange={vi.fn()}
      />
    )
    fireEvent.blur(screen.getByLabelText(/emailAddress\.address/i), {
      target: { value: 'valid@example.com' },
    })
    expect(screen.queryByText('validation.email')).not.toBeInTheDocument()
  })

  it('shows error for an invalid email on blur', () => {
    render(
      <EmailList
        value={[{ type: EmailType.PERSONAL, address: 'not-an-email', isPrimary: false }]}
        onChange={vi.fn()}
      />
    )
    fireEvent.blur(screen.getByLabelText(/emailAddress\.address/i), {
      target: { value: 'not-an-email' },
    })
    expect(screen.getByText('validation.email')).toBeInTheDocument()
  })

  it('clears error when address field is empty on blur', () => {
    render(
      <EmailList
        value={[{ type: EmailType.PERSONAL, address: '', isPrimary: false }]}
        onChange={vi.fn()}
      />
    )
    fireEvent.blur(screen.getByLabelText(/emailAddress\.address/i), {
      target: { value: '' },
    })
    expect(screen.queryByText('validation.email')).not.toBeInTheDocument()
  })
})
