/**
 * GoodWatch Auth Helper
 * Handles Google/Apple OAuth, analytics tracking, and user sync
 */

import { supabase } from './supabase';

// ============================================
// TYPES
// ============================================

export interface TasteProfile {
  languages: string[];
  era: string | null;
  likedMovies: number[];
  createdAt: number;
}

export interface GoodWatchUser {
  id: string;
  email: string;
  displayName?: string;
  avatarUrl?: string;
  authProvider: 'google' | 'apple' | 'email';
  tasteProfile?: TasteProfile;
  savedMovies: number[];
  skippedMovies: number[];
}

export type AuthEventType = 
  | 'signup_modal_shown'
  | 'signup_skipped'
  | 'signup_started'
  | 'signup_completed';

export type TriggerReason = 
  | 'saved_movies'
  | 'refine_taste'
  | 'explicit_click'
  | 'timeout'
  | 'taste_modal_complete';

// ============================================
// ANONYMOUS ID (for tracking before signup)
// ============================================

export function getAnonymousId(): string {
  let anonId = localStorage.getItem('goodwatch_anon_id');
  if (!anonId) {
    anonId = 'anon_' + Math.random().toString(36).substring(2, 15);
    localStorage.setItem('goodwatch_anon_id', anonId);
  }
  return anonId;
}

// ============================================
// ANALYTICS TRACKING
// ============================================

export async function trackAuthEvent(
  eventType: AuthEventType,
  options: {
    authProvider?: 'google' | 'apple' | 'email';
    triggerReason?: TriggerReason;
    metadata?: Record<string, any>;
  } = {}
): Promise<void> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    await supabase.from('auth_analytics').insert({
      event_type: eventType,
      auth_provider: options.authProvider || null,
      trigger_reason: options.triggerReason || null,
      page_url: typeof window !== 'undefined' ? window.location.pathname : null,
      anonymous_id: getAnonymousId(),
      user_id: user?.id || null,
      user_agent: typeof navigator !== 'undefined' ? navigator.userAgent : null,
      metadata: options.metadata || {},
    });
  } catch (error) {
    console.error('Failed to track auth event:', error);
  }
}

// ============================================
// OAUTH SIGN IN
// ============================================

export async function signInWithGoogle(): Promise<{ error: Error | null }> {
  try {
    await trackAuthEvent('signup_started', { authProvider: 'google' });
    
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
        queryParams: {
          access_type: 'offline',
          prompt: 'consent',
        },
      },
    });
    
    if (error) throw error;
    return { error: null };
  } catch (error) {
    console.error('Google sign in error:', error);
    return { error: error as Error };
  }
}

export async function signInWithApple(): Promise<{ error: Error | null }> {
  try {
    await trackAuthEvent('signup_started', { authProvider: 'apple' });
    
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'apple',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });
    
    if (error) throw error;
    return { error: null };
  } catch (error) {
    console.error('Apple sign in error:', error);
    return { error: error as Error };
  }
}

export async function signInWithEmail(email: string): Promise<{ error: Error | null }> {
  try {
    await trackAuthEvent('signup_started', { authProvider: 'email' });
    
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });
    
    if (error) throw error;
    return { error: null };
  } catch (error) {
    console.error('Email sign in error:', error);
    return { error: error as Error };
  }
}

// ============================================
// SIGN OUT
// ============================================

export async function signOut(): Promise<void> {
  await supabase.auth.signOut();
}

// ============================================
// GET CURRENT USER
// ============================================

export async function getCurrentUser(): Promise<GoodWatchUser | null> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;
    
    const { data: profile } = await supabase
      .from('users')
      .select('*')
      .eq('id', user.id)
      .single();
    
    if (!profile) return null;
    
    return {
      id: profile.id,
      email: profile.email,
      displayName: profile.display_name,
      avatarUrl: profile.avatar_url,
      authProvider: profile.auth_provider,
      tasteProfile: profile.taste_profile,
      savedMovies: profile.saved_movies || [],
      skippedMovies: profile.skipped_movies || [],
    };
  } catch (error) {
    console.error('Failed to get current user:', error);
    return null;
  }
}

// ============================================
// SYNC LOCAL DATA TO USER PROFILE
// ============================================

export async function syncLocalDataToProfile(): Promise<void> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    
    // Get local data
    const localData = localStorage.getItem('goodwatch_taste');
    if (!localData) return;
    
    const parsed = JSON.parse(localData);
    
    // Merge with existing profile
    const { data: existingProfile } = await supabase
      .from('users')
      .select('saved_movies, skipped_movies, taste_profile')
      .eq('id', user.id)
      .single();
    
    const mergedSaved = Array.from(new Set([
      ...(existingProfile?.saved_movies || []),
      ...(parsed.savedMovies || []),
    ]));
    
    const mergedSkipped = Array.from(new Set([
      ...(existingProfile?.skipped_movies || []),
      ...(parsed.skippedMovies || []),
    ]));
    
    // Use local taste profile if no existing one
    const tasteProfile = existingProfile?.taste_profile?.likedMovies?.length > 0
      ? existingProfile.taste_profile
      : parsed.tasteProfile;
    
    // Update profile
    await supabase
      .from('users')
      .update({
        taste_profile: tasteProfile,
        saved_movies: mergedSaved,
        skipped_movies: mergedSkipped,
        updated_at: new Date().toISOString(),
      })
      .eq('id', user.id);
    
    // Track completion
    await trackAuthEvent('signup_completed');
    
  } catch (error) {
    console.error('Failed to sync local data:', error);
  }
}

// ============================================
// CHECK AUTH STATE
// ============================================

export async function isAuthenticated(): Promise<boolean> {
  const { data: { user } } = await supabase.auth.getUser();
  return !!user;
}

// ============================================
// AUTH STATE LISTENER
// ============================================

export function onAuthStateChange(
  callback: (user: GoodWatchUser | null) => void
): () => void {
  const { data: { subscription } } = supabase.auth.onAuthStateChange(
    async (event, session) => {
      if (session?.user) {
        // Sync local data on sign in
        if (event === 'SIGNED_IN') {
          await syncLocalDataToProfile();
        }
        const user = await getCurrentUser();
        callback(user);
      } else {
        callback(null);
      }
    }
  );
  
  return () => subscription.unsubscribe();
}
