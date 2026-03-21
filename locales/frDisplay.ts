/**
 * Textes métier / API (fr) — source : fr.json.
 * À utiliser côté serveur (et partout hors composants Vue si besoin).
 */
import fr from './fr.json'

export type ApiErrorKey = keyof typeof fr.api.errors

export function tApiError(key: ApiErrorKey): string {
  return fr.api.errors[key]
}

const brand = fr.brand

/** From.Name Mailjet & pied email/PDF */
export function billetterieSenderName(): string {
  return `${brand.billetterieLabel} – ${brand.spectacleName}`
}

export function emailTicketSubject(orderRefShort: string): string {
  return `Votre billet — commande ${orderRefShort} — ${brand.spectacleName} 🎭`
}

export function emailAggregateLineDescription(): string {
  return `Billet(s) – ${brand.spectacleName}`
}

export function pdfOrderRecapFooter(): string {
  return `Conservez ce récapitulatif avec vos billets. ${billetterieSenderName()}.`
}

export { brand }
