import { createClient } from '@supabase/supabase-js'
import AsyncStorage from '@react-native-async-storage/async-storage'

// Ersetze diese beiden Strings mit deinen Daten aus dem Dashboard
const supabaseUrl = 'https://nsunowtdncutqcterjkd.supabase.co'
const supabaseAnonKey = 'sb_publishable_wlJDhSTA6n_VsLDq8F0LPA_XwXMZv6r'

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
})