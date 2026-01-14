import { supabaseAdmin } from '../lib/supabaseAdmin'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)

  if (!body?.orderId) {
    throw createError({ statusCode: 400 })
  }

  const { error } = await supabaseAdmin.rpc(
    'expire_order_if_unpaid',
    { p_order_id: body.orderId }
  )

  if (error) {
    throw createError({
      statusCode: 500,
      statusMessage: error.message
    })
  }

  return { ok: true }
})
