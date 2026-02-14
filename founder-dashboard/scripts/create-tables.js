#!/usr/bin/env node
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://jdjqrlkynwfhbtyuddjk.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpkanFybGt5bndmaGJ0eXVkZGprIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ0NzUwMTEsImV4cCI6MjA4MDA1MTAxMX0.KDRMLCewVMp3lwphkUvtoWOkg6kyAk8iSbVkRKiHYSk';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

console.log('🚀 Creating dashboard tables in Supabase...\n');

const tables = [
  {
    name: 'dashboard_tasks',
    check: async () => {
      const { data, error } = await supabase.from('dashboard_tasks').select('count').limit(1).maybeSingle();
      return !error;
    }
  },
  {
    name: 'dashboard_ship_logs',
    check: async () => {
      const { data, error } = await supabase.from('dashboard_ship_logs').select('count').limit(1).maybeSingle();
      return !error;
    }
  },
  {
    name: 'dashboard_context_notes',
    check: async () => {
      const { data, error } = await supabase.from('dashboard_context_notes').select('count').limit(1).maybeSingle();
      return !error;
    }
  }
];

async function checkTables() {
  for (const table of tables) {
    const exists = await table.check();
    if (exists) {
      console.log(`✅ ${table.name} already exists`);
    } else {
      console.log(`❌ ${table.name} does not exist`);
    }
  }

  const allExist = await Promise.all(tables.map(t => t.check()));

  if (allExist.every(exists => exists)) {
    console.log('\n✨ All tables exist! Dashboard is ready to use.');
  } else {
    console.log('\n⚠️  Some tables missing. Run the SQL manually:');
    console.log('   https://jdjqrlkynwfhbtyuddjk.supabase.co/project/jdjqrlkynwfhbtyuddjk/sql/new');
    console.log('   Copy supabase-setup.sql contents and execute.\n');
  }
}

checkTables();
