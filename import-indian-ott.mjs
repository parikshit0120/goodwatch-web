#!/usr/bin/env node

/**
 * GoodWatch Indian OTT Catalog Import
 * 
 * This script:
 * 1. Clears the movies table
 * 2. Fetches catalogs from each Indian OTT provider via TMDB
 * 3. Inserts only movies available on Indian flatrate streaming
 * 4. Handles deduplication (movies on multiple platforms)
 * 
 * Run: node import-indian-ott.mjs
 */

import { createClient } from '@supabase/supabase-js';

// ============================================
// CONFIGURATION
// ============================================

const SUPABASE_URL = 'https://jdjqrlkynwfhbtyuddjk.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpkanFybGt5bndmaGJ0eXVkZGprIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ0NzUwMTEsImV4cCI6MjA4MDA1MTAxMX0.KDRMLCewVMp3lwphkUvtoWOkg6kyAk8iSbVkRKiHYSk';
const TMDB_KEY = '204363c10c39f75a0320ad4258565f71';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// Indian OTT Providers (flatrate only)
const INDIAN_PROVIDERS = [
  { id: 8, name: 'Netflix' },
  { id: 119, name: 'Amazon Prime Video' },
  { id: 122, name: 'JioHotstar' },
  { id: 237, name: 'SonyLIV' },
  { id: 232, name: 'Zee5' },
  { id: 220, name: 'JioCinema' },
  { id: 350, name: 'Apple TV+' },
];

// Quality filters
const MIN_VOTE_COUNT = 50;
const MIN_RATING = 5.0;

// Rate limiting
const DELAY_MS = 200;
const sleep = (ms) => new Promise(r => setTimeout(r, ms));

// ============================================
// TMDB API FUNCTIONS
// ============================================

async function fetchProviderCatalog(providerId, providerName) {
  const movies = [];
  let page = 1;
  let totalPages = 1;

  console.log(`\n📺 Fetching ${providerName} catalog...`);

  while (page <= totalPages && page <= 500) { // TMDB max 500 pages
    const url = `https://api.themoviedb.org/3/discover/movie?api_key=${TMDB_KEY}` +
      `&watch_region=IN` +
      `&with_watch_providers=${providerId}` +
      `&with_watch_monetization_types=flatrate` +
      `&vote_count.gte=${MIN_VOTE_COUNT}` +
      `&vote_average.gte=${MIN_RATING}` +
      `&sort_by=vote_count.desc` +
      `&page=${page}`;

    try {
      const res = await fetch(url);
      const data = await res.json();

      if (data.results) {
        movies.push(...data.results.map(m => ({
          ...m,
          _provider: { id: providerId, name: providerName }
        })));
      }

      totalPages = Math.min(data.total_pages || 1, 500);
      
      if (page % 10 === 0 || page === totalPages) {
        process.stdout.write(`\r  ${providerName}: Page ${page}/${totalPages} | Found: ${movies.length} movies`);
      }

      page++;
      await sleep(DELAY_MS);
    } catch (err) {
      console.error(`\n  Error on page ${page}:`, err.message);
      await sleep(1000);
    }
  }

  console.log(`\n  ✓ ${providerName}: ${movies.length} movies total`);
  return movies;
}

async function fetchMovieDetails(tmdbId) {
  try {
    const url = `https://api.themoviedb.org/3/movie/${tmdbId}?api_key=${TMDB_KEY}&append_to_response=watch/providers`;
    const res = await fetch(url);
    return await res.json();
  } catch (err) {
    return null;
  }
}

function extractIndianProviders(watchProviders) {
  const india = watchProviders?.results?.IN;
  if (!india) return [];

  const providers = [];
  
  if (india.flatrate) {
    india.flatrate.forEach(p => providers.push({
      id: p.provider_id,
      name: p.provider_name,
      logo_path: p.logo_path,
      type: 'flatrate'
    }));
  }
  
  if (india.rent) {
    india.rent.forEach(p => providers.push({
      id: p.provider_id,
      name: p.provider_name,
      logo_path: p.logo_path,
      type: 'rent'
    }));
  }
  
  if (india.buy) {
    india.buy.forEach(p => providers.push({
      id: p.provider_id,
      name: p.provider_name,
      logo_path: p.logo_path,
      type: 'buy'
    }));
  }

  return providers;
}

// ============================================
// DATABASE FUNCTIONS
// ============================================

async function clearMoviesTable() {
  console.log('🗑️  Clearing movies table...');
  
  // Delete in batches to avoid timeout
  let deleted = 0;
  while (true) {
    const { data, error } = await supabase
      .from('movies')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000') // Delete all
      .select('id')
      .limit(1000);
    
    if (error) {
      console.error('Delete error:', error.message);
      break;
    }
    
    if (!data || data.length === 0) break;
    deleted += data.length;
    process.stdout.write(`\r  Deleted: ${deleted} movies`);
  }
  
  console.log(`\n  ✓ Cleared ${deleted} movies`);
}

