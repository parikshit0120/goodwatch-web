// =====================================================
// GOODWATCH RECOMMENDATION ENGINE
// recommendation-engine.ts
// =====================================================

import { createClient, SupabaseClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://jdjqrlkynwfhbtyuddjk.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpkanFybGt5bndmaGJ0eXVkZGprIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ0NzUwMTEsImV4cCI6MjA4MDA1MTAxMX0.KDRMLCewVMp3lwphkUvtoWOkg6kyAk8iSbVkRKiHYSk';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// =====================================================
// TYPES
// =====================================================

export interface MovieAxes {
  movie_id: string;
  pacing: number;
  intensity: number;
  humor: number;
  darkness: number;
  warmth: number;
  complexity: number;
  realism: number;
  cerebral: number;
  romance: number;
  suspense: number;
  violence: number;
  accessibility: number;
  confidence: number;
}

export interface UserPreferences {
  user_id: string;
  pref_pacing: number;
  pref_intensity: number;
  pref_humor: number;
  pref_darkness: number;
  pref_warmth: number;
  pref_complexity: number;
  pref_realism: number;
  pref_cerebral: number;
  pref_romance: number;
  pref_suspense: number;
  pref_violence: number;
  pref_accessibility: number;
  total_swipes: number;
  total_comparisons: number;
}

export interface SwipeData {
  user_id: string;
  movie_id: string;
  direction: 'right' | 'left' | 'up';
  mood_slug?: string;
  session_id?: string;
  position_in_session?: number;
  time_to_decision_ms?: number;
}

export interface ComparisonData {
  user_id: string;
  movie_a_id: string;
  movie_b_id: string;
  chosen: 'a' | 'b' | 'neither' | 'both';
  comparison_type?: string;
  mood_slug?: string;
  time_to_decision_ms?: number;
}

export interface MovieWithScores {
  id: string;
  title: string;
  poster_path: string;
  vote_average: number;
  overview?: string;
  release_date?: string;
  genres?: { id: number; name: string }[];
  mood_score?: number;
  preference_score?: number;
  combined_score?: number;
  axes?: MovieAxes;
  similarity_reasons?: string[];
}

export interface ComparisonPair {
  movie_a: MovieWithScores;
  movie_b: MovieWithScores;
  comparison_context: string;
}

// =====================================================
// AXIS LABELS FOR UI
// =====================================================

export const AXIS_LABELS: Record<string, { low: string; high: string; description: string }> = {
  pacing: { low: 'Slow Burn', high: 'Fast-Paced', description: 'How quickly the story moves' },
  intensity: { low: 'Subtle', high: 'Intense', description: 'Emotional and dramatic intensity' },
  humor: { low: 'Serious', high: 'Comedic', description: 'Amount of humor and levity' },
  darkness: { low: 'Light', high: 'Dark', description: 'Tone and subject matter darkness' },
  warmth: { low: 'Cynical', high: 'Heartwarming', description: 'Emotional warmth and hope' },
  complexity: { low: 'Straightforward', high: 'Complex', description: 'Plot and thematic complexity' },
  realism: { low: 'Fantastical', high: 'Grounded', description: 'How realistic vs fantastical' },
  cerebral: { low: 'Emotional', high: 'Intellectual', description: 'Head vs heart appeal' },
  romance: { low: 'No Romance', high: 'Romance Central', description: 'Romantic subplot importance' },
  suspense: { low: 'Calm', high: 'Edge-of-Seat', description: 'Tension and suspense level' },
  violence: { low: 'None', high: 'Graphic', description: 'Violence level' },
  accessibility: { low: 'Arthouse', high: 'Mainstream', description: 'How accessible to general audiences' },
};

// =====================================================
// RECOMMENDATION ENGINE CLASS
// =====================================================

export class RecommendationEngine {
  private supabase: SupabaseClient;
  private userId: string | null = null;

  constructor(customClient?: SupabaseClient) {
    this.supabase = customClient || supabase;
  }

  // Set current user
  setUser(userId: string) {
    this.userId = userId;
  }

  // Generate anonymous user ID
  generateAnonymousId(): string {
    return 'anon_' + Math.random().toString(36).substring(2, 15);
  }

  // =====================================================
  // SWIPE HANDLING
  // =====================================================

  async recordSwipe(data: SwipeData): Promise<void> {
    // Record the swipe
    const { error: swipeError } = await this.supabase
      .from('swipes')
      .insert({
        user_id: data.user_id,
        movie_id: data.movie_id,
        direction: data.direction,
        mood_slug: data.mood_slug,
        session_id: data.session_id,
        position_in_session: data.position_in_session,
        time_to_decision_ms: data.time_to_decision_ms,
      });

    if (swipeError) {
      console.error('Error recording swipe:', swipeError);
      return;
    }

    // Update user preferences based on swipe
    await this.updatePreferencesFromSwipe(data);

    // If right swipe or superlike, add to watchlist
    if (data.direction === 'right' || data.direction === 'up') {
      await this.addToWatchlist(data.user_id, data.movie_id, 'swipe', data.mood_slug);
    }
  }

  private async updatePreferencesFromSwipe(data: SwipeData): Promise<void> {
    // Get movie axes
    const { data: axes } = await this.supabase
      .from('movie_axes')
      .select('*')
      .eq('movie_id', data.movie_id)
      .single();

    if (!axes) return;

    // Ensure user preferences exist
    await this.supabase
      .from('user_preferences')
      .upsert({ user_id: data.user_id }, { onConflict: 'user_id' });

    // Get current preferences
    const { data: prefs } = await this.supabase
      .from('user_preferences')
      .select('*')
      .eq('user_id', data.user_id)
      .single();

    if (!prefs) return;

    // Calculate learning rate based on swipe type
    const learningRate = data.direction === 'up' ? 0.2 : data.direction === 'right' ? 0.1 : -0.05;

    // Update preferences
    const updates: Partial<UserPreferences> = {
      pref_pacing: this.lerp(prefs.pref_pacing, axes.pacing, learningRate),
      pref_intensity: this.lerp(prefs.pref_intensity, axes.intensity, learningRate),
      pref_humor: this.lerp(prefs.pref_humor, axes.humor, learningRate),
      pref_darkness: this.lerp(prefs.pref_darkness, axes.darkness, learningRate),
      pref_warmth: this.lerp(prefs.pref_warmth, axes.warmth, learningRate),
      pref_complexity: this.lerp(prefs.pref_complexity, axes.complexity, learningRate),
      pref_realism: this.lerp(prefs.pref_realism, axes.realism, learningRate),
      pref_cerebral: this.lerp(prefs.pref_cerebral, axes.cerebral, learningRate),
      pref_romance: this.lerp(prefs.pref_romance, axes.romance, learningRate),
      pref_suspense: this.lerp(prefs.pref_suspense, axes.suspense, learningRate),
      pref_violence: this.lerp(prefs.pref_violence, axes.violence, learningRate),
      pref_accessibility: this.lerp(prefs.pref_accessibility, axes.accessibility, learningRate),
      total_swipes: (prefs.total_swipes || 0) + 1,
    };

    await this.supabase
      .from('user_preferences')
      .update(updates)
      .eq('user_id', data.user_id);
  }

  private lerp(current: number, target: number, rate: number): number {
    const newVal = current + (target - current) * rate;
    return Math.max(1, Math.min(10, newVal)); // Clamp to 1-10
  }

  // =====================================================
  // A VS B COMPARISONS
  // =====================================================

  async getComparisonPair(userId: string, moodSlug?: string): Promise<ComparisonPair | null> {
    // Get movies the user hasn't compared yet
    const { data: movies } = await this.supabase
      .from('movies')
      .select('id, title, poster_path, vote_average, overview, release_date, genres')
      .gte('vote_average', 6.5)
      .not('poster_path', 'is', null)
      .limit(100);

    if (!movies || movies.length < 2) return null;

    // Get user's comparison history to avoid repeats
    const { data: pastComparisons } = await this.supabase
      .from('comparisons')
      .select('movie_a_id, movie_b_id')
      .eq('user_id', userId);

    const comparedPairs = new Set<string>();
    pastComparisons?.forEach(c => {
      comparedPairs.add(`${Math.min(c.movie_a_id, c.movie_b_id)}-${Math.max(c.movie_a_id, c.movie_b_id)}`);
    });

    // Find a good pair to compare
    // Strategy: Pick movies with different characteristics for maximum learning
    let bestPair: [MovieWithScores, MovieWithScores] | null = null;
    let maxDifference = 0;

    for (let i = 0; i < Math.min(50, movies.length); i++) {
      for (let j = i + 1; j < Math.min(50, movies.length); j++) {
        const pairKey = `${Math.min(movies[i].id, movies[j].id)}-${Math.max(movies[i].id, movies[j].id)}`;
        if (comparedPairs.has(pairKey)) continue;

        // Get axes for both movies
        const [axesA, axesB] = await Promise.all([
          this.getMovieAxes(movies[i].id),
          this.getMovieAxes(movies[j].id),
        ]);

        if (axesA && axesB) {
          const difference = this.calculateAxesDifference(axesA, axesB);
          if (difference > maxDifference) {
            maxDifference = difference;
            bestPair = [
              { ...movies[i], axes: axesA },
              { ...movies[j], axes: axesB },
            ];
          }
        }
      }
    }

    if (!bestPair) {
      // Fallback: random pair
      const shuffled = movies.sort(() => Math.random() - 0.5);
      bestPair = [shuffled[0] as MovieWithScores, shuffled[1] as MovieWithScores];
    }

    return {
      movie_a: bestPair[0],
      movie_b: bestPair[1],
      comparison_context: moodSlug 
        ? `Which would you rather watch when feeling ${moodSlug}?`
        : 'Which movie would you rather watch tonight?',
    };
  }

  async recordComparison(data: ComparisonData): Promise<void> {
    // Record comparison
    await this.supabase.from('comparisons').insert(data);

    // Update preferences based on choice
    if (data.chosen === 'a' || data.chosen === 'b') {
      const winnerId = data.chosen === 'a' ? data.movie_a_id : data.movie_b_id;
      const loserId = data.chosen === 'a' ? data.movie_b_id : data.movie_a_id;

      // Treat winner like a right swipe, loser like a soft left
      await this.updatePreferencesFromSwipe({
        user_id: data.user_id,
        movie_id: winnerId,
        direction: 'right',
        mood_slug: data.mood_slug,
      });

      await this.updatePreferencesFromSwipe({
        user_id: data.user_id,
        movie_id: loserId,
        direction: 'left',
        mood_slug: data.mood_slug,
      });
    }

    // Update comparison count
    await this.supabase
      .from('user_preferences')
      .update({ 
        total_comparisons: this.supabase.rpc('increment_comparisons', { uid: data.user_id })
      })
      .eq('user_id', data.user_id);
  }

  private calculateAxesDifference(a: MovieAxes, b: MovieAxes): number {
    const axes = ['pacing', 'intensity', 'humor', 'darkness', 'warmth', 'complexity', 'suspense', 'romance'];
    let totalDiff = 0;
    
    axes.forEach(axis => {
      totalDiff += Math.abs((a as any)[axis] - (b as any)[axis]);
    });
    
    return totalDiff;
  }

  // =====================================================
  // RECOMMENDATIONS
  // =====================================================

  async getRecommendations(
    userId: string,
    options: {
      moodSlug?: string;
      limit?: number;
      excludeWatchlist?: boolean;
      excludeSwiped?: boolean;
    } = {}
  ): Promise<MovieWithScores[]> {
    const { moodSlug, limit = 20, excludeWatchlist = true, excludeSwiped = true } = options;

    // Get user preferences
    const { data: prefs } = await this.supabase
      .from('user_preferences')
      .select('*')
      .eq('user_id', userId)
      .single();

    // Get mood profile if specified
    let moodProfile = null;
    if (moodSlug) {
      const { data } = await this.supabase
        .from('mood_axis_profiles')
        .select('*')
        .eq('mood_slug', moodSlug)
        .single();
      moodProfile = data;
    }

    // Get movies with axes
    let query = this.supabase
      .from('movies')
      .select(`
        id, title, poster_path, vote_average, overview, release_date, genres,
        movie_axes (*)
      `)
      .gte('vote_average', 6.0)
      .not('poster_path', 'is', null)
      .order('vote_average', { ascending: false })
      .limit(200);

    const { data: movies } = await query;
    if (!movies) return [];

    // Get exclusion lists
    let swipedIds = new Set<number>();
    let watchlistIds = new Set<number>();

    if (excludeSwiped) {
      const { data: swipes } = await this.supabase
        .from('swipes')
        .select('movie_id')
        .eq('user_id', userId);
      swipedIds = new Set(swipes?.map(s => s.movie_id) || []);
    }

    if (excludeWatchlist) {
      const { data: watchlist } = await this.supabase
        .from('user_watchlist')
        .select('movie_id')
        .eq('user_id', userId);
      watchlistIds = new Set(watchlist?.map(w => w.movie_id) || []);
    }

    // Score and rank movies
    const scoredMovies: MovieWithScores[] = movies
      .filter(m => !swipedIds.has(m.id) && !watchlistIds.has(m.id))
      .map(movie => {
        const axes = movie.movie_axes?.[0] || null;
        
        let moodScore = 0.5;
        let preferenceScore = 0.5;
        
        if (axes) {
          // Calculate mood match
          if (moodProfile) {
            moodScore = this.calculateMoodMatch(axes, moodProfile);
          }
          
          // Calculate preference match
          if (prefs && prefs.total_swipes > 5) {
            preferenceScore = this.calculatePreferenceMatch(axes, prefs);
          }
        }

        // Quality score from vote average
        const qualityScore = (movie.vote_average || 5) / 10;

        // Combined score
        const combinedScore = (
          moodScore * (moodSlug ? 0.4 : 0.2) +
          preferenceScore * (prefs?.total_swipes > 5 ? 0.4 : 0.2) +
          qualityScore * 0.3 +
          Math.random() * 0.1 // Small random factor for variety
        );

        return {
          id: movie.id,
          title: movie.title,
          poster_path: movie.poster_path,
          vote_average: movie.vote_average,
          overview: movie.overview,
          release_date: movie.release_date,
          genres: movie.genres,
          mood_score: moodScore,
          preference_score: preferenceScore,
          combined_score: combinedScore,
          axes: axes,
        };
      });

    // Sort by combined score and return top results
    return scoredMovies
      .sort((a, b) => (b.combined_score || 0) - (a.combined_score || 0))
      .slice(0, limit);
  }

  private calculateMoodMatch(axes: MovieAxes, moodProfile: any): number {
    let score = 0;
    let weightSum = 0;

    const checkAxis = (axisName: string) => {
      const target = moodProfile[`${axisName}_target`];
      const weight = moodProfile[`${axisName}_weight`] || 1;
      
      if (target !== null && target !== undefined) {
        const movieValue = (axes as any)[axisName];
        const diff = Math.abs(movieValue - target);
        score += (1 - diff / 9) * weight;
        weightSum += weight;
      }
    };

    ['pacing', 'intensity', 'humor', 'darkness', 'warmth', 'complexity', 'suspense', 'romance'].forEach(checkAxis);

    return weightSum > 0 ? score / weightSum : 0.5;
  }

  private calculatePreferenceMatch(axes: MovieAxes, prefs: UserPreferences): number {
    const axisNames = ['pacing', 'intensity', 'humor', 'darkness', 'warmth', 'complexity', 'romance', 'suspense'];
    let score = 0;
    
    axisNames.forEach(axis => {
      const movieValue = (axes as any)[axis];
      const prefValue = (prefs as any)[`pref_${axis}`];
      const diff = Math.abs(movieValue - prefValue);
      score += (1 - diff / 9);
    });

    return score / axisNames.length;
  }

  // =====================================================
  // SIMILAR MOVIES
  // =====================================================

  async getSimilarMovies(movieId: string, limit: number = 10): Promise<MovieWithScores[]> {
    // First check cache
    const { data: cached } = await this.supabase
      .from('movie_similarities')
      .select(`
        similar_movie_id,
        combined_score,
        similarity_reasons,
        movies!movie_similarities_similar_movie_id_fkey (
          id, title, poster_path, vote_average, overview, release_date, genres
        )
      `)
      .eq('movie_id', movieId)
      .order('combined_score', { ascending: false })
      .limit(limit);

    if (cached && cached.length > 0) {
      return cached.map(c => ({
        ...c.movies,
        combined_score: c.combined_score,
        similarity_reasons: c.similarity_reasons,
      })) as MovieWithScores[];
    }

    // Calculate on the fly using embeddings and axes
    const sourceAxes = await this.getMovieAxes(movieId);
    
    // Get source movie's embedding
    const { data: sourceMovie } = await this.supabase
      .from('movies')
      .select('id, embedding, genres')
      .eq('id', movieId)
      .single();

    if (!sourceMovie) return [];

    // Find similar movies using embedding similarity
    const { data: similarByEmbedding } = await this.supabase
      .rpc('match_movies', {
        query_embedding: sourceMovie.embedding,
        match_threshold: 0.7,
        match_count: 50,
      });

    if (!similarByEmbedding) return [];

    // Score and rank
    const results: MovieWithScores[] = [];
    
    for (const movie of similarByEmbedding) {
      if (movie.id === movieId) continue;

      const axes = await this.getMovieAxes(movie.id);
      let axisSimilarity = 0.5;
      const reasons: string[] = [];

      if (sourceAxes && axes) {
        axisSimilarity = 1 - (this.calculateAxesDifference(sourceAxes, axes) / (9 * 8));
        
        // Generate reasons
        if (Math.abs(sourceAxes.pacing - axes.pacing) <= 2) reasons.push('Similar pacing');
        if (Math.abs(sourceAxes.intensity - axes.intensity) <= 2) reasons.push('Similar intensity');
        if (Math.abs(sourceAxes.humor - axes.humor) <= 2) reasons.push('Similar tone');
        if (Math.abs(sourceAxes.darkness - axes.darkness) <= 2) reasons.push('Similar mood');
      }

      // Genre overlap
      const sourceGenres = new Set((sourceMovie.genres || []).map((g: any) => g.id));
      const movieGenres = new Set((movie.genres || []).map((g: any) => g.id));
      const genreOverlap = [...sourceGenres].filter(g => movieGenres.has(g)).length;
      const genreSimilarity = genreOverlap / Math.max(sourceGenres.size, movieGenres.size, 1);
      
      if (genreOverlap > 0) reasons.push('Shared genres');

      const combinedScore = (
        (movie.similarity || 0.5) * 0.4 +
        axisSimilarity * 0.4 +
        genreSimilarity * 0.2
      );

      results.push({
        id: movie.id,
        title: movie.title,
        poster_path: movie.poster_path,
        vote_average: movie.vote_average,
        overview: movie.overview,
        combined_score: combinedScore,
        similarity_reasons: reasons,
      });
    }

    return results
      .sort((a, b) => (b.combined_score || 0) - (a.combined_score || 0))
      .slice(0, limit);
  }

  // =====================================================
  // HELPERS
  // =====================================================

  async getMovieAxes(movieId: string): Promise<MovieAxes | null> {
    const { data } = await this.supabase
      .from('movie_axes')
      .select('*')
      .eq('movie_id', movieId)
      .single();
    return data;
  }

  async addToWatchlist(userId: string, movieId: string, source: string, mood?: string): Promise<void> {
    await this.supabase
      .from('user_watchlist')
      .upsert({
        user_id: userId,
        movie_id: movieId,
        added_from: source,
        mood_when_added: mood,
      }, { onConflict: 'user_id,movie_id' });
  }

  async getUserPreferences(userId: string): Promise<UserPreferences | null> {
    const { data } = await this.supabase
      .from('user_preferences')
      .select('*')
      .eq('user_id', userId)
      .single();
    return data;
  }

  async getUserStats(userId: string): Promise<{
    totalSwipes: number;
    totalComparisons: number;
    watchlistCount: number;
    preferenceConfidence: number;
  }> {
    const [prefs, watchlist] = await Promise.all([
      this.getUserPreferences(userId),
      this.supabase.from('user_watchlist').select('id', { count: 'exact' }).eq('user_id', userId),
    ]);

    return {
      totalSwipes: prefs?.total_swipes || 0,
      totalComparisons: prefs?.total_comparisons || 0,
      watchlistCount: watchlist.count || 0,
      preferenceConfidence: prefs ? Math.min((prefs.total_swipes + prefs.total_comparisons * 2) / 50, 1) : 0,
    };
  }
}

// Export singleton instance
export const recommendationEngine = new RecommendationEngine();
export default recommendationEngine;
