import { supabaseAdmin } from '../lib/supabaseAdmin'

type SeatStatus = 'free' | 'hold' | 'paid'

export default defineEventHandler(async () => {
  const EVENT_ID = 'eb53c5be-ac8a-4bdc-8dca-73ceff948e49'

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
    .in('status', ['hold', 'paid'])

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
    status: reservationMap.get(seat.id) ?? 'free'
  }))
})


