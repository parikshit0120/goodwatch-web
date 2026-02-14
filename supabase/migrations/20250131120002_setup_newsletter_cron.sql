-- GoodWatch Newsletter Cron Job
-- Triggers newsletter every Sunday at 10 AM IST (4:30 AM UTC)
--
-- PREREQUISITE: Enable these extensions in Supabase Dashboard first:
-- Dashboard > Database > Extensions > Enable pg_cron and pg_net

-- Drop existing function if any (for clean re-deployment)
DROP FUNCTION IF EXISTS trigger_weekly_newsletter();

-- Create the newsletter trigger function
CREATE OR REPLACE FUNCTION trigger_weekly_newsletter()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    function_url TEXT := 'https://zaoihuwiovhakapdbhbi.supabase.co/functions/v1/send-weekly-newsletter';
BEGIN
    -- Call the edge function with the newsletter secret
    -- This is safe because pg_cron functions run server-side only
    PERFORM net.http_post(
        url := function_url,
        headers := jsonb_build_object(
            'Content-Type', 'application/json',
            'x-newsletter-secret', 'ceef6f8db70c34e3e4193cc1f2be395cac11bf5ec95b8537c4a03ccde3d6ec90'
        ),
        body := '{}'::jsonb
    );

    -- Log the trigger
    INSERT INTO newsletter_sends (
        week_start,
        week_end,
        subscriber_count,
        successful_sends,
        failed_sends,
        status,
        error_log
    ) VALUES (
        CURRENT_DATE - INTERVAL '7 days',
        CURRENT_DATE,
        0,
        0,
        0,
        'triggered',
        'Cron job triggered at ' || NOW()::TEXT
    );
END;
$$;

-- Unschedule existing job if any
SELECT cron.unschedule('weekly-newsletter') WHERE EXISTS (
    SELECT 1 FROM cron.job WHERE jobname = 'weekly-newsletter'
);

-- Schedule the cron job for every Sunday at 4:30 AM UTC (10:00 AM IST)
SELECT cron.schedule(
    'weekly-newsletter',           -- job name
    '30 4 * * 0',                  -- cron expression: 4:30 AM UTC every Sunday
    $$SELECT trigger_weekly_newsletter()$$
);
