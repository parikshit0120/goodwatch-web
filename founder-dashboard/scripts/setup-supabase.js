#!/usr/bin/env node

/**
 * Auto-setup Supabase tables for the dashboard
 * Run: npm run setup
 */

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const SUPABASE_URL = 'https://jdjqrlkynwfhbtyuddjk.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_SERVICE_ROLE_KEY) {
  console.error('❌ SUPABASE_SERVICE_ROLE_KEY environment variable not set');
  console.log('\nGet it from: https://jdjqrlkynwfhbtyuddjk.supabase.co/project/jdjqrlkynwfhbtyuddjk/settings/api');
  console.log('Then run: SUPABASE_SERVICE_ROLE_KEY=your_key npm run setup');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function setupTables() {
  console.log('🚀 Setting up Supabase tables for dashboard...\n');

  const sql = readFileSync(join(__dirname, '..', 'supabase-setup.sql'), 'utf8');

  try {
    // Execute the SQL
    const { error } = await supabase.rpc('exec_sql', { sql_string: sql });

    if (error) {
      // If exec_sql doesn't exist, we need to create tables via REST API
      console.log('⚠️  Cannot run SQL directly. Tables must be created manually.');
      console.log('\nGo to: https://jdjqrlkynwfhbtyuddjk.supabase.co/project/jdjqrlkynwfhbtyuddjk/sql/new');
      console.log('Copy the contents of supabase-setup.sql and run it.\n');
      return;
    }

    console.log('✅ Tables created successfully!');
    console.log('\nCreated tables:');
    console.log('  - dashboard_tasks');
    console.log('  - dashboard_ship_logs');
    console.log('  - dashboard_context_notes');
    console.log('\n✨ Setup complete! Dashboard is ready to use.');
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

setupTables();
