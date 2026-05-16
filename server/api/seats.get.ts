import { supabaseAdmin } from '../lib/supabaseAdmin'
import { EVENT_ID, SEAT_STATUS } from '../../constants'
import { tApiError } from '../../locales/frDisplay'
import { getEventBookingState } from '../utils/eventBooking'
import { isReservationBlockingSeat } from '../utils/seatAvailability'

type SeatStatus = 'free' | 'hold' | 'paid' | 'staff'

export default defineEventHandler(async () => {
  const eventState = await getEventBookingState(EVENT_ID)

  const { data: seats, error: seatError } = await supabaseAdmin
    .from('seat')
    .select('id, label, reserved_for_staff')

  if (seatError) {
    throw createError({
      statusCode: 500,
      statusMessage: tApiError('loadSeatsFailed')
    })
  }

  const { data: reservations, error: resError } = await supabaseAdmin
    .from('seat_reservation')
    .select('seat_id, status, expires_at')
    .eq('event_id', EVENT_ID)
    .in('status', [SEAT_STATUS.HOLD, SEAT_STATUS.PAID])

  if (resError) {
    throw createError({
      statusCode: 500,
      statusMessage: tApiError('loadReservationsFailed')
    })
  }

  const now = Date.now()
  const reservationMap = new Map<string, SeatStatus>()

  for (const r of reservations ?? []) {
    if (!isReservationBlockingSeat(r, now)) continue
    reservationMap.set(r.seat_id, r.status as SeatStatus)
  }

  const seatList = seats.map((seat) => {
    const row = seat as { id: string; label: string; reserved_for_staff?: boolean }
    const reserved = reservationMap.get(row.id)
    let status: SeatStatus = SEAT_STATUS.FREE
    if (reserved === SEAT_STATUS.HOLD || reserved === SEAT_STATUS.PAID) {
      status = reserved
    } else if (row.reserved_for_staff === true) {
      status = SEAT_STATUS.STAFF
    }
    return {
      id: row.id,
      label: row.label,
      status
    }
  })

  return {
    seats: seatList,
    event: {
      startsAt: eventState.startsAt,
      bookingClosed: eventState.bookingClosed
    }
  }
})
