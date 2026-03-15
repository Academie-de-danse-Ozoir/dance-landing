import { useSupabaseClient } from '#imports'

export function useSeatsRealtime(updateSeat: (seat: any) => void) {
  const supabase = useSupabaseClient()

  const channel = supabase
    .channel('seats-realtime')
    .on(
      'postgres_changes',
      {
        event: 'UPDATE',
        schema: 'public',
        table: 'seats'
      },
      (payload) => {
        updateSeat(payload.new)
      }
    )
    .subscribe()

  return () => {
    supabase.removeChannel(channel)
  }
}