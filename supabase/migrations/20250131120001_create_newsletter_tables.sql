-- GoodWatch Newsletter System Tables
-- Migration: 20250131_create_newsletter_tables.sql

-- ============================================
-- 1. Platform Availability Snapshots
-- Used to detect new releases by comparing before/after sync
-- ============================================
CREATE TABLE IF NOT EXISTS platform_availability_snapshots (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    movie_id UUID NOT NULL,
    platform TEXT NOT NULL,
    snapshot_date DATE NOT NULL DEFAULT CURRENT_DATE,
    is_available BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    -- Foreign key to movies table (adjust if your movies table has different PK)
    CONSTRAINT fk_movie FOREIGN KEY (movie_id) REFERENCES movies(id) ON DELETE CASCADE
);

-- Index for efficient querying during comparison
CREATE INDEX IF NOT EXISTS idx_snapshots_movie_platform
    ON platform_availability_snapshots(movie_id, platform);
CREATE INDEX IF NOT EXISTS idx_snapshots_date
    ON platform_availability_snapshots(snapshot_date);

-- ============================================
-- 2. OTT Releases Table
-- Tracks when movies become available on each platform
-- ============================================
CREATE TABLE IF NOT EXISTS ott_releases (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    movie_id UUID NOT NULL,
    platform TEXT NOT NULL CHECK (platform IN (
        'netflix', 'prime', 'jiohotstar', 'sonyliv',
        'zee5', 'jiocinema', 'appletv'
    )),
    release_date DATE NOT NULL DEFAULT CURRENT_DATE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    -- Foreign key to movies table
    CONSTRAINT fk_movie_release FOREIGN KEY (movie_id) REFERENCES movies(id) ON DELETE CASCADE,

    -- Each movie can only be released once per platform
    CONSTRAINT unique_movie_platform UNIQUE (movie_id, platform)
);

-- Indexes for weekly digest queries
CREATE INDEX IF NOT EXISTS idx_ott_releases_date
    ON ott_releases(release_date);
CREATE INDEX IF NOT EXISTS idx_ott_releases_platform_date
    ON ott_releases(platform, release_date);

-- ============================================
-- 3. Update newsletter_subscribers table
-- Add unsubscribe functionality
-- ============================================
ALTER TABLE newsletter_subscribers
    ADD COLUMN IF NOT EXISTS unsubscribed_at TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS unsubscribe_token UUID DEFAULT gen_random_uuid();

-- Ensure all existing rows have unsubscribe tokens
UPDATE newsletter_subscribers
SET unsubscribe_token = gen_random_uuid()
WHERE unsubscribe_token IS NULL;

-- Make unsubscribe_token NOT NULL after backfill
ALTER TABLE newsletter_subscribers
    ALTER COLUMN unsubscribe_token SET NOT NULL;

-- Index for unsubscribe lookups
CREATE INDEX IF NOT EXISTS idx_subscribers_unsubscribe_token
    ON newsletter_subscribers(unsubscribe_token);

