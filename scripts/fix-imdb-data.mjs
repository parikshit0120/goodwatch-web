/**
 * IMDb Data Audit & Fix Script
 * 
 * This script:
 * 1. Audits current IMDb data quality
 * 2. Fixes common issues (vote parsing, wrong mappings)
 * 3. Re-fetches from OMDb using IMDb ID (not title)
 * 
 * Run with: node --env-file=.env scripts/fix-imdb-data.mjs
 */

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.SUPABASE_URL || 'https://jdjqrlkynwfhbtyuddjk.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;
const OMDB_API_KEY = process.env.OMDB_API_KEY; // Get from http://www.omdbapi.com/apikey.aspx

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// ============================================
// AUDIT FUNCTIONS
// ============================================

async function auditImdbData() {
  console.log('\n📊 AUDITING IMDB DATA...\n');
  
  // Count total movies
  const { count: total } = await supabase
    .from('movies')
    .select('*', { count: 'exact', head: true });
  
  // Movies with IMDb ID
  const { count: withImdbId } = await supabase
    .from('movies')
    .select('*', { count: 'exact', head: true })
    .not('imdb_id', 'is', null);
  
  // Movies with IMDb rating
  const { count: withRating } = await supabase
    .from('movies')
    .select('*', { count: 'exact', head: true })
    .not('imdb_rating', 'is', null);
  
  // Movies with IMDb votes
  const { count: withVotes } = await supabase
    .from('movies')
    .select('*', { count: 'exact', head: true })
    .not('imdb_votes', 'is', null)
    .gt('imdb_votes', 0);
  
  // Movies with suspicious vote counts (likely parsing errors)
  const { data: suspiciousVotes } = await supabase
    .from('movies')
    .select('id, title, year, imdb_votes')
    .not('imdb_votes', 'is', null)
    .lt('imdb_votes', 100) // Very low votes usually means parsing error
    .limit(10);
  
  // Movies with impossible ratings
  const { data: badRatings } = await supabase
    .from('movies')
    .select('id, title, year, imdb_rating')
    .or('imdb_rating.lt.0,imdb_rating.gt.10')
    .limit(10);
  
  // Sample of movies with data
  const { data: sampleWithData } = await supabase
    .from('movies')
    .select('title, year, imdb_id, imdb_rating, imdb_votes')
    .not('imdb_rating', 'is', null)
    .order('imdb_votes', { ascending: false })
    .limit(5);
  
  console.log('=== AUDIT RESULTS ===');
  console.log(`Total movies: ${total}`);
  console.log(`With IMDb ID: ${withImdbId} (${((withImdbId/total)*100).toFixed(1)}%)`);
  console.log(`With IMDb rating: ${withRating} (${((withRating/total)*100).toFixed(1)}%)`);
  console.log(`With valid votes: ${withVotes} (${((withVotes/total)*100).toFixed(1)}%)`);
  
  if (suspiciousVotes?.length > 0) {
    console.log('\n⚠️  SUSPICIOUS VOTE COUNTS (possible parsing errors):');
    suspiciousVotes.forEach(m => {
      console.log(`  - ${m.title} (${m.year}): ${m.imdb_votes} votes`);
    });
  }
  
  if (badRatings?.length > 0) {
    console.log('\n❌ INVALID RATINGS:');
    badRatings.forEach(m => {
      console.log(`  - ${m.title} (${m.year}): ${m.imdb_rating}`);
    });
  }
  
  console.log('\n✅ SAMPLE WITH GOOD DATA:');
  sampleWithData?.forEach(m => {
    console.log(`  - ${m.title} (${m.year}): ${m.imdb_rating}/10, ${m.imdb_votes?.toLocaleString()} votes`);
  });
  
  return { total, withImdbId, withRating, withVotes };
}

// ============================================
// FIX FUNCTIONS
// ============================================

