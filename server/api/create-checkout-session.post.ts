import { stripe } from '../lib/stripe'
import { supabaseAdmin } from '../lib/supabaseAdmin'
import {
  ERROR_MISSING_ORDER_ID,
  ERROR_ORDER_NOT_FOUND,
  ERROR_ORDER_NOT_PAYABLE,
  ERROR_RESERVATION_EXPIRED,
  ERROR_ADULT_CHILD_MISMATCH,
  ORDER_STATUS,
  SEAT_STATUS
} from '../../constants'

const PRICE_ADULT_CENTS = 100 
const PRICE_CHILD_CENTS = 50

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const { orderId, adultCount: bodyAdult, childCount: bodyChild } = body

  if (!orderId) {
    throw createError({ statusCode: 400, statusMessage: ERROR_MISSING_ORDER_ID })
  }

  /* =====================
     1) Vérifier la commande
  ===================== */
  const { data: order, error: orderError } = await supabaseAdmin
    .from('order')
    .select('id, email, status')
    .eq('id', orderId)
    .single()

  if (orderError || !order) {
    throw createError({ statusCode: 404, statusMessage: ERROR_ORDER_NOT_FOUND })
  }

  if (order.status !== ORDER_STATUS.PENDING) {
    throw createError({ statusCode: 409, statusMessage: ERROR_ORDER_NOT_PAYABLE })
  }

  /* =====================
     2) Charger les réservations hold
  ===================== */
  const { data: reservations, error: resError } = await supabaseAdmin
    .from('seat_reservation')
    .select('id, expires_at')
    .eq('order_id', orderId)
    .eq('status', SEAT_STATUS.HOLD)

  if (resError || !reservations || reservations.length === 0) {
    throw createError({
      statusCode: 409,
      statusMessage: ERROR_RESERVATION_EXPIRED
    })
  }

  /* =====================
     3) Vérifier expiration
  ===================== */
  const now = Date.now()

  const hasExpired = reservations.some(r =>
    new Date(r.expires_at).getTime() <= now
  )

  if (hasExpired) {
    // Nettoyage sécurité
    await supabaseAdmin
      .from('seat_reservation')
      .delete()
      .eq('order_id', orderId)
      .eq('status', SEAT_STATUS.HOLD)

    throw createError({
      statusCode: 409,
      statusMessage: ERROR_RESERVATION_EXPIRED
    })
  }

  const seatCount = reservations.length
  const adultCount = Math.max(0, Number(bodyAdult))
  const childCount = Math.max(0, Number(bodyChild))
  if (adultCount + childCount !== seatCount) {
    throw createError({
      statusCode: 400,
      statusMessage: ERROR_ADULT_CHILD_MISMATCH
    })
  }

  const lineItems: { price_data: { currency: string; product_data: { name: string }; unit_amount: number }; quantity: number }[] = []
  if (adultCount > 0) {
    lineItems.push({
      price_data: {
        currency: 'eur',
        product_data: { name: 'Billet adulte – Spectacle de danse Ozoir' },
        unit_amount: PRICE_ADULT_CENTS
      },
      quantity: adultCount
    })
  }
  if (childCount > 0) {
    lineItems.push({
      price_data: {
        currency: 'eur',
        product_data: { name: 'Billet enfant – Spectacle de danse Ozoir' },
        unit_amount: PRICE_CHILD_CENTS
      },
      quantity: childCount
    })
  }

  /* =====================
     4) Créer la session Stripe
  ===================== */
  const session = await stripe.checkout.sessions.create({
    mode: 'payment',
    payment_method_types: ['card'],
    customer_email: order.email,
    locale: 'fr',

    line_items: lineItems,

    metadata: {
      order_id: orderId
    },

    success_url: `${process.env.PUBLIC_SITE_URL}/success?order_id=${orderId}`,
    cancel_url: `${process.env.PUBLIC_SITE_URL}/cancel?order_id=${orderId}`
  })

  /* =====================
     5) Sauver l’ID Stripe
  ===================== */
  await supabaseAdmin
    .from('order')
    .update({ stripe_session_id: session.id })
    .eq('id', orderId)

  return { url: session.url }
})
