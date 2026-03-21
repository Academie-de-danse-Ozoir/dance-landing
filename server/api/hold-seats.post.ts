import { supabaseAdmin } from '../lib/supabaseAdmin'
import {
  EVENT_ID,
  MAX_SEATS_PER_ORDER,
  RATE_LIMIT_HOLD_SEATS_PER_MINUTE,
  MAX_LENGTH,
  ERROR_NO_SEATS_SELECTED,
  ERROR_MISSING_CUSTOMER_INFO,
  ERROR_SEATS_UNAVAILABLE,
  ERROR_CREATE_RESERVATION_FAILED,
  ERROR_TOO_MANY_SEATS,
  ERROR_FIELD_TOO_LONG,
  ERROR_RATE_LIMIT,
  ERROR_CAPTCHA_TURNSTILE
} from '../../constants'
import { checkRateLimit, getClientIp } from '../utils/rateLimit'
import { verifyTurnstileToken } from '../utils/verifyTurnstile'

function trimStr(s: unknown, max: number): string {
  const str = typeof s === 'string' ? s.trim() : ''
  if (str.length > max) throw createError({ statusCode: 400, statusMessage: ERROR_FIELD_TOO_LONG })
  return str
}

export default defineEventHandler(async (event) => {
  const ip = getClientIp(event)

  if (!checkRateLimit(ip, 'hold', RATE_LIMIT_HOLD_SEATS_PER_MINUTE).ok) {
    throw createError({ statusCode: 429, statusMessage: ERROR_RATE_LIMIT })
  }

  const body = await readBody(event)
  let seatIds: unknown
  let firstName: unknown
  let lastName: unknown
  let email: unknown
  let phone: unknown
  let turnstileToken: unknown
  ;({ seatIds, firstName, lastName, email, phone, turnstileToken } = body)

  if (process.env.TURNSTILE_SECRET_KEY) {
    const token = typeof turnstileToken === 'string' ? turnstileToken : ''
    const ok = await verifyTurnstileToken(token)
    if (!ok) {
      throw createError({ statusCode: 400, statusMessage: ERROR_CAPTCHA_TURNSTILE })
    }
  }

  if (!seatIds || !Array.isArray(seatIds) || seatIds.length === 0) {
    throw createError({
      statusCode: 400,
      statusMessage: ERROR_NO_SEATS_SELECTED
    })
  }
  if (seatIds.length > MAX_SEATS_PER_ORDER) {
    throw createError({
      statusCode: 400,
      statusMessage: ERROR_TOO_MANY_SEATS
    })
  }

  let fName: string
  let lName: string
  let em: string
  let ph: string
  try {
    fName = trimStr(firstName, MAX_LENGTH.firstName)
    lName = trimStr(lastName, MAX_LENGTH.lastName)
    em = trimStr(email, MAX_LENGTH.email)
    ph = trimStr(phone, MAX_LENGTH.phone)
  } catch (e: any) {
    if (e.statusCode === 400) throw e
    throw createError({ statusCode: 400, statusMessage: ERROR_MISSING_CUSTOMER_INFO })
  }
  if (!fName || !lName || !em || !ph) {
    throw createError({
      statusCode: 400,
      statusMessage: ERROR_MISSING_CUSTOMER_INFO
    })
  }

  const { data, error } = await supabaseAdmin.rpc('hold_seats', {
    p_seat_ids: seatIds,
    p_event_id: EVENT_ID,
    p_first_name: fName,
    p_last_name: lName,
    p_email: em,
    p_phone: ph
  })

  if (error) {
    console.error('hold_seats error:', error)
    throw createError({
      statusCode: 409,
      statusMessage: ERROR_SEATS_UNAVAILABLE
    })
  }

  if (!data || data.length === 0) {
    throw createError({
      statusCode: 500,
      statusMessage: ERROR_CREATE_RESERVATION_FAILED
    })
  }

  const row = data[0] as Record<string, unknown>
  const orderId = row.order_id ?? row.orderId
  const orderTokenRaw = row.order_token ?? row.orderToken
  const expiresAt = row.expires_at ?? row.expiresAt

  const orderToken =
    orderTokenRaw != null && orderTokenRaw !== ''
      ? String(orderTokenRaw)
      : ''

  if (!orderId || !orderToken || !expiresAt) {
    console.error('[billetterie:hold-seats] RPC row inattendu:', row)
    throw createError({
      statusCode: 500,
      statusMessage:
        'Réponse hold_seats incomplète : vérifie que la fonction retourne order_id, order_token et expires_at (RETURNS TABLE à 3 colonnes).'
    })
  }

  console.info('[billetterie:hold-seats] Réservation créée', {
    orderId: String(orderId),
    expiresAt: String(expiresAt),
    seatCount: Array.isArray(seatIds) ? seatIds.length : 0
  })

  return {
    orderId: String(orderId),
    orderToken,
    expiresAt: String(expiresAt)
  }
})