async function fixVoteParsingErrors() {
  console.log('\n🔧 FIXING VOTE PARSING ERRORS...\n');
  
  if (!OMDB_API_KEY) {
    console.log('❌ OMDB_API_KEY not set. Skipping OMDb refresh.');
    return;
  }
  
  // Find movies with suspiciously low votes that have IMDb ID
  const { data: needsFix } = await supabase
    .from('movies')
    .select('id, title, year, imdb_id, imdb_rating, imdb_votes')
    .not('imdb_id', 'is', null)
    .lt('imdb_votes', 100)
    .not('imdb_votes', 'is', null)
    .limit(50);
  
  console.log(`Found ${needsFix?.length || 0} movies to check`);
  
  let fixed = 0;
  for (const movie of needsFix || []) {
    try {
      // Always use IMDb ID, never title!
      const response = await fetch(
        `http://www.omdbapi.com/?i=${movie.imdb_id}&apikey=${OMDB_API_KEY}`
      );
      const data = await response.json();
      
      if (data.Response === 'True') {
        // Parse votes correctly (remove commas)
        const votes = parseInt(data.imdbVotes?.replace(/,/g, ''), 10) || null;
        const rating = parseFloat(data.imdbRating) || null;
        
        // Sanity check: title and year should roughly match
        const titleMatch = data.Title?.toLowerCase().includes(movie.title?.toLowerCase().substring(0, 10)) ||
                          movie.title?.toLowerCase().includes(data.Title?.toLowerCase().substring(0, 10));
        const yearMatch = Math.abs((parseInt(data.Year) || 0) - (movie.year || 0)) <= 1;
        
        if (!titleMatch || !yearMatch) {
          console.log(`⚠️  MISMATCH: ${movie.title} (${movie.year}) vs OMDb: ${data.Title} (${data.Year})`);
          continue;
        }
        
        if (votes !== movie.imdb_votes || rating !== movie.imdb_rating) {
          await supabase
            .from('movies')
            .update({
              imdb_rating: rating,
              imdb_votes: votes,
              // Add tracking field if you have one
              // imdb_last_updated: new Date().toISOString()
            })
            .eq('id', movie.id);
          
          console.log(`✅ Fixed: ${movie.title} - ${movie.imdb_votes} → ${votes?.toLocaleString()} votes`);
          fixed++;
        }
      } else {
        console.log(`❌ OMDb error for ${movie.title}: ${data.Error}`);
      }
      
      // Rate limit: 1 request per second for free tier
      await new Promise(r => setTimeout(r, 1100));
      
    } catch (err) {
      console.log(`❌ Error fixing ${movie.title}:`, err.message);
    }
  }
  
  console.log(`\n✅ Fixed ${fixed} movies`);
}

// ============================================
// REFRESH MISSING DATA
// ============================================

async function refreshMissingImdbData(limit = 100) {
  console.log(`\n🔄 REFRESHING MISSING IMDB DATA (limit: ${limit})...\n`);
  
  if (!OMDB_API_KEY) {
    console.log('❌ OMDB_API_KEY not set. Cannot refresh from OMDb.');
    console.log('   Get a free key at: http://www.omdbapi.com/apikey.aspx');
    return;
  }
  
  // Find movies with IMDb ID but missing rating/votes
  const { data: needsData } = await supabase
    .from('movies')
    .select('id, title, year, imdb_id')
    .not('imdb_id', 'is', null)
    .is('imdb_rating', null)
    .limit(limit);
  
  console.log(`Found ${needsData?.length || 0} movies needing IMDb data`);
  
  let updated = 0;
  for (const movie of needsData || []) {
    try {
      // CRITICAL: Always use IMDb ID (i=ttXXXX), never title (t=)
      const response = await fetch(
        `http://www.omdbapi.com/?i=${movie.imdb_id}&apikey=${OMDB_API_KEY}`
      );
      const data = await response.json();
      
      if (data.Response === 'True') {
        // Parse votes correctly
        const votes = parseInt(data.imdbVotes?.replace(/,/g, ''), 10) || null;
        const rating = parseFloat(data.imdbRating) || null;
        
        if (rating !== null) {
          await supabase
            .from('movies')
            .update({
              imdb_rating: rating,
              imdb_votes: votes
            })
            .eq('id', movie.id);
          
          console.log(`✅ ${movie.title}: ${rating}/10, ${votes?.toLocaleString()} votes`);
          updated++;
        }
      } else {
        console.log(`⚠️  No OMDb data for ${movie.title} (${movie.imdb_id})`);
      }
      
      // Rate limit
      await new Promise(r => setTimeout(r, 1100));
      
    } catch (err) {
      console.log(`❌ Error: ${movie.title}:`, err.message);
    }
  }
  
  console.log(`\n✅ Updated ${updated} movies`);
}

