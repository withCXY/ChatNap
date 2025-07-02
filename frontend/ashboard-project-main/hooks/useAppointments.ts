import { useState, useEffect } from 'react'
// import { supabase } from '@/lib/supabase'

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
      const res = await fetch('/api/appointments')
      if (!res.ok) throw new Error('Failed to fetch appointments')
      const data = await res.json()
      setEvents(data || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch appointments')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchAppointments() }, [])

  // 实时订阅功能如需保留，可用WebSocket或SSE实现，否则可移除

  return { events, loading, error, refetch: fetchAppointments }
} 