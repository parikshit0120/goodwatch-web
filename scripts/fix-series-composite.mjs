import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://jdjqrlkynwfhbtyuddjk.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpkanFybGt5bndmaGJ0eXVkZGprIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ0NzUwMTEsImV4cCI6MjA4MDA1MTAxMX0.KDRMLCewVMp3lwphkUvtoWOkg6kyAk8iSbVkRKiHYSk'
);

// Recalculate composite_score for series that now have both imdb_rating and vote_average
const { data, error } = await supabase.from('movies')
  .select('id, title, imdb_rating, vote_average, composite_score, content_type')
  .not('imdb_rating', 'is', null)
  .not('vote_average', 'is', null)
  .in('content_type', ['tv', 'series'])
  .limit(500);

if (error) {
  console.log('Error:', error);
  process.exit(1);
}

console.log(`Found ${data.length} series with both IMDb and TMDB ratings`);

let updated = 0;
for (const movie of data) {
  const newComposite = (movie.imdb_rating * 0.7) + (movie.vote_average * 0.3);

  // Only update if composite changed meaningfully
  if (Math.abs(newComposite - (movie.composite_score || 0)) > 0.05) {
    const { error: updateError } = await supabase.from('movies')
      .update({ composite_score: parseFloat(newComposite.toFixed(4)) })
      .eq('id', movie.id);

    if (updateError) {
      console.log(`  Error updating ${movie.title}:`, updateError);
    } else {
      updated++;
      console.log(`  ${movie.title}: ${movie.composite_score} -> ${newComposite.toFixed(4)}`);
    }
  }
}

console.log(`\nUpdated composite scores for ${updated} series`);
