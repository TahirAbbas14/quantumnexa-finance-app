import { supabase } from './supabase'

export function getSupabaseClient() {
  if (!supabase) {
    throw new Error('Supabase client is not initialized. Please check your environment variables.')
  }
  return supabase
}

export function getSupabaseClientSafe() {
  return supabase
}

export function isSupabaseInitialized(): boolean {
  return supabase !== null
}