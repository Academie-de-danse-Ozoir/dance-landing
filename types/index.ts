export type SeatStatus = 'free' | 'hold' | 'paid' | 'staff'

export type Seat = {
  id: string
  label: string
  status: SeatStatus
  x: number
  y: number
}

export type ActiveOrder = {
  orderId: string
  /** Token secret pour prouver la propriété de la commande (annulation, paiement, détails) */
  orderToken: string
  expiresAt: string
  seatCount?: number
  adultCount?: number
  childCount?: number
  /** IDs des places réservées (pour l’étape 2 du formulaire) */
  seatIds?: string[]
}

export type TicketDetail = {
  seatId: string
  seatLabel: string
  firstName: string
  lastName: string
  ticketType: 'adult' | 'child'
}
