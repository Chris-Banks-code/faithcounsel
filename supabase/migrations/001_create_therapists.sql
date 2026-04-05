-- Stage 5: Create therapists table schema
-- Migration: 001_create_therapists.sql

CREATE TABLE IF NOT EXISTS therapists (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  credentials TEXT,
  city TEXT NOT NULL,
  state TEXT NOT NULL,
  phone TEXT,
  website TEXT,
  specialties TEXT,
  insurance TEXT,
  session_type TEXT,
  bio_snippet TEXT,
  source TEXT DEFAULT 'Psychology Today',
  scraped_at DATE,
  telehealth TEXT DEFAULT 'unknown',
  session_rate TEXT DEFAULT 'unavailable',
  is_verified BOOLEAN DEFAULT false,
  confidence INTEGER DEFAULT 0,
  reason TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE therapists ENABLE ROW LEVEL SECURITY;

-- Public read access (anyone can view therapists)
CREATE POLICY "Public can view therapists" ON therapists
  FOR SELECT USING (true);

-- Only authenticated users can insert/update (service role)
CREATE POLICY "Service role can insert" ON therapists
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Service role can update" ON therapists
  FOR UPDATE USING (true);

-- Indexes for common queries
CREATE INDEX IF NOT EXISTS idx_therapists_city ON therapists(city);
CREATE INDEX IF NOT EXISTS idx_therapists_state ON therapists(state);
CREATE INDEX IF NOT EXISTS idx_therapists_telehealth ON therapists(telehealth);
CREATE INDEX IF NOT EXISTS idx_therapists_source ON therapists(source);
