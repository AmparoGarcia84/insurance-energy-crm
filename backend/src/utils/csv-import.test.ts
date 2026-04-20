import { describe, it, expect } from 'vitest'
import {
  parseCSV,
  col,
  parseDate,
  parseIBAN,
  mapType,
  mapStatus,
  mapQualification,
  mapCollectionManager,
  mapAddressType,
} from './csv-import.js'

// ─── parseCSV ────────────────────────────────────────────────────────────────

describe('parseCSV', () => {
  it('parses a simple single-row CSV', () => {
    const result = parseCSV('a,b,c')
    expect(result).toEqual([['a', 'b', 'c']])
  })

  it('parses multiple rows separated by LF', () => {
    const result = parseCSV('a,b\nc,d')
    expect(result).toEqual([['a', 'b'], ['c', 'd']])
  })

  it('parses multiple rows separated by CRLF', () => {
    const result = parseCSV('a,b\r\nc,d')
    expect(result).toEqual([['a', 'b'], ['c', 'd']])
  })

  it('handles quoted fields containing commas', () => {
    const result = parseCSV('"hello, world",b')
    expect(result).toEqual([['hello, world', 'b']])
  })

  it('handles escaped double quotes inside quoted fields', () => {
    const result = parseCSV('"say ""hi""",b')
    expect(result).toEqual([['say "hi"', 'b']])
  })

  it('returns an empty array for an empty string', () => {
    const result = parseCSV('')
    expect(result).toEqual([])
  })

  it('preserves empty fields between delimiters', () => {
    const result = parseCSV('a,,c')
    expect(result).toEqual([['a', '', 'c']])
  })
})

// ─── col ─────────────────────────────────────────────────────────────────────

describe('col', () => {
  it('returns trimmed value at the given index', () => {
    expect(col(['  foo  ', 'bar'], 0)).toBe('foo')
  })

  it('returns empty string for out-of-bounds index', () => {
    expect(col(['a'], 5)).toBe('')
  })

  it('returns empty string for undefined entry', () => {
    const row: string[] = []
    expect(col(row, 0)).toBe('')
  })
})

// ─── parseDate ───────────────────────────────────────────────────────────────

describe('parseDate', () => {
  it('parses a valid ISO date string', () => {
    const d = parseDate('2000-06-15')
    expect(d).toBeInstanceOf(Date)
    expect(d!.getFullYear()).toBe(2000)
  })

  it('returns null for empty string', () => {
    expect(parseDate('')).toBeNull()
  })

  it('returns null for the sentinel value 0000-00-00', () => {
    expect(parseDate('0000-00-00')).toBeNull()
  })

  it('returns null for the sentinel value 9999-01-01', () => {
    expect(parseDate('9999-01-01')).toBeNull()
  })

  it('returns null for an invalid date string', () => {
    expect(parseDate('not-a-date')).toBeNull()
  })
})

// ─── parseIBAN ───────────────────────────────────────────────────────────────

describe('parseIBAN', () => {
  it('returns a clean IBAN for a valid input', () => {
    expect(parseIBAN('ES76 2100 0418 6902 0005 1332')).toBe('ES76210004186902000513 32'.replace(/\s/g, ''))
  })

  it('strips internal spaces and uppercases', () => {
    const result = parseIBAN('es76 2100 0418 6902 0005 1332')
    expect(result).toBe('ES76210004186902000513 32'.replace(/\s/g, ''))
  })

  it('returns null for an empty string', () => {
    expect(parseIBAN('')).toBeNull()
  })

  it('returns null for a string that does not match IBAN format', () => {
    expect(parseIBAN('NOT-AN-IBAN')).toBeNull()
  })
})

// ─── mapType ─────────────────────────────────────────────────────────────────

