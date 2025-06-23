import { useState, useEffect } from 'react'
import { supabase, UserProfile, Booking } from '@/lib/supabase'

export interface CustomerData extends UserProfile {
  bookings?: Booking[]
  conversationSummary: string
  interactionStage: 'Ongoing' | 'Escalated' | 'Confirmed'
  accountStatus: 'Active' | 'Inactive'
}

export const useCustomers = () => {
  const [customers, setCustomers] = useState<CustomerData[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchCustomers = async () => {
    try {
      setLoading(true)
      setError(null)

      // Get user profiles (simplified query, no need to join bookings)
      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error

      // Transform data format to match existing Customer interface
      const customersData: CustomerData[] = (data || []).map((profile: any) => ({
        ...profile,
        conversationSummary: `Customer from ${profile.platform || 'Unknown platform'}`,
        interactionStage: 'Ongoing' as const, // Simplified to fixed value
        accountStatus: 'Active' as const // Simplified to fixed value
      }))

      setCustomers(customersData)
    } catch (err) {
      console.error('Error fetching customers:', err)
      setError(err instanceof Error ? err.message : 'Failed to fetch customers')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchCustomers()
  }, [])

  // Real-time subscription to data changes
  useEffect(() => {
    const channel = supabase
      .channel('customers-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'user_profiles' },
        () => {
          fetchCustomers() // Re-fetch data
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  return { customers, loading, error, refetch: fetchCustomers }
} 