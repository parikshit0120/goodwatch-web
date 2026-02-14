-- GoodWatch Web Base Tables
-- Migration: 20250131_001_create_base_tables.sql
-- Run this FIRST before the newsletter tables migration

-- ============================================
-- 1. Newsletter Subscribers Table
-- Core table for email subscriptions
-- ============================================
CREATE TABLE IF NOT EXISTS newsletter_subscribers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT NOT NULL UNIQUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for email lookups
CREATE INDEX IF NOT EXISTS idx_subscribers_email
    ON newsletter_subscribers(email);

-- Enable RLS
ALTER TABLE newsletter_subscribers ENABLE ROW LEVEL SECURITY;

-- Allow anonymous users to insert (subscribe)
CREATE POLICY "Allow anonymous subscribe"
    ON newsletter_subscribers
    FOR INSERT
    WITH CHECK (true);

-- Allow reading own subscription (not really needed but good practice)
CREATE POLICY "Allow read access"
    ON newsletter_subscribers
    FOR SELECT
    USING (true);

-- ============================================
-- 2. Movies Table (Simplified for newsletter)
-- Stores movie data from TMDB for newsletter digests
-- ============================================
CREATE TABLE IF NOT EXISTS movies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tmdb_id INTEGER UNIQUE,
    title TEXT NOT NULL,
    year INTEGER,
    rating NUMERIC(3,1),
    vote_count INTEGER DEFAULT 0,
    runtime_minutes INTEGER,
    poster_url TEXT,
    backdrop_url TEXT,
    overview TEXT,
    genres TEXT[],
    mood_tags TEXT[],
    platforms TEXT[],
    language TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for common queries
CREATE INDEX IF NOT EXISTS idx_movies_tmdb_id ON movies(tmdb_id);
CREATE INDEX IF NOT EXISTS idx_movies_rating ON movies(rating);
CREATE INDEX IF NOT EXISTS idx_movies_platforms ON movies USING GIN(platforms);

-- Enable RLS
ALTER TABLE movies ENABLE ROW LEVEL SECURITY;

-- Public read access to movies
CREATE POLICY "Public read access to movies"
    ON movies
    FOR SELECT
    USING (true);

-- Service role full access for sync
CREATE POLICY "Service role write access to movies"
    ON movies
    FOR ALL
    USING (auth.role() = 'service_role');

-- ============================================
-- 3. Update timestamp trigger
-- ============================================
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER movies_updated_at
    BEFORE UPDATE ON movies
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at();
