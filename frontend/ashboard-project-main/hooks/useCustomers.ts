import { useState, useEffect } from 'react'
// import { supabase, UserProfile, Booking } from '@/lib/supabase'

export interface CustomerData {
  id: string;
  name: string;
  phone: string;
  email?: string;
  platform?: string;
  created_at?: string;
  // 其他字段按需补充
}

export const useCustomers = () => {
  const [customers, setCustomers] = useState<CustomerData[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchCustomers = async () => {
    try {
      setLoading(true)
      setError(null)
      const res = await fetch('/api/customers')
      if (!res.ok) throw new Error('Failed to fetch customers')
      const data = await res.json()
      setCustomers(data || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch customers')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchCustomers() }, [])

  // 实时订阅功能如需保留，可用WebSocket或SSE实现，否则可移除

  return { customers, loading, error, refetch: fetchCustomers }
} 