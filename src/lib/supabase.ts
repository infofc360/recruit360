import { createClient, SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// Create client only if credentials are provided
export const supabase: SupabaseClient | null =
  supabaseUrl && supabaseAnonKey
    ? createClient(supabaseUrl, supabaseAnonKey)
    : null;

export const isSupabaseConfigured = !!supabase;

// Types for database
export interface DBCollege {
  id: string;
  name: string;
  division: 'D1' | 'D2' | 'D3' | 'ECNL';
  conference: string;
  city: string | null;
  state: string | null;
  region: string | null;
  lat: number | null;
  lng: number | null;
  website: string | null;
  created_at: string;
  updated_at: string;
}

export interface DBCoach {
  id: number;
  college_id: string;
  name: string;
  title: string | null;
  email: string | null;
  phone: string | null;
  created_at: string;
}
