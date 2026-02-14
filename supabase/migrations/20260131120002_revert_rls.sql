-- Revert to simple open policies (app-level password protection is sufficient)
-- Drop the token-based policies

DROP POLICY IF EXISTS "Require token for tracker_data" ON tracker_data;
DROP POLICY IF EXISTS "Require token for daily_tasks" ON daily_tasks;
DROP POLICY IF EXISTS "Require token for metrics_snapshots" ON metrics_snapshots;
DROP POLICY IF EXISTS "Require token for content_bank" ON content_bank;
DROP POLICY IF EXISTS "Require token for b2b_outreach" ON b2b_outreach;
DROP POLICY IF EXISTS "Require token for tracker_settings" ON tracker_settings;

-- Drop the function
DROP FUNCTION IF EXISTS check_tracker_access();

-- Recreate simple open policies
CREATE POLICY "Allow all on tracker_data" ON tracker_data FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on daily_tasks" ON daily_tasks FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on metrics_snapshots" ON metrics_snapshots FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on content_bank" ON content_bank FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on b2b_outreach" ON b2b_outreach FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on tracker_settings" ON tracker_settings FOR ALL USING (true) WITH CHECK (true);
