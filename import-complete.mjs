#!/usr/bin/env node

/**
 * GoodWatch Complete Indian OTT Catalog Import
 * 
 * Gets EVERYTHING available on Indian streaming:
 * - All movies (no rating/vote filters)
 * - All TV series
 * - All providers
 * 
 * Run: node import-complete.mjs
 */

import { createClient } from '@supabase/supabase-js';

// ============================================
// CONFIGURATION
// ============================================

const SUPABASE_URL = 'https://jdjqrlkynwfhbtyuddjk.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpkanFybGt5bndmaGJ0eXVkZGprIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ0NzUwMTEsImV4cCI6MjA4MDA1MTAxMX0.KDRMLCewVMp3lwphkUvtoWOkg6kyAk8iSbVkRKiHYSk';
const TMDB_KEY = '204363c10c39f75a0320ad4258565f71';
const OMDB_KEY = 'a7be3b08';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// Indian OTT Providers
const INDIAN_PROVIDERS = [
  { id: 8, name: 'Netflix' },
  { id: 119, name: 'Amazon Prime Video' },
  { id: 122, name: 'JioHotstar' },
  { id: 237, name: 'SonyLIV' },
  { id: 232, name: 'Zee5' },
  { id: 220, name: 'JioCinema' },
  { id: 350, name: 'Apple TV+' },
  { id: 531, name: 'Paramount+' },
  { id: 283, name: 'Crunchyroll' },
  { id: 192, name: 'YouTube Premium' },
  { id: 121, name: 'Voot' },
  { id: 255, name: 'Eros Now' },
  { id: 218, name: 'Lionsgate Play' },
  { id: 309, name: 'Sun NXT' },
  { id: 315, name: 'Hoichoi' },
  { id: 319, name: 'ManoramaMAX' },
  { id: 533, name: 'Aha' },
];

const DELAY_MS = 150;
const sleep = (ms) => new Promise(r => setTimeout(r, ms));

// ============================================
// TMDB API FUNCTIONS
// ============================================

async function fetchCatalog(providerId, providerName, type = 'movie') {
  const items = [];
  let page = 1;
  let totalPages = 1;
  const endpoint = type === 'movie' ? 'discover/movie' : 'discover/tv';

  console.log(`  📺 ${providerName} (${type})...`);

  while (page <= totalPages && page <= 500) {
    const url = `https://api.themoviedb.org/3/${endpoint}?api_key=${TMDB_KEY}` +
      `&watch_region=IN` +
      `&with_watch_providers=${providerId}` +
      `&with_watch_monetization_types=flatrate` +
      `&sort_by=popularity.desc` +
      `&page=${page}`;

    try {
      const res = await fetch(url);
      const data = await res.json();

      if (data.results) {
        items.push(...data.results.map(m => ({
          ...m,
          _type: type,
          _provider: { id: providerId, name: providerName }
        })));
      }

      totalPages = Math.min(data.total_pages || 1, 500);
      
      if (page % 20 === 0) {
        process.stdout.write(`\r    Page ${page}/${totalPages} | Found: ${items.length}`);
      }

      page++;
      await sleep(DELAY_MS);
    } catch (err) {
      console.error(`\n    Error on page ${page}:`, err.message);
      await sleep(1000);
    }
  }

  console.log(`\r    ✓ ${items.length} ${type}s                    `);
  return items;
}

async function fetchDetails(id, type = 'movie') {
  try {
    const endpoint = type === 'movie' ? 'movie' : 'tv';
    const url = `https://api.themoviedb.org/3/${endpoint}/${id}?api_key=${TMDB_KEY}&append_to_response=watch/providers`;
    const res = await fetch(url);
    return await res.json();
  } catch (err) {
    return null;
  }
}