async function insertMovie(movie, ottProviders) {
  const movieData = {
    tmdb_id: movie.id,
    title: movie.title,
    overview: movie.overview,
    poster_path: movie.poster_path,
    backdrop_path: movie.backdrop_path,
    release_date: movie.release_date || null,
    year: movie.release_date ? parseInt(movie.release_date.slice(0, 4)) : null,
    vote_average: movie.vote_average,
    vote_count: movie.vote_count,
    popularity: movie.popularity,
    original_language: movie.original_language,
    genres: movie.genres || [],
    runtime: movie.runtime || null,
    ott_providers: ottProviders,
  };

  const { error } = await supabase.from('movies').insert(movieData);
  
  if (error && !error.message.includes('duplicate')) {
    console.error(`\n  Error inserting ${movie.title}:`, error.message);
    return false;
  }
  
  return true;
}

async function updateMovieProviders(tmdbId, newProviders) {
  // Get existing movie
  const { data: existing } = await supabase
    .from('movies')
    .select('ott_providers')
    .eq('tmdb_id', tmdbId)
    .single();

  if (!existing) return false;

  // Merge providers (dedupe by id)
  const existingProviders = existing.ott_providers || [];
  const allProviders = [...existingProviders];
  
  for (const newP of newProviders) {
    if (!allProviders.some(p => p.id === newP.id && p.type === newP.type)) {
      allProviders.push(newP);
    }
  }

  const { error } = await supabase
    .from('movies')
    .update({ ott_providers: allProviders })
    .eq('tmdb_id', tmdbId);

  return !error;
}

// ============================================
// MAIN IMPORT FUNCTION
// ============================================

async function runImport() {
  console.log('═══════════════════════════════════════════════════════════');
  console.log('  GoodWatch Indian OTT Catalog Import');
  console.log('═══════════════════════════════════════════════════════════\n');

  // Step 1: Clear existing data
  await clearMoviesTable();

  // Step 2: Fetch all provider catalogs
  console.log('\n📥 Fetching provider catalogs from TMDB...\n');
  
  const allMovies = new Map(); // tmdb_id -> movie data
  
  for (const provider of INDIAN_PROVIDERS) {
    const catalog = await fetchProviderCatalog(provider.id, provider.name);
    
    for (const movie of catalog) {
      if (allMovies.has(movie.id)) {
        // Movie already seen, just add this provider
        const existing = allMovies.get(movie.id);
        existing._providers.push({ id: provider.id, name: provider.name });
      } else {
        // New movie
        allMovies.set(movie.id, {
          ...movie,
          _providers: [{ id: provider.id, name: provider.name }]
        });
      }
    }
  }

  console.log(`\n📊 Total unique movies across all providers: ${allMovies.size}`);

  // Step 3: Fetch details and insert each movie
  console.log('\n📝 Fetching movie details and inserting...\n');
  
  let inserted = 0;
  let failed = 0;
  let index = 0;
  const total = allMovies.size;

  for (const [tmdbId, movie] of allMovies) {
    index++;
    
    // Fetch full details including watch providers
    const details = await fetchMovieDetails(tmdbId);
    await sleep(DELAY_MS);

    if (!details || details.success === false) {
      failed++;
      continue;
    }

    // Extract Indian OTT providers
    const ottProviders = extractIndianProviders(details['watch/providers']);
    
    // Only insert if has flatrate streaming
    const hasFlatrate = ottProviders.some(p => p.type === 'flatrate');
    if (!hasFlatrate) {
      continue;
    }

    // Insert movie with full details
    const movieWithDetails = {
      ...movie,
      ...details,
    };

    const success = await insertMovie(movieWithDetails, ottProviders);
    
    if (success) {
      inserted++;
      const providers = ottProviders.filter(p => p.type === 'flatrate').map(p => p.name).join(', ');
      if (inserted % 50 === 0) {
        console.log(`  [${index}/${total}] ✓ ${details.title} (${providers})`);
      }
    } else {
      failed++;
    }

    // Progress update
    if (index % 100 === 0) {
      process.stdout.write(`\r  Progress: ${index}/${total} | Inserted: ${inserted} | Failed: ${failed}`);
    }
  }

  // Step 4: Summary
  console.log('\n\n═══════════════════════════════════════════════════════════');
  console.log('  Import Complete!');
  console.log('═══════════════════════════════════════════════════════════');
  console.log(`  ✓ Movies inserted: ${inserted}`);
  console.log(`  ✗ Failed/skipped: ${failed}`);
  console.log(`  📺 Providers: ${INDIAN_PROVIDERS.map(p => p.name).join(', ')}`);
  console.log('═══════════════════════════════════════════════════════════\n');
}

// ============================================
// RUN
// ============================================

runImport().catch(console.error);
