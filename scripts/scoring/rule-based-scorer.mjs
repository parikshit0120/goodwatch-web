/**
 * GoodWatch Rule-Based Emotional Scorer v1
 * Scores ALL movies using deterministic rules - NO API, $0 cost
 * 
 * LOCKED: Do not tweak values without user data
 */

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://jdjqrlkynwfhbtyuddjk.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpkanFybGt5bndmaGJ0eXVkZGprIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ0NzUwMTEsImV4cCI6MjA4MDA1MTAxMX0.KDRMLCewVMp3lwphkUvtoWOkg6kyAk8iSbVkRKiHYSk';

const SCORING_VERSION = 'rule_v1';
const SCORING_SOURCE = 'deterministic';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// ===========================================
// GENRE → BASE EMOTIONAL PROFILE MAPPING
// ===========================================

const GENRE_PROFILES = {
  'Animation': { eI: 4, mS: 3, c: 8, e: 5, d: 1, h: 6, x: 2, r: 8, arch: 'light' },
  'Family': { eI: 4, mS: 2, c: 9, e: 4, d: 1, h: 5, x: 2, r: 8, arch: 'light' },
  'Comedy': { eI: 4, mS: 3, c: 7, e: 6, d: 1, h: 9, x: 2, r: 7, arch: 'fun' },
  'Romance': { eI: 6, mS: 3, c: 7, e: 4, d: 2, h: 4, x: 3, r: 7, arch: 'light' },
  'Music': { eI: 5, mS: 3, c: 7, e: 6, d: 2, h: 5, x: 3, r: 7, arch: 'fun' },
  'Action': { eI: 6, mS: 4, c: 5, e: 9, d: 4, h: 3, x: 3, r: 7, arch: 'fun' },
  'Adventure': { eI: 6, mS: 4, c: 6, e: 8, d: 3, h: 4, x: 4, r: 8, arch: 'fun' },
  'Fantasy': { eI: 6, mS: 5, c: 6, e: 7, d: 3, h: 3, x: 5, r: 7, arch: 'fun' },
  'Science Fiction': { eI: 6, mS: 7, c: 4, e: 7, d: 4, h: 2, x: 6, r: 7, arch: 'stimulating' },
  'Western': { eI: 5, mS: 4, c: 5, e: 6, d: 5, h: 2, x: 4, r: 6, arch: 'fun' },
  'Mystery': { eI: 6, mS: 8, c: 4, e: 5, d: 5, h: 2, x: 7, r: 7, arch: 'stimulating' },
  'Thriller': { eI: 8, mS: 7, c: 2, e: 8, d: 6, h: 1, x: 6, r: 6, arch: 'stimulating' },
  'Crime': { eI: 7, mS: 6, c: 3, e: 6, d: 7, h: 2, x: 6, r: 6, arch: 'stimulating' },
  'Drama': { eI: 7, mS: 5, c: 4, e: 4, d: 5, h: 2, x: 5, r: 6, arch: 'deep' },
  'War': { eI: 8, mS: 5, c: 2, e: 6, d: 8, h: 1, x: 5, r: 5, arch: 'deep' },
  'History': { eI: 6, mS: 6, c: 4, e: 4, d: 5, h: 1, x: 5, r: 5, arch: 'deep' },
  'Horror': { eI: 8, mS: 5, c: 1, e: 7, d: 9, h: 2, x: 4, r: 5, arch: 'deep' },
  'Documentary': { eI: 5, mS: 7, c: 5, e: 3, d: 4, h: 2, x: 5, r: 4, arch: 'stimulating' },
  'TV Movie': { eI: 4, mS: 3, c: 6, e: 4, d: 3, h: 4, x: 3, r: 5, arch: 'light' },
};

// ===========================================
// KEYWORD ADJUSTMENTS (from overview)
// ===========================================

