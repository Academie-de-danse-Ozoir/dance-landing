import Stripe from 'stripe'
import { buffer } from 'node:stream/consumers'
import { supabaseAdmin } from '../lib/supabaseAdmin'
import { ORDER_STATUS, SEAT_STATUS } from '../../constants'
import { tApiError } from '../../locales/frDisplay'
import { sendPaidOrderTicketEmailIfNeeded } from '../utils/paidOrderTicketEmail'
import { updateOrderStatusAndClearContact } from '../utils/updateOrderStatusAndClearContact'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-12-15.clover',
})

export default defineEventHandler(async (event) => {
  const rawBody = await buffer(event.node.req)
  const signature = event.node.req.headers['stripe-signature'] as string

  let stripeEvent: Stripe.Event

  try {
    stripeEvent = stripe.webhooks.constructEvent(
      rawBody,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    )
  } catch (err: any) {
    console.error('[billetterie:stripe-webhook] Signature invalide (STRIPE_WEBHOOK_SECRET / corps brut ?)', err?.message ?? err)
    throw createError({ statusCode: 400, statusMessage: tApiError('invalidRequest') })
  }

  console.info('[billetterie:stripe-webhook] Événement reçu', { type: stripeEvent.type, id: stripeEvent.id })

  if (stripeEvent.type === 'checkout.session.completed') {
    const eventId = stripeEvent.id
    const session = stripeEvent.data.object as Stripe.Checkout.Session
    const orderId = session.metadata?.order_id

    console.info('[billetterie:stripe-webhook] checkout.session.completed', {
      eventId,
      orderId: orderId ?? '(absent)',
      payment_status: session.payment_status,
      sessionId: session.id
    })

    if (!orderId) {
      console.warn('[billetterie:stripe-webhook] Pas de metadata.order_id → rien à faire')
      return { received: true }
    }
    if (session.payment_status !== ORDER_STATUS.PAID) {
      console.info('[billetterie:stripe-webhook] payment_status !== paid → sortie', { payment_status: session.payment_status })
      return { received: true }
    }

    const { data: order } = await supabaseAdmin
      .from('order')
      .select('id, status, email, ticket_sent, first_name, last_name, phone')
      .eq('id', orderId)
      .single()

    if (!order) {
      console.warn('[billetterie:stripe-webhook] Commande introuvable en BDD', { orderId })
      return { received: true }
    }

    /* Sync-checkout a souvent déjà mis PAID avant ce handler — envoyer le mail si pas encore fait */
    if (order.status === ORDER_STATUS.PAID) {
      if (!order.ticket_sent) {
        console.info('[billetterie:mail] Commande déjà PAID (sync ou retry) — envoi email si besoin', { orderId })
        try {
          const emailResult = await sendPaidOrderTicketEmailIfNeeded(session, orderId)
          console.info('[billetterie:mail] Résultat envoi (branche déjà-PAID)', { orderId, emailResult })
        } catch (e) {
          console.error('[billetterie:mail] Échec envoi (branche déjà-PAID)', { orderId, e })
          throw e
        }
      } else {
        console.info('[billetterie:stripe-webhook] Commande déjà PAID + ticket_sent', { orderId })
      }
      return { received: true }
    }

    if (order.status === ORDER_STATUS.REFUNDED) {
      console.info('[billetterie:stripe-webhook] Commande déjà REFUNDED', { orderId })
      return { received: true }
    }

    console.info('[billetterie:stripe-webhook] Commande avant traitement', { orderId, status: order.status })

    const { data: reservations } = await supabaseAdmin
      .from('seat_reservation')
      .select('id, expires_at')
      .eq('order_id', orderId)
      .eq('status', SEAT_STATUS.HOLD)

    const now = Date.now()

    const hasValidHolds =
      reservations &&
      reservations.length > 0 &&
      reservations.every(
        (r) => new Date(r.expires_at).getTime() > now
      )

    if (
      order.status === ORDER_STATUS.EXPIRED ||
      order.status === ORDER_STATUS.CANCELED ||
      !hasValidHolds
    ) {
      console.warn('[billetterie:stripe-webhook] Branche REMBOURSEMENT (holds invalides ou commande expirée/canceled)', {
        orderId,
        orderStatus: order.status,
        hasValidHolds,
        holdsCount: reservations?.length ?? 0
      })
      await supabaseAdmin
        .from('order')
        .update({ status: ORDER_STATUS.REFUNDED })
        .eq('id', orderId)

      const paymentIntentId =
        typeof session.payment_intent === 'string'
          ? session.payment_intent
          : (session.payment_intent as { id?: string })?.id

      if (paymentIntentId) {
        try {
          await stripe.refunds.create({ payment_intent: paymentIntentId })
        } catch (e: any) {
          if (e?.code !== 'charge_already_refunded') console.error(e)
        }
      }

      if (reservations?.length) {
        await supabaseAdmin
          .from('seat_reservation')
          .delete()
          .eq('order_id', orderId)
          .eq('status', SEAT_STATUS.HOLD)
      }

      return { received: true }
    }

    console.info('[billetterie:stripe-webhook] Branche PAID — mise à jour commande + sièges', { orderId })
    const { data: updatedOrder } = await supabaseAdmin
      .from('order')
      .update({ status: ORDER_STATUS.PAID })
      .eq('id', orderId)
      .select('id, email, ticket_sent')
      .single()

    await supabaseAdmin
      .from('seat_reservation')
      .update({ status: SEAT_STATUS.PAID, expires_at: null })
      .eq('order_id', orderId)
      .eq('status', SEAT_STATUS.HOLD)

    console.info('[billetterie:mail] Après mise à jour PAID — décision email', {
      orderId,
      hasUpdatedOrder: !!updatedOrder,
      ticket_sent: updatedOrder?.ticket_sent,
      willSendEmail: !!(updatedOrder && !updatedOrder.ticket_sent)
    })

    if (updatedOrder && !updatedOrder.ticket_sent) {
      try {
        const emailResult = await sendPaidOrderTicketEmailIfNeeded(session, orderId)
        console.info('[billetterie:mail] Résultat envoi (branche normale)', { orderId, emailResult })
      } catch (mailErr) {
        console.error('[billetterie:mail] Échec envoi (branche normale)', { orderId, mailErr })
        throw mailErr
      }
    } else {
      console.info('[billetterie:mail] Pas d’envoi Mailjet (skip)', {
        orderId: updatedOrder?.id,
        reason: !updatedOrder
          ? 'pas de updatedOrder'
          : updatedOrder.ticket_sent
            ? 'ticket_sent déjà true'
            : 'inconnu'
      })
    }
  }

  if (stripeEvent.type === 'checkout.session.expired') {
    const session = stripeEvent.data.object as Stripe.Checkout.Session
    const orderId = session.metadata?.order_id
    if (orderId) {
      const { data: ord } = await supabaseAdmin.from('order').select('status').eq('id', orderId).single()
      if (ord?.status === ORDER_STATUS.PENDING) {
        await supabaseAdmin
          .from('seat_reservation')
          .delete()
          .eq('order_id', orderId)
          .eq('status', SEAT_STATUS.HOLD)
        await updateOrderStatusAndClearContact(orderId, ORDER_STATUS.EXPIRED)
        console.info('[billetterie:stripe-webhook] checkout.session.expired → holds supprimés, contact effacé', {
          orderId
        })
      }
    }
  }

  return { received: true }
})
