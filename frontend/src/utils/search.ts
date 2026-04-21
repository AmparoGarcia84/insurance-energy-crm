/**
 * Normalises a string for search comparison:
 * lowercases and strips diacritics so that, e.g.,
 * "García" matches "garcia", "GARCÍA", "garciá", etc.
 */
export function normalizeSearch(str: string): string {
  return str
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
}