// ============================================
// VERIFY IMDB ID MAPPINGS
// ============================================

async function verifyImdbMappings(sampleSize = 20) {
  console.log(`\n🔍 VERIFYING IMDB ID MAPPINGS (sample: ${sampleSize})...\n`);
  
  if (!OMDB_API_KEY) {
    console.log('❌ OMDB_API_KEY not set.');
    return;
  }
  
  // Get random sample of movies with IMDb IDs
  const { data: sample } = await supabase
    .from('movies')
    .select('id, title, year, imdb_id, runtime')
    .not('imdb_id', 'is', null)
    .limit(sampleSize);
  
  let mismatches = 0;
  
  for (const movie of sample || []) {
    try {
      const response = await fetch(
        `http://www.omdbapi.com/?i=${movie.imdb_id}&apikey=${OMDB_API_KEY}`
      );
      const data = await response.json();
      
      if (data.Response === 'True') {
        // Check for mismatches
        const titleMatch = data.Title?.toLowerCase() === movie.title?.toLowerCase() ||
                          data.Title?.toLowerCase().includes(movie.title?.toLowerCase()) ||
                          movie.title?.toLowerCase().includes(data.Title?.toLowerCase());
        
        const yearMatch = Math.abs((parseInt(data.Year) || 0) - (movie.year || 0)) <= 1;
        
        // Runtime check (within 10 minutes)
        const omdbRuntime = parseInt(data.Runtime) || 0;
        const runtimeMatch = !movie.runtime || !omdbRuntime || 
                            Math.abs(omdbRuntime - movie.runtime) <= 10;
        
        if (!titleMatch || !yearMatch) {
          console.log(`❌ MISMATCH: DB has "${movie.title}" (${movie.year})`);
          console.log(`            OMDb has "${data.Title}" (${data.Year})`);
          console.log(`            IMDb ID: ${movie.imdb_id}`);
          mismatches++;
        } else {
          console.log(`✅ ${movie.title} (${movie.year}) - matches OMDb`);
        }
      }
      
      await new Promise(r => setTimeout(r, 1100));
      
    } catch (err) {
      console.log(`❌ Error checking ${movie.title}:`, err.message);
    }
  }
  
  console.log(`\n📊 Results: ${mismatches}/${sampleSize} mismatches (${((mismatches/sampleSize)*100).toFixed(1)}%)`);
  
  if (mismatches > sampleSize * 0.1) {
    console.log('⚠️  High mismatch rate! Review your TMDB → IMDb mapping process.');
  }
}

// ============================================
// MAIN
// ============================================

async function main() {
  console.log('🎬 IMDb Data Audit & Fix Tool\n');
  
  const action = process.argv[2] || 'audit';
  
  switch (action) {
    case 'audit':
      await auditImdbData();
      break;
    case 'fix-votes':
      await fixVoteParsingErrors();
      break;
    case 'refresh':
      const limit = parseInt(process.argv[3]) || 100;
      await refreshMissingImdbData(limit);
      break;
    case 'verify':
      const sample = parseInt(process.argv[3]) || 20;
      await verifyImdbMappings(sample);
      break;
    case 'all':
      await auditImdbData();
      await verifyImdbMappings(10);
      await fixVoteParsingErrors();
      break;
    default:
      console.log('Usage:');
      console.log('  node fix-imdb-data.mjs audit        - Audit current data quality');
      console.log('  node fix-imdb-data.mjs fix-votes    - Fix vote parsing errors');
      console.log('  node fix-imdb-data.mjs refresh 100  - Refresh missing data (limit)');
      console.log('  node fix-imdb-data.mjs verify 20    - Verify IMDb ID mappings');
      console.log('  node fix-imdb-data.mjs all          - Run all checks');
  }
}

main().catch(console.error);
