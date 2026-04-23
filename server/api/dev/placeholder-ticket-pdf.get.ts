import { createError, defineEventHandler, setHeader } from 'h3'
import { buildTicketPdfBuffer } from '../../utils/ticketPdf'
import { createPlaceholderPdfData } from '../../utils/devPlaceholderData'

function assertDevOnly() {
  if (process.env.NODE_ENV === 'production') {
    throw createError({ statusCode: 404, statusMessage: 'Not found' })
  }
}

export default defineEventHandler(async (event) => {
  assertDevOnly()
  const pdf = await buildTicketPdfBuffer(createPlaceholderPdfData())
  setHeader(event, 'Content-Type', 'application/pdf')
  setHeader(event, 'Content-Disposition', 'inline; filename="placeholder-ticket.pdf"')
  return pdf
})
