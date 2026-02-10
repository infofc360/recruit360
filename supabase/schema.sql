-- Supabase Schema for Recruit360
-- Run this in your Supabase SQL Editor

-- Create colleges table
CREATE TABLE IF NOT EXISTS colleges (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  division TEXT NOT NULL CHECK (division IN ('D1', 'D2', 'D3', 'ECNL')),
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

-- Create coaches table
CREATE TABLE IF NOT EXISTS coaches (
  id SERIAL PRIMARY KEY,
  college_id TEXT NOT NULL REFERENCES colleges(id) ON DELETE CASCADE,
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

-- Enable Row Level Security (RLS)
ALTER TABLE colleges ENABLE ROW LEVEL SECURITY;
ALTER TABLE coaches ENABLE ROW LEVEL SECURITY;

-- Create policies for public read access
CREATE POLICY "Allow public read access to colleges"
  ON colleges FOR SELECT
  TO anon
  USING (true);

CREATE POLICY "Allow public read access to coaches"
  ON coaches FOR SELECT
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

-- Trigger to auto-update updated_at
CREATE TRIGGER update_colleges_updated_at
  BEFORE UPDATE ON colleges
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
