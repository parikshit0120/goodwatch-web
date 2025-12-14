import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://jdjqrlkynwfhbtyuddjk.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpkanFybGt5bndmaGJ0eXVkZGprIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ0NzUwMTEsImV4cCI6MjA4MDA1MTAxMX0.KDRMLCewVMp3lwphkUvtoWOkg6kyAk8iSbVkRKiHYSk'
);

function normalizeProvider(name) {
  const map = {
    'Disney+ Hotstar': 'JioHotstar',
    'Disney Plus Hotstar': 'JioHotstar',
    'Hotstar': 'JioHotstar',
    'Amazon Prime Video with Ads': 'Amazon Prime Video',
    'Sony Liv': 'SonyLIV',
    'Zee5': 'ZEE5',
    'Jio Cinema': 'JioCinema'
  };
  return map[name] || name;
}

function calculateConfidence(providers) {
  if (!providers || providers.length === 0) return 0.0;
  let confidence = 0.4;
  const flatrateCount = providers.filter(p => p.type === 'flatrate').length;
  if (flatrateCount > 1) confidence += 0.1;
  return Math.min(confidence, 0.5);
}

async function main() {
  console.log('Populating decision snapshots...');
  
  let processed = 0, created = 0, skipped = 0;
  let lastId = null;
  const batchSize = 500;
  
  while (true) {
    let query = supabase
      .from('movies')
      .select('id, tmdb_id, title, ott_providers')
      .not('ott_providers', 'is', null)
      .order('id', { ascending: true })
      .limit(batchSize);
    
    if (lastId) query = query.gt('id', lastId);
    
    const { data: movies, error } = await query;
    
    if (error) { console.error('Fetch error:', error); break; }
    if (!movies || movies.length === 0) break;
    
    const snapshots = [];
    
    for (const movie of movies) {
      processed++;
      lastId = movie.id;
      
      if (!movie.ott_providers || !Array.isArray(movie.ott_providers) || movie.ott_providers.length === 0) {
        skipped++;
        continue;
      }
      
      const normalizedProviders = movie.ott_providers.map(p => ({
        ...p,
        name: normalizeProvider(p.name || p.provider_name || 'Unknown')
      }));
      
      const confidence = calculateConfidence(normalizedProviders);
      
      snapshots.push({
        movie_id: movie.id,
        tmdb_id: movie.tmdb_id,
        region: 'IN',
        providers: normalizedProviders,
        confidence_score: confidence,
        is_valid: confidence >= 0.4,
        invalid_reason: confidence >= 0.4 ? null : 'low_confidence',
        verified_at: new Date().toISOString()
      });
    }
    
    if (snapshots.length > 0) {
      const { error: insertError } = await supabase
        .from('decision_snapshots')
        .upsert(snapshots, { onConflict: 'tmdb_id,region' });
      
      if (insertError) console.error('Insert error:', insertError.message);
      else created += snapshots.length;
    }
    
    console.log(`Processed ${processed} (created: ${created}, skipped: ${skipped})`);
    
    if (movies.length < batchSize) break;
  }
  
  console.log('\n=== DONE ===');
  console.log(`Total: ${processed}, Created: ${created}, Skipped: ${skipped}`);
  
  const { data: valid } = await supabase.from('decision_snapshots').select('id').eq('is_valid', true);
  const { data: tonight } = await supabase.from('decision_snapshots').select('id').gte('confidence_score', 0.5);
  
  console.log(`Valid: ${valid?.length || 0}, Tonight-ready: ${tonight?.length || 0}`);
}

main().catch(console.error);
