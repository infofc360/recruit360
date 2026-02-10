// Upload D3 colleges and coaches from CSV files to Supabase
// Usage: SUPABASE_SERVICE_ROLE_KEY=<key> node scripts/uploadD3ToSupabase.js

const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://rrbvwhoskztooslkznph.supabase.co';
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SERVICE_ROLE_KEY) {
  console.error('Error: SUPABASE_SERVICE_ROLE_KEY environment variable is required');
  console.error('Usage: SUPABASE_SERVICE_ROLE_KEY=<key> node scripts/uploadD3ToSupabase.js');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

// Parse CSV line handling quoted fields
function parseCSVLine(line) {
  const result = [];
  let current = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  result.push(current.trim());
  return result;
}

const STATE_TO_REGION = {
  CT: 'Northeast', ME: 'Northeast', MA: 'Northeast', NH: 'Northeast',
  RI: 'Northeast', VT: 'Northeast', NJ: 'Northeast', NY: 'Northeast',
  PA: 'Northeast', DC: 'Northeast', MD: 'Northeast', DE: 'Northeast',
  AL: 'Southeast', AR: 'Southeast', FL: 'Southeast', GA: 'Southeast',
  KY: 'Southeast', LA: 'Southeast', MS: 'Southeast', NC: 'Southeast',
  SC: 'Southeast', TN: 'Southeast', VA: 'Southeast', WV: 'Southeast',
  IL: 'Midwest', IN: 'Midwest', IA: 'Midwest', KS: 'Midwest',
  MI: 'Midwest', MN: 'Midwest', MO: 'Midwest', NE: 'Midwest',
  ND: 'Midwest', OH: 'Midwest', SD: 'Midwest', WI: 'Midwest',
  AZ: 'Southwest', NM: 'Southwest', OK: 'Southwest', TX: 'Southwest',
  AK: 'West', CA: 'West', CO: 'West', HI: 'West',
  ID: 'West', MT: 'West', NV: 'West', OR: 'West',
  UT: 'West', WA: 'West', WY: 'West'
};

function createId(name) {
  return name.toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
}

// Read d3_locations.csv: College, State, Conference, Latitude, Longitude
const locationsPath = path.join(__dirname, '../d3_locations.csv');
const locationsData = fs.readFileSync(locationsPath, 'utf-8');
const locationLines = locationsData.trim().split('\n');

const locationMap = new Map();
for (let i = 1; i < locationLines.length; i++) {
  const fields = parseCSVLine(locationLines[i]);
  if (fields.length >= 5) {
    const college = fields[0];
    const state = fields[1];
    const conference = fields[2];
    const lat = fields[3] ? parseFloat(fields[3]) : null;
    const lng = fields[4] ? parseFloat(fields[4]) : null;
    locationMap.set(college, { state, conference, lat, lng });
  }
}

// Read d3_db.csv: College, Name, Title, Email, Phone, Source
const dbPath = path.join(__dirname, '../d3_db.csv');
const dbData = fs.readFileSync(dbPath, 'utf-8');
const dbLines = dbData.trim().split('\n');

const coachesMap = new Map();
for (let i = 1; i < dbLines.length; i++) {
  const fields = parseCSVLine(dbLines[i]);
  if (fields.length >= 5) {
    const college = fields[0];
    const name = fields[1];
    const title = fields[2];
    const email = fields[3];
    const phone = fields[4];
    const source = fields[5] || '';

    if (!coachesMap.has(college)) {
      coachesMap.set(college, { coaches: [], website: source });
    }
    const entry = coachesMap.get(college);
    entry.coaches.push({ name, title, email, ...(phone && { phone }) });
    if (source && !entry.website) {
      entry.website = source;
    }
  }
}

async function upload() {
  // Build D3 college rows
  const collegeRows = [];
  const coachRows = [];

  for (const [collegeName, location] of locationMap) {
    const id = createId(collegeName);
    const coachData = coachesMap.get(collegeName) || { coaches: [], website: '' };

    collegeRows.push({
      id,
      name: collegeName,
      division: 'D3',
      conference: location.conference,
      city: location.state, // fallback city to state (same pattern as D2 script)
      state: location.state,
      region: STATE_TO_REGION[location.state] || null,
      lat: location.lat,
      lng: location.lng,
      website: coachData.website || null
    });

    for (const coach of coachData.coaches) {
      coachRows.push({
        college_id: id,
        name: coach.name,
        title: coach.title || null,
        email: coach.email || null,
        phone: coach.phone || null
      });
    }
  }

  console.log(`Prepared ${collegeRows.length} D3 colleges and ${coachRows.length} coaches`);

  // Upload colleges in batches (upsert to handle re-runs)
  const BATCH_SIZE = 100;
  let collegesInserted = 0;

  for (let i = 0; i < collegeRows.length; i += BATCH_SIZE) {
    const batch = collegeRows.slice(i, i + BATCH_SIZE);
    const { error } = await supabase
      .from('colleges')
      .upsert(batch, { onConflict: 'id' });

    if (error) {
      console.error(`Error inserting colleges batch ${i / BATCH_SIZE + 1}:`, error.message);
      process.exit(1);
    }
    collegesInserted += batch.length;
    console.log(`Colleges: ${collegesInserted}/${collegeRows.length}`);
  }

  // Delete existing D3 coaches before inserting (to avoid duplicates on re-run)
  const d3CollegeIds = collegeRows.map(c => c.id);
  for (let i = 0; i < d3CollegeIds.length; i += BATCH_SIZE) {
    const batch = d3CollegeIds.slice(i, i + BATCH_SIZE);
    const { error } = await supabase
      .from('coaches')
      .delete()
      .in('college_id', batch);

    if (error) {
      console.error('Error deleting old coaches:', error.message);
      process.exit(1);
    }
  }

  // Upload coaches in batches
  let coachesInserted = 0;
  for (let i = 0; i < coachRows.length; i += BATCH_SIZE) {
    const batch = coachRows.slice(i, i + BATCH_SIZE);
    const { error } = await supabase
      .from('coaches')
      .insert(batch);

    if (error) {
      console.error(`Error inserting coaches batch ${i / BATCH_SIZE + 1}:`, error.message);
      process.exit(1);
    }
    coachesInserted += batch.length;
    console.log(`Coaches: ${coachesInserted}/${coachRows.length}`);
  }

  console.log('\nDone!');
  console.log(`Uploaded ${collegesInserted} D3 colleges and ${coachesInserted} coaches to Supabase`);
}

upload().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
