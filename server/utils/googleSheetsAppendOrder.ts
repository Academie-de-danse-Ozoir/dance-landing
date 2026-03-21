import { JWT } from 'google-auth-library'

const LOG = '[billetterie:admin-sheet]'

/** Nombre de colonnes écrites (A→H). */
const SHEET_COL_COUNT = 8

/** Hauteur max lue / effacée sous la ligne d’en-tête (évite une plage ouverte infinie). */
const SHEET_DATA_MAX_ROWS = 5000

function padSheetRow(cells: unknown[]): string[] {
  const s = cells.map((c) => (c == null ? '' : String(c)))
  while (s.length < SHEET_COL_COUNT) s.push('')
  return s.slice(0, SHEET_COL_COUNT)
}

function isSheetRowEmpty(row: string[]): boolean {
  return row.every((c) => c.trim() === '')
}

/**
 * Étend `A2:H` → `A2:H5000` pour GET/clear ; laisse inchangé si la fin de plage a déjà un numéro de ligne.
 */
function expandDataRangeForReadClear(cellPart: string): string {
  const m = cellPart.match(/^([A-Za-z]+)(\d+):([A-Za-z]+)(\d*)$/i)
  if (!m) return cellPart
  const [, c1, r1, c2, rTail] = m
  if (rTail !== undefined && rTail.length > 0) return cellPart
  return `${c1.toUpperCase()}${r1}:${c2.toUpperCase()}${SHEET_DATA_MAX_ROWS}`
}

/** Cellule en haut à gauche des données (ex. A2) pour un `values.update`. */
function dataTopLeftCell(cellPart: string): string | null {
  const m = cellPart.match(/^([A-Za-z]+)(\d+)/i)
  return m ? `${m[1].toUpperCase()}${m[2]}` : null
}

/** Tri par nom de résa (col. A), puis ordre stable pour garder les lignes d’une même commande groupées. */
function sortSheetRowsByReservationName(rows: string[][]): string[][] {
  const padded = rows.map(padSheetRow)
  return [...padded].sort((a, b) => {
    const fr = { sensitivity: 'base' as const }
    let c = (a[0] ?? '').trim().localeCompare((b[0] ?? '').trim(), 'fr', fr)
    if (c !== 0) return c
    c = (a[1] ?? '').trim().localeCompare((b[1] ?? '').trim(), 'fr', fr)
    if (c !== 0) return c
    c = (a[2] ?? '').trim().localeCompare((b[2] ?? '').trim(), 'fr', fr)
    if (c !== 0) return c
    c = (a[4] ?? '').trim().localeCompare((b[4] ?? '').trim(), 'fr', fr)
    if (c !== 0) return c
    c = (a[5] ?? '').trim().localeCompare((b[5] ?? '').trim(), 'fr', fr)
    if (c !== 0) return c
    c = (a[6] ?? '').trim().localeCompare((b[6] ?? '').trim(), 'fr', fr)
    if (c !== 0) return c
    return (a[7] ?? '').trim().localeCompare((b[7] ?? '').trim(), 'fr', fr)
  })
}

async function sheetsValuesGet(
  spreadsheetId: string,
  rangeA1: string,
  token: string
): Promise<string[][] | null> {
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(rangeA1)}`
  const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } })
  if (!res.ok) {
    const text = await res.text().catch(() => '')
    console.error(`${LOG} GET values (${res.status})`, text.slice(0, 600))
    return null
  }
  const body = (await res.json()) as { values?: unknown[][] }
  if (!body.values?.length) return []
  return body.values.map((r) => padSheetRow(r))
}

async function sheetsValuesClear(spreadsheetId: string, rangeA1: string, token: string): Promise<boolean> {
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(rangeA1)}:clear`
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: '{}'
  })
  if (!res.ok) {
    const text = await res.text().catch(() => '')
    console.error(`${LOG} CLEAR (${res.status})`, text.slice(0, 600))
    return false
  }
  return true
}

async function sheetsValuesUpdate(
  spreadsheetId: string,
  rangeA1: string,
  values: string[][],
  token: string
): Promise<boolean> {
  const url = new URL(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(rangeA1)}`
  )
  url.searchParams.set('valueInputOption', 'USER_ENTERED')
  const res = await fetch(url.toString(), {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ values })
  })
  if (!res.ok) {
    const text = await res.text().catch(() => '')
    console.error(`${LOG} PUT values (${res.status})`, text.slice(0, 600))
    return false
  }
  return true
}

/** ID du classeur (segment entre `/d/` et `/edit` dans l’URL Google Sheets). */
export function resolveGoogleSheetsSpreadsheetId(): string | null {
  return process.env.GOOGLE_SHEETS_SPREADSHEET_ID?.trim() || null
}

/**
 * Google Sheets exige des guillemets simples autour du nom d’onglet s’il contient des espaces, etc.
 * Ex. Spectacle - Ozoir!A:K → 'Spectacle - Ozoir'!A:K
 * @see https://developers.google.com/sheets/api/guides/concepts#a1_notation
 */
function normalizeSheetAppendRange(range: string): string {
  const t = range.trim()
  const bang = t.indexOf('!')
  if (bang <= 0) return t
  let sheet = t.slice(0, bang).trim()
  const cellPart = t.slice(bang + 1).trim()
  if ((sheet.startsWith('"') && sheet.endsWith('"')) || (sheet.startsWith("'") && sheet.endsWith("'"))) {
    sheet = sheet.slice(1, -1)
  }
  const alreadyQuoted = sheet.startsWith("'") && sheet.endsWith("'")
  const inner = alreadyQuoted ? sheet.slice(1, -1) : sheet
  const needsQuotes =
    !alreadyQuoted && (/[\s!'"]/.test(inner) || /[^A-Za-z0-9_]/.test(inner))
  const sheetA1 = needsQuotes ? `'${inner.replace(/'/g, "''")}'` : inner
  return `${sheetA1}!${cellPart}`
}

