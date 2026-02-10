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

// Read locations_d2.csv
const locationCsv = fs.readFileSync(path.join(__dirname, '../locations_d2.csv'), 'utf-8');
const lines = locationCsv.trim().split('\n');

// Build location map from CSV
const locationMap = new Map();
for (let i = 1; i < lines.length; i++) {
  const fields = parseCSVLine(lines[i]);
  if (fields.length >= 6) {
    const name = fields[0];
    const lat = fields[4] ? parseFloat(fields[4]) : null;
    const lng = fields[5] ? parseFloat(fields[5]) : null;
    locationMap.set(name, { lat, lng });
  }
}

// Read and update colleges.json
const collegesPath = path.join(__dirname, '../data/colleges.json');
const colleges = JSON.parse(fs.readFileSync(collegesPath, 'utf-8'));

let updatedCount = 0;
const updatedColleges = colleges.map(college => {
  // Only update D2 colleges
  if (college.division !== 'D2') return college;

  const location = locationMap.get(college.name);
  if (location) {
    const oldLat = college.lat;
    const oldLng = college.lng;

    if (location.lat !== oldLat || location.lng !== oldLng) {
      console.log(`Updated ${college.name}:`);
      console.log(`  Old: ${oldLat}, ${oldLng}`);
      console.log(`  New: ${location.lat}, ${location.lng}`);
      updatedCount++;
    }

    return {
      ...college,
      lat: location.lat,
      lng: location.lng
    };
  }
  return college;
});

// Write updated data
fs.writeFileSync(collegesPath, JSON.stringify(updatedColleges, null, 2));
console.log(`\nUpdated ${updatedCount} D2 colleges with new coordinates`);
