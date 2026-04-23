import { createError, defineEventHandler, getRequestURL } from 'h3'
import { buildTicketEmailHtml } from '../../utils/ticketEmailTemplate'
import { createPlaceholderEmailData } from '../../utils/devPlaceholderData'

function assertDevOnly() {
  if (process.env.NODE_ENV === 'production') {
    throw createError({ statusCode: 404, statusMessage: 'Not found' })
  }
}

export default defineEventHandler((event) => {
  assertDevOnly()
  const origin = getRequestURL(event).origin
  const html = buildTicketEmailHtml({
    ...createPlaceholderEmailData(),
    publicSiteUrl: origin
  })
  return html
})
