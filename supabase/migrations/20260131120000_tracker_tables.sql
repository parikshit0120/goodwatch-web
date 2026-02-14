-- GoodWatch Distribution Tracker Schema
-- Migration: 20260131_tracker_tables

-- Main tracker state (JSON blob for flexibility)
CREATE TABLE IF NOT EXISTS tracker_data (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  data JSONB NOT NULL DEFAULT '{}',
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Daily task completions (for historical analysis)
CREATE TABLE IF NOT EXISTS daily_tasks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  date DATE NOT NULL UNIQUE,
  tasks JSONB NOT NULL,
  completion_rate INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Metrics snapshots (daily recordings)
CREATE TABLE IF NOT EXISTS metrics_snapshots (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  date DATE NOT NULL,
  metric_type TEXT NOT NULL,
  value INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(date, metric_type)
);

-- Content bank
CREATE TABLE IF NOT EXISTS content_bank (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  platform TEXT NOT NULL,
  content_type TEXT NOT NULL,
  text TEXT NOT NULL,
  status TEXT DEFAULT 'Draft',
  posted_at TIMESTAMP WITH TIME ZONE,
  performance_notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- B2B outreach pipeline
CREATE TABLE IF NOT EXISTS b2b_outreach (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  company TEXT NOT NULL,
  contact_name TEXT,
  contact_role TEXT,
  linkedin_url TEXT,
  email TEXT,
  status TEXT DEFAULT 'Not Started',
  notes TEXT,
  last_contact_date DATE,
  next_action TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tracker settings
CREATE TABLE IF NOT EXISTS tracker_settings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  start_date DATE NOT NULL,
  password_hash TEXT NOT NULL,
  settings JSONB DEFAULT '{}'
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_daily_tasks_date ON daily_tasks(date);
CREATE INDEX IF NOT EXISTS idx_metrics_snapshots_date ON metrics_snapshots(date);
CREATE INDEX IF NOT EXISTS idx_metrics_snapshots_type ON metrics_snapshots(metric_type);
CREATE INDEX IF NOT EXISTS idx_content_bank_status ON content_bank(status);
CREATE INDEX IF NOT EXISTS idx_content_bank_platform ON content_bank(platform);
CREATE INDEX IF NOT EXISTS idx_b2b_outreach_status ON b2b_outreach(status);

-- Enable Row Level Security (but allow all operations since this is password-protected)
ALTER TABLE tracker_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE metrics_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_bank ENABLE ROW LEVEL SECURITY;
ALTER TABLE b2b_outreach ENABLE ROW LEVEL SECURITY;
ALTER TABLE tracker_settings ENABLE ROW LEVEL SECURITY;

-- Create policies to allow all operations (auth is handled at app level)
CREATE POLICY "Allow all operations on tracker_data" ON tracker_data FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations on daily_tasks" ON daily_tasks FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations on metrics_snapshots" ON metrics_snapshots FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations on content_bank" ON content_bank FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations on b2b_outreach" ON b2b_outreach FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations on tracker_settings" ON tracker_settings FOR ALL USING (true) WITH CHECK (true);
