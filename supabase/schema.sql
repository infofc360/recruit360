-- Supabase Schema for Recruit360
-- Run this in your Supabase SQL Editor

-- Create colleges table (NCAA D1/D2/D3 only)
CREATE TABLE IF NOT EXISTS colleges (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  division TEXT NOT NULL CHECK (division IN ('D1', 'D2', 'D3')),
  conference TEXT NOT NULL,
  city TEXT,
  state TEXT,
  region TEXT,
  lat DECIMAL(10, 7),
  lng DECIMAL(10, 7),
  website TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create ecnl_clubs table (ECNL youth clubs, separate from NCAA colleges)
CREATE TABLE IF NOT EXISTS ecnl_clubs (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  conference TEXT NOT NULL,
  city TEXT,
  state TEXT,
  region TEXT,
  lat DECIMAL(10, 7),
  lng DECIMAL(10, 7),
  website TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create coaches table (shared; college_id is a soft reference to colleges or ecnl_clubs)
CREATE TABLE IF NOT EXISTS coaches (
  id SERIAL PRIMARY KEY,
  college_id TEXT NOT NULL,
  name TEXT NOT NULL,
  title TEXT,
  email TEXT,
  phone TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_colleges_division ON colleges(division);
CREATE INDEX IF NOT EXISTS idx_colleges_conference ON colleges(conference);
CREATE INDEX IF NOT EXISTS idx_colleges_state ON colleges(state);
CREATE INDEX IF NOT EXISTS idx_colleges_region ON colleges(region);
CREATE INDEX IF NOT EXISTS idx_coaches_college_id ON coaches(college_id);
CREATE INDEX IF NOT EXISTS idx_ecnl_clubs_conference ON ecnl_clubs(conference);
CREATE INDEX IF NOT EXISTS idx_ecnl_clubs_state ON ecnl_clubs(state);
CREATE INDEX IF NOT EXISTS idx_ecnl_clubs_region ON ecnl_clubs(region);

-- Enable Row Level Security (RLS)
ALTER TABLE colleges ENABLE ROW LEVEL SECURITY;
ALTER TABLE coaches ENABLE ROW LEVEL SECURITY;
ALTER TABLE ecnl_clubs ENABLE ROW LEVEL SECURITY;

-- Create policies for public read access
CREATE POLICY "Allow public read access to colleges"
  ON colleges FOR SELECT
  TO anon
  USING (true);

CREATE POLICY "Allow public read access to coaches"
  ON coaches FOR SELECT
  TO anon
  USING (true);

CREATE POLICY "Allow public read access to ecnl_clubs"
  ON ecnl_clubs FOR SELECT
  TO anon
  USING (true);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers to auto-update updated_at
CREATE TRIGGER update_colleges_updated_at
  BEFORE UPDATE ON colleges
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_ecnl_clubs_updated_at
  BEFORE UPDATE ON ecnl_clubs
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
