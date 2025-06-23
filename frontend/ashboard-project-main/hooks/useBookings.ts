import { useState, useEffect } from 'react'
import { supabase, Booking } from '@/lib/supabase'

export interface CalendarEvent {
  id: string
  title: string
  start: string
  end: string
  color: string
  customerName?: string
  customerPhone?: string
  serviceType?: string
  status?: string
  notes?: string
}

export const useBookings = () => {
  const [events, setEvents] = useState<CalendarEvent[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchBookings = async () => {
    try {
      setLoading(true)
      setError(null)

      // Get all booking data
      const { data, error } = await supabase
        .from('bookings')
        .select('*')
        .order('appointment_time', { ascending: true })

      if (error) throw error

      // Transform booking data to calendar event format
      const calendarEvents: CalendarEvent[] = (data || []).map((booking: Booking) => {
        const startTime = new Date(booking.appointment_time)
        const endTime = new Date(startTime.getTime() + booking.duration_minutes * 60000)

        // Set colors based on status
        let color = 'bg-blue-500'
        switch (booking.status) {
          case 'confirmed':
            color = 'bg-green-500'
            break
          case 'cancelled':
            color = 'bg-red-500'
            break
          case 'completed':
            color = 'bg-gray-500'
            break
          default:
            color = 'bg-blue-500'
        }

        return {
          id: booking.booking_id,
          title: `${booking.service_type} - ${booking.customer_name}`,
          start: startTime.toISOString(),
          end: endTime.toISOString(),
          color,
          customerName: booking.customer_name,
          customerPhone: booking.customer_phone || undefined,
          serviceType: booking.service_type,
          status: booking.status,
          notes: booking.notes || undefined
        }
      })

      setEvents(calendarEvents)
    } catch (err) {
      console.error('Error fetching bookings:', err)
      setError(err instanceof Error ? err.message : 'Failed to fetch bookings')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchBookings()
  }, [])

  // Real-time subscription to booking data changes
  useEffect(() => {
    const channel = supabase
      .channel('bookings-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'bookings' },
        () => {
          fetchBookings() // Re-fetch data
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  return { events, loading, error, refetch: fetchBookings }
} 