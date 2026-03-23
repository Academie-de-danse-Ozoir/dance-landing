import { supabaseAdmin } from '../lib/supabaseAdmin'
import {
  EVENT_ID,
  MAX_SEATS_PER_ORDER,
  RATE_LIMIT_HOLD_SEATS_PER_MINUTE,
  MAX_LENGTH,
  STAFF_RESERVED_SEAT_IDS
} from '../../constants'
import { tApiError } from '../../locales/frDisplay'
import { checkRateLimit, getClientIp } from '../utils/rateLimit'
import { verifyTurnstileToken } from '../utils/verifyTurnstile'

function trimStr(s: unknown, max: number): string {
  const str = typeof s === 'string' ? s.trim() : ''
  if (str.length > max) throw createError({ statusCode: 400, statusMessage: tApiError('fieldTooLong') })
  return str
}

export default defineEventHandler(async (event) => {
  const ip = getClientIp(event)

  if (!checkRateLimit(ip, 'hold', RATE_LIMIT_HOLD_SEATS_PER_MINUTE).ok) {
    throw createError({ statusCode: 429, statusMessage: tApiError('rateLimit') })
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
      throw createError({ statusCode: 400, statusMessage: tApiError('captchaTurnstile') })
    }
  }

  if (!seatIds || !Array.isArray(seatIds) || seatIds.length === 0) {
    throw createError({
      statusCode: 400,
      statusMessage: tApiError('noSeatsSelected')
    })
  }
  if (seatIds.length > MAX_SEATS_PER_ORDER) {
    throw createError({
      statusCode: 400,
      statusMessage: tApiError('tooManySeats')
    })
  }

  const seatIdStrs = seatIds.map(id => String(id))
  if (seatIdStrs.some(id => STAFF_RESERVED_SEAT_IDS.includes(id))) {
    throw createError({
      statusCode: 400,
      statusMessage: tApiError('staffSeatsNotBookable')
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
    throw createError({ statusCode: 400, statusMessage: tApiError('missingCustomerInfo') })
  }
  if (!fName || !lName || !em || !ph) {
    throw createError({
      statusCode: 400,
      statusMessage: tApiError('missingCustomerInfo')
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
      statusMessage: tApiError('seatsUnavailable')
    })
  }

  if (!data || data.length === 0) {
    throw createError({
      statusCode: 500,
      statusMessage: tApiError('createReservationFailed')
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
      statusMessage: tApiError('holdSeatsIncompleteResponse')
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
