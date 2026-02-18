import { NextResponse } from 'next/server';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import conferencesData from '../../../../data/conferences.json';

export async function GET() {
  // If Supabase is not configured, fall back to local JSON
  if (!isSupabaseConfigured || !supabase) {
    return NextResponse.json(conferencesData);
  }

  try {
    // Get conferences from both colleges (NCAA) and ecnl_clubs tables
    const [{ data: ncaaData, error: ncaaError }, { data: ecnlData, error: ecnlError }] = await Promise.all([
      supabase.from('colleges').select('conference'),
      supabase.from('ecnl_clubs').select('conference'),
    ]);

    if (ncaaError) {
      console.error('Error fetching NCAA conferences:', ncaaError);
      return NextResponse.json(conferencesData);
    }
    if (ecnlError) {
      console.error('Error fetching ECNL conferences:', ecnlError);
      return NextResponse.json(conferencesData);
    }

    // Merge and deduplicate conferences from both tables
    const conferences = [...new Set([...(ncaaData ?? []), ...(ecnlData ?? [])].map(c => c.conference))]
      .filter(Boolean)
      .sort();

    return NextResponse.json(conferences);
  } catch (error) {
    console.error('Unexpected error:', error);
    // Fall back to local data on error
    return NextResponse.json(conferencesData);
  }
}
