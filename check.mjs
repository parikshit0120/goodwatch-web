import { createClient } from '@supabase/supabase-js';
const supabase = createClient('https://jdjqrlkynwfhbtyuddjk.supabase.co', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpkanFybGt5bndmaGJ0eXVkZGprIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzI5NzYyNDUsImV4cCI6MjA0ODU1MjI0NX0.Ra0O4fvtTOAOLNPyLMVVwbOs3lQB51ylQyDLkdpv8jQ');
const { data } = await supabase.from('movies').select('id,title,ott_providers').not('ott_providers','is',null).limit(3);
console.log(JSON.stringify(data, null, 2));
