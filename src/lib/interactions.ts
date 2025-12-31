import { supabase } from './supabase';

/**
 * Interaction types - iOS Parity
 * From: UserModels.swift InteractionAction
 *
 * iOS uses: shown, watch_now, not_tonight, already_seen
 * Web maps: watched → watch_now, seen → already_seen, rejected → not_tonight
 */
export type InteractionAction = 'shown' | 'watch_now' | 'not_tonight' | 'already_seen';

/**
 * iOS Parity: Interaction schema
 * From: UserModels.swift GWInteraction
 *
 * Table: interactions
 * - id: UUID (auto)
 * - user_id: UUID
 * - movie_id: UUID
 * - action: string
 * - rejection_reason: string (nullable)
 * - context: jsonb { session_id, mood_at_time, time_of_day }
 * - created_at: timestamp
 */
interface InteractionContext {
  session_id?: string;
  mood_at_time?: string;
  time_of_day?: string;
}

/**
 * Record a user interaction with a movie.
 * iOS Parity: Matches GWInteraction schema exactly.
 *
 * Silent failure is acceptable per guardrails.
 */
export async function recordInteraction(
  movieId: string,
  action: InteractionAction,
  sessionId: string,
  rejectionReason?: string
): Promise<boolean> {
  const context: InteractionContext = {
    session_id: sessionId,
    time_of_day: getCurrentTimeOfDay(),
  };

  const { error } = await supabase.from('interactions').insert({
    // iOS uses user_id (UUID), web uses anonymous session
    // For anonymous web users, we use a placeholder UUID
    user_id: '00000000-0000-0000-0000-000000000000',
    movie_id: movieId,
    action: action,
    rejection_reason: rejectionReason ?? null,
    context: context,
    created_at: new Date().toISOString(),
  });

  if (error) {
    // Silent failure - per guardrails, don't block UX
    console.error('Failed to record interaction:', error.message);
    return false;
  }

  return true;
}

/**
 * Get movie IDs that user has already interacted with in this session.
 * Used to exclude from recommendations.
 *
 * iOS filters by user_id, web filters by session_id in context.
 */
export async function getSessionInteractions(sessionId: string): Promise<string[]> {
  const { data, error } = await supabase
    .from('interactions')
    .select('movie_id')
    .contains('context', { session_id: sessionId });

  if (error || !data) {
    return [];
  }

  return data.map((row) => row.movie_id);
}

/**
 * Get recently rejected movie IDs (last 7 days).
 * iOS Parity: From InteractionService.getRecentlyRejectedMovieIds()
 */
export async function getRecentlyRejectedMovieIds(sessionId: string): Promise<string[]> {
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  const { data, error } = await supabase
    .from('interactions')
    .select('movie_id')
    .contains('context', { session_id: sessionId })
    .in('action', ['not_tonight', 'already_seen'])
    .gte('created_at', sevenDaysAgo.toISOString());

  if (error || !data) {
    return [];
  }

  return data.map((row) => row.movie_id);
}

/**
 * Generate a session ID for anonymous tracking.
 * Persists in localStorage for session continuity.
 */
export function getOrCreateSessionId(): string {
  if (typeof window === 'undefined') {
    // Server-side: generate new ID
    return `web_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  }

  const key = 'gw_session_id';
  let sessionId = localStorage.getItem(key);
  if (!sessionId) {
    sessionId = `web_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    localStorage.setItem(key, sessionId);
  }
  return sessionId;
}

/**
 * Helper: Get current time of day string
 * iOS Parity: From InteractionService.currentTimeOfDay()
 */
function getCurrentTimeOfDay(): string {
  const hour = new Date().getHours();
  if (hour >= 6 && hour < 12) return 'morning';
  if (hour >= 12 && hour < 17) return 'afternoon';
  if (hour >= 17 && hour < 21) return 'evening';
  return 'night';
}

/**
 * Map web action names to iOS action names
 */
export function mapWebActionToiOS(webAction: string): InteractionAction {
  switch (webAction) {
    case 'watched':
      return 'watch_now';
    case 'seen':
      return 'already_seen';
    case 'rejected':
      return 'not_tonight';
    default:
      return 'shown';
  }
}
