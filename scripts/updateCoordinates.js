const fs = require('fs');
const path = require('path');

// Read location.csv
const locationCsv = fs.readFileSync(path.join(__dirname, '../location.csv'), 'utf-8');
const lines = locationCsv.trim().split('\n');

// Parse CSV - handle quoted fields
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

// Build location map from CSV
const locationMap = new Map();
for (let i = 1; i < lines.length; i++) {
  const fields = parseCSVLine(lines[i]);
  if (fields.length >= 5) {
    const name = fields[0];
    const lat = fields[3] ? parseFloat(fields[3]) : null;
    const lng = fields[4] ? parseFloat(fields[4]) : null;
    locationMap.set(name, { lat, lng });
  }
}

// Read and update colleges.json
const collegesPath = path.join(__dirname, '../data/colleges.json');
const colleges = JSON.parse(fs.readFileSync(collegesPath, 'utf-8'));

let updatedCount = 0;
const updatedColleges = colleges.map(college => {
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
console.log(`\nUpdated ${updatedCount} colleges with new coordinates`);
