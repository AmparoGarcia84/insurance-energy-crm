/**
 * validators.ts — Shared input validators
 *
 * Pure functions with no side effects — safe to use in services, controllers
 * and tests alike.
 */

// ── CIF (Spanish company tax identifier) ─────────────────────────────────────

/**
 * Validates a Spanish CIF.
 *
 * Format: one letter + 7 digits + one control character (digit or letter A-J).
 * The first letter determines whether the control character is a digit or a letter.
 *
 * Letters that always use a letter as the control character: K, P, Q, S
 * Letters that always use a digit as the control character: none (determined by
 * the calculation result — but K/P/Q/S force letter, A/B/C/D/E/F/G/H/J/U/V/W
 * accept both; the standard says K/P/Q/S must use letter, rest can use either).
 *
 * Returns true when the CIF is structurally valid.
 */
export function isValidCIF(value: string): boolean {
  const cif = value.trim().toUpperCase()

  // Basic format check
  if (!/^[ABCDEFGHJKLMNPQRSUVW]\d{7}[0-9A-J]$/.test(cif)) return false

  const digits = cif.slice(1, 8)
  const control = cif.slice(-1)
  const firstLetter = cif[0]

  // Sum odd-position digits (1-indexed: positions 1, 3, 5, 7 → indices 0, 2, 4, 6)
  let oddSum = 0
  for (let i = 0; i < 7; i += 2) {
    oddSum += parseInt(digits[i], 10)
  }

  // Sum even-position digits doubled (positions 2, 4, 6 → indices 1, 3, 5)
  // If doubled value ≥ 10, add its digits (e.g. 8×2=16 → 1+6=7)
  let evenSum = 0
  for (let i = 1; i < 7; i += 2) {
    const doubled = parseInt(digits[i], 10) * 2
    evenSum += doubled >= 10 ? Math.floor(doubled / 10) + (doubled % 10) : doubled
  }

  const total = oddSum + evenSum
  const remainder = total % 10
  const expectedDigit = remainder === 0 ? 0 : 10 - remainder
  // Letter control: A=1, B=2, ..., J=0 (where J maps to expectedDigit === 0)
  const expectedLetter = 'JABCDEFGHI'[expectedDigit]

  // K, P, Q, S → control must be a letter
  if ('KPQS'.includes(firstLetter)) return control === expectedLetter
  // N, R → control must be a digit
  if ('NR'.includes(firstLetter)) return control === String(expectedDigit)
  // All others accept either letter or digit
  return control === expectedLetter || control === String(expectedDigit)
}
