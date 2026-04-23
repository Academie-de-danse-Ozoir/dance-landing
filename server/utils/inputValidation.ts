const NAME_PATTERN = /^\p{L}[\p{L}\p{M}]*(?:[ '\-’][\p{L}\p{M}]+)*$/u
const SIMPLE_EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export function normalizeSingleLineText(value: unknown): string {
  return typeof value === 'string' ? value.trim().replace(/\s+/g, ' ') : ''
}

export function isValidPersonName(value: unknown): boolean {
  const normalized = normalizeSingleLineText(value)
  if (!normalized) return false
  if (!NAME_PATTERN.test(normalized)) return false
  const lettersCount = Array.from(normalized).filter((ch) => /\p{L}/u.test(ch)).length
  return lettersCount >= 2
}

export function isValidEmail(value: unknown): boolean {
  const normalized = normalizeSingleLineText(value)
  return SIMPLE_EMAIL_PATTERN.test(normalized)
}
