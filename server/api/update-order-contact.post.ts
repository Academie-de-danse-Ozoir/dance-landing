import { supabaseAdmin } from '../lib/supabaseAdmin'
import {
  ORDER_STATUS,
  MAX_LENGTH,
  RATE_LIMIT_UPDATE_ORDER_CONTACT_PER_MINUTE
} from '../../constants'
import { tApiError } from '../../locales/frDisplay'
import { checkRateLimit, getClientIp } from '../utils/rateLimit'

function trimStr(s: unknown, max: number): string {
  const str = typeof s === 'string' ? s.trim() : ''
  if (str.length > max) throw createError({ statusCode: 400, statusMessage: tApiError('fieldTooLong') })
  return str
}

export default defineEventHandler(async (event) => {
  const ip = getClientIp(event)
  if (!checkRateLimit(ip, 'update-contact', RATE_LIMIT_UPDATE_ORDER_CONTACT_PER_MINUTE).ok) {
    throw createError({ statusCode: 429, statusMessage: tApiError('rateLimit') })
  }

  const body = await readBody(event)
  const { orderId, orderToken: rawToken, firstName, lastName, email, phone } = body as {
    orderId?: string
    orderToken?: string
    firstName?: unknown
    lastName?: unknown
    email?: unknown
    phone?: unknown
  }

  const orderToken =
    typeof rawToken === 'string' ? rawToken.trim() : rawToken != null ? String(rawToken).trim() : ''

  if (!orderId || !orderToken) {
    throw createError({
      statusCode: 400,
      statusMessage: !orderToken ? tApiError('missingOrderToken') : tApiError('missingOrderId')
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
    throw createError({ statusCode: 400, statusMessage: tApiError('missingCustomerInfo') })
  }

  let phoneDigits = ph.replace(/\D/g, '')
  if (phoneDigits.startsWith('33') && phoneDigits.length === 11) {
    phoneDigits = `0${phoneDigits.slice(2)}`
  }
  if (!/^0[1-9]\d{8}$/.test(phoneDigits)) {
    throw createError({ statusCode: 400, statusMessage: tApiError('invalidRequest') })
  }

  const { data: order, error: orderError } = await supabaseAdmin
    .from('order')
    .select('id, status')
    .eq('id', orderId)
    .eq('order_token', orderToken)
    .single()

  if (orderError || !order || order.status !== ORDER_STATUS.PENDING) {
    throw createError({ statusCode: 404, statusMessage: tApiError('orderNotFound') })
  }

  const { error: updateError } = await supabaseAdmin
    .from('order')
    .update({
      first_name: fName,
      last_name: lName,
      email: em,
      phone: phoneDigits
    })
    .eq('id', orderId)

  if (updateError) {
    console.error('[billetterie:update-order-contact]', updateError)
    throw createError({ statusCode: 500, statusMessage: tApiError('ticketDetailsSaveFailed') })
  }

  return { ok: true }
})
