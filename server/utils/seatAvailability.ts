import { SEAT_STATUS } from '../../constants'

export type SeatReservationRow = {
  seat_id: string
  status: string
  expires_at?: string | null
}

/** Hold expiré = place libre ; paid = toujours bloquante. */
export function isReservationBlockingSeat(
  row: SeatReservationRow,
  nowMs: number = Date.now()
): boolean {
  if (row.status === SEAT_STATUS.PAID) return true
  if (row.status === SEAT_STATUS.HOLD) {
    const exp = row.expires_at ? Date.parse(row.expires_at) : Number.NaN
    return Number.isFinite(exp) && exp > nowMs
  }
  return false
}

export function reservationBlocksSeatId(
  reservations: SeatReservationRow[],
  seatId: string,
  nowMs: number = Date.now()
): boolean {
  return reservations.some((r) => r.seat_id === seatId && isReservationBlockingSeat(r, nowMs))
}
