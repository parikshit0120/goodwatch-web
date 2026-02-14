-- Update RLS policies to require a secret access token
-- This makes the tracker data only accessible with the correct token

-- First, drop the existing permissive policies
DROP POLICY IF EXISTS "Allow all operations on tracker_data" ON tracker_data;
DROP POLICY IF EXISTS "Allow all operations on daily_tasks" ON daily_tasks;
DROP POLICY IF EXISTS "Allow all operations on metrics_snapshots" ON metrics_snapshots;
DROP POLICY IF EXISTS "Allow all operations on content_bank" ON content_bank;
DROP POLICY IF EXISTS "Allow all operations on b2b_outreach" ON b2b_outreach;
DROP POLICY IF EXISTS "Allow all operations on tracker_settings" ON tracker_settings;

-- Create a function to check the access token from request headers
CREATE OR REPLACE FUNCTION check_tracker_access()
RETURNS BOOLEAN AS $$
BEGIN
  -- Check if the request has the correct access token
  -- The token is passed via the 'x-tracker-token' header
  RETURN current_setting('request.headers', true)::json->>'x-tracker-token' = 'gw-tracker-2026-secret';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create new policies that require the access token
CREATE POLICY "Require token for tracker_data" ON tracker_data
  FOR ALL USING (check_tracker_access()) WITH CHECK (check_tracker_access());

CREATE POLICY "Require token for daily_tasks" ON daily_tasks
  FOR ALL USING (check_tracker_access()) WITH CHECK (check_tracker_access());

CREATE POLICY "Require token for metrics_snapshots" ON metrics_snapshots
  FOR ALL USING (check_tracker_access()) WITH CHECK (check_tracker_access());

CREATE POLICY "Require token for content_bank" ON content_bank
  FOR ALL USING (check_tracker_access()) WITH CHECK (check_tracker_access());

CREATE POLICY "Require token for b2b_outreach" ON b2b_outreach
  FOR ALL USING (check_tracker_access()) WITH CHECK (check_tracker_access());

CREATE POLICY "Require token for tracker_settings" ON tracker_settings
  FOR ALL USING (check_tracker_access()) WITH CHECK (check_tracker_access());