-- ============================================
-- 4. Newsletter Sends Log
-- Track each newsletter send for debugging/analytics
-- ============================================
CREATE TABLE IF NOT EXISTS newsletter_sends (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sent_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    week_start DATE NOT NULL,
    week_end DATE NOT NULL,
    subscriber_count INT NOT NULL DEFAULT 0,
    successful_sends INT NOT NULL DEFAULT 0,
    failed_sends INT NOT NULL DEFAULT 0,
    status TEXT NOT NULL CHECK (status IN ('success', 'partial', 'failed')),
    error_log TEXT,
    digest_data JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for querying send history
CREATE INDEX IF NOT EXISTS idx_newsletter_sends_date
    ON newsletter_sends(sent_at);

-- ============================================
-- 5. RLS Policies
-- ============================================

-- Enable RLS on new tables
ALTER TABLE platform_availability_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE ott_releases ENABLE ROW LEVEL SECURITY;
ALTER TABLE newsletter_sends ENABLE ROW LEVEL SECURITY;

-- Snapshots: Only service role can read/write (used by sync process)
CREATE POLICY "Service role full access to snapshots"
    ON platform_availability_snapshots
    FOR ALL
    USING (auth.role() = 'service_role');

-- OTT Releases: Public can read, only service role can write
CREATE POLICY "Public read access to ott_releases"
    ON ott_releases
    FOR SELECT
    USING (true);

CREATE POLICY "Service role write access to ott_releases"
    ON ott_releases
    FOR ALL
    USING (auth.role() = 'service_role');

-- Newsletter sends: Only service role
CREATE POLICY "Service role full access to newsletter_sends"
    ON newsletter_sends
    FOR ALL
    USING (auth.role() = 'service_role');

-- Update newsletter_subscribers policy for unsubscribe
-- Allow public to update their own record via unsubscribe_token
CREATE POLICY "Allow unsubscribe via token"
    ON newsletter_subscribers
    FOR UPDATE
    USING (true)
    WITH CHECK (true);

-- ============================================
-- 6. Helper Functions
-- ============================================

-- Function to get active subscribers (not unsubscribed)
CREATE OR REPLACE FUNCTION get_active_subscribers()
RETURNS TABLE (
    id UUID,
    email TEXT,
    unsubscribe_token UUID,
    created_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT
        ns.id,
        ns.email,
        ns.unsubscribe_token,
        ns.created_at
    FROM newsletter_subscribers ns
    WHERE ns.unsubscribed_at IS NULL;
END;
$$;

-- Function to unsubscribe by token
CREATE OR REPLACE FUNCTION unsubscribe_by_token(token UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    affected_rows INT;
BEGIN
    UPDATE newsletter_subscribers
    SET unsubscribed_at = NOW()
    WHERE unsubscribe_token = token
    AND unsubscribed_at IS NULL;

    GET DIAGNOSTICS affected_rows = ROW_COUNT;
    RETURN affected_rows > 0;
END;
$$;

-- Function to get weekly releases with movie details
CREATE OR REPLACE FUNCTION get_weekly_releases(
    start_date DATE DEFAULT CURRENT_DATE - INTERVAL '7 days',
    end_date DATE DEFAULT CURRENT_DATE
)
RETURNS TABLE (
    release_id UUID,
    movie_id UUID,
    platform TEXT,
    release_date DATE,
    title TEXT,
    year INT,
    rating NUMERIC,
    vote_count INT,
    runtime_minutes INT,
    poster_url TEXT,
    mood_tags TEXT[],
    genres TEXT[]
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT
        r.id as release_id,
        r.movie_id,
        r.platform,
        r.release_date,
        m.title,
        m.year,
        m.rating,
        m.vote_count,
        m.runtime_minutes,
        m.poster_url,
        m.mood_tags,
        m.genres
    FROM ott_releases r
    JOIN movies m ON r.movie_id = m.id
    WHERE r.release_date BETWEEN start_date AND end_date
    ORDER BY r.platform, m.rating DESC;
END;
$$;

-- Function to cleanup old snapshots (keep only last 2)
CREATE OR REPLACE FUNCTION cleanup_old_snapshots()
RETURNS INT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    deleted_count INT;
    cutoff_date DATE;
BEGIN
    -- Get the date of the second most recent snapshot
    SELECT snapshot_date INTO cutoff_date
    FROM (
        SELECT DISTINCT snapshot_date
        FROM platform_availability_snapshots
        ORDER BY snapshot_date DESC
        LIMIT 2
    ) recent
    ORDER BY snapshot_date ASC
    LIMIT 1;

    -- Delete snapshots older than cutoff
    IF cutoff_date IS NOT NULL THEN
        DELETE FROM platform_availability_snapshots
        WHERE snapshot_date < cutoff_date;

        GET DIAGNOSTICS deleted_count = ROW_COUNT;
    ELSE
        deleted_count := 0;
    END IF;

    RETURN deleted_count;
END;
$$;

-- ============================================
-- 7. Grant permissions to anon role for unsubscribe
-- ============================================
GRANT EXECUTE ON FUNCTION unsubscribe_by_token(UUID) TO anon;
GRANT EXECUTE ON FUNCTION unsubscribe_by_token(UUID) TO authenticated;