const KEYWORD_ADJUSTMENTS = {
  // Darkness
  death: { d: 2, c: -1 }, murder: { d: 2, c: -2 }, kill: { d: 1, c: -1 },
  dark: { d: 1, c: -1 }, revenge: { d: 2, eI: 1 }, violent: { d: 2, e: 1 },
  war: { d: 2, eI: 1 }, suicide: { d: 3, c: -2 }, tragic: { d: 2, eI: 2 },
  grief: { d: 2, eI: 2, c: -1 }, haunted: { d: 2, c: -2 }, horror: { d: 2, c: -2 },
  terror: { d: 2, c: -2 }, nightmare: { d: 2, c: -1 },
  
  // Comfort
  love: { c: 2, eI: 1 }, family: { c: 2, d: -1 }, friend: { c: 1, d: -1 },
  heartwarming: { c: 3, d: -2 }, sweet: { c: 2, h: 1 }, charming: { c: 2, h: 1 },
  wholesome: { c: 3, d: -2 }, cozy: { c: 3, e: -1 }, gentle: { c: 2, e: -1 },
  warm: { c: 2 }, hope: { c: 2, d: -1 }, dream: { c: 1, mS: 1 },
  
  // Humour
  funny: { h: 3, c: 1 }, hilarious: { h: 3, c: 1 }, comedy: { h: 2, c: 1 },
  laugh: { h: 2, c: 1 }, humor: { h: 2 }, humour: { h: 2 }, witty: { h: 2, mS: 1 },
  sarcastic: { h: 2 }, absurd: { h: 2, mS: 1 }, ridiculous: { h: 2 },
  parody: { h: 3 }, satire: { h: 2, mS: 2 },
  
  // Mental stimulation
  mystery: { mS: 2, x: 1 }, puzzle: { mS: 2, x: 1 }, twist: { mS: 2, x: 2 },
  philosophical: { mS: 3, x: 2 }, complex: { mS: 2, x: 2 }, mindbending: { mS: 3, x: 3 },
  cerebral: { mS: 3, x: 2 }, intelligent: { mS: 2 }, psychological: { mS: 2, d: 1 },
  conspiracy: { mS: 2, x: 1 }, secret: { mS: 1, x: 1 },
  
  // Energy
  action: { e: 2, mS: -1 }, chase: { e: 2 }, fight: { e: 2, d: 1 },
  battle: { e: 2, d: 1 }, explosion: { e: 2 }, fast: { e: 2 },
  adrenaline: { e: 3 }, thrilling: { e: 2, eI: 1 }, exciting: { e: 2 },
  adventure: { e: 2, c: 1 }, race: { e: 2 },
  
  // Complexity
  nonlinear: { x: 3, mS: 2 }, layered: { x: 2, mS: 1 }, intricate: { x: 2, mS: 1 },
  ambiguous: { x: 2, mS: 1 }, unreliable: { x: 2, mS: 2 }, timeline: { x: 2, mS: 1 },
  
  // Emotional intensity
  emotional: { eI: 2 }, powerful: { eI: 2 }, intense: { eI: 2, e: 1 },
  heartbreaking: { eI: 3, d: 1 }, devastating: { eI: 3, d: 2 }, moving: { eI: 2, c: 1 },
  profound: { eI: 2, mS: 1 }, tear: { eI: 2 }, cry: { eI: 2 },
  
  // Rewatchability
  classic: { r: 2, c: 1 }, iconic: { r: 2 }, beloved: { r: 2, c: 1 },
  masterpiece: { r: 2, mS: 1 }, timeless: { r: 2, c: 1 }, cult: { r: 2 },
};

// ===========================================
// GENRE COMBINATION OVERRIDES (sorted keys)
// ===========================================

