import { supabaseAdmin } from '../lib/supabaseAdmin'
import {
  EVENT_ID,
  ERROR_NO_SEATS_SELECTED,
  ERROR_MISSING_CUSTOMER_INFO,
  ERROR_SEATS_UNAVAILABLE,
  ERROR_CREATE_RESERVATION_FAILED
} from '../../constants'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)

  const {
    seatIds,
    firstName,
    lastName,
    email,
    phone
  } = body

  if (!seatIds || !Array.isArray(seatIds) || seatIds.length === 0) {
    throw createError({
      statusCode: 400,
      statusMessage: ERROR_NO_SEATS_SELECTED
    })
  }

  if (!firstName || !lastName || !email || !phone) {
    throw createError({
      statusCode: 400,
      statusMessage: ERROR_MISSING_CUSTOMER_INFO
    })
  }

  const { data, error } = await supabaseAdmin.rpc('hold_seats', {
    p_seat_ids: seatIds,
    p_event_id: EVENT_ID,
    p_first_name: firstName,
    p_last_name: lastName,
    p_email: email,
    p_phone: phone
  })

  if (error) {
    console.error('hold_seats error:', error)
    throw createError({
      statusCode: 409,
      statusMessage: ERROR_SEATS_UNAVAILABLE
    })
  }

  if (!data || data.length === 0) {
    throw createError({
      statusCode: 500,
      statusMessage: ERROR_CREATE_RESERVATION_FAILED
    })
  }

  return {
    orderId: data[0].order_id,
    orderToken: data[0].order_token,
    expiresAt: data[0].expires_at
  }
})
