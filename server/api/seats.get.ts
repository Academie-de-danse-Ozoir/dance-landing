import { supabaseAdmin } from '../lib/supabaseAdmin'

export default defineEventHandler(async () => {
  const EVENT_ID = 'eb53c5be-ac8a-4bdc-8dca-73ceff948e49'

  console.log('USING CLIENT:', supabaseAdmin)

  // 1️⃣ Récupérer les sièges
  const { data: seats, error: seatError } = await supabaseAdmin
    .from('seat')
    .select('id, label')

  if (seatError) {
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to load seats'
    })
  }

  // 2️⃣ Récupérer les réservations actives
  const { data: reservations, error: resError } = await supabaseAdmin
    .from('seat_reservation')
    .select('seat_id, status, expires_at')
    .eq('event_id', EVENT_ID)
    .or(
      `status.eq.paid,and(status.eq.hold,expires_at.gt.${new Date().toISOString()})`
    )

  if (resError) {
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to load reservations'
    })
  }

  // 3️⃣ Fusionner
  const reservationMap = new Map<
    string,
    'hold' | 'paid'
  >()

  reservations.forEach(r => {
    reservationMap.set(r.seat_id, r.status)
  })

  const result = seats.map(seat => ({
    id: seat.id,
    label: seat.label,
    status: reservationMap.get(seat.id) ?? 'free'
  }))

  return result
})