const GENRE_COMBOS = {
  'Comedy,Romance': { arch: 'light', c: 8, h: 7, d: 1, eI: 5 },
  'Action,Comedy': { arch: 'fun', e: 8, h: 7, c: 6 },
  'Comedy,Horror': { arch: 'fun', h: 6, d: 5, c: 4 },
  'Animation,Family': { arch: 'light', c: 9, h: 6, d: 0, r: 9 },
  'Drama,Romance': { arch: 'deep', eI: 7, c: 5, d: 3 },
  'Science Fiction,Thriller': { arch: 'stimulating', mS: 8, e: 7, x: 7 },
  'Crime,Thriller': { arch: 'stimulating', d: 7, e: 7, mS: 7 },
  'Action,Adventure': { arch: 'fun', e: 9, c: 6, r: 8 },
  'Drama,War': { arch: 'deep', d: 8, eI: 8, c: 1 },
  'Drama,History': { arch: 'deep', mS: 6, eI: 6, d: 5 },
  'Mystery,Thriller': { arch: 'stimulating', mS: 8, x: 7, e: 6 },
  'Animation,Comedy': { arch: 'fun', h: 8, c: 8, r: 8 },
  'Adventure,Fantasy': { arch: 'fun', e: 7, c: 6, r: 8, mS: 5 },
};

// ===========================================
// SCORING FUNCTION
// ===========================================

function scoreMovie(movie) {
  let profile = { eI: 5, mS: 5, c: 5, e: 5, d: 5, h: 5, x: 5, r: 5 };
  let archetype = 'fun';
  
  const genres = movie.genres?.map(g => g.name) || [];
  const overview = (movie.overview || '').toLowerCase();
  
  // 1. Genre combination override (sorted for consistency)
  const genreKey = genres.slice(0, 2).sort().join(',');
  if (GENRE_COMBOS[genreKey]) {
    const combo = GENRE_COMBOS[genreKey];
    if (combo.arch) archetype = combo.arch;
    if (combo.eI !== undefined) profile.eI = combo.eI;
    if (combo.mS !== undefined) profile.mS = combo.mS;
    if (combo.c !== undefined) profile.c = combo.c;
    if (combo.e !== undefined) profile.e = combo.e;
    if (combo.d !== undefined) profile.d = combo.d;
    if (combo.h !== undefined) profile.h = combo.h;
    if (combo.x !== undefined) profile.x = combo.x;
    if (combo.r !== undefined) profile.r = combo.r;
  } else if (genres.length > 0) {
    // 2. Average genre profiles
    let count = 0;
    let sum = { eI: 0, mS: 0, c: 0, e: 0, d: 0, h: 0, x: 0, r: 0 };
    let archetypes = [];
    
    for (const genre of genres) {
      const gp = GENRE_PROFILES[genre];
      if (gp) {
        sum.eI += gp.eI; sum.mS += gp.mS; sum.c += gp.c; sum.e += gp.e;
        sum.d += gp.d; sum.h += gp.h; sum.x += gp.x; sum.r += gp.r;
        archetypes.push(gp.arch);
        count++;
      }
    }
    
    if (count > 0) {
      profile.eI = Math.round(sum.eI / count);
      profile.mS = Math.round(sum.mS / count);
      profile.c = Math.round(sum.c / count);
      profile.e = Math.round(sum.e / count);
      profile.d = Math.round(sum.d / count);
      profile.h = Math.round(sum.h / count);
      profile.x = Math.round(sum.x / count);
      profile.r = Math.round(sum.r / count);
      
      const archCounts = {};
      archetypes.forEach(a => archCounts[a] = (archCounts[a] || 0) + 1);
      archetype = Object.entries(archCounts).sort((a, b) => b[1] - a[1])[0][0];
    }
  }
  
  // 3. Keyword adjustments (max 4 to prevent over-accumulation)
  let keywordHits = 0;
  for (const [keyword, adj] of Object.entries(KEYWORD_ADJUSTMENTS)) {
    if (keywordHits >= 4) break;
    if (overview.includes(keyword)) {
      keywordHits++;
      if (adj.eI) profile.eI += adj.eI;
      if (adj.mS) profile.mS += adj.mS;
      if (adj.c) profile.c += adj.c;
      if (adj.e) profile.e += adj.e;
      if (adj.d) profile.d += adj.d;
      if (adj.h) profile.h += adj.h;
      if (adj.x) profile.x += adj.x;
      if (adj.r) profile.r += adj.r;
    }
  }
  
  // 4. Rating adjustments
  const rating = movie.vote_average || 0;
  if (rating >= 8.0) profile.r += 2;
  else if (rating >= 7.5) profile.r += 1;
  else if (rating < 5.5) profile.r -= 1;
  
  // 5. Year adjustments
  const year = movie.year || 2020;
  if (year < 1990) { profile.r += 1; profile.c += 1; }
  else if (year < 2000) { profile.r += 1; }
  else if (year >= 2020) { profile.r -= 1; }
  
  // 6. Runtime adjustments
  const runtime = movie.runtime || 120;
  if (runtime > 150) { profile.x += 1; profile.e -= 1; }
  else if (runtime < 90) { profile.c += 1; profile.x -= 1; }
  
  // 7. Clamp all values to 0-10
  profile.eI = Math.max(0, Math.min(10, profile.eI));
  profile.mS = Math.max(0, Math.min(10, profile.mS));
  profile.c = Math.max(0, Math.min(10, profile.c));
  profile.e = Math.max(0, Math.min(10, profile.e));
  profile.d = Math.max(0, Math.min(10, profile.d));
  profile.h = Math.max(0, Math.min(10, profile.h));
  profile.x = Math.max(0, Math.min(10, profile.x));
  profile.r = Math.max(0, Math.min(10, profile.r));
  
  // 8. Final archetype based on profile
  if (profile.c >= 7 && profile.d <= 3) archetype = 'light';
  else if (profile.h >= 7 || (profile.e >= 7 && profile.d <= 4)) archetype = 'fun';
  else if (profile.mS >= 7 || profile.x >= 7) archetype = 'stimulating';
  else if (profile.d >= 6 || profile.eI >= 8) archetype = 'deep';
  
  return {
    emotional_profile: {
      emotionalIntensity: profile.eI,
      mentalStimulation: profile.mS,
      comfort: profile.c,
      energy: profile.e,
      darkness: profile.d,
      humour: profile.h,
      complexity: profile.x,
      rewatchability: profile.r
    },
    archetype
  };
}

