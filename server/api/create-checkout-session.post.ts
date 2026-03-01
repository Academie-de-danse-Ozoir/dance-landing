import { stripe } from '../lib/stripe'
import { supabaseAdmin } from '../lib/supabaseAdmin'
import {
  ERROR_MISSING_ORDER_ID,
  ERROR_ORDER_NOT_FOUND,
  ERROR_ORDER_NOT_PAYABLE,
  ERROR_RESERVATION_EXPIRED,
  ORDER_STATUS,
  SEAT_STATUS
} from '../../constants'

export default defineEventHandler(async (event) => {
  const { orderId } = await readBody(event)

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

  /* =====================
     4) Créer la session Stripe
  ===================== */
  const session = await stripe.checkout.sessions.create({
    mode: 'payment',
    payment_method_types: ['card'],
    customer_email: order.email,

    line_items: [
      {
        price_data: {
          currency: 'eur',
          product_data: {
            name: 'Billet – Spectacle de danse Ozoir'
          },
          unit_amount: 50 // 25€
        },
        quantity: seatCount
      }
    ],

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
