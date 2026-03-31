import { createError } from 'h3'
import { supabaseAdmin } from '../lib/supabaseAdmin'
import { tApiError } from '../../locales/frDisplay'

/**
 * Met à jour le statut et efface les champs contact (NULL puis repli sur '' si la BDD refuse NULL).
 * Utilisé à l’annulation, à l’expiration timer, et quand un hold a expiré côté API checkout.
 */
export async function updateOrderStatusAndClearContact(orderId: string, newStatus: string) {
  const clearedContact = {
    status: newStatus,
    first_name: null as string | null,
    last_name: null as string | null,
    email: null as string | null,
    phone: null as string | null,
    ticket_attendees: null as unknown
  }

  let { error: updateError } = await supabaseAdmin.from('order').update(clearedContact).eq('id', orderId)

  if (updateError) {
    console.warn('[billetterie:orderContactClear] NULL refusé, repli sur chaînes vides', updateError)
    ;({ error: updateError } = await supabaseAdmin
      .from('order')
      .update({
        status: newStatus,
        first_name: '',
        last_name: '',
        email: '',
        phone: '',
        ticket_attendees: null
      })
      .eq('id', orderId))
  }

  if (updateError) {
    console.error('[billetterie:orderContactClear] Échec mise à jour commande', updateError)
    throw createError({
      statusCode: 500,
      statusMessage: tApiError('orderUpdateFailed')
    })
  }
}
