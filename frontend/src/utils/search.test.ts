import { describe, it, expect } from 'vitest'
import { normalizeSearch } from './search'

describe('normalizeSearch', () => {
  it('lowercases the string', () => {
    expect(normalizeSearch('GARCÍA')).toBe('garcia')
  })

  it('strips diacritics', () => {
    expect(normalizeSearch('garcía')).toBe('garcia')
    expect(normalizeSearch('José')).toBe('jose')
    expect(normalizeSearch('Martínez')).toBe('martinez')
    expect(normalizeSearch('Ángel')).toBe('angel')
    expect(normalizeSearch('añadir')).toBe('anadir')
  })

  it('handles strings without diacritics unchanged (after lowercase)', () => {
    expect(normalizeSearch('hola')).toBe('hola')
    expect(normalizeSearch('Ana Lopez')).toBe('ana lopez')
  })

  it('returns empty string for empty input', () => {
    expect(normalizeSearch('')).toBe('')
  })
})
