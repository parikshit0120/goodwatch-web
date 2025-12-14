/**
 * AVAILABILITY-FIRST MOVIE IMPORTER
 * 
 * PHILOSOPHY:
 * "If a movie cannot be watched tonight on a supported OTT, 
 *  GoodWatch will not acknowledge its existence."
 * 
 * This script:
 * 1. Fetches popular movies from TMDB
 * 2. Checks if available on India OTTs FIRST
 * 3. Only imports movies with flatrate providers
 * 4. Creates decision_snapshot at import time
 * 
 * Run: TMDB_API_KEY=xxx npx ts-node scripts/import-available-movies.ts
 */

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://jdjqrlkynwfhbtyuddjk.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpkanFybGt5bndmaGJ0eXVkZGprIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ0NzUwMTEsImV4cCI6MjA4MDA1MTAxMX0.KDRMLCewVMp3lwphkUvtoWOkg6kyAk8iSbVkRKiHYSk';
const TMDB_API_KEY = process.env.TMDB_API_KEY || '204363c10c39f75a0320ad4258565f71';
const REGION = 'IN';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// ============ PROVIDER CONFIG ============
const FLATRATE_PROVIDERS: Record<number, string> = {
  8: 'Netflix',
  119: 'Amazon Prime Video',
  122: 'JioHotstar',
  350: 'Apple TV+',
  237: 'SonyLIV',
  232: 'Zee5',
  220: 'JioCinema',
};

const PROVIDER_NORMALIZATION: Record<string, { name: string; id: number }> = {
  'Disney Plus Hotstar': { name: 'JioHotstar', id: 122 },
  'Disney+ Hotstar': { name: 'JioHotstar', id: 122 },
  'Hotstar': { name: 'JioHotstar', id: 122 },
};

// Language config for filtering
const ALLOWED_LANGUAGES = new Set(['en', 'hi', 'ta', 'te', 'ml', 'bn', 'ko', 'kn', 'mr', 'pa', 'gu']);

interface SnapshotProvider {
  id: number;
  name: string;
  type: 'flatrate';
  logo_path: string;
  deep_link: string | null;
}

// ============ CHECK AVAILABILITY FIRST ============
async function checkAvailability(tmdbId: number): Promise<{ available: boolean; providers: SnapshotProvider[]; link: string | null }> {
  try {
    const url = `https://api.themoviedb.org/3/movie/${tmdbId}/watch/providers?api_key=${TMDB_API_KEY}`;
    const res = await fetch(url);
    if (!res.ok) return { available: false, providers: [], link: null };

    const data = await res.json();
    const inData = data.results?.IN;
    
    if (!inData?.flatrate?.length) {
      return { available: false, providers: [], link: null };
    }

    const providers: SnapshotProvider[] = [];
    const seen = new Set<number>();

    for (const p of inData.flatrate) {
      // Normalize provider name
      const norm = PROVIDER_NORMALIZATION[p.provider_name] || { id: p.provider_id, name: p.provider_name };
      
      if (FLATRATE_PROVIDERS[norm.id] && !seen.has(norm.id)) {
        seen.add(norm.id);
        providers.push({
          id: norm.id,
          name: FLATRATE_PROVIDERS[norm.id],
          type: 'flatrate',
          logo_path: p.logo_path || '',
          deep_link: inData.link || null,
        });
      }
    }

    return {
      available: providers.length > 0,
      providers,
      link: inData.link || null,
    };
  } catch {
    return { available: false, providers: [], link: null };
  }
}

