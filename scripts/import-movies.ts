/**
 * TMDB MOVIE IMPORTER
 * 
 * Fetches movies from TMDB and imports to Supabase
 * Runs in parallel batches for speed
 * 
 * Run: TMDB_API_KEY=xxx npx ts-node scripts/import-movies.ts --pages 500
 * 
 * Each page = 20 movies, so 500 pages = 10,000 movies
 * For 50k movies: --pages 2500
 */

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://jdjqrlkynwfhbtyuddjk.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpkanFybGt5bndmaGJ0eXVkZGprIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ0NzUwMTEsImV4cCI6MjA4MDA1MTAxMX0.KDRMLCewVMp3lwphkUvtoWOkg6kyAk8iSbVkRKiHYSk';
const TMDB_API_KEY = process.env.TMDB_API_KEY || '204363c10c39f75a0320ad4258565f71';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// Languages to include
const ALLOWED_LANGUAGES = new Set(['en', 'hi', 'ta', 'te', 'ml', 'bn', 'ko', 'kn', 'mr', 'pa', 'gu']);

// Minimum ratings by language
const MIN_RATING: Record<string, number> = {
  'en': 6.0,
  'hi': 5.5,
  'ko': 6.0,
  'default': 5.0
};

interface TMDBMovie {
  id: number;
  title: string;
  original_title: string;
  overview: string;
  poster_path: string | null;
  backdrop_path: string | null;
  release_date: string;
  vote_average: number;
  vote_count: number;
  popularity: number;
  original_language: string;
  genre_ids: number[];
  adult: boolean;
}

interface TMDBMovieDetails {
  id: number;
  title: string;
  original_title: string;
  overview: string;
  poster_path: string | null;
  backdrop_path: string | null;
  release_date: string;
  vote_average: number;
  vote_count: number;
  popularity: number;
  original_language: string;
  genres: { id: number; name: string }[];
  runtime: number | null;
  adult: boolean;
}

// Genre ID to name mapping
const GENRE_MAP: Record<number, string> = {
  28: 'Action', 12: 'Adventure', 16: 'Animation', 35: 'Comedy',
  80: 'Crime', 99: 'Documentary', 18: 'Drama', 10751: 'Family',
  14: 'Fantasy', 36: 'History', 27: 'Horror', 10402: 'Music',
  9648: 'Mystery', 10749: 'Romance', 878: 'Science Fiction',
  10770: 'TV Movie', 53: 'Thriller', 10752: 'War', 37: 'Western'
};

// ============ FETCH DISCOVER PAGE ============
async function fetchDiscoverPage(page: number): Promise<TMDBMovie[]> {
  const url = `https://api.themoviedb.org/3/discover/movie?api_key=${TMDB_API_KEY}&sort_by=popularity.desc&page=${page}&vote_count.gte=100`;
  
  try {
    const res = await fetch(url);
    if (!res.ok) return [];
    const data = await res.json();
    return data.results || [];
  } catch {
    return [];
  }
}

// ============ FETCH MOVIE DETAILS ============
async function fetchMovieDetails(tmdbId: number): Promise<TMDBMovieDetails | null> {
  const url = `https://api.themoviedb.org/3/movie/${tmdbId}?api_key=${TMDB_API_KEY}`;
  
  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

// ============ CHECK IF MOVIE EXISTS ============
async function movieExists(tmdbId: number): Promise<boolean> {
  const { data } = await supabase
    .from('movies')
    .select('id')
    .eq('tmdb_id', tmdbId)
    .single();
  return !!data;
}

// ============ INSERT MOVIE ============
async function insertMovie(movie: TMDBMovieDetails): Promise<boolean> {
  const lang = movie.original_language;
  const minRating = MIN_RATING[lang] || MIN_RATING['default'];
  
  // Filter checks
  if (!ALLOWED_LANGUAGES.has(lang)) return false;
  if (movie.vote_average < minRating) return false;
  if (movie.vote_count < 50) return false;
  if (!movie.poster_path) return false;
  if (movie.adult) return false;

  const year = movie.release_date ? parseInt(movie.release_date.substring(0, 4)) : null;
  const decade = year ? `${Math.floor(year / 10) * 10}s` : null;

  const { error } = await supabase.from('movies').upsert({
    tmdb_id: movie.id,
    title: movie.title,
    original_title: movie.original_title,
    overview: movie.overview,
    poster_path: movie.poster_path,
    backdrop_path: movie.backdrop_path,
    release_date: movie.release_date || null,
    year: year,
    decade: decade,
    vote_average: movie.vote_average,
    vote_count: movie.vote_count,
    popularity: movie.popularity,
    original_language: lang,
    genres: movie.genres,
    runtime: movie.runtime,
  }, { onConflict: 'tmdb_id' });

  return !error;
}

// ============ PROCESS BATCH ============
async function processBatch(pages: number[], stats: { added: number; skipped: number; exists: number; failed: number }) {
  for (const page of pages) {
    const movies = await fetchDiscoverPage(page);
    
    for (const movie of movies) {
      // Check if exists
      if (await movieExists(movie.id)) {
        stats.exists++;
        continue;
      }

      // Fetch details
      const details = await fetchMovieDetails(movie.id);
      if (!details) {
        stats.failed++;
        continue;
      }

      // Insert
      const inserted = await insertMovie(details);
      if (inserted) {
        stats.added++;
        process.stdout.write(`\r✅ Added: ${stats.added} | ⏭️ Skipped: ${stats.skipped} | 📦 Exists: ${stats.exists} | ❌ Failed: ${stats.failed}`);
      } else {
        stats.skipped++;
      }

      // Rate limit: 40 req/10s = 4 req/s, so 250ms between requests
      await new Promise(r => setTimeout(r, 100));
    }
  }
}

// ============ MAIN ============
async function main() {
  const args = process.argv.slice(2);
  let totalPages = 100; // Default: 2000 movies
  let concurrency = 3;  // Parallel batches
  let startPage = 1;

  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--pages') totalPages = parseInt(args[i + 1]);
    if (args[i] === '--concurrency') concurrency = parseInt(args[i + 1]);
    if (args[i] === '--start') startPage = parseInt(args[i + 1]);
  }

  console.log(`\n🎬 TMDB Movie Importer`);
  console.log(`📄 Pages: ${startPage} to ${startPage + totalPages - 1} (${totalPages * 20} potential movies)`);
  console.log(`⚡ Concurrency: ${concurrency}`);
  console.log(`🌐 Languages: ${[...ALLOWED_LANGUAGES].join(', ')}`);
  console.log(`\n`);

  const stats = { added: 0, skipped: 0, exists: 0, failed: 0 };
  
  // Create page batches
  const allPages = Array.from({ length: totalPages }, (_, i) => startPage + i);
  const batchSize = Math.ceil(totalPages / concurrency);
  const batches: number[][] = [];
  
  for (let i = 0; i < allPages.length; i += batchSize) {
    batches.push(allPages.slice(i, i + batchSize));
  }

  // Process batches in parallel
  console.log(`Processing ${batches.length} batches...\n`);
  
  await Promise.all(batches.map(batch => processBatch(batch, stats)));

  console.log(`\n\n${'='.repeat(50)}`);
  console.log(`✅ Added:   ${stats.added}`);
  console.log(`⏭️ Skipped: ${stats.skipped} (filters)`);
  console.log(`📦 Exists:  ${stats.exists}`);
  console.log(`❌ Failed:  ${stats.failed}`);
  console.log(`${'='.repeat(50)}\n`);
}

main().catch(console.error);
