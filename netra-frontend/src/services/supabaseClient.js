/**
 * services/supabaseClient.js
 *
 * Centralized Supabase client instance for NETRA.
 * Connects to PostgreSQL, Auth, and Realtime websocket channels.
 */

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const isSupabaseConfigured = Boolean(
  supabaseUrl &&
  supabaseAnonKey &&
  supabaseUrl !== 'https://your-project.supabase.co' &&
  !supabaseUrl.includes('placeholder')
)

if (!isSupabaseConfigured) {
  console.warn(
    '[Supabase] Missing or default VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY in .env. Falling back to local mock data.'
  )
}

export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
      },
    })
  : null

export default supabase
