import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://jdjqrlkynwfhbtyuddjk.supabase.co', 
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpkanFybGt5bndmaGJ0eXVkZGprIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ0NzUwMTEsImV4cCI6MjA4MDA1MTAxMX0.KDRMLCewVMp3lwphkUvtoWOkg6kyAk8iSbVkRKiHYSk'
);
const TMDB_KEY = '204363c10c39f75a0320ad4258565f71';

async function fetchOTT(tmdbId) {
  const res = await fetch(`https://api.themoviedb.org/3/movie/${tmdbId}/watch/providers?api_key=${TMDB_KEY}`);
  const data = await res.json();
  const india = data.results?.IN;
  if (!india) return null;
  
  const providers = [];
  if (india.flatrate) {
    india.flatrate.forEach(p => providers.push({ 
      name: p.provider_name, 
      logo_path: p.logo_path, 
      type: 'flatrate' 
    }));
  }
  if (india.rent) {
    india.rent.forEach(p => providers.push({ 
      name: p.provider_name, 
      logo_path: p.logo_path, 
      type: 'rent' 
    }));
  }
  return providers.length > 0 ? providers : null;
}

async function run() {
  // Get movies without OTT data
  const { data: movies } = await supabase
    .from('movies')
    .select('id,tmdb_id,title')
    .is('ott_providers', null)
    .limit(100);
  
  console.log(`Found ${movies?.length || 0} movies without OTT data`);
  
  let updated = 0;
  for (const movie of movies || []) {
    const ott = await fetchOTT(movie.tmdb_id);
    if (ott) {
      await supabase.from('movies').update({ ott_providers: ott }).eq('id', movie.id);
      console.log(`✓ ${movie.title}: ${ott.map(p => p.name).join(', ')}`);
      updated++;
    }
    await new Promise(r => setTimeout(r, 250)); // Rate limit
  }
  console.log(`\nUpdated ${updated} movies with OTT data`);
}

run();
