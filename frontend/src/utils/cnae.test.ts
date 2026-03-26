import { describe, it, expect } from 'vitest'
import { ClientActivity } from '@crm/shared'
import { ACTIVITY_CNAE } from './cnae'

describe('ACTIVITY_CNAE', () => {
  it('maps known activities to 4-digit CNAE codes', () => {
    expect(ACTIVITY_CNAE[ClientActivity.LAW_FIRM]).toBe('6910')
    expect(ACTIVITY_CNAE[ClientActivity.TAX_ADVISORY]).toBe('6920')
    expect(ACTIVITY_CNAE[ClientActivity.ELECTRICIAN]).toBe('4321')
    expect(ACTIVITY_CNAE[ClientActivity.HOSPITALITY]).toBe('5610')
    expect(ACTIVITY_CNAE[ClientActivity.MECHANICS]).toBe('4520')
  })

  it('all mapped codes are exactly 4 digits', () => {
    for (const code of Object.values(ACTIVITY_CNAE)) {
      expect(code).toMatch(/^\d{4}$/)
    }
  })

  it('returns undefined for activities with no CNAE', () => {
    expect(ACTIVITY_CNAE[ClientActivity.PENSIONERS_AND_RETIRED]).toBeUndefined()
    expect(ACTIVITY_CNAE[ClientActivity.NOT_SPECIFIED]).toBeUndefined()
  })
})