/** Partie cellules (ex. `A2:H`) depuis `GOOGLE_SHEETS_APPEND_RANGE`. */
function parseAppendCellPart(rangeRaw: string): string {
  const t = rangeRaw.trim()
  const bang = t.indexOf('!')
  if (bang < 0) return t || 'A2:H'
  const cell = t.slice(bang + 1).trim()
  return cell || 'A2:H'
}

function quoteSheetTitleForA1(title: string): string {
  return `'${title.replace(/'/g, "''")}'`
}

/**
 * Même nombre que dans l’URL Sheets (`#gid=…`) = `sheetId` côté API → titre d’onglet fiable pour l’append.
 */
function resolveSheetGidFromEnv(): number | null {
  const envGid = process.env.GOOGLE_SHEETS_TAB_GID?.trim()
  if (envGid && /^\d+$/.test(envGid)) return parseInt(envGid, 10)
  return null
}

/**
 * Lien du bouton « registre » dans le mail admin : `GOOGLE_SHEETS_SPREADSHEET_ID` + `GOOGLE_SHEETS_TAB_GID`.
 */
export function buildGoogleSheetsRegisterUrl(): string | null {
  const id = resolveGoogleSheetsSpreadsheetId()
  if (!id) return null
  const gid = resolveSheetGidFromEnv()
  if (gid != null) {
    return `https://docs.google.com/spreadsheets/d/${id}/edit?gid=${gid}#gid=${gid}`
  }
  return `https://docs.google.com/spreadsheets/d/${id}/edit`
}

