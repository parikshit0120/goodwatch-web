#!/usr/bin/env node

/**
 * Sync metrics from Supabase (iOS app) to Firestore (Dashboard)
 *
 * Run: node scripts/sync-metrics.js
 *
 * This pulls real data from your iOS app's Supabase and pushes to Firestore
 * so the dashboard shows actual metrics.
 */

import { createClient } from '@supabase/supabase-js';
import admin from 'firebase-admin';
import { readFileSync } from 'fs';

// Supabase (iOS app - source of truth)
const SUPABASE_URL = 'https://jdjqrlkynwfhbtyuddjk.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpkanFybGt5bndmaGJ0eXVkZGprIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ0NzUwMTEsImV4cCI6MjA4MDA1MTAxMX0.KDRMLCewVMp3lwphkUvtoWOkg6kyAk8iSbVkRKiHYSk';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Initialize Firebase Admin
const serviceAccountPath = process.env.GOOGLE_APPLICATION_CREDENTIALS ||
  '/Users/parikshitjhajharia/Desktop/Personal/GoodWatch Marketing/goodwatchapp-1f699b2c9bff.json';

try {
  const serviceAccount = JSON.parse(readFileSync(serviceAccountPath, 'utf8'));
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    projectId: 'goodwatchapp',
  });
  console.log('✅ Firebase Admin initialized');
} catch (error) {
  console.error('❌ Failed to initialize Firebase Admin:', error.message);
  console.log('Make sure the service account JSON is at:', serviceAccountPath);
  process.exit(1);
}

const db = admin.firestore();

async function calculateMetrics() {
  const today = new Date().toISOString().split('T')[0];
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

  console.log('\n📊 Calculating metrics from Supabase...');

  // Get app events from last 7 days
  const { data: events, error } = await supabase
    .from('app_events')
    .select('*')
    .gte('created_at', sevenDaysAgo);

  if (error) {
    console.error('❌ Error fetching events:', error);
    return null;
  }

  console.log(`   Found ${events.length} events in last 7 days`);

  // Calculate DAU (unique users today)
  const todayEvents = events.filter(e => e.created_at.startsWith(today));
  const dau = new Set(todayEvents.map(e => e.user_id)).size;

  // Calculate new users today
  const { data: profiles, error: profileError } = await supabase
    .from('user_profiles')
    .select('created_at')
    .gte('created_at', today + 'T00:00:00')
    .lte('created_at', today + 'T23:59:59');

  const newUsers = profiles ? profiles.length : 0;

  // Calculate 7-day retention (simplified)
  // Users who were active 7 days ago and are still active
  const activeUsers = new Set(events.map(e => e.user_id));
  const retention7d = activeUsers.size > 0 ? (dau / activeUsers.size) * 100 : 0;

  // Shares per user (from interactions)
  const { data: interactions, error: interError } = await supabase
    .from('user_interactions')
    .select('*')
    .eq('interaction_type', 'share')
    .gte('created_at', sevenDaysAgo);

  const sharesPerUser = activeUsers.size > 0 ? (interactions?.length || 0) / activeUsers.size : 0;

  // Revenue (placeholder - you don't have payments yet)
  const revenue7d = 0;

  const metrics = {
    dau,
    newUsers,
    retention7d: Math.round(retention7d * 10) / 10,
    sharesPerUser: Math.round(sharesPerUser * 100) / 100,
    revenue7d,
  };

  console.log('\n📈 Calculated Metrics:');
  console.log(`   DAU: ${metrics.dau}`);
  console.log(`   New Users Today: ${metrics.newUsers}`);
  console.log(`   7D Retention: ${metrics.retention7d}%`);
  console.log(`   Shares per User: ${metrics.sharesPerUser}`);
  console.log(`   7D Revenue: $${metrics.revenue7d}`);

  return metrics;
}

async function syncToFirestore(metrics) {
  const today = new Date().toISOString().split('T')[0];

  console.log('\n💾 Syncing to Firestore...');

  try {
    await db.collection('dailyMetrics').doc(today).set({
      ...metrics,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    }, { merge: true });

    console.log(`✅ Metrics synced to Firestore for ${today}`);
  } catch (error) {
    console.error('❌ Error syncing to Firestore:', error);
  }
}

async function main() {
  console.log('🚀 Starting metrics sync...\n');

  const metrics = await calculateMetrics();

  if (metrics) {
    await syncToFirestore(metrics);
  }

  console.log('\n✨ Sync complete!');
  process.exit(0);
}

main();
