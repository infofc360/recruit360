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
    locationMap.set(fields[0], {
      state: fields[1],
      conference: fields[2],
      lat: fields[3] ? parseFloat(fields[3]) : null,
      lng: fields[4] ? parseFloat(fields[4]) : null
    });
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
    if (!coachesMap.has(college)) {
      coachesMap.set(college, { coaches: [], website: fields[5] || '' });
    }
    const entry = coachesMap.get(college);
    entry.coaches.push({
      name: fields[1],
      title: fields[2],
      email: fields[3],
      ...(fields[4] && { phone: fields[4] })
    });
    if (fields[5] && !entry.website) {
      entry.website = fields[5];
    }
  }
}

// Build D3 colleges
const d3Colleges = [];
const conferences = new Set();

for (const [collegeName, location] of locationMap) {
  const coachData = coachesMap.get(collegeName) || { coaches: [], website: '' };
  conferences.add(location.conference);

  d3Colleges.push({
    id: createId(collegeName),
    name: collegeName,
    division: 'D3',
    conference: location.conference,
    city: location.state,
    state: location.state,
    region: STATE_TO_REGION[location.state] || 'Unknown',
    lat: location.lat,
    lng: location.lng,
    coaches: coachData.coaches,
    website: coachData.website
  });
}

// Read existing colleges.json, filter out D3, add new D3
const collegesPath = path.join(__dirname, '../data/colleges.json');
const existingColleges = JSON.parse(fs.readFileSync(collegesPath, 'utf-8'));
const nonD3 = existingColleges.filter(c => c.division !== 'D3');
const allColleges = [...nonD3, ...d3Colleges];
fs.writeFileSync(collegesPath, JSON.stringify(allColleges, null, 2));
console.log(`Added ${d3Colleges.length} D3 colleges`);
console.log(`Total colleges: ${allColleges.length}`);

// Read and update conferences.json
const conferencesPath = path.join(__dirname, '../data/conferences.json');
const existingConferences = JSON.parse(fs.readFileSync(conferencesPath, 'utf-8'));
const allConferences = [...new Set([...existingConferences, ...conferences])].sort();
fs.writeFileSync(conferencesPath, JSON.stringify(allConferences, null, 2));
console.log(`Total conferences: ${allConferences.length}`);
console.log('\nNew D3 conferences added:');
conferences.forEach(c => {
  if (!existingConferences.includes(c)) {
    console.log(`  - ${c}`);
  }
});
