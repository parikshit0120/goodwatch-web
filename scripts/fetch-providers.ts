/**
 * PROVIDER FETCH SCRIPT - v3 (FINAL)
 * 
 * RULES:
 * - Normalize provider names (Disney+ Hotstar → JioHotstar)
 * - Flatrate = +0.4 confidence, Rent = +0.2 confidence
 * - Apply overrides from provider_overrides table
 * - Provider APIs are claims, not truth
 * 
 * Run: TMDB_API_KEY=xxx npx ts-node scripts/fetch-providers.ts --limit 100
 */

import { createClient } from '@supabase/supabase-js';

// ============ CONFIG ============
const SUPABASE_URL = 'https://jdjqrlkynwfhbtyuddjk.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpkanFybGt5bndmaGJ0eXVkZGprIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ0NzUwMTEsImV4cCI6MjA4MDA1MTAxMX0.KDRMLCewVMp3lwphkUvtoWOkg6kyAk8iSbVkRKiHYSk';

const TMDB_API_KEY = process.env.TMDB_API_KEY || '204363c10c39f75a0320ad4258565f71';
const REGION = 'IN';

// ============ PROVIDER CONFIG (INDIA v1 - LOCKED) ============

// Flatrate providers - First class (+0.4 confidence)
const FLATRATE_PROVIDERS: Record<number, string> = {
  8: 'Netflix',
  119: 'Amazon Prime Video',
  122: 'JioHotstar',  // Normalized from Disney+ Hotstar
  350: 'Apple TV+',
  237: 'SonyLIV',
  232: 'Zee5',
  220: 'JioCinema',
};

// Rent/Buy providers - Secondary (+0.2 confidence, opt-in for Tonight)
const RENT_BUY_PROVIDERS: Record<number, string> = {
  2: 'Apple TV',
  3: 'Google Play Movies',
  10: 'Amazon Video',
  192: 'YouTube Movies',
};

// Normalization map (raw TMDB name → normalized name)
const PROVIDER_NORMALIZATION: Record<string, { name: string; id: number }> = {
  'Disney Plus Hotstar': { name: 'JioHotstar', id: 122 },
  'Disney+ Hotstar': { name: 'JioHotstar', id: 122 },
  'Hotstar': { name: 'JioHotstar', id: 122 },
};

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// ============ TYPES ============
interface TMDBProvider {
  provider_id: number;
  provider_name: string;
  logo_path: string;
}

interface SnapshotProvider {
  id: number;
  name: string;
  type: 'flatrate' | 'rent' | 'buy';
  logo_path: string;
  deep_link: string | null;
}

interface ProviderResult {
  flatrate: SnapshotProvider[];
  rent: SnapshotProvider[];
  buy: SnapshotProvider[];
}

// ============ NORMALIZE PROVIDER ============
function normalizeProvider(p: TMDBProvider): { id: number; name: string } {
  // Check normalization map first
  const normalized = PROVIDER_NORMALIZATION[p.provider_name];
  if (normalized) {
    return normalized;
  }
  // Return as-is
  return { id: p.provider_id, name: p.provider_name };
}

// ============ FETCH FROM TMDB ============
async function fetchTMDBProviders(tmdbId: number): Promise<ProviderResult | null> {
  try {
    const url = `https://api.themoviedb.org/3/movie/${tmdbId}/watch/providers?api_key=${TMDB_API_KEY}`;
    const res = await fetch(url);
    
    if (!res.ok) return null;

    const data = await res.json();
    const inData = data.results?.IN;
    
    if (!inData) {
      return { flatrate: [], rent: [], buy: [] };
    }

    const result: ProviderResult = { flatrate: [], rent: [], buy: [] };
    const seenIds = new Set<number>();

    // Process flatrate
    if (inData.flatrate?.length) {
      for (const p of inData.flatrate) {
        const norm = normalizeProvider(p);
        if (FLATRATE_PROVIDERS[norm.id] && !seenIds.has(norm.id)) {
          seenIds.add(norm.id);
          result.flatrate.push({
            id: norm.id,
            name: FLATRATE_PROVIDERS[norm.id],
            type: 'flatrate',
            logo_path: p.logo_path,
            deep_link: inData.link || null,
          });
        }
      }
    }

    // Process rent
    if (inData.rent?.length) {
      for (const p of inData.rent) {
        const norm = normalizeProvider(p);
        if (RENT_BUY_PROVIDERS[norm.id] && !seenIds.has(norm.id)) {
          seenIds.add(norm.id);
          result.rent.push({
            id: norm.id,
            name: RENT_BUY_PROVIDERS[norm.id],
            type: 'rent',
            logo_path: p.logo_path,
            deep_link: inData.link || null,
          });
        }
      }
    }

    // Process buy
    if (inData.buy?.length) {
      for (const p of inData.buy) {
        const norm = normalizeProvider(p);
        if (RENT_BUY_PROVIDERS[norm.id] && !seenIds.has(norm.id)) {
          seenIds.add(norm.id);
          result.buy.push({
            id: norm.id,
            name: RENT_BUY_PROVIDERS[norm.id],
            type: 'buy',
            logo_path: p.logo_path,
            deep_link: inData.link || null,
          });
        }
      }
    }

    return result;
  } catch {
    return null;
  }
}

// ============ FETCH OVERRIDES ============
async function fetchOverrides(movieId: string): Promise<SnapshotProvider[]> {
  const { data } = await supabase
    .from('provider_overrides')
    .select('*')
    .eq('movie_id', movieId)
    .eq('region', REGION)
    .gt('expires_at', new Date().toISOString());

  if (!data?.length) return [];

  return data.map(o => ({
    id: o.provider_id,
    name: o.provider_name,
    type: o.availability_type as 'flatrate' | 'rent' | 'buy',
    logo_path: '',
    deep_link: null,
  }));
}

