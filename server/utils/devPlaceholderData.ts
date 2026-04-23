import type { TicketEmailData } from './ticketEmailTemplate'
import type { TicketPdfData } from './ticketPdf'
import { brand } from '../../locales/frDisplay'

function nowFr(): string {
  return new Date().toLocaleDateString('fr-FR', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

export function createPlaceholderEmailData(): TicketEmailData {
  return {
    orderId: 'preview-order-12345678',
    customerEmail: 'placeholder.client@example.com',
    firstName: 'Camille',
    lastName: 'Durand',
    seatCount: 3,
    amountTotalFormatted: '95,00 €',
    currency: 'eur',
    lineItems: [
      {
        description: brand.stripeLineAdult,
        quantity: 2,
        unitPriceFormatted: '35,00 €',
        totalFormatted: '70,00 €'
      },
      {
        description: brand.stripeLineChild,
        quantity: 1,
        unitPriceFormatted: '25,00 €',
        totalFormatted: '25,00 €'
      }
    ],
    ticketsUrl: null,
    ticketsInAttachment: true,
    receiptUrl: 'https://example.com/receipt-placeholder.pdf',
    stripeSessionId: 'cs_test_placeholder_123456',
    paymentStatus: 'paid',
    paidAtFormatted: nowFr()
  }
}

export function createPlaceholderPdfData(): TicketPdfData {
  const email = createPlaceholderEmailData()
  return {
    orderId: email.orderId,
    seatLabels: ['B12', 'B13', 'B14'],
    tickets: [
      { seatLabel: 'B12', firstName: 'Camille', lastName: 'Durand', ticketType: 'adult' },
      { seatLabel: 'B13', firstName: 'Lucas', lastName: 'Durand', ticketType: 'adult' },
      { seatLabel: 'B14', firstName: 'Lina', lastName: 'Durand', ticketType: 'child' }
    ],
    customerName: 'Camille Durand',
    customerEmail: email.customerEmail,
    customerPhone: '0601020304',
    amountTotalFormatted: email.amountTotalFormatted,
    paidAtFormatted: email.paidAtFormatted,
    eventDate: brand.eventDate,
    eventVenue: brand.eventVenue,
    lineItems: email.lineItems
  }
}