async function fetchSheetTitleByGid(
  spreadsheetId: string,
  sheetGid: number,
  token: string
): Promise<string | null> {
  const metaUrl = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}?fields=sheets.properties%28sheetId%2Ctitle%29`
  const res = await fetch(metaUrl, { headers: { Authorization: `Bearer ${token}` } })
  if (!res.ok) {
    const text = await res.text().catch(() => '')
    console.error(`${LOG} Lecture métadonnées classeur (${res.status})`, text.slice(0, 600))
    return null
  }
  const data = (await res.json()) as {
    sheets?: Array<{ properties?: { sheetId?: number; title?: string } }>
  }
  const sheets = data.sheets ?? []
  for (const s of sheets) {
    if (s.properties?.sheetId === sheetGid) {
      const title = s.properties?.title
      return title ?? null
    }
  }
  console.error(`${LOG} Aucun onglet avec sheetId/gid=${sheetGid}`, {
    onglets: sheets.map((s) => ({ gid: s.properties?.sheetId, title: s.properties?.title }))
  })
  return null
}

function parseServiceAccountJson(): { client_email: string; private_key: string } | null {
  const raw = process.env.GOOGLE_SERVICE_ACCOUNT_JSON?.trim()
  if (!raw) return null
  let jsonStr = raw
  if (!jsonStr.startsWith('{')) {
    try {
      jsonStr = Buffer.from(jsonStr, 'base64').toString('utf8')
    } catch {
      return null
    }
  }
  try {
    const o = JSON.parse(jsonStr) as { client_email?: string; private_key?: string }
    if (!o.client_email || !o.private_key) return null
    return { client_email: o.client_email, private_key: o.private_key }
  } catch {
    return null
  }
}

async function getAccessToken(): Promise<string | null> {
  const keys = parseServiceAccountJson()
  if (!keys) return null
  const client = new JWT({
    email: keys.client_email,
    key: keys.private_key,
    scopes: ['https://www.googleapis.com/auth/spreadsheets']
  })
  const tokens = await client.authorize()
  return tokens.access_token ?? null
}

/** Une ligne par siège ; colonnes A→H (voir append). Mails / PDF inchangés. */
export type SheetSeatRow = {
  seatLabel: string
  attendeeFirstName: string
  attendeeLastName: string
  /** Ex. Adulte, Enfant, — */
  ticketTypeLabel: string
}

export type SheetOrderRow = {
  /** Pour les logs serveur uniquement (non écrit dans la sheet). */
  orderId: string
  /** Acheteur (même sur chaque ligne de siège). */
  buyerLastName: string
  buyerFirstName: string
  buyerEmail: string
  buyerPhone: string
  /** Une entrée = une ligne dans la sheet (titulaire du siège). */
  seats: SheetSeatRow[]
}

/**
 * Met à jour une Google Sheet : **une ligne par siège**, puis **réordonne tout le bloc données** par ordre alphabétique
 * du **nom de résa** (col. A, `fr`, insensible aux accents). Les lignes d’une même commande restent groupées (tri secondaire
 * prénom résa, email, nom/prénom place, type, n° place).
 *
 * Ligne 1 = en-têtes (non lue / non effacée). Plage données par défaut `A2:H` sur au plus 5000 lignes (GET + clear + réécriture).
 * Deux paiements simultanés peuvent théoriquement se marcher dessus : en pratique rare ; sinon il faudrait une file sérialisée.
 *
 * Colonnes : **Nom résa · Prénom résa · Email résa · Tél résa · Nom · Prénom · Type · N° place**
 *
 * Obligatoire : `GOOGLE_SHEETS_SPREADSHEET_ID`, `GOOGLE_SERVICE_ACCOUNT_JSON`, classeur partagé avec le compte de service (Éditeur).
 * Fortement recommandé : `GOOGLE_SHEETS_TAB_GID`.
 * Optionnel : `GOOGLE_SHEETS_APPEND_RANGE` (défaut `Sheet1!A2:H`) ; avec un gid, seule la partie après `!` compte (ex. `A2:H`).
 */
export async function appendPaidOrderRowToGoogleSheetIfConfigured(row: SheetOrderRow): Promise<void> {
  const spreadsheetId = resolveGoogleSheetsSpreadsheetId()
  const rangeRaw = (process.env.GOOGLE_SHEETS_APPEND_RANGE ?? 'Sheet1!A2:H').trim()
  const cellPart = parseAppendCellPart(rangeRaw)
  const sheetGid = resolveSheetGidFromEnv()
  if (!spreadsheetId) {
    console.warn(`${LOG} Ignoré : GOOGLE_SHEETS_SPREADSHEET_ID manquant`)
    return
  }

  let token: string | null
  try {
    token = await getAccessToken()
  } catch (e) {
    console.error(`${LOG} Auth Google (JWT) échouée`, e)
    return
  }
  if (!token) {
    console.warn(`${LOG} Ignoré : GOOGLE_SERVICE_ACCOUNT_JSON manquant ou invalide`)
    return
  }

  let range: string
  if (sheetGid != null) {
    const title = await fetchSheetTitleByGid(spreadsheetId, sheetGid, token)
    if (!title) {
      console.error(`${LOG} Append annulé : titre d’onglet introuvable pour gid=${sheetGid}`)
      return
    }
    range = `${quoteSheetTitleForA1(title)}!${cellPart}`
  } else {
    range = normalizeSheetAppendRange(rangeRaw)
  }

  const bang = range.lastIndexOf('!')
  const sheetA1Prefix = bang >= 0 ? range.slice(0, bang) : `'Sheet1'`
  const cellPartOnly = bang >= 0 ? range.slice(bang + 1) : range
  const topLeft = dataTopLeftCell(cellPartOnly)
  if (!topLeft) {
    console.error(`${LOG} Plage invalide (attendu ex. A2:H)`, { range })
    return
  }
  const readClearCellRange = expandDataRangeForReadClear(cellPartOnly)
  const readRangeA1 = `${sheetA1Prefix}!${readClearCellRange}`
  const clearRangeA1 = readRangeA1
  const updateRangeA1 = `${sheetA1Prefix}!${topLeft}`

  const buyer = [
    row.buyerLastName,
    row.buyerFirstName,
    row.buyerEmail,
    row.buyerPhone
  ] as const

  const newRows: string[][] =
    row.seats.length > 0
      ? row.seats.map((s) =>
          padSheetRow([
            ...buyer,
            s.attendeeLastName,
            s.attendeeFirstName,
            s.ticketTypeLabel,
            s.seatLabel
          ])
        )
      : [padSheetRow([...buyer, '', '', '—', '—'])]

  console.info(`${LOG} Mise à jour + tri (nom résa)`, {
    orderId: row.orderId,
    spreadsheetIdSuffix: spreadsheetId.slice(-8),
    readRangeA1,
    newRowCount: newRows.length,
    sheetGid: sheetGid ?? '(nom depuis GOOGLE_SHEETS_APPEND_RANGE)'
  })

  let existing: string[][] | null
  try {
    existing = await sheetsValuesGet(spreadsheetId, readRangeA1, token)
  } catch (e) {
    console.error(`${LOG} GET values — erreur`, { orderId: row.orderId, err: e })
    return
  }
  if (existing === null) return

  const merged = [...existing.filter((r) => !isSheetRowEmpty(padSheetRow(r))), ...newRows]
  const sorted = sortSheetRowsByReservationName(merged)

  const cleared = await sheetsValuesClear(spreadsheetId, clearRangeA1, token)
  if (!cleared) return

  const updated = await sheetsValuesUpdate(spreadsheetId, updateRangeA1, sorted, token)
  if (!updated) return

  console.info(`${LOG} Sheet mise à jour (tri nom résa)`, {
    orderId: row.orderId,
    totalRows: sorted.length,
    appendedForOrder: newRows.length
  })
}