async function fetchIMDbRating(imdbId) {
  if (!imdbId) return null;
  try {
    const url = `https://www.omdbapi.com/?i=${imdbId}&apikey=${OMDB_KEY}`;
    const res = await fetch(url);
    const data = await res.json();
    if (data.Response === 'True') {
      return {
        imdb_rating: data.imdbRating !== 'N/A' ? parseFloat(data.imdbRating) : null,
        imdb_votes: data.imdbVotes !== 'N/A' ? parseInt(data.imdbVotes.replace(/,/g, '')) : null,
      };
    }
    return null;
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

async function clearTable(table) {
  console.log(`🗑️  Clearing ${table} table...`);
  let deleted = 0;
  while (true) {
    const { data, error } = await supabase
      .from(table)
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000')
      .select('id')
      .limit(1000);
    
    if (error || !data || data.length === 0) break;
    deleted += data.length;
    process.stdout.write(`\r  Deleted: ${deleted}`);
  }
  console.log(`\r  ✓ Cleared ${deleted} records    `);
}

async function insertMovie(item, ottProviders, imdbData, type) {
  const data = {
    tmdb_id: item.id,
    imdb_id: item.imdb_id || (type === 'tv' ? item.external_ids?.imdb_id : null) || null,
    title: item.title || item.name,
    overview: item.overview,
    poster_path: item.poster_path,
    backdrop_path: item.backdrop_path,
    release_date: item.release_date || item.first_air_date || null,
    year: (item.release_date || item.first_air_date) ? parseInt((item.release_date || item.first_air_date).slice(0, 4)) : null,
    vote_average: item.vote_average,
    vote_count: item.vote_count,
    popularity: item.popularity,
    original_language: item.original_language,
    genres: item.genres || [],
    runtime: item.runtime || (item.episode_run_time?.[0]) || null,
    ott_providers: ottProviders,
    imdb_rating: imdbData?.imdb_rating || null,
    imdb_votes: imdbData?.imdb_votes || null,
    content_type: type, // 'movie' or 'tv'
    number_of_seasons: item.number_of_seasons || null,
    number_of_episodes: item.number_of_episodes || null,
    status: item.status || null,
  };

  const { error } = await supabase.from('movies').insert(data);
  
  if (error && !error.message.includes('duplicate')) {
    return false;
  }
  return true;
}

// ============================================
// MAIN IMPORT
// ============================================

async function runImport() {
  console.log('═══════════════════════════════════════════════════════════');
  console.log('  GoodWatch Complete Indian OTT Import');
  console.log('  Movies + TV Series | All Providers | No Filters');
  console.log('═══════════════════════════════════════════════════════════\n');

  // Clear existing data
  await clearTable('movies');

  // Collect all items from all providers
  console.log('\n📥 Fetching catalogs from all providers...\n');
  
  const allItems = new Map(); // tmdb_id-type -> item data

  for (const provider of INDIAN_PROVIDERS) {
    // Fetch movies
    const movies = await fetchCatalog(provider.id, provider.name, 'movie');
    for (const item of movies) {
      const key = `movie-${item.id}`;
      if (allItems.has(key)) {
        allItems.get(key)._providers.push({ id: provider.id, name: provider.name });
      } else {
        allItems.set(key, { ...item, _providers: [{ id: provider.id, name: provider.name }] });
      }
    }

    // Fetch TV series
    const series = await fetchCatalog(provider.id, provider.name, 'tv');
    for (const item of series) {
      const key = `tv-${item.id}`;
      if (allItems.has(key)) {
        allItems.get(key)._providers.push({ id: provider.id, name: provider.name });
      } else {
        allItems.set(key, { ...item, _providers: [{ id: provider.id, name: provider.name }] });
      }
    }
  }

  const movieCount = [...allItems.values()].filter(i => i._type === 'movie').length;
  const tvCount = [...allItems.values()].filter(i => i._type === 'tv').length;
  
  console.log(`\n📊 Total unique content: ${allItems.size}`);
  console.log(`   Movies: ${movieCount} | TV Series: ${tvCount}`);

  // Insert each item with details
  console.log('\n📝 Fetching details and inserting...\n');
  
  let inserted = 0, failed = 0, index = 0;
  const total = allItems.size;

  for (const [key, item] of allItems) {
    index++;
    const type = item._type;

    // Fetch full details
    const details = await fetchDetails(item.id, type);
    await sleep(DELAY_MS);

    if (!details || details.success === false) {
      failed++;
      continue;
    }

    // Extract Indian OTT providers
    const ottProviders = extractIndianProviders(details['watch/providers']);
    
    if (ottProviders.length === 0) {
      failed++;
      continue;
    }

    // Fetch IMDb rating
    const imdbId = details.imdb_id || details.external_ids?.imdb_id;
    let imdbData = null;
    if (imdbId) {
      imdbData = await fetchIMDbRating(imdbId);
      await sleep(DELAY_MS);
    }

    // Insert
    const itemWithDetails = { ...item, ...details };
    const success = await insertMovie(itemWithDetails, ottProviders, imdbData, type);
    
    if (success) {
      inserted++;
      if (inserted % 100 === 0) {
        const providers = ottProviders.filter(p => p.type === 'flatrate').map(p => p.name).slice(0, 2).join(', ');
        const rating = imdbData?.imdb_rating ? `IMDb ${imdbData.imdb_rating}` : '';
        console.log(`  [${index}/${total}] ✓ ${details.title || details.name} ${rating ? '| ' + rating : ''} | ${providers}`);
      }
    } else {
      failed++;
    }

    if (index % 500 === 0) {
      process.stdout.write(`\r  Progress: ${index}/${total} | Inserted: ${inserted} | Skipped: ${failed}   `);
    }
  }

  // Summary
  console.log('\n\n═══════════════════════════════════════════════════════════');
  console.log('  Import Complete!');
  console.log('═══════════════════════════════════════════════════════════');
  console.log(`  ✓ Total inserted: ${inserted}`);
  console.log(`  ✗ Skipped: ${failed}`);
  console.log(`  🎬 Movies + 📺 TV Series from ${INDIAN_PROVIDERS.length} providers`);
  console.log('═══════════════════════════════════════════════════════════\n');
}

runImport().catch(console.error);
