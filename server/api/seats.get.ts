import { supabaseAdmin } from '../lib/supabaseAdmin'
import { EVENT_ID, SEAT_STATUS } from '../../constants'

type SeatStatus = 'free' | 'hold' | 'paid'

export default defineEventHandler(async () => {
  // 1️⃣ Tous les sièges
  const { data: seats, error: seatError } = await supabaseAdmin
    .from('seat')
    .select('id, label')

  if (seatError) {
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to load seats'
    })
  }

  // 2️⃣ TOUTES les réservations existantes = BLOQUANTES
  const { data: reservations, error: resError } = await supabaseAdmin
    .from('seat_reservation')
    .select('seat_id, status')
    .eq('event_id', EVENT_ID)
    .in('status', [SEAT_STATUS.HOLD, SEAT_STATUS.PAID])

  if (resError) {
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to load reservations'
    })
  }

  // 3️⃣ Fusion DB → UI
  const reservationMap = new Map<string, SeatStatus>()

  reservations.forEach(r => {
    reservationMap.set(r.seat_id, r.status)
  })

  return seats.map(seat => ({
    id: seat.id,
    label: seat.label,
    status: reservationMap.get(seat.id) ?? SEAT_STATUS.FREE
  }))
})


