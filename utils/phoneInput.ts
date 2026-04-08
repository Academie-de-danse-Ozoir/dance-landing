/**
 * Rang des chiffres en AZERTY (sans Shift) : même position que 1–0 sur un clavier QWERTY.
 * @see https://fr.wikipedia.org/wiki/AZERTY
 */
const FR_AZERTY_TOP_ROW_TO_DIGIT: Record<string, string> = {
  '&': '1',
  'é': '2',
  'É': '2',
  '"': '3',
  "'": '4',
  '(': '5',
  '§': '6',
  'è': '7',
  'È': '7',
  '!': '8',
  'ç': '9',
  'Ç': '9',
  'à': '0',
  'À': '0'
}

/** Caractères du rang chiffres AZERTY (pour filtre keydown). */
export const FR_AZERTY_TOP_ROW_CHARS = new Set(Object.keys(FR_AZERTY_TOP_ROW_TO_DIGIT))

/**
 * Convertit la saisie (chiffres + touches AZERTY du rang du haut) en chiffres uniquement, max 10.
 */
export function normalizePhoneKeyboardInput(raw: string): string {
  let s = ''
  for (const ch of raw) {
    s += FR_AZERTY_TOP_ROW_TO_DIGIT[ch] ?? ch
  }
  return s.replace(/\D/g, '').slice(0, 10)
}

/**
 * Formate un numéro français : max 10 chiffres, groupes de 2 séparés par des espaces.
 * Ex. `0646097014` → `06 46 09 70 14`
 */
export function formatFrenchPhoneInput(raw: string): string {
  const digits = normalizePhoneKeyboardInput(raw)
  const parts: string[] = []
  for (let i = 0; i < digits.length; i += 2) {
    parts.push(digits.slice(i, i + 2))
  }
  return parts.join(' ')
}

/** Nombre de chiffres dans `s` strictement avant l’index `index`. */
export function countDigitsBeforeIndex(s: string, index: number): number {
  let c = 0
  const end = Math.min(Math.max(0, index), s.length)
  for (let i = 0; i < end; i++) {
    if (/\d/.test(s[i]!)) c++
  }
  return c
}

/**
 * Index dans la chaîne formatée après le `n`ᵉ chiffre (`n === 0` → début).
 * Utile pour replacer le curseur après reformatage (espaces insérés).
 */
export function indexAfterDigitCount(formatted: string, digitCount: number): number {
  if (digitCount <= 0) return 0
  let seen = 0
  for (let i = 0; i < formatted.length; i++) {
    if (/\d/.test(formatted[i]!)) {
      seen++
      if (seen === digitCount) return i + 1
    }
  }
  return formatted.length
}

/** Replacer le curseur après `formatFrenchPhoneInput` à partir de la position dans l’affichage précédent. */
export function mapCaretAfterPhoneFormat(
  prevDisplay: string,
  nextDigits: string,
  selectionStart: number | null,
  selectionEnd: number | null
): { start: number; end: number } {
  const nextDisplay = formatFrenchPhoneInput(nextDigits)
  const len = prevDisplay.length
  const start = selectionStart == null ? len : Math.min(Math.max(0, selectionStart), len)
  const end = selectionEnd == null ? start : Math.min(Math.max(0, selectionEnd), len)
  const dStart = countDigitsBeforeIndex(prevDisplay, start)
  const dEnd = countDigitsBeforeIndex(prevDisplay, end)
  return {
    start: indexAfterDigitCount(nextDisplay, dStart),
    end: indexAfterDigitCount(nextDisplay, dEnd)
  }
}

/**
 * Touche autorisée pour le téléphone : chiffres, pavé num., ou rang AZERTY.
 */
export function isAllowedPhoneKeyEvent(e: KeyboardEvent): boolean {
  if (/^Digit[0-9]$/.test(e.code) || /^Numpad[0-9]$/.test(e.code)) return true
  if (e.key.length === 1 && /\d/.test(e.key)) return true
  if (e.key.length === 1 && FR_AZERTY_TOP_ROW_CHARS.has(e.key)) return true
  return false
}
