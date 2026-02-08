import { createClient } from '@supabase/supabase-js';
const supabase = createClient('https://jdjqrlkynwfhbtyuddjk.supabase.co', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpkanFybGt5bndmaGJ0eXVkZGprIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzI5NzYyNDUsImV4cCI6MjA0ODU1MjI0NX0.Ra0O4fvtTOAOLNPyLMVVwbOs3lQB51ylQyDLkdpv8jQ');
const { count } = await supabase.from('movies').select('*', { count: 'exact', head: true });
console.log('Total movies:', count);