describe('mapType', () => {
  it.each([
    ['Particular',  'INDIVIDUAL'],
    ['Empresa',     'COMPANY'],
    ['Autónomo',    'SELF_EMPLOYED'],
    ['Autonomo',    'SELF_EMPLOYED'],
    ['Pensionista', 'PENSIONER'],
    ['Jubilad@',    'RETIRED'],
    ['Colaborador', 'COLLABORATOR'],
    ['Proveedor',   'SUPPLIER'],
    ['Posible',     'PROSPECT'],
    ['CCPP',        'COMMUNITY_OF_OWNERS'],
  ])('maps "%s" → %s', (input, expected) => {
    expect(mapType(input)).toBe(expected)
  })

  it('returns undefined for an unknown value', () => {
    expect(mapType('Unknown')).toBeUndefined()
  })

  it('returns undefined for an empty string', () => {
    expect(mapType('')).toBeUndefined()
  })
})

// ─── mapStatus ───────────────────────────────────────────────────────────────

describe('mapStatus', () => {
  it.each([
    ['vigor',     'ACTIVE'],
    ['activo',    'ACTIVE'],
    ['active',    'ACTIVE'],
    ['prospect',  'PROSPECTING'],
    ['posible',   'PROSPECTING'],
    ['baja',      'INACTIVE'],
    ['inactive',  'INACTIVE'],
    ['captación', 'LEAD'],
    ['lead',      'LEAD'],
    ['perdido',   'LOST'],
    ['lost',      'LOST'],
  ])('maps "%s" → %s', (input, expected) => {
    expect(mapStatus(input)).toBe(expected)
  })

  it('returns undefined for an unknown value', () => {
    expect(mapStatus('nope')).toBeUndefined()
  })

  it('returns undefined for empty string', () => {
    expect(mapStatus('')).toBeUndefined()
  })
})

// ─── mapQualification ────────────────────────────────────────────────────────

describe('mapQualification', () => {
  it('maps "Referencias BNI" → BNI_REFERRAL', () => {
    expect(mapQualification('Referencias BNI')).toBe('BNI_REFERRAL')
  })

  it('maps "Cartera" → PORTFOLIO', () => {
    expect(mapQualification('Cartera')).toBe('PORTFOLIO')
  })

  it('maps "Impago" → PAYMENT_DEFAULT', () => {
    expect(mapQualification('Impago')).toBe('PAYMENT_DEFAULT')
  })

  it('returns undefined for an unknown value', () => {
    expect(mapQualification('unknown')).toBeUndefined()
  })
})

// ─── mapCollectionManager ────────────────────────────────────────────────────

describe('mapCollectionManager', () => {
  it('maps "compañía" → INSURANCE_COMPANY', () => {
    expect(mapCollectionManager('compañía')).toBe('INSURANCE_COMPANY')
  })

  it('maps "transferencia" → BANK_TRANSFER', () => {
    expect(mapCollectionManager('transferencia')).toBe('BANK_TRANSFER')
  })

  it('maps "gexbrok" → BROKER', () => {
    expect(mapCollectionManager('gexbrok')).toBe('BROKER')
  })

  it('maps "tarjeta" → CARD_PAYMENT', () => {
    expect(mapCollectionManager('tarjeta')).toBe('CARD_PAYMENT')
  })

  it('maps "impago" → UNPAID', () => {
    expect(mapCollectionManager('impago')).toBe('UNPAID')
  })

  it('returns undefined for unknown value', () => {
    expect(mapCollectionManager('efectivo')).toBeUndefined()
  })
})

// ─── mapAddressType ──────────────────────────────────────────────────────────

describe('mapAddressType', () => {
  it('maps "fiscal" → FISCAL', () => {
    expect(mapAddressType('fiscal')).toBe('FISCAL')
  })

  it('maps "empresa" → BUSINESS', () => {
    expect(mapAddressType('empresa')).toBe('BUSINESS')
  })

  it('maps "negocio" → BUSINESS', () => {
    expect(mapAddressType('negocio')).toBe('BUSINESS')
  })

  it('defaults to PERSONAL for unknown types', () => {
    expect(mapAddressType('domicilio')).toBe('PERSONAL')
  })
})
