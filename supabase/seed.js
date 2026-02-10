// Script to generate SQL seed data from colleges.json
// Run: node supabase/seed.js > supabase/seed.sql

const fs = require('fs');
const path = require('path');

const colleges = JSON.parse(
  fs.readFileSync(path.join(__dirname, '../data/colleges.json'), 'utf-8')
);

// Escape single quotes for SQL
function escape(str) {
  if (str === null || str === undefined) return 'NULL';
  return `'${String(str).replace(/'/g, "''")}'`;
}

console.log('-- Seed data for Recruit360');
console.log('-- Generated from colleges.json\n');

// Insert colleges
console.log('-- Insert colleges');
console.log('INSERT INTO colleges (id, name, division, conference, city, state, region, lat, lng, website) VALUES');

const collegeValues = colleges.map((c, i) => {
  const lat = c.lat != null ? c.lat : 'NULL';
  const lng = c.lng != null ? c.lng : 'NULL';
  const ending = i === colleges.length - 1 ? ';' : ',';
  return `(${escape(c.id)}, ${escape(c.name)}, ${escape(c.division)}, ${escape(c.conference)}, ${escape(c.city)}, ${escape(c.state)}, ${escape(c.region)}, ${lat}, ${lng}, ${escape(c.website)})${ending}`;
});

collegeValues.forEach(v => console.log(v));

console.log('\n-- Insert coaches');

// Collect all coaches
const coachInserts = [];
colleges.forEach(college => {
  if (college.coaches && college.coaches.length > 0) {
    college.coaches.forEach(coach => {
      coachInserts.push({
        college_id: college.id,
        name: coach.name,
        title: coach.title || null,
        email: coach.email || null,
        phone: coach.phone || null
      });
    });
  }
});

if (coachInserts.length > 0) {
  console.log('INSERT INTO coaches (college_id, name, title, email, phone) VALUES');

  coachInserts.forEach((coach, i) => {
    const ending = i === coachInserts.length - 1 ? ';' : ',';
    console.log(`(${escape(coach.college_id)}, ${escape(coach.name)}, ${escape(coach.title)}, ${escape(coach.email)}, ${escape(coach.phone)})${ending}`);
  });
}

console.log('\n-- Done!');
console.log(`-- Total colleges: ${colleges.length}`);
console.log(`-- Total coaches: ${coachInserts.length}`);
