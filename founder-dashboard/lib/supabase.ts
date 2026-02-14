import { createClient } from '@supabase/supabase-js';

// iOS App Supabase (source of truth)
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://jdjqrlkynwfhbtyuddjk.supabase.co';
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpkanFybGt5bndmaGJ0eXVkZGprIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ0NzUwMTEsImV4cCI6MjA4MDA1MTAxMX0.KDRMLCewVMp3lwphkUvtoWOkg6kyAk8iSbVkRKiHYSk';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
