export type SeatStatus = 'free' | 'hold' | 'paid'

export type Seat = {
  id: string
  label: string
  status: SeatStatus
  x: number
  y: number
}

export type ActiveOrder = {
  orderId: string
  expiresAt: string
  seatCount?: number
}
