import { supabaseAdmin } from '../lib/supabaseAdmin'
import { EVENT_ID, SEAT_STATUS, STAFF_RESERVED_SEAT_IDS } from '../../constants'
import { tApiError } from '../../locales/frDisplay'

type SeatStatus = 'free' | 'hold' | 'paid' | 'staff'

export default defineEventHandler(async () => {
  // 1️⃣ Tous les sièges
  const { data: seats, error: seatError } = await supabaseAdmin
    .from('seat')
    .select('id, label')

  if (seatError) {
    throw createError({
      statusCode: 500,
      statusMessage: tApiError('loadSeatsFailed')
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
      statusMessage: tApiError('loadReservationsFailed')
    })
  }

  // 3️⃣ Fusion DB → UI
  const reservationMap = new Map<string, SeatStatus>()

  reservations.forEach(r => {
    reservationMap.set(r.seat_id, r.status)
  })

  return seats.map(seat => {
    const reserved = reservationMap.get(seat.id)
    let status: SeatStatus = SEAT_STATUS.FREE
    if (reserved === SEAT_STATUS.HOLD || reserved === SEAT_STATUS.PAID) {
      status = reserved
    } else if (STAFF_RESERVED_SEAT_IDS.includes(seat.id)) {
      status = SEAT_STATUS.STAFF
    }
    return {
      id: seat.id,
      label: seat.label,
      status
    }
  })
})