// ============ FETCH MOVIE DETAILS ============
async function fetchMovieDetails(tmdbId: number): Promise<any | null> {
  try {
    const url = `https://api.themoviedb.org/3/movie/${tmdbId}?api_key=${TMDB_API_KEY}`;
    const res = await fetch(url);
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

// ============ FETCH DISCOVER PAGE ============
async function fetchDiscoverPage(page: number, language?: string): Promise<any[]> {
  let url = `https://api.themoviedb.org/3/discover/movie?api_key=${TMDB_API_KEY}&sort_by=popularity.desc&page=${page}&vote_count.gte=10`;
  if (language) {
    url += `&with_original_language=${language}`;
  }
  
  try {
    const res = await fetch(url);
    if (!res.ok) return [];
    const data = await res.json();
    return data.results || [];
  } catch {
    return [];
  }
}

// ============ CHECK IF EXISTS ============
async function movieExists(tmdbId: number): Promise<string | null> {
  const { data } = await supabase
    .from('movies')
    .select('id')
    .eq('tmdb_id', tmdbId)
    .single();
  return data?.id || null;
}

// ============ INSERT MOVIE + SNAPSHOT ============
async function insertMovieWithSnapshot(movie: any, providers: SnapshotProvider[]): Promise<boolean> {
  // Filter checks
  if (!movie.poster_path) return false;
  if (movie.adult) return false;
  if (!ALLOWED_LANGUAGES.has(movie.original_language)) return false;

  const year = movie.release_date ? parseInt(movie.release_date.substring(0, 4)) : null;
  const decade = year ? `${Math.floor(year / 10) * 10}s` : null;

  // Insert movie
  const { data: movieData, error: movieError } = await supabase.from('movies').upsert({
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
    original_language: movie.original_language,
    genres: movie.genres || [],
    runtime: movie.runtime,
  }, { onConflict: 'tmdb_id' }).select('id').single();

  if (movieError || !movieData) return false;

  // Create decision snapshot immediately
  const confidence = 0.5; // TMDB confirmed = 0.4 + freshness 0.1
  
  const { error: snapshotError } = await supabase.from('decision_snapshots').upsert({
    movie_id: movieData.id,
    region: REGION,
    providers: providers,
    confidence_score: confidence,
    verified_at: new Date().toISOString(),
    verification_sources: ['tmdb'],
    is_valid: true,
    invalid_reason: null,
    updated_at: new Date().toISOString(),
  }, { onConflict: 'movie_id,region' });

  return !snapshotError;
}

// ============ PROCESS BY LANGUAGE ============
async function processLanguage(
  language: string,
  languageName: string,
  targetCount: number,
  stats: { total: number; available: number; unavailable: number; exists: number; failed: number }
): Promise<void> {
  console.log(`\n🌐 ${languageName} (target: ${targetCount})`);
  
  let added = 0;
  let page = 1;
  const maxPages = 500;

  while (added < targetCount && page <= maxPages) {
    const movies = await fetchDiscoverPage(page, language);
    if (movies.length === 0) break;

    for (const movie of movies) {
      if (added >= targetCount) break;
      stats.total++;

      // Check if already exists
      const existingId = await movieExists(movie.id);
      if (existingId) {
        stats.exists++;
        continue;
      }

      // CHECK AVAILABILITY FIRST - This is the key
      const availability = await checkAvailability(movie.id);
      
      if (!availability.available) {
        stats.unavailable++;
        await new Promise(r => setTimeout(r, 50));
        continue;
      }

      // Only now fetch full details
      const details = await fetchMovieDetails(movie.id);
      if (!details) {
        stats.failed++;
        await new Promise(r => setTimeout(r, 50));
        continue;
      }

      // Insert movie + snapshot together
      const inserted = await insertMovieWithSnapshot(details, availability.providers);
      
      if (inserted) {
        added++;
        stats.available++;
        const providerNames = availability.providers.map(p => p.name).join(', ');
        process.stdout.write(`\r   ✅ ${added}/${targetCount} | ${providerNames.substring(0, 30).padEnd(30)}`);
      } else {
        stats.failed++;
      }

      // Rate limit: ~10 req/s
      await new Promise(r => setTimeout(r, 100));
    }

    page++;
  }

  console.log(`\n   Done: ${added} available movies added`);
}

// ============ MAIN ============
async function main() {
  console.log(`\n${'='.repeat(60)}`);
  console.log(`🎬 AVAILABILITY-FIRST MOVIE IMPORTER`);
  console.log(`${'='.repeat(60)}`);
  console.log(`\nPHILOSOPHY:`);
  console.log(`"If a movie cannot be watched tonight on a supported OTT,`);
  console.log(` GoodWatch will not acknowledge its existence."\n`);
  console.log(`Supported OTTs: ${Object.values(FLATRATE_PROVIDERS).join(', ')}`);
  console.log(`${'='.repeat(60)}`);

  const startTime = Date.now();
  const stats = { total: 0, available: 0, unavailable: 0, exists: 0, failed: 0 };

  // Language targets (only import what's available)
  // These are aspirational - actual counts depend on OTT availability
  const languages = [
    { code: 'en', name: 'English', target: 5000 },
    { code: 'hi', name: 'Hindi', target: 3000 },
    { code: 'ta', name: 'Tamil', target: 500 },
    { code: 'te', name: 'Telugu', target: 500 },
    { code: 'ml', name: 'Malayalam', target: 300 },
    { code: 'ko', name: 'Korean', target: 500 },
    { code: 'kn', name: 'Kannada', target: 200 },
    { code: 'mr', name: 'Marathi', target: 200 },
    { code: 'bn', name: 'Bengali', target: 200 },
  ];

  for (const lang of languages) {
    await processLanguage(lang.code, lang.name, lang.target, stats);
  }

  const elapsed = ((Date.now() - startTime) / 1000 / 60).toFixed(1);

  console.log(`\n${'='.repeat(60)}`);
  console.log(`FINAL RESULTS`);
  console.log(`${'='.repeat(60)}`);
  console.log(`📊 Total checked:     ${stats.total}`);
  console.log(`✅ Available & added: ${stats.available}`);
  console.log(`⚪ Not available:     ${stats.unavailable}`);
  console.log(`📦 Already existed:   ${stats.exists}`);
  console.log(`❌ Failed:            ${stats.failed}`);
  console.log(`⏱️ Time:              ${elapsed} minutes`);
  console.log(`${'='.repeat(60)}`);
  console.log(`\n💡 Only movies available on India OTTs were imported.`);
  console.log(`   Every movie in the database can be watched tonight.\n`);
}

main().catch(console.error);
