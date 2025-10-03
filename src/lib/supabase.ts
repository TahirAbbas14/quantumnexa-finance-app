import { createClient } from '@supabase/supabase-js'
import { createBrowserClient } from '@supabase/ssr'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export function createSupabaseClient() {
  return createBrowserClient(supabaseUrl, supabaseAnonKey)
}

// Database types
export interface Client {
  id: string
  name: string
  email: string
  phone?: string
  company?: string
  address?: string
  created_at: string
  updated_at: string
  user_id: string
}

export interface Project {
  id: string
  name: string
  description?: string
  client_id: string
  status: 'active' | 'completed' | 'on_hold' | 'cancelled'
  budget?: number
  start_date?: string
  end_date?: string
  created_at: string
  updated_at: string
  user_id: string
}

export interface Invoice {
  id: string
  invoice_number: string
  client_id: string
  project_id?: string
  amount: number
  tax_amount?: number
  total_amount: number
  status: 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled'
  issue_date: string
  due_date: string
  description?: string
  created_at: string
  updated_at: string
  user_id: string
}

export interface Expense {
  id: string
  description: string
  amount: number
  category: string
  date: string
  receipt_url?: string
  project_id?: string
  created_at: string
  updated_at: string
  user_id: string
}

export interface Payment {
  id: string
  invoice_id: string
  amount: number
  payment_date: string
  payment_method: string
  notes?: string
  created_at: string
  updated_at: string
  user_id: string
}