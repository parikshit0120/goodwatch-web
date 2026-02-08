import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://jdjqrlkynwfhbtyuddjk.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpkanFybGt5bndmaGJ0eXVkZGprIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ0NzUwMTEsImV4cCI6MjA4MDA1MTAxMX0.KDRMLCewVMp3lwphkUvtoWOkg6kyAk8iSbVkRKiHYSk'
);
const TMDB_KEY = '204363c10c39f75a0320ad4258565f71';
const OMDB_KEY = 'a7be3b08';

const sleep = (ms) => new Promise(r => setTimeout(r, ms));

async function run() {
  // Get movies without IMDb data
  const { data: movies } = await supabase
    .from('movies')
    .select('id,tmdb_id,title')
    .is('imdb_rating', null)
    .limit(500);

  console.log(`Found ${movies?.length || 0} movies without IMDb data\n`);

  let updated = 0;
  for (const movie of movies || []) {
    // Get IMDB ID from TMDB
    const tmdbRes = await fetch(`https://api.themoviedb.org/3/movie/${movie.tmdb_id}?api_key=${TMDB_KEY}`);
    const tmdbData = await tmdbRes.json();
    
    if (!tmdbData.imdb_id) {
      console.log(`  ✗ ${movie.title}: No IMDb ID`);
      continue;
    }

    // Get IMDb rating from OMDb
    const omdbRes = await fetch(`https://www.omdbapi.com/?i=${tmdbData.imdb_id}&apikey=${OMDB_KEY}`);
    const omdbData = await omdbRes.json();

    if (omdbData.Response === 'True' && omdbData.imdbRating !== 'N/A') {
      const rating = parseFloat(omdbData.imdbRating);
      const votes = parseInt(omdbData.imdbVotes.replace(/,/g, ''));

      await supabase.from('movies').update({
        imdb_id: tmdbData.imdb_id,
        imdb_rating: rating,
        imdb_votes: votes,
      }).eq('id', movie.id);

      console.log(`  ✓ ${movie.title}: IMDb ${rating} (${votes.toLocaleString()} votes)`);
      updated++;
    } else {
      console.log(`  ✗ ${movie.title}: No IMDb rating`);
    }

    await sleep(250); // Rate limit
  }

  console.log(`\nDone! Updated ${updated} movies with IMDb ratings.`);
}

run();
