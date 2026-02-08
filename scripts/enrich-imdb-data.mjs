/**
 * IMDB DATA ENRICHMENT SCRIPT
 * 
 * This script:
 * 1. Fetches IMDb ID from TMDB external_ids endpoint
 * 2. Fetches rating/votes from OMDb using IMDb ID (NOT title)
 * 3. Validates data before storing
 * 
 * Run: 
 *   TMDB_API_KEY=xxx OMDB_API_KEY=xxx node scripts/enrich-imdb-data.mjs
 *   
 * Get OMDb key (free): http://www.omdbapi.com/apikey.aspx
 */

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://jdjqrlkynwfhbtyuddjk.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpkanFybGt5bndmaGJ0eXVkZGprIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ0NzUwMTEsImV4cCI6MjA4MDA1MTAxMX0.KDRMLCewVMp3lwphkUvtoWOkg6kyAk8iSbVkRKiHYSk';
const TMDB_API_KEY = process.env.TMDB_API_KEY || '204363c10c39f75a0320ad4258565f71';
const OMDB_API_KEY = process.env.OMDB_API_KEY;

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// ============================================
// STEP 1: Fetch IMDb ID from TMDB
// ============================================
async function fetchImdbIdFromTMDB(tmdbId) {
  const url = `https://api.themoviedb.org/3/movie/${tmdbId}/external_ids?api_key=${TMDB_API_KEY}`;
  
  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    const data = await res.json();
    return data.imdb_id || null; // Returns "tt1234567" format
  } catch {
    return null;
  }
}

// ============================================
// STEP 2: Fetch rating from OMDb using IMDb ID
// ============================================
async function fetchOmdbData(imdbId) {
  if (!OMDB_API_KEY) return null;
  if (!imdbId || !imdbId.startsWith('tt')) return null;
  
  // CRITICAL: Always use ?i=ttXXXX, NEVER ?t=title
  const url = `http://www.omdbapi.com/?i=${imdbId}&apikey=${OMDB_API_KEY}`;
  
  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    const data = await res.json();
    
    if (data.Response !== 'True') return null;
    
    return {
      rating: parseFloat(data.imdbRating) || null,
      votes: parseInt(data.imdbVotes?.replace(/,/g, ''), 10) || null,
      title: data.Title,
      year: parseInt(data.Year) || null,
      type: data.Type
    };
  } catch {
    return null;
  }
}

// ============================================
// STEP 3: Validate OMDb response matches our movie
// ============================================
function validateOmdbResponse(movie, omdbData) {
  if (!omdbData) return false;
  
  // Must be a movie, not series/episode/game
  if (omdbData.type !== 'movie') {
    console.log(`  ⚠️ Type mismatch: ${omdbData.type}`);
    return false;
  }
  
  // Year must match within ±1 year
  if (omdbData.year && movie.year) {
    if (Math.abs(omdbData.year - movie.year) > 1) {
      console.log(`  ⚠️ Year mismatch: DB=${movie.year}, OMDb=${omdbData.year}`);
      return false;
    }
  }
  
  // Title should loosely match (handles "The Movie" vs "Movie, The")
  const dbTitle = movie.title?.toLowerCase().replace(/[^a-z0-9]/g, '');
  const omdbTitle = omdbData.title?.toLowerCase().replace(/[^a-z0-9]/g, '');
  
  if (dbTitle && omdbTitle) {
    const titleMatch = dbTitle.includes(omdbTitle.substring(0, 10)) || 
                       omdbTitle.includes(dbTitle.substring(0, 10));
    if (!titleMatch && dbTitle !== omdbTitle) {
      console.log(`  ⚠️ Title mismatch: DB="${movie.title}", OMDb="${omdbData.title}"`);
      // Don't fail on title mismatch if year matches - could be translation
    }
  }
  
  return true;
}

