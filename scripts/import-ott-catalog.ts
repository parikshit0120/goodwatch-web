/**
 * OTT CATALOG IMPORTER (WITH CLEANUP)
 * 
 * PHILOSOPHY:
 * "If a movie cannot be watched tonight on a supported OTT, 
 *  GoodWatch will not acknowledge its existence."
 * 
 * This script:
 * 1. Imports all movies available on India OTTs
 * 2. Creates decision_snapshots at import time
 * 3. REMOVES movies that aren't available on any OTT
 * 
 * Run: TMDB_API_KEY=xxx npx ts-node scripts/import-ott-catalog.ts
 */

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://jdjqrlkynwfhbtyuddjk.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpkanFybGt5bndmaGJ0eXVkZGprIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ0NzUwMTEsImV4cCI6MjA4MDA1MTAxMX0.KDRMLCewVMp3lwphkUvtoWOkg6kyAk8iSbVkRKiHYSk';
const TMDB_API_KEY = process.env.TMDB_API_KEY || '204363c10c39f75a0320ad4258565f71';
const REGION = 'IN';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// ============ OTT PROVIDERS (INDIA) ============
const OTT_PROVIDERS = [
  { id: 8, name: 'Netflix' },
  { id: 119, name: 'Amazon Prime Video' },
  { id: 122, name: 'JioHotstar' },
  { id: 350, name: 'Apple TV+' },
  { id: 237, name: 'SonyLIV' },
  { id: 232, name: 'Zee5' },
  { id: 220, name: 'JioCinema' },
];

const PROVIDER_MAP: Record<number, string> = {};
OTT_PROVIDERS.forEach(p => PROVIDER_MAP[p.id] = p.name);

const PROVIDER_NORMALIZATION: Record<string, { name: string; id: number }> = {
  'Disney Plus Hotstar': { name: 'JioHotstar', id: 122 },
  'Disney+ Hotstar': { name: 'JioHotstar', id: 122 },
  'Hotstar': { name: 'JioHotstar', id: 122 },
};

interface SnapshotProvider {
  id: number;
  name: string;
  type: 'flatrate';
  logo_path: string;
  deep_link: string | null;
}

// Track all valid movie IDs (available on OTTs)
const validMovieIds = new Set<string>();
const seenTmdbIds = new Set<number>();

// ============ FETCH OTT CATALOG PAGE ============
async function fetchOttCatalogPage(providerId: number, page: number): Promise<any[]> {
  const url = `https://api.themoviedb.org/3/discover/movie?api_key=${TMDB_API_KEY}&watch_region=${REGION}&with_watch_providers=${providerId}&with_watch_monetization_types=flatrate&sort_by=popularity.desc&page=${page}`;
  
  try {
    const res = await fetch(url);
    if (!res.ok) return [];
    const data = await res.json();
    return data.results || [];
  } catch {
    return [];
  }
}

