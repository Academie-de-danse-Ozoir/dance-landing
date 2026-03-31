import { stripe } from '../lib/stripe'
import { supabaseAdmin } from '../lib/supabaseAdmin'
import {
  ORDER_STATUS,
  SEAT_STATUS,
  PRICE_ADULT_CENTS,
  PRICE_CHILD_CENTS,
  RATE_LIMIT_CREATE_CHECKOUT_PER_MINUTE
} from '../../constants'
import { brand, tApiError } from '../../locales/frDisplay'
import { checkRateLimit, getClientIp } from '../utils/rateLimit'
import { verifyTurnstileToken } from '../utils/verifyTurnstile'
import { updateOrderStatusAndClearContact } from '../utils/updateOrderStatusAndClearContact'

export default defineEventHandler(async (event) => {
  const ip = getClientIp(event)
  if (!checkRateLimit(ip, 'checkout', RATE_LIMIT_CREATE_CHECKOUT_PER_MINUTE).ok) {
    throw createError({ statusCode: 429, statusMessage: tApiError('rateLimit') })
  }

  const body = await readBody(event)
  const { orderId, orderToken, adultCount: bodyAdult, childCount: bodyChild, turnstileToken } = body

  if (process.env.TURNSTILE_SECRET_KEY) {
    const token = typeof turnstileToken === 'string' ? turnstileToken : ''
    const ok = await verifyTurnstileToken(token)
    if (!ok) {
      throw createError({ statusCode: 400, statusMessage: tApiError('captchaTurnstile') })
    }
  }

  if (!orderId || !orderToken) {
    throw createError({
      statusCode: 400,
      statusMessage: !orderToken ? tApiError('missingOrderToken') : tApiError('missingOrderId')
    })
  }

  /* =====================
     1) Vérifier la commande (id + token)
  ===================== */
  const { data: order, error: orderError } = await supabaseAdmin
    .from('order')
    .select('id, email, status, stripe_session_id')
    .eq('id', orderId)
    .eq('order_token', orderToken)
    .single()

  if (orderError || !order) {
    throw createError({ statusCode: 404, statusMessage: tApiError('orderNotFound') })
  }

  if (order.status !== ORDER_STATUS.PENDING) {
    throw createError({ statusCode: 409, statusMessage: tApiError('orderNotPayable') })
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
    await supabaseAdmin
      .from('seat_reservation')
      .delete()
      .eq('order_id', orderId)
      .eq('status', SEAT_STATUS.HOLD)
    if (order.stripe_session_id) {
      try {
        await stripe.checkout.sessions.expire(order.stripe_session_id)
      } catch (e) {
        console.info('[billetterie:create-checkout-session] expire Stripe (pas de holds)', e)
      }
    }
    await updateOrderStatusAndClearContact(orderId, ORDER_STATUS.EXPIRED)
    throw createError({
      statusCode: 409,
      statusMessage: tApiError('reservationExpired')
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
    await supabaseAdmin
      .from('seat_reservation')
      .delete()
      .eq('order_id', orderId)
      .eq('status', SEAT_STATUS.HOLD)

    if (order.stripe_session_id) {
      try {
        await stripe.checkout.sessions.expire(order.stripe_session_id)
      } catch (e) {
        console.info('[billetterie:create-checkout-session] expire Stripe (hold expiré)', e)
      }
    }

    await updateOrderStatusAndClearContact(orderId, ORDER_STATUS.EXPIRED)

    throw createError({
      statusCode: 409,
      statusMessage: tApiError('reservationExpired')
    })
  }

  const seatCount = reservations.length
  const adultCount = Math.max(0, Number(bodyAdult))
  const childCount = Math.max(0, Number(bodyChild))
  if (adultCount + childCount !== seatCount) {
    throw createError({
      statusCode: 400,
      statusMessage: tApiError('adultChildMismatch')
    })
  }

  const lineItems: { price_data: { currency: string; product_data: { name: string; description: string }; unit_amount: number }; quantity: number }[] = []
  if (adultCount > 0) {
    lineItems.push({
      price_data: {
        currency: 'eur',
        product_data: {
          name: brand.spectacleNameStripe,
          description: brand.stripeLineAdult
        },
        unit_amount: PRICE_ADULT_CENTS
      },
      quantity: adultCount
    })
  }
  if (childCount > 0) {
    lineItems.push({
      price_data: {
        currency: 'eur',
        product_data: {
          name: brand.spectacleNameStripe,
          description: brand.stripeLineChild
        },
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

    // {CHECKOUT_SESSION_ID} est remplacé par Stripe (query utile pour logs / debug)
    success_url: `${process.env.PUBLIC_SITE_URL}/success?order_id=${orderId}&session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${process.env.PUBLIC_SITE_URL}/cancel?order_id=${orderId}`
  })

  /* =====================
     5) Sauver l’ID Stripe
  ===================== */
  await supabaseAdmin
    .from('order')
    .update({ stripe_session_id: session.id })
    .eq('id', orderId)

  console.info('[billetterie:create-checkout-session]', {
    orderId,
    stripeSessionId: session.id,
    successUrlHost: process.env.PUBLIC_SITE_URL ?? '(PUBLIC_SITE_URL non défini)'
  })

  return { url: session.url }
})