// ============================================
// MAIN: Enrich movies missing IMDb data
// ============================================
async function enrichImdbData(limit = 100, mode = 'missing-id') {
  console.log('\n🎬 IMDb Data Enrichment\n');
  
  if (!OMDB_API_KEY) {
    console.log('⚠️  OMDB_API_KEY not set. Will only fetch IMDb IDs from TMDB.');
    console.log('   Get free key at: http://www.omdbapi.com/apikey.aspx\n');
  }
  
  // Select movies based on mode
  let query = supabase
    .from('movies')
    .select('id, tmdb_id, title, year, imdb_id, imdb_rating, imdb_votes')
    .order('popularity', { ascending: false })
    .limit(limit);
  
  if (mode === 'missing-id') {
    // Movies without IMDb ID
    query = query.is('imdb_id', null);
    console.log(`📋 Mode: Fetching IMDb IDs for movies without one`);
  } else if (mode === 'missing-rating') {
    // Movies with IMDb ID but no rating
    query = query.not('imdb_id', 'is', null).is('imdb_rating', null);
    console.log(`📋 Mode: Fetching ratings for movies with IMDb ID but no rating`);
  } else if (mode === 'all') {
    // All movies, refresh everything
    console.log(`📋 Mode: Refreshing all movies`);
  }
  
  const { data: movies, error } = await query;
  
  if (error) {
    console.error('❌ Database error:', error);
    return;
  }
  
  console.log(`📊 Found ${movies?.length || 0} movies to process\n`);
  
  let stats = { 
    imdbIdFetched: 0, 
    ratingFetched: 0, 
    skipped: 0, 
    failed: 0,
    validated: 0
  };
  
  for (const movie of movies || []) {
    process.stdout.write(`\r🔄 Processing: ${movie.title.substring(0, 40).padEnd(40)}...`);
    
    let imdbId = movie.imdb_id;
    let needsUpdate = false;
    const updateData = {};
    
    // Step 1: Get IMDb ID if missing
    if (!imdbId) {
      imdbId = await fetchImdbIdFromTMDB(movie.tmdb_id);
      
      if (imdbId) {
        updateData.imdb_id = imdbId;
        needsUpdate = true;
        stats.imdbIdFetched++;
      } else {
        stats.failed++;
        continue;
      }
      
      // Rate limit TMDB: 40 req/10s
      await new Promise(r => setTimeout(r, 260));
    }
    
    // Step 2: Get rating from OMDb if we have IMDb ID and API key
    if (imdbId && OMDB_API_KEY && !movie.imdb_rating) {
      const omdbData = await fetchOmdbData(imdbId);
      
      if (omdbData && validateOmdbResponse(movie, omdbData)) {
        if (omdbData.rating !== null) {
          updateData.imdb_rating = omdbData.rating;
          updateData.imdb_votes = omdbData.votes;
          needsUpdate = true;
          stats.ratingFetched++;
          stats.validated++;
        }
      } else if (omdbData) {
        stats.skipped++; // Validation failed
      } else {
        stats.failed++;
      }
      
      // Rate limit OMDb: 1000 req/day = ~1 req/86ms, but be safe
      await new Promise(r => setTimeout(r, 1100));
    }
    
    // Step 3: Update database
    if (needsUpdate) {
      const { error: updateError } = await supabase
        .from('movies')
        .update(updateData)
        .eq('id', movie.id);
      
      if (updateError) {
        console.error(`\n❌ Update failed for ${movie.title}:`, updateError);
      }
    }
  }
  
  console.log(`\n\n${'='.repeat(50)}`);
  console.log(`✅ IMDb IDs fetched:  ${stats.imdbIdFetched}`);
  console.log(`✅ Ratings fetched:   ${stats.ratingFetched}`);
  console.log(`✅ Validated:         ${stats.validated}`);
  console.log(`⏭️ Skipped (invalid): ${stats.skipped}`);
  console.log(`❌ Failed:            ${stats.failed}`);
  console.log(`${'='.repeat(50)}\n`);
}

// ============================================
// CLI
// ============================================
const args = process.argv.slice(2);
const limit = parseInt(args.find(a => !a.startsWith('--')) || '100');
const mode = args.includes('--all') ? 'all' : 
             args.includes('--ratings') ? 'missing-rating' : 
             'missing-id';

console.log(`\nUsage:`);
console.log(`  node enrich-imdb-data.mjs 100              # Fetch IMDb IDs for 100 movies`);
console.log(`  node enrich-imdb-data.mjs 100 --ratings    # Fetch ratings for movies with ID`);
console.log(`  node enrich-imdb-data.mjs 100 --all        # Refresh everything`);
console.log(`\nRunning with limit=${limit}, mode=${mode}\n`);

enrichImdbData(limit, mode).catch(console.error);
