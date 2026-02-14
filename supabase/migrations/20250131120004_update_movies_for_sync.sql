-- Update movies table for TMDB sync
-- Adds fields needed by the sync-movies Edge Function

-- Add new columns to movies table
ALTER TABLE movies ADD COLUMN IF NOT EXISTS tmdb_id INTEGER UNIQUE;
ALTER TABLE movies ADD COLUMN IF NOT EXISTS original_title TEXT;
ALTER TABLE movies ADD COLUMN IF NOT EXISTS overview TEXT;
ALTER TABLE movies ADD COLUMN IF NOT EXISTS backdrop_url TEXT;
ALTER TABLE movies ADD COLUMN IF NOT EXISTS popularity DECIMAL;
ALTER TABLE movies ADD COLUMN IF NOT EXISTS original_language TEXT;
ALTER TABLE movies ADD COLUMN IF NOT EXISTS synced_at TIMESTAMPTZ;

-- Create index on tmdb_id for faster lookups
CREATE INDEX IF NOT EXISTS idx_movies_tmdb_id ON movies(tmdb_id);

-- Create index on platforms for filtering
CREATE INDEX IF NOT EXISTS idx_movies_platforms ON movies USING GIN(platforms);

-- Create index on mood_tags for filtering
CREATE INDEX IF NOT EXISTS idx_movies_mood_tags ON movies USING GIN(mood_tags);

-- Create index on rating for quality gates
CREATE INDEX IF NOT EXISTS idx_movies_rating ON movies(rating);

-- Create composite index for newsletter queries
CREATE INDEX IF NOT EXISTS idx_movies_newsletter
ON movies(rating, vote_count)
WHERE rating >= 6.5 AND vote_count >= 500;
