import { stripe } from '../lib/stripe'
import { supabaseAdmin } from '../lib/supabaseAdmin'

export default defineEventHandler(async (event) => {
  const { orderId } = await readBody(event)

  if (!orderId) {
    throw createError({ statusCode: 400, statusMessage: 'Missing orderId' })
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
    throw createError({ statusCode: 404, statusMessage: 'Order not found' })
  }

  if (order.status !== 'pending') {
    throw createError({ statusCode: 409, statusMessage: 'Order not payable' })
  }

  /* =====================
     2) Charger les réservations hold
  ===================== */
  const { data: reservations, error: resError } = await supabaseAdmin
    .from('seat_reservation')
    .select('id, expires_at')
    .eq('order_id', orderId)
    .eq('status', 'hold')

  if (resError || !reservations || reservations.length === 0) {
    throw createError({
      statusCode: 409,
      statusMessage: 'Reservation expired'
    })
  }

  /* =====================
     3) Vérifier expiration (SOURCE DE VÉRITÉ)
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
      .eq('status', 'hold')

    throw createError({
      statusCode: 409,
      statusMessage: 'Reservation expired'
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

    // ✅ ICI
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
