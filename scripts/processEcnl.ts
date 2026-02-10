import * as fs from 'fs';
import * as path from 'path';
import { parse } from 'csv-parse/sync';

interface EcnlDbRow {
  'Club Name': string;
  'Source URL': string;
  'Emails': string;
}

interface EcnlLocationRow {
  'Club Name': string;
  'Conference': string;
  'Latitude': string;
  'Longitude': string;
  'Address': string;
}

interface EcnlClub {
  id: string;
  name: string;
  division: string;
  conference: string;
  city: string;
  state: string;
  region: string;
  lat: number;
  lng: number;
  coaches: { name: string; title: string; email: string }[];
  website?: string;
}

// Continental US bounding box
const US_BOUNDS = {
  minLat: 24.5,
  maxLat: 49.5,
  minLng: -125.0,
  maxLng: -66.5,
};

// ECNL conference to region mapping
const CONFERENCE_TO_REGION: Record<string, string> = {
  'Northeast & Mid-Atlantic': 'Northeast',
  'Southeast': 'Southeast',
  'Midwest': 'Midwest',
  'Texas & South Central': 'Southwest',
  'West & Northwest': 'West',
  'California (South & North)': 'West',
};

// US state abbreviations for extracting from address
const US_STATES: Record<string, string> = {
  'Alabama': 'AL', 'Alaska': 'AK', 'Arizona': 'AZ', 'Arkansas': 'AR',
  'California': 'CA', 'Colorado': 'CO', 'Connecticut': 'CT', 'Delaware': 'DE',
  'Florida': 'FL', 'Georgia': 'GA', 'Hawaii': 'HI', 'Idaho': 'ID',
  'Illinois': 'IL', 'Indiana': 'IN', 'Iowa': 'IA', 'Kansas': 'KS',
  'Kentucky': 'KY', 'Louisiana': 'LA', 'Maine': 'ME', 'Maryland': 'MD',
  'Massachusetts': 'MA', 'Michigan': 'MI', 'Minnesota': 'MN',
  'Mississippi': 'MS', 'Missouri': 'MO', 'Montana': 'MT', 'Nebraska': 'NE',
  'Nevada': 'NV', 'New Hampshire': 'NH', 'New Jersey': 'NJ',
  'New Mexico': 'NM', 'New York': 'NY', 'North Carolina': 'NC',
  'North Dakota': 'ND', 'Ohio': 'OH', 'Oklahoma': 'OK', 'Oregon': 'OR',
  'Pennsylvania': 'PA', 'Rhode Island': 'RI', 'South Carolina': 'SC',
  'South Dakota': 'SD', 'Tennessee': 'TN', 'Texas': 'TX', 'Utah': 'UT',
  'Vermont': 'VT', 'Virginia': 'VA', 'Washington': 'WA',
  'West Virginia': 'WV', 'Wisconsin': 'WI', 'Wyoming': 'WY',
  'District of Columbia': 'DC',
};

function extractState(address: string): string {
  if (!address) return '';
  for (const [stateName, abbrev] of Object.entries(US_STATES)) {
    if (address.includes(stateName)) return abbrev;
  }
  return '';
}

function isInUS(lat: number, lng: number): boolean {
  return (
    lat >= US_BOUNDS.minLat && lat <= US_BOUNDS.maxLat &&
    lng >= US_BOUNDS.minLng && lng <= US_BOUNDS.maxLng
  );
}

// Read CSV files
const dbCsv = fs.readFileSync(path.join(__dirname, '../ecnl_db.csv'), 'utf-8');
const locationCsv = fs.readFileSync(path.join(__dirname, '../ecnl_location.csv'), 'utf-8');

// Parse CSVs
const dbData: EcnlDbRow[] = parse(dbCsv, { columns: true, skip_empty_lines: true });
const locationData: EcnlLocationRow[] = parse(locationCsv, { columns: true, skip_empty_lines: true });

// Create location lookup map
const locationMap = new Map<string, EcnlLocationRow>();
for (const loc of locationData) {
  locationMap.set(loc['Club Name'].trim(), loc);
}

// Process clubs
const clubs: EcnlClub[] = [];
let badCoords = 0;
let noCoords = 0;

for (const row of dbData) {
  const clubName = row['Club Name'].trim();
  const location = locationMap.get(clubName);

  const id = clubName
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');

  // Parse emails
  const emailStr = (row['Emails'] || '').trim();
  const emails = emailStr
    ? emailStr.split(';').map(e => e.trim()).filter(e => e && e !== 'mymail@mailservice.com' && e !== 'email@email.com')
    : [];

  // Build coaches from emails
  const coaches = emails.map(email => ({
    name: 'Contact',
    title: 'Club Contact',
    email,
  }));

  const conference = location?.Conference || '';
  const region = CONFERENCE_TO_REGION[conference] || '';
  const address = location?.Address || '';
  const state = extractState(address);

  let lat = parseFloat(location?.Latitude || '');
  let lng = parseFloat(location?.Longitude || '');

  if (isNaN(lat) || isNaN(lng)) {
    lat = 0;
    lng = 0;
    noCoords++;
  } else if (!isInUS(lat, lng)) {
    // Bad geocoding — zero out
    lat = 0;
    lng = 0;
    badCoords++;
  }

  clubs.push({
    id,
    name: clubName,
    division: 'ECNL',
    conference,
    city: '',
    state,
    region,
    lat,
    lng,
    coaches,
    website: row['Source URL'] || undefined,
  });
}

// Sort by name
clubs.sort((a, b) => a.name.localeCompare(b.name));

// Write output
const outputDir = path.join(__dirname, '../data');
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

fs.writeFileSync(
  path.join(outputDir, 'ecnl_clubs.json'),
  JSON.stringify(clubs, null, 2)
);

console.log(`Processed ${clubs.length} ECNL clubs`);
console.log(`  - ${clubs.filter(c => c.lat !== 0).length} with valid US coordinates`);
console.log(`  - ${badCoords} with bad coordinates (zeroed out)`);
console.log(`  - ${noCoords} with no coordinates`);
console.log(`  - ${clubs.filter(c => c.coaches.length > 0).length} with email contacts`);
console.log(`  - ${clubs.filter(c => c.state).length} with extracted state`);

const conferences = [...new Set(clubs.map(c => c.conference))].filter(Boolean).sort();
console.log(`\nConferences: ${conferences.join(', ')}`);
