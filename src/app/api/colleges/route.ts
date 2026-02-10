import { NextResponse } from 'next/server';
import { supabase, isSupabaseConfigured, DBCollege, DBCoach } from '@/lib/supabase';
import { College, Coach } from '@/types/college';
import collegesData from '../../../../data/colleges.json';

export async function GET() {
  // If Supabase is not configured, fall back to local JSON
  if (!isSupabaseConfigured || !supabase) {
    return NextResponse.json(collegesData as College[]);
  }

  try {
    // Fetch all colleges
    const { data: colleges, error: collegesError } = await supabase
      .from('colleges')
      .select('*')
      .order('name');

    if (collegesError) {
      console.error('Error fetching colleges:', collegesError);
      // Fall back to local data on error
      return NextResponse.json(collegesData as College[]);
    }

    // Fetch all coaches
    const { data: coaches, error: coachesError } = await supabase
      .from('coaches')
      .select('*');

    if (coachesError) {
      console.error('Error fetching coaches:', coachesError);
      // Fall back to local data on error
      return NextResponse.json(collegesData as College[]);
    }

    // Group coaches by college_id
    const coachesByCollege = new Map<string, Coach[]>();
    (coaches as DBCoach[]).forEach(coach => {
      const collegeCoaches = coachesByCollege.get(coach.college_id) || [];
      collegeCoaches.push({
        name: coach.name,
        title: coach.title || '',
        email: coach.email || '',
        ...(coach.phone && { phone: coach.phone })
      });
      coachesByCollege.set(coach.college_id, collegeCoaches);
    });

    // Transform to College type
    const transformedColleges: College[] = (colleges as DBCollege[]).map(c => ({
      id: c.id,
      name: c.name,
      division: c.division,
      conference: c.conference,
      city: c.city || '',
      state: c.state || '',
      region: (c.region as College['region']) || 'Northeast',
      lat: c.lat || 0,
      lng: c.lng || 0,
      coaches: coachesByCollege.get(c.id) || [],
      website: c.website || undefined
    }));

    return NextResponse.json(transformedColleges);
  } catch (error) {
    console.error('Unexpected error:', error);
    // Fall back to local data on error
    return NextResponse.json(collegesData as College[]);
  }
}
