import { NextResponse } from 'next/server';
import { supabase, isSupabaseConfigured, DBCollege, DBCoach } from '@/lib/supabase';
import { College, Coach } from '@/types/college';
import ecnlData from '../../../../data/ecnl_clubs.json';

export async function GET() {
  // If Supabase is not configured, fall back to local JSON
  if (!isSupabaseConfigured || !supabase) {
    return NextResponse.json(ecnlData);
  }

  try {
    // Fetch ECNL clubs from colleges table
    const { data: clubs, error: clubsError } = await supabase
      .from('colleges')
      .select('*')
      .eq('division', 'ECNL')
      .order('name');

    if (clubsError) {
      console.error('Error fetching ECNL clubs:', clubsError);
      return NextResponse.json(ecnlData);
    }

    // Fetch coaches/contacts for ECNL clubs
    const clubIds = (clubs as DBCollege[]).map(c => c.id);
    const { data: coaches, error: coachesError } = await supabase
      .from('coaches')
      .select('*')
      .in('college_id', clubIds);

    if (coachesError) {
      console.error('Error fetching ECNL contacts:', coachesError);
      return NextResponse.json(ecnlData);
    }

    // Group coaches by college_id
    const coachesByClub = new Map<string, Coach[]>();
    (coaches as DBCoach[]).forEach(coach => {
      const clubCoaches = coachesByClub.get(coach.college_id) || [];
      clubCoaches.push({
        name: coach.name,
        title: coach.title || '',
        email: coach.email || '',
      });
      coachesByClub.set(coach.college_id, clubCoaches);
    });

    // Transform to College type
    const transformedClubs: College[] = (clubs as DBCollege[]).map(c => ({
      id: c.id,
      name: c.name,
      division: c.division,
      conference: c.conference,
      city: c.city || '',
      state: c.state || '',
      region: (c.region as College['region']) || 'Northeast',
      lat: c.lat || 0,
      lng: c.lng || 0,
      coaches: coachesByClub.get(c.id) || [],
      website: c.website || undefined,
    }));

    return NextResponse.json(transformedClubs);
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json(ecnlData);
  }
}
