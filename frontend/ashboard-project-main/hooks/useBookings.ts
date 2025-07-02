import { useState, useEffect } from 'react'
// import { supabase, Booking } from '@/lib/supabase'

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
      const res = await fetch('/api/bookings')
      if (!res.ok) throw new Error('Failed to fetch bookings')
      const data = await res.json()
      // 这里假设后端API已返回格式化好的数据
      setEvents(data || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch bookings')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchBookings() }, [])

  // 实时订阅功能如需保留，可用WebSocket或SSE实现，否则可移除

  return { events, loading, error, refetch: fetchBookings }
} 