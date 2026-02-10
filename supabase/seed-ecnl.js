// Script to generate SQL seed data from ecnl_clubs.json
// Run: node supabase/seed-ecnl.js > supabase/seed-ecnl.sql

const fs = require('fs');
const path = require('path');

const clubs = JSON.parse(
  fs.readFileSync(path.join(__dirname, '../data/ecnl_clubs.json'), 'utf-8')
);

// Escape single quotes for SQL
function escape(str) {
  if (str === null || str === undefined) return 'NULL';
  return `'${String(str).replace(/'/g, "''")}'`;
}

console.log('-- Seed data for Recruit360 ECNL clubs');
console.log('-- Generated from ecnl_clubs.json');
console.log('-- NOTE: Run schema migration first to allow ECNL division:');
console.log('--   ALTER TABLE colleges DROP CONSTRAINT IF EXISTS colleges_division_check;');
console.log("--   ALTER TABLE colleges ADD CONSTRAINT colleges_division_check CHECK (division IN ('D1', 'D2', 'D3', 'ECNL'));\n");

// Migration for existing databases
console.log('-- Migration: update division check constraint');
console.log('ALTER TABLE colleges DROP CONSTRAINT IF EXISTS colleges_division_check;');
console.log("ALTER TABLE colleges ADD CONSTRAINT colleges_division_check CHECK (division IN ('D1', 'D2', 'D3', 'ECNL'));\n");

// Insert colleges
console.log('-- Insert ECNL clubs');
console.log('INSERT INTO colleges (id, name, division, conference, city, state, region, lat, lng, website) VALUES');

const clubValues = clubs.map((c, i) => {
  const lat = c.lat != null ? c.lat : 'NULL';
  const lng = c.lng != null ? c.lng : 'NULL';
  const ending = i === clubs.length - 1 ? ';' : ',';
  return `(${escape(c.id)}, ${escape(c.name)}, ${escape(c.division)}, ${escape(c.conference)}, ${escape(c.city)}, ${escape(c.state)}, ${escape(c.region)}, ${lat}, ${lng}, ${escape(c.website)})${ending}`;
});

clubValues.forEach(v => console.log(v));

console.log('\n-- Insert ECNL contacts');

// Collect all coaches/contacts
const contactInserts = [];
clubs.forEach(club => {
  if (club.coaches && club.coaches.length > 0) {
    club.coaches.forEach(coach => {
      contactInserts.push({
        college_id: club.id,
        name: coach.name,
        title: coach.title || null,
        email: coach.email || null,
        phone: null
      });
    });
  }
});

if (contactInserts.length > 0) {
  console.log('INSERT INTO coaches (college_id, name, title, email, phone) VALUES');

  contactInserts.forEach((coach, i) => {
    const ending = i === contactInserts.length - 1 ? ';' : ',';
    console.log(`(${escape(coach.college_id)}, ${escape(coach.name)}, ${escape(coach.title)}, ${escape(coach.email)}, ${escape(coach.phone)})${ending}`);
  });
}

console.log('\n-- Done!');
console.log(`-- Total ECNL clubs: ${clubs.length}`);
console.log(`-- Total contacts: ${contactInserts.length}`);
