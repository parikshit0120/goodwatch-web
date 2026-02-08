import type { APIRoute } from 'astro';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://jdjqrlkynwfhbtyuddjk.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpkanFybGt5bndmaGJ0eXVkZGprIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ0NzUwMTEsImV4cCI6MjA4MDA1MTAxMX0.KDRMLCewVMp3lwphkUvtoWOkg6kyAk8iSbVkRKiHYSk'
);

// Feedback weights by issue type
const FEEDBACK_WEIGHTS: Record<string, number> = {
  'not_available': 1.0,
  'link_broken': 0.7,
  'rent_only': 0.8,
  'different_provider': 0.5
};

// Suppression threshold
const SUPPRESSION_THRESHOLD = 2.0;
const MIN_DISTINCT_USERS = 2;
const AGGREGATION_WINDOW_HOURS = 72;

export const POST: APIRoute = async ({ request }) => {
  try {
    const body = await request.json();
    const { 
      userId, 
      tmdbId, 
      reportedProvider, 
      issueType, 
      correctProvider, 
      sourcePage,
      bounceTimeMs 
    } = body;
    
    // Calculate weight
    const weight = FEEDBACK_WEIGHTS[issueType] || 0.5;
    
    // 1. Insert feedback
    const { error: feedbackError } = await supabase
      .from('provider_feedback')
      .insert({
        user_id: userId || 'anonymous',
        tmdb_id: parseInt(tmdbId),
        reported_provider: reportedProvider,
        issue_type: issueType,
        correct_provider: correctProvider || null,
        source_page: sourcePage || 'unknown',
        bounce_time_ms: bounceTimeMs || null,
        region: 'IN',
        weight: weight,
        processed: false
      });
    
    if (feedbackError) {
      console.error('Feedback insert error:', feedbackError);
      return new Response(JSON.stringify({ success: false, error: feedbackError.message }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    // 2. Immediately invalidate for this user's session (instant feedback)
    await supabase
      .from('decision_snapshots')
      .update({ 
        is_valid: false, 
        invalid_reason: 'user_reported',
        updated_at: new Date().toISOString()
      })
      .eq('tmdb_id', parseInt(tmdbId))
      .eq('region', 'IN');
    
    // 3. Check if we should auto-suppress for everyone (aggregation check)
    const shouldSuppress = await checkAggregationThreshold(parseInt(tmdbId), reportedProvider, 'IN');
    
    if (shouldSuppress) {
      await suppressMovieProvider(parseInt(tmdbId), reportedProvider, 'IN');
    }
    
    // 4. Create override if user provided correct provider
    if (correctProvider && correctProvider !== reportedProvider) {
      await supabase
        .from('provider_overrides')
        .upsert({
          tmdb_id: parseInt(tmdbId),
          region: 'IN',
          provider_name: correctProvider,
          availability_type: 'flatrate',
          confidence_boost: 0.3,
          source: 'user_correction',
          source_details: `Reported by ${userId || 'anonymous'} from ${sourcePage}`,
          is_active: true,
          expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
        }, {
          onConflict: 'tmdb_id,region,provider_name'
        });
    }
    
    return new Response(JSON.stringify({ 
      success: true, 
      suppressed: shouldSuppress 
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
    
  } catch (err) {
    console.error('Provider feedback API error:', err);
    return new Response(JSON.stringify({ success: false, error: 'Server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};

// Check if aggregation threshold is met
async function checkAggregationThreshold(
  tmdbId: number, 
  provider: string, 
  region: string
): Promise<boolean> {
  const windowStart = new Date(Date.now() - AGGREGATION_WINDOW_HOURS * 60 * 60 * 1000).toISOString();
  
  // Get aggregated feedback
  const { data: feedback } = await supabase
    .from('provider_feedback')
    .select('user_id, weight')
    .eq('tmdb_id', tmdbId)
    .eq('reported_provider', provider)
    .eq('region', region)
    .eq('processed', false)
    .gte('created_at', windowStart);
  
  if (!feedback || feedback.length === 0) return false;
  
  // Calculate weighted score and distinct users
  const distinctUsers = new Set(feedback.map(f => f.user_id)).size;
  const weightedScore = feedback.reduce((sum, f) => sum + (f.weight || 1), 0);
  
  // Check guardrail: recent successful watch?
  const { data: snapshot } = await supabase
    .from('decision_snapshots')
    .select('last_success_at')
    .eq('tmdb_id', tmdbId)
    .eq('region', region)
    .single();
  
  const recentSuccess = snapshot?.last_success_at && 
    new Date(snapshot.last_success_at) > new Date(Date.now() - 24 * 60 * 60 * 1000);
  
  // Don't suppress if there was a recent successful watch
  if (recentSuccess) return false;
  
  // Suppress if weighted score >= 2.0 AND at least 2 distinct users
  return weightedScore >= SUPPRESSION_THRESHOLD && distinctUsers >= MIN_DISTINCT_USERS;
}

// Suppress movie+provider for everyone
async function suppressMovieProvider(
  tmdbId: number, 
  provider: string, 
  region: string
): Promise<void> {
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
  
  // Update snapshot
  await supabase
    .from('decision_snapshots')
    .update({
      is_valid: false,
      confidence_score: 0,
      invalid_reason: 'community_reported_unavailable',
      suppressed_at: new Date().toISOString(),
      suppressed_reason: 'community_reported_unavailable',
      suppression_expires_at: expiresAt,
      updated_at: new Date().toISOString()
    })
    .eq('tmdb_id', tmdbId)
    .eq('region', region);
  
  // Mark feedback as processed
  await supabase
    .from('provider_feedback')
    .update({ processed: true })
    .eq('tmdb_id', tmdbId)
    .eq('reported_provider', provider)
    .eq('region', region)
    .eq('processed', false);
  
  console.log(`[SUPPRESSED] tmdb_id=${tmdbId}, provider=${provider}, region=${region}`);
}
