import type { H3Event } from 'h3'
import { EVENT_ID } from '../../constants'
import { tApiError } from '../../locales/frDisplay'
import { isAdminEvent } from './adminSession'
import { supabaseAdmin } from '../lib/supabaseAdmin'

export type EventBookingState = {
  id: string
  name: string | null
  startsAt: string | null
  bookingClosed: boolean
}

export async function getEventBookingState(eventId: string = EVENT_ID): Promise<EventBookingState> {
  const { data, error } = await supabaseAdmin
    .from('event')
    .select('id, name, starts_at')
    .eq('id', eventId)
    .single()

  if (error || !data) {
    throw createError({
      statusCode: 500,
      statusMessage: tApiError('loadEventFailed')
    })
  }

  const startsAt = (data.starts_at as string | null) ?? null
  const startMs = startsAt != null ? Date.parse(startsAt) : Number.NaN
  const bookingClosed = Number.isFinite(startMs) && startMs <= Date.now()

  return {
    id: data.id as string,
    name: (data.name as string | null) ?? null,
    startsAt,
    bookingClosed
  }
}

export function assertBookingOpen(state: EventBookingState): void {
  if (state.bookingClosed) {
    throw createError({
      statusCode: 403,
      statusMessage: tApiError('bookingClosed')
    })
  }
}

/** Billetterie publique uniquement — le back-office admin peut réserver après la date. */
export function assertBookingOpenForRequest(event: H3Event, state: EventBookingState): void {
  if (isAdminEvent(event)) return
  assertBookingOpen(state)
}
