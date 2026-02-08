import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://jdjqrlkynwfhbtyuddjk.supabase.co', 
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpkanFybGt5bndmaGJ0eXVkZGprIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ0NzUwMTEsImV4cCI6MjA4MDA1MTAxMX0.KDRMLCewVMp3lwphkUvtoWOkg6kyAk8iSbVkRKiHYSk'
);

async function checkStats() {
  const { count: total } = await supabase.from('movies').select('*', { count: 'exact', head: true });
  const { count: withOtt } = await supabase.from('movies').select('*', { count: 'exact', head: true }).not('ott_providers', 'is', null);
  
  // Check how many have flatrate
  const { data: sample } = await supabase.from('movies').select('id,title,ott_providers').not('ott_providers', 'is', null).limit(10);
  
  let withFlatrate = 0;
  sample?.forEach(m => {
    if (m.ott_providers?.some(p => p.type === 'flatrate')) withFlatrate++;
  });
  
  console.log(`Total movies: ${total}`);
  console.log(`With OTT data: ${withOtt}`);
  console.log(`Sample with flatrate: ${withFlatrate}/10`);
  console.log('\nSample movies:');
  sample?.forEach(m => {
    const flatrate = m.ott_providers?.filter(p => p.type === 'flatrate').map(p => p.name) || [];
    console.log(`  ${m.title}: ${flatrate.length > 0 ? flatrate.join(', ') : 'NO FLATRATE'}`);
  });
}

checkStats();
