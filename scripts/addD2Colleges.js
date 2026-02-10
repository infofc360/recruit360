const fs = require('fs');
const path = require('path');

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

// State to region mapping
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

// Read locations_d2.csv
const locationsPath = path.join(__dirname, '../locations_d2.csv');
const locationsData = fs.readFileSync(locationsPath, 'utf-8');
const locationLines = locationsData.trim().split('\n');

// Build location map: college name -> { state, conference, lat, lng }
const locationMap = new Map();
for (let i = 1; i < locationLines.length; i++) {
  const fields = parseCSVLine(locationLines[i]);
  if (fields.length >= 6) {
    const college = fields[0];
    const state = fields[1];
    const conference = fields[2];
    const lat = fields[4] ? parseFloat(fields[4]) : null;
    const lng = fields[5] ? parseFloat(fields[5]) : null;
    locationMap.set(college, { state, conference, lat, lng });
  }
}

// Read d2_db.csv for coaches
const dbPath = path.join(__dirname, '../d2_db.csv');
const dbData = fs.readFileSync(dbPath, 'utf-8');
const dbLines = dbData.trim().split('\n');

// Build coaches map: college name -> coaches array
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
    entry.coaches.push({
      name,
      title,
      email,
      ...(phone && { phone })
    });
    if (source && !entry.website) {
      entry.website = source;
    }
  }
}

// Create ID from college name
function createId(name) {
  return name.toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
}

// Extract city from location (approximate - use state for now)
function getCity(collegeName, state) {
  // Try to extract city from college name or use a default
  const cityMatch = collegeName.match(/University of (.+?) at (.+)/);
  if (cityMatch) return cityMatch[2];

  const cityMatch2 = collegeName.match(/(.+?) State University/);
  if (cityMatch2) return cityMatch2[1];

  return state; // fallback to state
}

// Build D2 colleges array
const d2Colleges = [];
const conferences = new Set();

for (const [collegeName, location] of locationMap) {
  const coachData = coachesMap.get(collegeName) || { coaches: [], website: '' };

  conferences.add(location.conference);

  d2Colleges.push({
    id: createId(collegeName),
    name: collegeName,
    division: 'D2',
    conference: location.conference,
    city: getCity(collegeName, location.state),
    state: location.state,
    region: STATE_TO_REGION[location.state] || 'Unknown',
    lat: location.lat,
    lng: location.lng,
    coaches: coachData.coaches,
    website: coachData.website
  });
}

// Read existing colleges.json
const collegesPath = path.join(__dirname, '../data/colleges.json');
const existingColleges = JSON.parse(fs.readFileSync(collegesPath, 'utf-8'));

// Filter out any existing D2 colleges (in case we're re-running)
const d1Colleges = existingColleges.filter(c => c.division !== 'D2');

// Combine D1 and D2
const allColleges = [...d1Colleges, ...d2Colleges];

// Write updated colleges.json
fs.writeFileSync(collegesPath, JSON.stringify(allColleges, null, 2));
console.log(`Added ${d2Colleges.length} D2 colleges`);
console.log(`Total colleges: ${allColleges.length}`);

// Read and update conferences.json
const conferencesPath = path.join(__dirname, '../data/conferences.json');
const existingConferences = JSON.parse(fs.readFileSync(conferencesPath, 'utf-8'));
const allConferences = [...new Set([...existingConferences, ...conferences])].sort();
fs.writeFileSync(conferencesPath, JSON.stringify(allConferences, null, 2));
console.log(`Total conferences: ${allConferences.length}`);
console.log('\nNew D2 conferences added:');
conferences.forEach(c => {
  if (!existingConferences.includes(c)) {
    console.log(`  - ${c}`);
  }
});
