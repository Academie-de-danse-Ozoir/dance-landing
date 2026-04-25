import { stripe } from '../../lib/stripe'
import { supabaseAdmin } from '../../lib/supabaseAdmin'
import {
  ORDER_STATUS,
  RATE_LIMIT_ADMIN_COMPLETE_FREE_ORDER_PER_MINUTE,
  SEAT_STATUS
} from '../../../constants'
import { tApiError } from '../../../locales/frDisplay'
import { checkRateLimit, getClientIp } from '../../utils/rateLimit'
import { sendPaidOrderTicketEmailForAdminFreeOrder } from '../../utils/paidOrderTicketEmail'
import { updateOrderStatusAndClearContact } from '../../utils/updateOrderStatusAndClearContact'

/**
 * Auth : `server/middleware/01-admin-api-auth.ts` (cookie admin obligatoire sur toute `/api/admin/*` sauf login).
 */
export default defineEventHandler(async (event) => {
  const ip = getClientIp(event)
  if (!checkRateLimit(ip, 'admin_complete_free', RATE_LIMIT_ADMIN_COMPLETE_FREE_ORDER_PER_MINUTE).ok) {
    throw createError({ statusCode: 429, statusMessage: tApiError('rateLimit') })
  }

  const body = await readBody(event)
  const { orderId, orderToken, adultCount: bodyAdult, childCount: bodyChild } = body as {
    orderId?: string
    orderToken?: string
    adultCount?: number
    childCount?: number
  }

  if (!orderId || !orderToken) {
    throw createError({
      statusCode: 400,
      statusMessage: !orderToken ? tApiError('missingOrderToken') : tApiError('missingOrderId')
    })
  }

  const { data: order, error: orderError } = await supabaseAdmin
    .from('order')
    .select('id, status, email, stripe_session_id')
    .eq('id', orderId)
    .eq('order_token', orderToken)
    .single()

  if (orderError || !order) {
    throw createError({ statusCode: 404, statusMessage: tApiError('orderNotFound') })
  }

  if (order.status !== ORDER_STATUS.PENDING) {
    throw createError({ statusCode: 409, statusMessage: tApiError('orderNotPayable') })
  }

  const { data: reservations, error: resError } = await supabaseAdmin
    .from('seat_reservation')
    .select('id, expires_at, seat_id')
    .eq('order_id', orderId)
    .eq('status', SEAT_STATUS.HOLD)

  if (resError || !reservations || reservations.length === 0) {
    await supabaseAdmin.from('seat_reservation').delete().eq('order_id', orderId).eq('status', SEAT_STATUS.HOLD)
    if (order.stripe_session_id) {
      try {
        await stripe.checkout.sessions.expire(order.stripe_session_id)
      } catch {
        // ignore
      }
    }
    await updateOrderStatusAndClearContact(orderId, ORDER_STATUS.EXPIRED)
    throw createError({ statusCode: 409, statusMessage: tApiError('reservationExpired') })
  }

  const now = Date.now()
  const hasExpired = reservations.some((r) => new Date(r.expires_at).getTime() <= now)
  if (hasExpired) {
    await supabaseAdmin.from('seat_reservation').delete().eq('order_id', orderId).eq('status', SEAT_STATUS.HOLD)
    if (order.stripe_session_id) {
      try {
        await stripe.checkout.sessions.expire(order.stripe_session_id)
      } catch {
        // ignore
      }
    }
    await updateOrderStatusAndClearContact(orderId, ORDER_STATUS.EXPIRED)
    throw createError({ statusCode: 409, statusMessage: tApiError('reservationExpired') })
  }

  const seatCount = reservations.length
  const adultCount = Math.max(0, Number(bodyAdult))
  const childCount = Math.max(0, Number(bodyChild))
  if (adultCount + childCount !== seatCount) {
    throw createError({ statusCode: 400, statusMessage: tApiError('adultChildMismatch') })
  }

  const heldSeatIds = reservations.map((r) => r.seat_id).filter(Boolean) as string[]
  const { data: seatRows } = await supabaseAdmin
    .from('seat')
    .select('id, reserved_for_staff')
    .in('id', heldSeatIds)

  if (
    !seatRows ||
    seatRows.length !== heldSeatIds.length ||
    seatRows.some((s: { reserved_for_staff?: boolean }) => s.reserved_for_staff === true)
  ) {
    await supabaseAdmin.from('seat_reservation').delete().eq('order_id', orderId).eq('status', SEAT_STATUS.HOLD)
    if (order.stripe_session_id) {
      try {
        await stripe.checkout.sessions.expire(order.stripe_session_id)
      } catch {
        // ignore
      }
    }
    await updateOrderStatusAndClearContact(orderId, ORDER_STATUS.EXPIRED)
    throw createError({
      statusCode: 409,
      statusMessage: tApiError('staffSeatsNotBookable')
    })
  }

  if (order.stripe_session_id) {
    try {
      await stripe.checkout.sessions.expire(order.stripe_session_id)
    } catch {
      // ignore: session may already be completed or missing
    }
  }

  const { data: updatedOrder, error: updateErr } = await supabaseAdmin
    .from('order')
    .update({ status: ORDER_STATUS.PAID, stripe_session_id: null })
    .eq('id', orderId)
    .select('id, email, ticket_sent')
    .single()

  if (updateErr || !updatedOrder) {
    throw createError({ statusCode: 500, statusMessage: tApiError('orderUpdateFailed') })
  }

  const { error: resUpErr } = await supabaseAdmin
    .from('seat_reservation')
    .update({ status: SEAT_STATUS.PAID, expires_at: null })
    .eq('order_id', orderId)
    .eq('status', SEAT_STATUS.HOLD)

  if (resUpErr) {
    throw createError({ statusCode: 500, statusMessage: tApiError('orderUpdateFailed') })
  }

  if (updatedOrder.email && !updatedOrder.ticket_sent) {
    const send = await sendPaidOrderTicketEmailForAdminFreeOrder(orderId, adultCount, childCount)
    if (send.sent !== true) {
      throw createError({ statusCode: 500, statusMessage: tApiError('orderUpdateFailed') })
    }
  }

  return { ok: true as const }
})
