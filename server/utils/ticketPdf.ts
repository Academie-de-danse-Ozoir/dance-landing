import PDFDocument from 'pdfkit'
import { brand, pdfOrderRecapFooter } from '../../locales/frDisplay'

export interface TicketPdfLineItem {
  description: string
  quantity: number
  unitPriceFormatted: string
  totalFormatted: string
}

/** Détail d’un billet (pour les pages billets et le récap) */
export interface TicketPdfTicket {
  seatLabel: string
  firstName?: string | null
  lastName?: string | null
  ticketType?: 'adult' | 'child' | null
}

export interface TicketPdfData {
  orderId: string
  /** Libellés des places (ex: ["A1", "A2"]) — utilisé si tickets non fourni */
  seatLabels: string[]
  /** Détail par billet (place + titulaire + type adulte/enfant). Si fourni, remplace seatLabels pour les pages billets. */
  tickets?: TicketPdfTicket[] | null
  /** Optionnel : nom du client (contact) */
  customerName?: string | null
  /** Optionnel : email du client */
  customerEmail?: string | null
  /** Optionnel : montant total formaté (ex: "150,00 €") */
  amountTotalFormatted?: string | null
  /** Optionnel : date de paiement formatée */
  paidAtFormatted?: string | null
  /** Optionnel : date du spectacle */
  eventDate?: string | null
  /** Optionnel : lieu du spectacle */
  eventVenue?: string | null
  /** Optionnel : numéro de téléphone */
  customerPhone?: string | null
  /** Optionnel : lignes du détail (pour la page récap commande) */
  lineItems?: TicketPdfLineItem[] | null
}

/**
 * Génère un PDF : 1 page A4 par billet (infos du billet uniquement) + 1 page A4 récapitulatif de la commande.
 * Ex. 2 places → 3 pages (billet 1, billet 2, récap commande).
 */