// ============ CALCULATE CONFIDENCE ============
function calculateConfidence(
  providers: ProviderResult,
  overrides: SnapshotProvider[],
  sources: string[],
  existing?: { user_success_count: number; user_failure_count: number }
): number {
  let score = 0;
  
  const hasFlatrate = providers.flatrate.length > 0 || overrides.some(o => o.type === 'flatrate');
  const hasRent = providers.rent.length > 0 || providers.buy.length > 0 || overrides.some(o => o.type === 'rent' || o.type === 'buy');

  // TMDB contribution
  if (sources.includes('tmdb')) {
    if (hasFlatrate) score += 0.4;
    else if (hasRent) score += 0.2;
  }

  // JustWatch contribution (future)
  if (sources.includes('justwatch')) {
    if (hasFlatrate) score += 0.4;
    else if (hasRent) score += 0.2;
  }

  // Override boost
  if (overrides.length > 0) {
    score += 0.4; // Overrides are trusted
  }

  // Freshness bonus
  score += 0.1;

  // User feedback
  if (existing) {
    score += existing.user_success_count * 0.1;
    score -= existing.user_failure_count * 0.5;
  }

  // No providers = 0
  if (!hasFlatrate && !hasRent && overrides.length === 0) {
    score = 0;
  }

  return Math.max(0, Math.min(1, score));
}

// ============ UPSERT SNAPSHOT ============
async function upsertSnapshot(
  movieId: string,
  providers: ProviderResult,
  overrides: SnapshotProvider[],
  sources: string[]
): Promise<boolean> {
  const { data: existing } = await supabase
    .from('decision_snapshots')
    .select('user_success_count, user_failure_count')
    .eq('movie_id', movieId)
    .eq('region', REGION)
    .single();

  const confidence = calculateConfidence(providers, overrides, sources, existing || undefined);

  // Merge all providers (overrides take precedence)
  const overrideIds = new Set(overrides.map(o => o.id));
  const allProviders = [
    ...overrides,
    ...providers.flatrate.filter(p => !overrideIds.has(p.id)),
    ...providers.rent.filter(p => !overrideIds.has(p.id)),
    ...providers.buy.filter(p => !overrideIds.has(p.id)),
  ];

  const isValid = allProviders.length > 0 && confidence >= 0.4;
  const invalidReason = allProviders.length === 0 ? 'no_provider' : (confidence < 0.4 ? 'low_confidence' : null);

  const { error } = await supabase
    .from('decision_snapshots')
    .upsert({
      movie_id: movieId,
      region: REGION,
      providers: allProviders,
      confidence_score: confidence,
      verified_at: new Date().toISOString(),
      verification_sources: sources,
      is_valid: isValid,
      invalid_reason: invalidReason,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'movie_id,region' });

  if (error) {
    console.error(`  DB: ${error.message}`);
    return false;
  }
  return true;
}

// ============ PROCESS MOVIES ============
async function processMovies(limit: number, offset: number) {
  console.log(`\n🎬 Processing ${limit} movies (offset: ${offset})\n`);
  console.log('📺 Flatrate:', Object.values(FLATRATE_PROVIDERS).join(', '));
  console.log('💰 Rent/Buy:', Object.values(RENT_BUY_PROVIDERS).join(', '));
  console.log('');

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

  console.log(`Found ${movies.length} movies\n`);

  let stats = { flatrate: 0, rentOnly: 0, override: 0, none: 0, failed: 0 };

  for (const movie of movies) {
    await new Promise(r => setTimeout(r, 250));

    const title = movie.title.substring(0, 32).padEnd(32);
    process.stdout.write(`${title}`);

    const tmdbResult = await fetchTMDBProviders(movie.tmdb_id);
    if (!tmdbResult) {
      console.log(' ❌ TMDB fail');
      stats.failed++;
      continue;
    }

    const overrides = await fetchOverrides(movie.id);
    const sources = ['tmdb'];
    
    const saved = await upsertSnapshot(movie.id, tmdbResult, overrides, sources);
    if (!saved) {
      console.log(' ❌ DB fail');
      stats.failed++;
      continue;
    }

    const flatNames = tmdbResult.flatrate.map(p => p.name);
    const rentNames = [...tmdbResult.rent, ...tmdbResult.buy].map(p => p.name);
    const overrideNames = overrides.map(o => o.name);

    if (overrideNames.length > 0) {
      console.log(` 🔧 Override: ${overrideNames.join(', ')}`);
      stats.override++;
    } else if (flatNames.length > 0) {
      console.log(` ✅ ${flatNames.join(', ')}`);
      stats.flatrate++;
    } else if (rentNames.length > 0) {
      console.log(` 💰 ${rentNames.join(', ')}`);
      stats.rentOnly++;
    } else {
      console.log(' ⚪ None');
      stats.none++;
    }
  }

  console.log(`\n${'='.repeat(45)}`);
  console.log(`✅ Flatrate:  ${stats.flatrate}`);
  console.log(`💰 Rent only: ${stats.rentOnly}`);
  console.log(`🔧 Override:  ${stats.override}`);
  console.log(`⚪ None:      ${stats.none}`);
  console.log(`❌ Failed:    ${stats.failed}`);
  console.log(`${'='.repeat(45)}\n`);
}

// ============ MAIN ============
async function main() {
  const args = process.argv.slice(2);
  let limit = 100, offset = 0;
  
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--limit') limit = parseInt(args[i + 1]);
    if (args[i] === '--offset') offset = parseInt(args[i + 1]);
  }

  console.log('🔑 TMDB:', TMDB_API_KEY.substring(0, 8) + '...');
  console.log('🌏 Region:', REGION);

  await processMovies(limit, offset);
}

main().catch(console.error);