// ===========================================
// MAIN PROCESSING
// ===========================================

async function main() {
  console.log('');
  console.log('╔════════════════════════════════════════════╗');
  console.log('║  GoodWatch Rule-Based Emotional Scorer     ║');
  console.log('║  Version: rule_v1 | $0 cost                ║');
  console.log('╚════════════════════════════════════════════╝');
  console.log('');
  
  const BATCH_SIZE = 500;
  let success = 0;
  let failed = 0;
  let batchNum = 0;
  
  while (true) {
    // Fetch batch (always fresh query for unscored)
    const { data: movies, error: fetchError } = await supabase
      .from('movies')
      .select('tmdb_id, title, year, genres, overview, vote_average, runtime')
      .is('emotional_profile', null)
      .not('poster_path', 'is', null)
      .order('vote_count', { ascending: false })
      .limit(BATCH_SIZE);
    
    if (fetchError) {
      console.error('Fetch error:', fetchError.message);
      break;
    }
    
    if (!movies || movies.length === 0) {
      console.log('');
      console.log('No more unscored movies found.');
      break;
    }
    
    batchNum++;
    const batchStart = Date.now();
    
    // Score and update each movie
    for (const movie of movies) {
      const { emotional_profile, archetype } = scoreMovie(movie);
      
      const { error } = await supabase
        .from('movies')
        .update({ 
          emotional_profile, 
          archetype,
          scoring_version: SCORING_VERSION,
          scoring_source: SCORING_SOURCE,
          scored_at: new Date().toISOString()
        })
        .eq('tmdb_id', movie.tmdb_id);
      
      if (error) {
        failed++;
      } else {
        success++;
      }
    }
    
    const batchTime = ((Date.now() - batchStart) / 1000).toFixed(1);
    console.log(`[Batch ${batchNum}] Scored ${movies.length} movies in ${batchTime}s | Total: ${success} done, ${failed} failed`);
  }
  
  console.log('');
  console.log('╔════════════════════════════════════════════╗');
  console.log('║  COMPLETE                                  ║');
  console.log(`║  Success: ${String(success).padEnd(6)} | Failed: ${String(failed).padEnd(6)}    ║`);
  console.log('╚════════════════════════════════════════════╝');
  console.log('');
}

main().catch(console.error);