export function buildTicketPdfBuffer(data: TicketPdfData): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: 'A4', margin: 40 })
    const chunks: Buffer[] = []

    doc.on('data', (chunk: Buffer) => chunks.push(chunk))
    doc.on('end', () => resolve(Buffer.concat(chunks)))
    doc.on('error', reject)

    const pageWidth = doc.page.width - 80
    const ticketList = (data.tickets && data.tickets.length > 0)
      ? data.tickets
      : data.seatLabels.map((seatLabel) => ({ seatLabel } as TicketPdfTicket))

    // —— Pages billets : 1 A4 par place (place, titulaire, type adulte/enfant) ——
    ticketList.forEach((ticket, index) => {
      if (index > 0) doc.addPage({ size: 'A4', margin: 40 })

      const label = ticket.seatLabel
      const attendeeName = [ticket.firstName, ticket.lastName].filter(Boolean).join(' ') || null
      const typeLabel = ticket.ticketType === 'child' ? 'Enfant' : ticket.ticketType === 'adult' ? 'Adulte' : null

      // Bandeau haut
      doc
        .rect(0, 0, doc.page.width, 72)
        .fill('#2d2a26')
      doc
        .fillColor('#c9b896')
        .fontSize(10)
        .text(brand.billetterieLabel.toUpperCase(), 40, 26, { align: 'center', width: pageWidth })
      doc
        .fillColor('#ffffff')
        .fontSize(20)
        .font('Helvetica-Bold')
        .text(brand.spectacleName, 40, 44, { align: 'center', width: pageWidth })

      doc.y = 100

      const cardY = doc.y
      const cardHeight = 240
      doc
        .strokeColor('#e7e5e4')
        .lineWidth(1)
        .roundedRect(40, cardY, pageWidth, cardHeight, 8)
        .stroke()

      let rowY = cardY + 24

      doc
        .fillColor('#78716c')
        .fontSize(10)
        .font('Helvetica')
        .text('Numéro de commande', 56, rowY)
      doc
        .fillColor('#1c1917')
        .fontSize(18)
        .font('Helvetica-Bold')
        .text(data.orderId, 56, rowY + 16)
      rowY += 48

      doc
        .fillColor('#78716c')
        .fontSize(10)
        .font('Helvetica')
        .text('Place', 56, rowY)
      doc
        .fillColor('#1c1917')
        .fontSize(28)
        .font('Helvetica-Bold')
        .text(label, 56, rowY + 16)
      rowY += 52

      if (attendeeName) {
        doc
          .fillColor('#78716c')
          .fontSize(10)
          .font('Helvetica')
          .text('Titulaire du billet', 56, rowY)
        doc
          .fillColor('#1c1917')
          .fontSize(14)
          .font('Helvetica')
          .text(attendeeName, 56, rowY + 16)
        rowY += 40
      }
      if (typeLabel) {
        doc
          .fillColor('#78716c')
          .fontSize(10)
          .font('Helvetica')
          .text('Type', 56, rowY)
        doc
          .fillColor('#1c1917')
          .fontSize(14)
          .font('Helvetica')
          .text(typeLabel, 56, rowY + 16)
        rowY += 40
      }

      if (data.eventDate || data.eventVenue) {
        doc
          .fillColor('#78716c')
          .fontSize(10)
          .font('Helvetica')
          .text(brand.pdfLabelEvent, 56, rowY)
        const eventLine = [data.eventDate, data.eventVenue].filter(Boolean).join(' – ')
        doc
          .fillColor('#1c1917')
          .fontSize(11)
          .font('Helvetica')
          .text(eventLine, 56, rowY + 16)
      }

      doc
        .fillColor('#a8a29e')
        .fontSize(9)
        .font('Helvetica')
        .text(brand.pdfPresentTicketAtEntry, 40, cardY + cardHeight + 28, {
          align: 'center',
          width: pageWidth
        })
    })

    // —— Dernière page A4 : récapitulatif de la commande ——
    doc.addPage({ size: 'A4', margin: 40 })

    doc
      .rect(0, 0, doc.page.width, 72)
      .fill('#2d2a26')
    doc
      .fillColor('#c9b896')
      .fontSize(10)
      .text(brand.billetterieLabel.toUpperCase(), 40, 26, { align: 'center', width: pageWidth })
    doc
      .fillColor('#ffffff')
      .fontSize(18)
      .font('Helvetica-Bold')
      .text('Récapitulatif de la commande', 40, 44, { align: 'center', width: pageWidth })

    doc.y = 100

    const recapX = 56
    let recapY = doc.y

    const labelStyle = () => {
      doc.fillColor('#78716c').fontSize(10).font('Helvetica')
    }
    const valueStyle = () => {
      doc.fillColor('#1c1917').fontSize(12).font('Helvetica')
    }
    const valueBold = () => {
      doc.fillColor('#1c1917').fontSize(12).font('Helvetica-Bold')
    }

    labelStyle()
    doc.text('Numéro de commande', recapX, recapY)
    valueBold()
    doc.text(data.orderId, recapX, recapY + 18)
    recapY += 44

    if (data.customerName) {
      labelStyle()
      doc.text('Réservation au nom de', recapX, recapY)
      valueStyle()
      doc.text(data.customerName, recapX, recapY + 18)
      recapY += 40
    }
    if (data.customerEmail) {
      labelStyle()
      doc.text('Email', recapX, recapY)
      valueStyle()
      doc.text(data.customerEmail, recapX, recapY + 18)
      recapY += 38
    }
    if (data.customerPhone) {
      labelStyle()
      doc.text('Téléphone', recapX, recapY)
      valueStyle()
      doc.text(data.customerPhone, recapX, recapY + 18)
      recapY += 38
    }

    labelStyle()
    doc.text('Places réservées', recapX, recapY)
    valueStyle()
    doc.text(
      ticketList.map((t) => t.seatLabel).join(', '),
      recapX,
      recapY + 18
    )
    recapY += 44

    const hasAttendeeInfo = ticketList.some((t) => t.firstName || t.lastName || t.ticketType)
    if (hasAttendeeInfo) {
      labelStyle()
      doc.text('Détail des billets', recapX, recapY)
      recapY += 20
      ticketList.forEach((t) => {
        const name = [t.firstName, t.lastName].filter(Boolean).join(' ') || '—'
        const type = t.ticketType === 'child' ? 'Enfant' : t.ticketType === 'adult' ? 'Adulte' : '—'
        valueStyle()
        doc.text(`${t.seatLabel} : ${name} (${type})`, recapX, recapY)
        recapY += 20
      })
      recapY += 8
    }

    if (data.eventDate || data.eventVenue) {
      labelStyle()
      doc.text(brand.pdfLabelEvent, recapX, recapY)
      valueStyle()
      doc.text([data.eventDate, data.eventVenue].filter(Boolean).join(' – '), recapX, recapY + 18)
      recapY += 44
    }

    if (data.lineItems && data.lineItems.length > 0) {
      labelStyle()
      doc.text('Détail du paiement', recapX, recapY)
      recapY += 22
      data.lineItems.forEach((item) => {
        valueStyle()
        doc.text(
          `${item.description} × ${item.quantity} — ${item.unitPriceFormatted} — ${item.totalFormatted}`,
          recapX,
          recapY
        )
        recapY += 22
      })
      recapY += 8
    }

    if (data.amountTotalFormatted) {
      labelStyle()
      doc.text('Total payé', recapX, recapY)
      valueBold()
      doc.text(data.amountTotalFormatted, recapX, recapY + 18)
      recapY += 44
    }
    if (data.paidAtFormatted) {
      labelStyle()
      doc.text('Date de paiement', recapX, recapY)
      valueStyle()
      doc.text(data.paidAtFormatted, recapX, recapY + 18)
      recapY += 44
    }

    // Indication sur la même page, juste sous le récap
    doc
      .fillColor('#a8a29e')
      .fontSize(9)
      .font('Helvetica')
      .text(pdfOrderRecapFooter(), 40, recapY + 32, { align: 'center', width: pageWidth })

    doc.end()
  })
}
