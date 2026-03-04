import PDFDocument from 'pdfkit'

const TITLE = 'Spectacle de Danse d\'Ozoir'
const SUBTITLE = 'Billetterie officielle'

export interface TicketPdfData {
  orderId: string
  /** Libellés des places (ex: ["A1", "A2"]) */
  seatLabels: string[]
  /** Optionnel : nom du client */
  customerName?: string | null
}

/**
 * Génère un PDF contenant un billet par place (une page par billet).
 */
export function buildTicketPdfBuffer(data: TicketPdfData): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: 'A4', margin: 40 })
    const chunks: Buffer[] = []

    doc.on('data', (chunk: Buffer) => chunks.push(chunk))
    doc.on('end', () => resolve(Buffer.concat(chunks)))
    doc.on('error', reject)

    const pageWidth = doc.page.width - 80

    data.seatLabels.forEach((label, index) => {
      if (index > 0) doc.addPage({ size: 'A4', margin: 40 })

      // Bandeau haut
      doc
        .rect(0, 0, doc.page.width, 72)
        .fill('#2d2a26')
      doc
        .fillColor('#c9b896')
        .fontSize(10)
        .text(SUBTITLE.toUpperCase(), 40, 26, { align: 'center', width: pageWidth })
      doc
        .fillColor('#ffffff')
        .fontSize(20)
        .font('Helvetica-Bold')
        .text(TITLE, 40, 44, { align: 'center', width: pageWidth })

      doc.y = 100

      // Carte billet
      const cardY = 120
      const cardHeight = 180
      doc
        .strokeColor('#e7e5e4')
        .lineWidth(1)
        .roundedRect(40, cardY, pageWidth, cardHeight, 8)
        .stroke()

      doc
        .fillColor('#78716c')
        .fontSize(10)
        .font('Helvetica')
        .text('Billet n°', 56, cardY + 24)
      doc
        .fillColor('#1c1917')
        .fontSize(18)
        .font('Helvetica-Bold')
        .text(data.orderId, 56, cardY + 40)

      doc
        .fillColor('#78716c')
        .fontSize(10)
        .font('Helvetica')
        .text('Place', 56, cardY + 80)
      doc
        .fillColor('#1c1917')
        .fontSize(28)
        .font('Helvetica-Bold')
        .text(label, 56, cardY + 96)

      if (data.customerName) {
        doc
          .fillColor('#78716c')
          .fontSize(10)
          .font('Helvetica')
          .text('Réservation au nom de', 56, cardY + 140)
        doc
          .fillColor('#1c1917')
          .fontSize(14)
          .font('Helvetica')
          .text(data.customerName, 56, cardY + 156)
      }

      // Pied de page
      doc
        .fillColor('#a8a29e')
        .fontSize(9)
        .font('Helvetica')
        .text(
          'Présentez ce billet à l\'entrée du spectacle.',
          40,
          doc.page.height - 50,
          { align: 'center', width: pageWidth }
        )
    })

    doc.end()
  })
}
