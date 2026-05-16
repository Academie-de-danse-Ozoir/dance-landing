/** Logo header en variante claire tant que la section statement est visible (desktop). */
export function useStatementLogoZone() {
  return useState<boolean>('statement-section-in-view', () => false)
}
