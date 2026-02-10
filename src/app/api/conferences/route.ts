import { NextResponse } from 'next/server';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import conferencesData from '../../../../data/conferences.json';

export async function GET() {
  // If Supabase is not configured, fall back to local JSON
  if (!isSupabaseConfigured || !supabase) {
    return NextResponse.json(conferencesData);
  }

  try {
    // Get distinct conferences from colleges table
    const { data, error } = await supabase
      .from('colleges')
      .select('conference')
      .order('conference');

    if (error) {
      console.error('Error fetching conferences:', error);
      // Fall back to local data on error
      return NextResponse.json(conferencesData);
    }

    // Extract unique conferences
    const conferences = [...new Set(data.map(c => c.conference))].filter(Boolean);

    return NextResponse.json(conferences);
  } catch (error) {
    console.error('Unexpected error:', error);
    // Fall back to local data on error
    return NextResponse.json(conferencesData);
  }
}
