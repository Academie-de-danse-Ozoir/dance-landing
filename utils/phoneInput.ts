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

/**
 * Touche autorisée pour le téléphone : chiffres, pavé num., ou rang AZERTY.
 */
export function isAllowedPhoneKeyEvent(e: KeyboardEvent): boolean {
  if (/^Digit[0-9]$/.test(e.code) || /^Numpad[0-9]$/.test(e.code)) return true
  if (e.key.length === 1 && /\d/.test(e.key)) return true
  if (e.key.length === 1 && FR_AZERTY_TOP_ROW_CHARS.has(e.key)) return true
  return false
}
