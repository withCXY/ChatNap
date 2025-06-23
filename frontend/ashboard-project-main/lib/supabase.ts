import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Define database table types
export interface UserProfile {
  id: number
  session_id: string
  name: string | null
  phone: string | null
  email: string | null
  platform: string | null
  preferences: any
  created_at: string
  updated_at: string
}

export interface Booking {
  id: number
  booking_id: string
  session_id: string
  customer_name: string
  customer_phone: string | null
  customer_email: string | null
  service_type: string
  appointment_time: string
  duration_minutes: number
  status: string
  notes: string | null
  created_at: string
  updated_at: string
} 

export interface Appointment {
  id: string
  title: string
  datetime: string // ISO format time
  service: string
  user: string
  status: string
}
