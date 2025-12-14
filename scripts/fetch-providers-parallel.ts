/**
 * PARALLEL PROVIDER FETCHER
 * 
 * Fetches watch providers for all movies in parallel batches
 * Much faster than sequential processing
 * 
 * Run: TMDB_API_KEY=xxx npx ts-node scripts/fetch-providers-parallel.ts
 * 
 * Options:
 *   --batch 50      Movies per batch
 *   --concurrency 5 Parallel batches
 *   --offset 0      Start from offset
 *   --limit 5000    Total movies to process
 */

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://jdjqrlkynwfhbtyuddjk.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpkanFybGt5bndmaGJ0eXVkZGprIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ0NzUwMTEsImV4cCI6MjA4MDA1MTAxMX0.KDRMLCewVMp3lwphkUvtoWOkg6kyAk8iSbVkRKiHYSk';
const TMDB_API_KEY = process.env.TMDB_API_KEY || '204363c10c39f75a0320ad4258565f71';
const REGION = 'IN';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// Provider config
const FLATRATE_PROVIDERS: Record<number, string> = {
  8: 'Netflix', 119: 'Amazon Prime Video', 122: 'JioHotstar',
  350: 'Apple TV+', 237: 'SonyLIV', 232: 'Zee5', 220: 'JioCinema',
};

const RENT_BUY_PROVIDERS: Record<number, string> = {
  2: 'Apple TV', 3: 'Google Play Movies', 10: 'Amazon Video', 192: 'YouTube Movies',
};

const PROVIDER_NORMALIZATION: Record<string, { name: string; id: number }> = {
  'Disney Plus Hotstar': { name: 'JioHotstar', id: 122 },
  'Disney+ Hotstar': { name: 'JioHotstar', id: 122 },
  'Hotstar': { name: 'JioHotstar', id: 122 },
};

interface SnapshotProvider {
  id: number;
  name: string;
  type: 'flatrate' | 'rent' | 'buy';
  logo_path: string;
  deep_link: string | null;
}

// Shared stats
const stats = { flatrate: 0, rentOnly: 0, none: 0, failed: 0, processed: 0 };

function normalizeProvider(p: any): { id: number; name: string } {
  const norm = PROVIDER_NORMALIZATION[p.provider_name];
  return norm || { id: p.provider_id, name: p.provider_name };
}

async function fetchProviders(tmdbId: number): Promise<{ flatrate: SnapshotProvider[]; rent: SnapshotProvider[]; buy: SnapshotProvider[] } | null> {
  try {
    const res = await fetch(`https://api.themoviedb.org/3/movie/${tmdbId}/watch/providers?api_key=${TMDB_API_KEY}`);
    if (!res.ok) return null;
    
    const data = await res.json();
    const inData = data.results?.IN;
    if (!inData) return { flatrate: [], rent: [], buy: [] };

    const result = { flatrate: [] as SnapshotProvider[], rent: [] as SnapshotProvider[], buy: [] as SnapshotProvider[] };
    const seen = new Set<number>();

    for (const p of inData.flatrate || []) {
      const norm = normalizeProvider(p);
      if (FLATRATE_PROVIDERS[norm.id] && !seen.has(norm.id)) {
        seen.add(norm.id);
        result.flatrate.push({ id: norm.id, name: FLATRATE_PROVIDERS[norm.id], type: 'flatrate', logo_path: p.logo_path, deep_link: inData.link || null });
      }
    }
    for (const p of inData.rent || []) {
      const norm = normalizeProvider(p);
      if (RENT_BUY_PROVIDERS[norm.id] && !seen.has(norm.id)) {
        seen.add(norm.id);
        result.rent.push({ id: norm.id, name: RENT_BUY_PROVIDERS[norm.id], type: 'rent', logo_path: p.logo_path, deep_link: inData.link || null });
      }
    }
    for (const p of inData.buy || []) {
      const norm = normalizeProvider(p);
      if (RENT_BUY_PROVIDERS[norm.id] && !seen.has(norm.id)) {
        seen.add(norm.id);
        result.buy.push({ id: norm.id, name: RENT_BUY_PROVIDERS[norm.id], type: 'buy', logo_path: p.logo_path, deep_link: inData.link || null });
      }
    }
    return result;
  } catch {
    return null;
  }
}

