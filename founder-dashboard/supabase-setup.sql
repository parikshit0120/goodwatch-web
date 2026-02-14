-- Dashboard Tables for Founder Operations
-- Run this in your Supabase SQL editor: https://jdjqrlkynwfhbtyuddjk.supabase.co

-- Tasks table
CREATE TABLE IF NOT EXISTS dashboard_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  category TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'todo',
  impact_score INTEGER NOT NULL DEFAULT 3,
  effort_score INTEGER NOT NULL DEFAULT 2,
  linked_metric TEXT,
  due_date DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

-- Ship logs table
CREATE TABLE IF NOT EXISTS dashboard_ship_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  date DATE NOT NULL,
  description TEXT NOT NULL,
  metric_targeted TEXT,
  result_note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Context notes table
CREATE TABLE IF NOT EXISTS dashboard_context_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  category TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Row Level Security (RLS) - Only you can access
ALTER TABLE dashboard_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE dashboard_ship_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE dashboard_context_notes ENABLE ROW LEVEL SECURITY;

-- Policies - Allow all operations for authenticated users
CREATE POLICY "Allow all for authenticated users" ON dashboard_tasks
  FOR ALL USING (auth.uid() IS NOT NULL);

CREATE POLICY "Allow all for authenticated users" ON dashboard_ship_logs
  FOR ALL USING (auth.uid() IS NOT NULL);

CREATE POLICY "Allow all for authenticated users" ON dashboard_context_notes
  FOR ALL USING (auth.uid() IS NOT NULL);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_tasks_category ON dashboard_tasks(category);
CREATE INDEX IF NOT EXISTS idx_tasks_status ON dashboard_tasks(status);
CREATE INDEX IF NOT EXISTS idx_ship_logs_date ON dashboard_ship_logs(date DESC);
CREATE INDEX IF NOT EXISTS idx_context_notes_category ON dashboard_context_notes(category);