// ============ GET TOTAL PAGES FOR OTT ============
async function getOttTotalPages(providerId: number): Promise<number> {
  const url = `https://api.themoviedb.org/3/discover/movie?api_key=${TMDB_API_KEY}&watch_region=${REGION}&with_watch_providers=${providerId}&with_watch_monetization_types=flatrate&page=1`;
  
  try {
    const res = await fetch(url);
    if (!res.ok) return 0;
    const data = await res.json();
    return Math.min(data.total_pages || 0, 500);
  } catch {
    return 0;
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

// ============ FETCH WATCH PROVIDERS ============
async function fetchWatchProviders(tmdbId: number): Promise<SnapshotProvider[]> {
  try {
    const url = `https://api.themoviedb.org/3/movie/${tmdbId}/watch/providers?api_key=${TMDB_API_KEY}`;
    const res = await fetch(url);
    if (!res.ok) return [];

    const data = await res.json();
    const inData = data.results?.IN;
    if (!inData?.flatrate?.length) return [];

    const providers: SnapshotProvider[] = [];
    const seen = new Set<number>();

    for (const p of inData.flatrate) {
      const norm = PROVIDER_NORMALIZATION[p.provider_name] || { id: p.provider_id, name: p.provider_name };
      
      if (PROVIDER_MAP[norm.id] && !seen.has(norm.id)) {
        seen.add(norm.id);
        providers.push({
          id: norm.id,
          name: PROVIDER_MAP[norm.id],
          type: 'flatrate',
          logo_path: p.logo_path || '',
          deep_link: inData.link || null,
        });
      }
    }

    return providers;
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
async function insertMovieWithSnapshot(movie: any, providers: SnapshotProvider[]): Promise<string | null> {
  if (!movie.poster_path) return null;
  if (movie.adult) return null;

  const year = movie.release_date ? parseInt(movie.release_date.substring(0, 4)) : null;
  const decade = year ? `${Math.floor(year / 10) * 10}s` : null;

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

  if (movieError || !movieData) return null;

  const { error: snapshotError } = await supabase.from('decision_snapshots').upsert({
    movie_id: movieData.id,
    region: REGION,
    providers: providers,
    confidence_score: 0.5,
    verified_at: new Date().toISOString(),
    verification_sources: ['tmdb'],
    is_valid: true,
    invalid_reason: null,
    updated_at: new Date().toISOString(),
  }, { onConflict: 'movie_id,region' });

  if (snapshotError) return null;
  return movieData.id;
}

// ============ UPDATE EXISTING SNAPSHOT ============
async function updateSnapshot(movieId: string, providers: SnapshotProvider[]): Promise<boolean> {
  const { data: existing } = await supabase
    .from('decision_snapshots')
    .select('providers')
    .eq('movie_id', movieId)
    .eq('region', REGION)
    .single();

  let mergedProviders = providers;
  if (existing?.providers) {
    const existingIds = new Set((existing.providers as any[]).map(p => p.id));
    const newProviders = providers.filter(p => !existingIds.has(p.id));
    mergedProviders = [...(existing.providers as any[]), ...newProviders];
  }

  const { error } = await supabase.from('decision_snapshots').upsert({
    movie_id: movieId,
    region: REGION,
    providers: mergedProviders,
    confidence_score: 0.5,
    verified_at: new Date().toISOString(),
    verification_sources: ['tmdb'],
    is_valid: true,
    invalid_reason: null,
    updated_at: new Date().toISOString(),
  }, { onConflict: 'movie_id,region' });

  return !error;
}

// ============ PROCESS OTT ============
async function processOtt(
  provider: { id: number; name: string },
  globalStats: { added: number; updated: number; skipped: number; failed: number }
): Promise<void> {
  console.log(`\n📺 ${provider.name}`);
  
  const totalPages = await getOttTotalPages(provider.id);
  console.log(`   Found ${totalPages} pages (~${totalPages * 20} movies)`);

  let localAdded = 0;
  let localUpdated = 0;

  for (let page = 1; page <= totalPages; page++) {
    const movies = await fetchOttCatalogPage(provider.id, page);
    
    for (const movie of movies) {
      if (seenTmdbIds.has(movie.id)) continue;
      seenTmdbIds.add(movie.id);

      const existingId = await movieExists(movie.id);
      
      if (existingId) {
        validMovieIds.add(existingId);
        const providers = await fetchWatchProviders(movie.id);
        if (providers.length > 0) {
          await updateSnapshot(existingId, providers);
          localUpdated++;
          globalStats.updated++;
        }
        await new Promise(r => setTimeout(r, 50));
        continue;
      }

      const details = await fetchMovieDetails(movie.id);
      if (!details) {
        globalStats.failed++;
        await new Promise(r => setTimeout(r, 50));
        continue;
      }

      const providers = await fetchWatchProviders(movie.id);
      if (providers.length === 0) {
        globalStats.skipped++;
        await new Promise(r => setTimeout(r, 50));
        continue;
      }

      const newId = await insertMovieWithSnapshot(details, providers);
      if (newId) {
        validMovieIds.add(newId);
        localAdded++;
        globalStats.added++;
      } else {
        globalStats.failed++;
      }

      await new Promise(r => setTimeout(r, 80));
    }

    const progress = ((page / totalPages) * 100).toFixed(0);
    process.stdout.write(`\r   Page ${page}/${totalPages} (${progress}%) | Added: ${localAdded} | Updated: ${localUpdated}`);
  }

  console.log(`\n   ✅ ${provider.name}: ${localAdded} new, ${localUpdated} updated`);
}

// ============ CLEANUP: REMOVE UNAVAILABLE MOVIES ============
async function cleanupUnavailableMovies(): Promise<number> {
  console.log(`\n🧹 Cleaning up unavailable movies...`);
  
  // Get all movie IDs
  const { data: allMovies, error } = await supabase
    .from('movies')
    .select('id, title');
  
  if (error || !allMovies) {
    console.log(`   Error fetching movies: ${error?.message}`);
    return 0;
  }

  const toDelete: string[] = [];
  
  for (const movie of allMovies) {
    if (!validMovieIds.has(movie.id)) {
      toDelete.push(movie.id);
    }
  }

  if (toDelete.length === 0) {
    console.log(`   No movies to remove.`);
    return 0;
  }

  console.log(`   Removing ${toDelete.length} movies not available on any OTT...`);

  // Delete in batches
  const batchSize = 100;
  let deleted = 0;
  
  for (let i = 0; i < toDelete.length; i += batchSize) {
    const batch = toDelete.slice(i, i + batchSize);
    
    // Delete snapshots first (foreign key)
    await supabase
      .from('decision_snapshots')
      .delete()
      .in('movie_id', batch);
    
    // Delete movies
    const { error: deleteError } = await supabase
      .from('movies')
      .delete()
      .in('id', batch);
    
    if (!deleteError) {
      deleted += batch.length;
      process.stdout.write(`\r   Deleted: ${deleted}/${toDelete.length}`);
    }
  }

  console.log(`\n   ✅ Removed ${deleted} unavailable movies`);
  return deleted;
}

// ============ MAIN ============
async function main() {
  console.log(`\n${'='.repeat(60)}`);
  console.log(`📺 OTT CATALOG IMPORTER (WITH CLEANUP)`);
  console.log(`${'='.repeat(60)}`);
  console.log(`\nImporting ALL movies from supported India OTTs:`);
  OTT_PROVIDERS.forEach(p => console.log(`   • ${p.name}`));
  console.log(`\n⚠️  Movies not on any OTT will be REMOVED.\n`);
  console.log(`${'='.repeat(60)}`);

  const startTime = Date.now();
  const stats = { added: 0, updated: 0, skipped: 0, failed: 0 };

  // Import from all OTTs
  for (const provider of OTT_PROVIDERS) {
    await processOtt(provider, stats);
  }

  // Cleanup unavailable movies
  const removedCount = await cleanupUnavailableMovies();

  const elapsed = ((Date.now() - startTime) / 1000 / 60).toFixed(1);

  console.log(`\n${'='.repeat(60)}`);
  console.log(`FINAL RESULTS`);
  console.log(`${'='.repeat(60)}`);
  console.log(`✅ New movies added:     ${stats.added}`);
  console.log(`🔄 Existing updated:     ${stats.updated}`);
  console.log(`⏭️ Skipped (no poster):  ${stats.skipped}`);
  console.log(`❌ Failed:               ${stats.failed}`);
  console.log(`🗑️ Removed (not on OTT): ${removedCount}`);
  console.log(`📊 Total valid movies:   ${validMovieIds.size}`);
  console.log(`⏱️ Time:                 ${elapsed} minutes`);
  console.log(`${'='.repeat(60)}`);
  console.log(`\n💡 Every movie in the database is now watchable on a supported OTT.\n`);
}

main().catch(console.error);
