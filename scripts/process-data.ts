import * as fs from 'fs';
import * as path from 'path';
import { parse } from 'csv-parse/sync';

interface CoachRow {
  College: string;
  Name: string;
  Title: string;
  Email: string;
  Phone: string;
  Source: string;
  Conference: string;
}

interface LocationRow {
  'College Name': string;
  City: string;
  'Primary Conference': string;
  Latitude: string;
  Longitude: string;
}

interface College {
  id: string;
  name: string;
  division: string;
  conference: string;
  city: string;
  lat: number;
  lng: number;
  coaches: {
    name: string;
    title: string;
    email: string;
    phone?: string;
  }[];
  website?: string;
}

// Read CSV files
const coachCsv = fs.readFileSync(path.join(__dirname, '../d1_db.csv'), 'utf-8');
const locationCsv = fs.readFileSync(path.join(__dirname, '../location.csv'), 'utf-8');

// Parse CSVs
const coachData: CoachRow[] = parse(coachCsv, { columns: true, skip_empty_lines: true });
const locationData: LocationRow[] = parse(locationCsv, { columns: true, skip_empty_lines: true });

// Create location lookup map
const locationMap = new Map<string, LocationRow>();
for (const loc of locationData) {
  locationMap.set(loc['College Name'].toLowerCase().trim(), loc);
}

// Group coaches by college
const collegeCoaches = new Map<string, CoachRow[]>();
for (const coach of coachData) {
  const collegeName = coach.College.trim();
  if (!collegeCoaches.has(collegeName)) {
    collegeCoaches.set(collegeName, []);
  }
  collegeCoaches.get(collegeName)!.push(coach);
}

// Create college records
const colleges: College[] = [];
const missingLocations: string[] = [];

for (const [collegeName, coaches] of collegeCoaches) {
  const location = locationMap.get(collegeName.toLowerCase().trim());

  if (!location) {
    missingLocations.push(collegeName);
    continue;
  }

  const id = collegeName
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');

  colleges.push({
    id,
    name: collegeName,
    division: 'D1', // All current data is D1
    conference: location['Primary Conference'] || coaches[0]?.Conference || 'Unknown',
    city: location.City,
    lat: parseFloat(location.Latitude),
    lng: parseFloat(location.Longitude),
    coaches: coaches.map(c => ({
      name: c.Name,
      title: c.Title,
      email: c.Email,
      ...(c.Phone ? { phone: c.Phone } : {})
    })),
    website: coaches[0]?.Source
  });
}

// Sort by name
colleges.sort((a, b) => a.name.localeCompare(b.name));

// Get unique conferences
const conferences = [...new Set(colleges.map(c => c.conference))].sort();

// Write output
const outputDir = path.join(__dirname, '../data');
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

fs.writeFileSync(
  path.join(outputDir, 'colleges.json'),
  JSON.stringify(colleges, null, 2)
);

fs.writeFileSync(
  path.join(outputDir, 'conferences.json'),
  JSON.stringify(conferences, null, 2)
);

console.log(`Processed ${colleges.length} colleges`);
console.log(`Found ${conferences.length} conferences`);

if (missingLocations.length > 0) {
  console.log(`\nMissing locations for ${missingLocations.length} colleges:`);
  missingLocations.forEach(c => console.log(`  - ${c}`));
}
