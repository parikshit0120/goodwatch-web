-- GoodWatch Movie Sync Cron Job
-- Runs daily at 6 AM IST (12:30 AM UTC) to sync movies and detect new releases

-- Create the sync trigger function
CREATE OR REPLACE FUNCTION trigger_movie_sync()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    function_url TEXT := 'https://zaoihuwiovhakapdbhbi.supabase.co/functions/v1/sync-movies';
BEGIN
    -- Call the sync edge function
    PERFORM net.http_post(
        url := function_url,
        headers := jsonb_build_object(
            'Content-Type', 'application/json'
        ),
        body := '{}'::jsonb
    );

    -- Log the sync trigger
    RAISE NOTICE 'Movie sync triggered at %', NOW();
END;
$$;

-- Unschedule existing job if any
SELECT cron.unschedule('daily-movie-sync') WHERE EXISTS (
    SELECT 1 FROM cron.job WHERE jobname = 'daily-movie-sync'
);

-- Schedule the cron job for daily at 12:30 AM UTC (6:00 AM IST)
SELECT cron.schedule(
    'daily-movie-sync',            -- job name
    '30 0 * * *',                  -- cron expression: 12:30 AM UTC daily
    $$SELECT trigger_movie_sync()$$
);

-- Also add a function to manually trigger sync
CREATE OR REPLACE FUNCTION manual_movie_sync()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    PERFORM trigger_movie_sync();
    RETURN 'Sync triggered at ' || NOW()::TEXT;
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION manual_movie_sync() TO authenticated;
GRANT EXECUTE ON FUNCTION manual_movie_sync() TO service_role;
