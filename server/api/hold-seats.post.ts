import { randomUUID } from 'node:crypto'
import { supabaseAdmin } from '../lib/supabaseAdmin'
import {
  EVENT_ID,
  MAX_SEATS_PER_ORDER,
  RATE_LIMIT_HOLD_SEATS_PER_MINUTE,
  MAX_LENGTH,
  SEAT_STATUS
} from '../../constants'
import { tApiError } from '../../locales/frDisplay'
import { checkRateLimit, getClientIp } from '../utils/rateLimit'
import { isValidEmail, isValidPersonName } from '../utils/inputValidation'

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
  let quick: unknown
  ;({ seatIds, firstName, lastName, email, phone, quick } = body)

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
  const uniqueSeatIds = [...new Set(seatIdStrs)]

  const { data: seatRows, error: seatLookupError } = await supabaseAdmin
    .from('seat')
    .select('id, reserved_for_staff')
    .in('id', uniqueSeatIds)

  if (seatLookupError || !seatRows || seatRows.length !== uniqueSeatIds.length) {
    throw createError({
      statusCode: 400,
      statusMessage: tApiError('seatsUnavailable')
    })
  }

  if (seatRows.some((r: { reserved_for_staff?: boolean }) => r.reserved_for_staff === true)) {
    throw createError({
      statusCode: 400,
      statusMessage: tApiError('staffSeatsNotBookable')
    })
  }

  const { data: blockingReservations } = await supabaseAdmin
    .from('seat_reservation')
    .select('seat_id')
    .eq('event_id', EVENT_ID)
    .in('seat_id', uniqueSeatIds)
    .in('status', [SEAT_STATUS.HOLD, SEAT_STATUS.PAID])

  if (blockingReservations && blockingReservations.length > 0) {
    throw createError({
      statusCode: 409,
      statusMessage: tApiError('seatsUnavailable')
    })
  }

  let fName: string
  let lName: string
  let em: string
  let ph: string

  if (quick === true) {
    fName = 'Réservation'
    lName = 'en cours'
    const host = (() => {
      const base = process.env.PUBLIC_SITE_URL?.trim()
      if (!base) return 'localhost'
      try {
        return new URL(base).hostname || 'localhost'
      } catch {
        return 'localhost'
      }
    })()
    em = `en-attente+${randomUUID().replace(/-/g, '')}@${host}`.slice(0, MAX_LENGTH.email)
    ph = '0612345678'
  } else {
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
    if (!isValidPersonName(fName) || !isValidPersonName(lName) || !isValidEmail(em)) {
      throw createError({
        statusCode: 400,
        statusMessage: tApiError('invalidRequest')
      })
    }
    let phoneDigits = ph.replace(/\D/g, '')
    if (phoneDigits.startsWith('33') && phoneDigits.length === 11) {
      phoneDigits = `0${phoneDigits.slice(2)}`
    }
    if (!/^0[1-9]\d{8}$/.test(phoneDigits)) {
      throw createError({
        statusCode: 400,
        statusMessage: tApiError('invalidRequest')
      })
    }
    ph = phoneDigits
  }

  const { data, error } = await supabaseAdmin.rpc('hold_seats', {
    p_seat_ids: uniqueSeatIds,
    p_event_id: EVENT_ID,
    p_first_name: fName,
    p_last_name: lName,
    p_email: em,
    p_phone: ph
  })

  if (error) {
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
    throw createError({
      statusCode: 500,
      statusMessage: tApiError('holdSeatsIncompleteResponse')
    })
  }

  /** Hold « rapide » : le RPC pose des valeurs factices ; on les efface tant que le client n’a pas rempli l’étape 1. */
  if (quick === true) {
    const id = String(orderId)
    let { error: clearError } = await supabaseAdmin
      .from('order')
      .update({
        first_name: null,
        last_name: null,
        email: null,
        phone: null,
        ticket_attendees: null
      })
      .eq('id', id)
    if (clearError) {
      ;({ error: clearError } = await supabaseAdmin
        .from('order')
        .update({
          first_name: '',
          last_name: '',
          email: '',
          phone: '',
          ticket_attendees: null
        })
        .eq('id', id))
    }
  }

  return {
    orderId: String(orderId),
    orderToken,
    expiresAt: String(expiresAt)
  }
})
