import PDFDocument from 'pdfkit'
import { formatFrenchPhoneForDisplay } from '../../utils/phoneInput'
import { brand, pdfOrderRecapFooter } from '../../locales/frDisplay'
import { pdfAssetsBundle } from './pdfAssets.bundle'

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

const DISPLAY_FONT = 'TicketDisplay'
const TEXT_FONT = 'TicketText'

function registerPdfFont(
  doc: InstanceType<typeof PDFDocument>,
  name: string,
  buffer: Buffer,
  fallback: string
): string {
  if (!buffer?.length) return fallback
  try {
    doc.registerFont(name, buffer)
    return name
  } catch {
    return fallback
  }
}

/**
 * Génère un PDF : 1 page A4 par billet (infos du billet uniquement) + 1 page A4 récapitulatif de la commande.
 * Ex. 2 places → 3 pages (billet 1, billet 2, récap commande).
 */
export function buildTicketPdfBuffer(data: TicketPdfData): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ size: 'A4', margin: 40, pdfVersion: '1.4', compress: false })
      const chunks: Buffer[] = []
      const debugPdf = process.env.DEBUG_TICKET_PDF === '1'

      if (!pdfAssetsBundle.afficheVerticalJpg?.length) {
        throw new Error('[ticket-pdf] Missing affiche_vertical.jpg in pdfAssetsBundle')
      }
      if (!pdfAssetsBundle.titleTtf?.length || !pdfAssetsBundle.textTtf?.length) {
        throw new Error('[ticket-pdf] Missing fonts in pdfAssetsBundle')
      }

      const displayFontName = registerPdfFont(
        doc,
        DISPLAY_FONT,
        pdfAssetsBundle.titleTtf,
        'Times-Bold'
      )
      const textFontName = registerPdfFont(doc, TEXT_FONT, pdfAssetsBundle.textTtf, 'Helvetica')

      doc.on('data', (chunk: Buffer) => chunks.push(chunk))
      doc.on('end', () => {
        const finalBuffer = Buffer.concat(chunks)
        if (debugPdf) {
          console.info('[ticket-pdf] generated', {
            orderId: data.orderId,
            displayFontName,
            textFontName,
            heroBytes: pdfAssetsBundle.afficheVerticalJpg.length,
            sizeBytes: finalBuffer.length
          })
        }
        resolve(finalBuffer)
      })
      doc.on('error', reject)

      const pageWidth = doc.page.width - 80
      const pageHeight = doc.page.height
      const heroImage = pdfAssetsBundle.afficheVerticalJpg
      const brandLogo = pdfAssetsBundle.brandLogoPng

      const palette = {
        footerBg: '#1a1a2e',
        cardBg: '#ffffff',
        cardBorder: '#dee2e6',
        textPrimary: '#212529',
        textSecondary: '#495057',
        textMuted: '#6c757d',
        accent: '#0d6efd',
        accentSoft: '#86b7fe'
      }
      const ticketList =
        data.tickets && data.tickets.length > 0
          ? data.tickets
          : data.seatLabels.map((seatLabel) => ({ seatLabel }) as TicketPdfTicket)
      const headerHeight = 102

      function drawHeroBackgroundCover() {
        doc.image(heroImage, 0, 0, {
          cover: [doc.page.width, pageHeight],
          align: 'center',
          valign: 'center'
        })
      }

      // —— Pages billets : 1 A4 par place ——
      ticketList.forEach((ticket, index) => {
        if (index > 0) doc.addPage({ size: 'A4', margin: 40 })

        const label = ticket.seatLabel
        const attendeeName = [ticket.firstName, ticket.lastName].filter(Boolean).join(' ') || null
        const typeLabel =
          ticket.ticketType === 'child' ? 'Enfant' : ticket.ticketType === 'adult' ? 'Adulte' : null

        drawHeroBackgroundCover()
        doc.save().fillOpacity(0.55).rect(0, 0, doc.page.width, pageHeight).fill('#0f1726').restore()

        doc.rect(0, 0, doc.page.width, headerHeight).fill(palette.footerBg)
        doc
          .fillColor('#c9b896')
          .font(textFontName)
          .fontSize(8)
          .text(brand.billetterieLabel.toUpperCase(), 40, 26, {
            align: 'center',
            width: pageWidth,
            characterSpacing: 1.3
          })
        doc
          .fillColor('#ffffff')
          .fontSize(26)
          .font(displayFontName)
          .text(brand.spectacleName, 40, 46, { align: 'center', width: pageWidth })

        doc.y = 142

        const cardX = 40
        const cardY = doc.y
        const cardW = pageWidth
        const placeSeatFontSize = 40
        const cardBaseHeight = 292
        const placeFontScale = placeSeatFontSize / 30
        const cardHeight = Math.round(cardBaseHeight * placeFontScale)

        const cardRadius = 10
        const cardShadow: { dx: number; dy: number; o: number }[] = [
          { dx: 0.4, dy: 0.7, o: 0.022 },
          { dx: 0.8, dy: 1.4, o: 0.028 },
          { dx: 1.2, dy: 2, o: 0.025 }
        ]
        for (const s of cardShadow) {
          doc.save()
          doc.fillColor('#000000')
          doc.fillOpacity(s.o)
          doc.roundedRect(cardX + s.dx, cardY + s.dy, cardW, cardHeight, cardRadius)
          doc.fill()
          doc.restore()
        }

        const cardGradient = doc.linearGradient(cardX, cardY, cardX + cardW, cardY + cardHeight)
        cardGradient.stop(0, '#1a1a2e')
        cardGradient.stop(0.58, '#23233f')
        cardGradient.stop(1, '#2d2d52')

        doc.save()
        doc.roundedRect(cardX, cardY, cardW, cardHeight, cardRadius).clip()
        doc.rect(cardX, cardY, cardW, cardHeight).fill(cardGradient)
        doc.restore()

        if (brandLogo?.length) {
          const logoH = 40
          const lPadR = 20
          const lPadT = 16
          const logoMeta = doc.openImage(brandLogo)
          const logoW = logoMeta?.width && logoMeta?.height ? (logoMeta.width / logoMeta.height) * logoH : logoH * 2
          doc.image(brandLogo, cardX + cardW - lPadR - logoW, cardY + lPadT, { height: logoH })
        }

        const cardLabelColor = '#d7dbe7'
        const cardPrimaryColor = '#f5f7ff'
        const cardSecondaryColor = '#e6e9f5'
        const cardAccentColor = '#c9b896'

        const padTop = Math.round(24 * placeFontScale)
        const gapAfterOrder = Math.round(48 * placeFontScale)
        const gapAfterPlace = Math.round(52 * placeFontScale)
        const gapAfterNameOrType = Math.round(40 * placeFontScale)
        const footOffset = Math.round(22 * placeFontScale)

        let rowY = cardY + padTop

        doc
          .fillColor(cardLabelColor)
          .fontSize(10)
          .font(textFontName)
          .text('Numéro de commande', 56, rowY)
        doc
          .fillColor(cardPrimaryColor)
          .fontSize(18)
          .font(textFontName)
          .text(data.orderId, 56, rowY + 16)
        rowY += gapAfterOrder

        doc.fillColor(cardLabelColor).fontSize(10).font(textFontName).text('Place', 56, rowY)
        doc
          .fillColor(cardAccentColor)
          .fontSize(placeSeatFontSize)
          .font(displayFontName)
          .text(label, 56, rowY + 16)
        rowY += gapAfterPlace

        if (attendeeName) {
          doc
            .fillColor(cardLabelColor)
            .fontSize(10)
            .font(textFontName)
            .text('Titulaire du billet', 56, rowY)
          doc
            .fillColor(cardPrimaryColor)
            .fontSize(14)
            .font(textFontName)
            .text(attendeeName, 56, rowY + 16)
          rowY += gapAfterNameOrType
        }
        if (typeLabel) {
          doc.fillColor(cardLabelColor).fontSize(10).font(textFontName).text('Type', 56, rowY)
          doc
            .fillColor(cardPrimaryColor)
            .fontSize(14)
            .font(textFontName)
            .text(typeLabel, 56, rowY + 16)
          rowY += gapAfterNameOrType
        }

        if (data.eventDate || data.eventVenue) {
          doc
            .fillColor(cardLabelColor)
            .fontSize(10)
            .font(textFontName)
            .text(brand.pdfLabelEvent, 56, rowY)
          const eventLine = [data.eventDate, data.eventVenue].filter(Boolean).join(' – ')
          doc
            .fillColor(cardSecondaryColor)
            .fontSize(11)
            .font(textFontName)
            .text(eventLine, 56, rowY + 16)
        }

        doc
          .fillColor(cardLabelColor)
          .fontSize(10)
          .font(textFontName)
          .text(brand.pdfPresentTicketAtEntry, 56, cardY + cardHeight - footOffset, {
            align: 'center',
            width: pageWidth - 32
          })
      })

      // —— Dernière page A4 : récapitulatif ——
      doc.addPage({ size: 'A4', margin: 40 })

      doc.rect(0, 0, doc.page.width, headerHeight).fill(palette.footerBg)
      doc
        .fillColor('#c9b896')
        .font(textFontName)
        .fontSize(8)
        .text(brand.billetterieLabel.toUpperCase(), 40, 26, {
          align: 'center',
          width: pageWidth,
          characterSpacing: 1.3
        })
      doc
        .fillColor('#ffffff')
        .fontSize(26)
        .font(displayFontName)
        .text('Récapitulatif de la commande', 40, 46, { align: 'center', width: pageWidth })

      doc.y = 142

      const recapX = 56
      let recapY = doc.y

      const labelStyle = () => {
        doc.fillColor(palette.textMuted).fontSize(10).font(textFontName)
      }
      const valueStyle = () => {
        doc.fillColor(palette.textSecondary).fontSize(12).font(textFontName)
      }
      const valueBold = () => {
        doc.fillColor(palette.textPrimary).fontSize(12).font(textFontName)
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
        const phoneForPdf = formatFrenchPhoneForDisplay(data.customerPhone) || data.customerPhone
        doc.text(phoneForPdf, recapX, recapY + 18)
        recapY += 38
      }

      labelStyle()
      doc.text('Places réservées', recapX, recapY)
      valueStyle()
      doc.text(ticketList.map((t) => t.seatLabel).join(', '), recapX, recapY + 18)
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

      const linkColor = '#0d6efd'
      const w = pageWidth
      const x = 40
      const displayEmail = brand.displayEmail
      const displayPhone = formatFrenchPhoneForDisplay(brand.contactPhone) || brand.contactPhone
      let yContact = recapY + 28

      doc.fontSize(10).font(textFontName)

      doc.fillColor(palette.textSecondary)
      doc.text('Pour toute information complémentaire, contactez-nous par e-mail à', x, yContact, {
        width: w,
        align: 'center'
      })
      yContact = doc.y + 5

      doc.fillColor(linkColor)
      doc.text(displayEmail, x, yContact, { width: w, align: 'center', underline: true })
      yContact = doc.y + 5

      doc.fillColor(palette.textSecondary)
      doc.text('ou par téléphone au', x, yContact, { width: w, align: 'center' })
      yContact = doc.y + 5

      doc.fillColor(linkColor)
      doc.text(`${displayPhone}.`, x, yContact, { width: w, align: 'center', underline: true })

      doc
        .fillColor('#a8a29e')
        .fontSize(9)
        .font(textFontName)
        .text(pdfOrderRecapFooter(), 40, doc.y + 18, { align: 'center', width: pageWidth })

      doc.end()
    } catch (err) {
      reject(err)
    }
  })
}