async function processMovie(movie: { id: string; tmdb_id: number; title: string }) {
  const providers = await fetchProviders(movie.tmdb_id);
  
  if (!providers) {
    stats.failed++;
    return;
  }

  const allProviders = [...providers.flatrate, ...providers.rent, ...providers.buy];
  const hasFlatrate = providers.flatrate.length > 0;
  const hasRent = providers.rent.length > 0 || providers.buy.length > 0;

  let confidence = 0;
  if (hasFlatrate) confidence = 0.5; // TMDB only = 0.4 + 0.1 freshness
  else if (hasRent) confidence = 0.3;

  const isValid = allProviders.length > 0 && confidence >= 0.4;

  await supabase.from('decision_snapshots').upsert({
    movie_id: movie.id,
    region: REGION,
    providers: allProviders,
    confidence_score: confidence,
    verified_at: new Date().toISOString(),
    verification_sources: ['tmdb'],
    is_valid: isValid,
    invalid_reason: allProviders.length === 0 ? 'no_provider' : null,
    updated_at: new Date().toISOString(),
  }, { onConflict: 'movie_id,region' });

  stats.processed++;
  if (hasFlatrate) stats.flatrate++;
  else if (hasRent) stats.rentOnly++;
  else stats.none++;
}

async function processBatch(movies: any[]) {
  // Process with small delay between each to respect rate limits
  for (const movie of movies) {
    await processMovie(movie);
    await new Promise(r => setTimeout(r, 100)); // 10 req/s per batch
  }
}

async function main() {
  const args = process.argv.slice(2);
  let batchSize = 50;
  let concurrency = 4;
  let offset = 0;
  let limit = 5000;

  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--batch') batchSize = parseInt(args[i + 1]);
    if (args[i] === '--concurrency') concurrency = parseInt(args[i + 1]);
    if (args[i] === '--offset') offset = parseInt(args[i + 1]);
    if (args[i] === '--limit') limit = parseInt(args[i + 1]);
  }

  console.log(`\n🎬 Parallel Provider Fetcher`);
  console.log(`📦 Batch size: ${batchSize}`);
  console.log(`⚡ Concurrency: ${concurrency}`);
  console.log(`📍 Offset: ${offset}, Limit: ${limit}\n`);

  // Fetch all movies
  const { data: movies, error } = await supabase
    .from('movies')
    .select('id, tmdb_id, title')
    .not('tmdb_id', 'is', null)
    .order('vote_average', { ascending: false })
    .range(offset, offset + limit - 1);

  if (error || !movies) {
    console.error('Failed to fetch movies:', error);
    return;
  }

  console.log(`Found ${movies.length} movies to process\n`);

  // Split into batches
  const batches: any[][] = [];
  for (let i = 0; i < movies.length; i += batchSize) {
    batches.push(movies.slice(i, i + batchSize));
  }

  // Process batches with concurrency
  const startTime = Date.now();
  
  for (let i = 0; i < batches.length; i += concurrency) {
    const currentBatches = batches.slice(i, i + concurrency);
    await Promise.all(currentBatches.map(batch => processBatch(batch)));
    
    const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
    const progress = Math.min(100, ((i + concurrency) / batches.length * 100)).toFixed(1);
    process.stdout.write(`\r⏳ ${progress}% | ✅ ${stats.flatrate} flatrate | 💰 ${stats.rentOnly} rent | ⚪ ${stats.none} none | ❌ ${stats.failed} failed | ${elapsed}s`);
  }

  const totalTime = ((Date.now() - startTime) / 1000).toFixed(1);
  
  console.log(`\n\n${'='.repeat(55)}`);
  console.log(`✅ Flatrate:  ${stats.flatrate}`);
  console.log(`💰 Rent only: ${stats.rentOnly}`);
  console.log(`⚪ None:      ${stats.none}`);
  console.log(`❌ Failed:    ${stats.failed}`);
  console.log(`⏱️ Time:      ${totalTime}s`);
  console.log(`${'='.repeat(55)}\n`);
}

main().catch(console.error);
