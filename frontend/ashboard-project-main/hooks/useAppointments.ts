import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'

export interface AppointmentEvent {
  id: string
  title: string
  start: string
  end: string
  color: string
  service?: string
  user?: string
  status?: string
}

export const useAppointments = () => {
  const [events, setEvents] = useState<AppointmentEvent[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchAppointments = async () => {
    try {
      setLoading(true)
      setError(null)

      // Get all appointment data
      const { data, error } = await supabase
        .from('appointments')
        .select('*')
        .order('datetime', { ascending: true })

      if (error) throw error

      // Transform appointment data to calendar event format
      const calendarEvents: AppointmentEvent[] = (data || []).map((appointment: any) => {
        const startTime = new Date(appointment.datetime)
        // Set different durations based on service type
        let durationMinutes = 60 // Default 1 hour
        switch (appointment.service) {
          case 'hair':
            durationMinutes = 90 // 1.5 hours
            break
          case 'haircut':
            durationMinutes = 45 // 45 minutes
            break
          default:
            durationMinutes = 60 // 1 hour
        }
        const endTime = new Date(startTime.getTime() + durationMinutes * 60000)

        // Set colors based on service type and status
        let color = 'bg-blue-500'
        switch (appointment.service) {
          case 'hair':
            color = 'bg-purple-500'
            break
          case 'haircut':
            color = 'bg-green-500'
            break
          default:
            // Set colors based on status
            switch (appointment.status) {
              case 'confirmed':
                color = 'bg-blue-500'
                break
              case 'cancelled':
                color = 'bg-red-500'
                break
              case 'completed':
                color = 'bg-gray-500'
                break
              default:
                color = 'bg-orange-500'
            }
        }

        return {
          id: appointment.id,
          title: appointment.title || `${appointment.service?.toUpperCase() || 'Service'}`,
          start: startTime.toISOString(),
          end: endTime.toISOString(),
          color,
          service: appointment.service,
          user: appointment.user,
          status: appointment.status
        }
      })

      setEvents(calendarEvents)
    } catch (err) {
      console.error('Error fetching appointments:', err)
      setError(err instanceof Error ? err.message : 'Failed to fetch appointments')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchAppointments()
  }, [])

  // Real-time subscription to appointment data changes
  useEffect(() => {
    const channel = supabase
      .channel('appointments-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'appointments' },
        () => {
          fetchAppointments() // Re-fetch data
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  return { events, loading, error, refetch: fetchAppointments }
} 