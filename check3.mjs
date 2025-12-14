import { createClient } from '@supabase/supabase-js';
const supabase = createClient('https://jdjqrlkynwfhbtyuddjk.supabase.co', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpkanFybGt5bndmaGJ0eXVkZGprIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ0NzUwMTEsImV4cCI6MjA4MDA1MTAxMX0.KDRMLCewVMp3lwphkUvtoWOkg6kyAk8iSbVkRKiHYSk');
const result = await supabase.from('movies').select('id,title,ott_providers').limit(3);
console.log('Result:', JSON.stringify(result.data, null, 2));
