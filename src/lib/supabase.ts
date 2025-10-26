import { createClient, SupabaseClient } from '@supabase/supabase-js'

declare global {
  var supabase: SupabaseClient | undefined;
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Missing Supabase environment variables')
}

// Client-side Supabase instance (safe for browser)
export const supabase = global.supabase || createClient(supabaseUrl, supabaseKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  },
  realtime: {
    params: {
      eventsPerSecond: 10
    }
  }
})

if (process.env.NODE_ENV !== 'production') {
  global.supabase = supabase
}
