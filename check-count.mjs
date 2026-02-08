import { createClient } from '@supabase/supabase-js';
const supabase = createClient('https://jdjqrlkynwfhbtyuddjk.supabase.co', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpkanFybGt5bndmaGJ0eXVkZGprIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ0NzUwMTEsImV4cCI6MjA4MDA1MTAxMX0.KDRMLCewVMp3lwphkUvtoWOkg6kyAk8iSbVkRKiHYSk');

const { count: total } = await supabase.from('movies').select('*', { count: 'exact', head: true });
const { count: withImdb } = await supabase.from('movies').select('*', { count: 'exact', head: true }).not('imdb_rating', 'is', null);
const { count: movies } = await supabase.from('movies').select('*', { count: 'exact', head: true }).eq('content_type', 'movie');
const { count: tv } = await supabase.from('movies').select('*', { count: 'exact', head: true }).eq('content_type', 'tv');

console.log(`Total: ${total}`);
console.log(`Movies: ${movies} | TV: ${tv}`);
console.log(`With IMDb rating: ${withImdb}`);
