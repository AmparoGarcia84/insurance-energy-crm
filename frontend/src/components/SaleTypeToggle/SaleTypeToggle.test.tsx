import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { SaleType } from '../../api/sales'
import SaleTypeToggle from './SaleTypeToggle'

describe('SaleTypeToggle', () => {
  it('renders with optional label', () => {
    render(
      <SaleTypeToggle
        value={SaleType.INSURANCE}
        onChange={vi.fn()}
        insuranceLabel="Insurance"
        energyLabel="Energy"
        label="Type"
      />
    )

    expect(screen.getByText('Type')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Insurance' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Energy' })).toBeInTheDocument()
  })

  it('calls onChange when switching type', async () => {
    const onChange = vi.fn()
    render(
      <SaleTypeToggle
        value={SaleType.INSURANCE}
        onChange={onChange}
        insuranceLabel="Insurance"
        energyLabel="Energy"
      />
    )

    await userEvent.click(screen.getByRole('button', { name: 'Energy' }))
    expect(onChange).toHaveBeenCalledWith(SaleType.ENERGY)
  })
})
