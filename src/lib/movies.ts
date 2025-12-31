import { supabase } from './supabase';

/**
 * Movie type matching Supabase schema
 * Mirrors iOS GWMovie structure
 */
export interface Movie {
  id: string;
  tmdb_id: number;
  title: string;
  overview: string | null;
  poster_path: string | null;
  backdrop_path: string | null;
  release_date: string | null;
  vote_average: number;
  year: number | null;
  runtime: number | null;
  original_language: string | null;
  genres: { id: number; name: string }[] | null;
  ott_providers: OttProvider[] | null;
  content_type: 'movie' | 'tv';
  emotional_profile: EmotionalProfile | null;
  feels_like: string | null;
  emotional_synopsis: string | null;
  tags: string[] | null;
  imdb_rating: number | null;
}

export interface OttProvider {
  id: number;
  name: string;
  type: string;
  logo_path: string;
}

export interface EmotionalProfile {
  energy: number | null;
  humour: number | null;
  comfort: number | null;
  darkness: number | null;
  complexity: number | null;
  rewatchability: number | null;
  mentalStimulation: number | null;
  emotionalIntensity: number | null;
}

// ============================================
// iOS PARITY: GoodScore Threshold Logic
// From: GWSpec.swift - Section 4
// ============================================

type TimeOfDay = 'morning' | 'afternoon' | 'evening' | 'lateNight';

function getCurrentTimeOfDay(): TimeOfDay {
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 12) return 'morning';
  if (hour >= 12 && hour < 17) return 'afternoon';
  if (hour >= 17 && hour < 22) return 'evening';
  return 'lateNight';
}

/**
 * iOS Parity: GoodScore threshold based on mood and time of day
 * From: GWSpec.swift goodscoreThreshold()
 */
function getGoodscoreThreshold(mood: string, timeOfDay: TimeOfDay): number {
  if (timeOfDay === 'lateNight') return 85;
  if (mood === 'tired') return 88;
  if (mood === 'adventurous') return 75;
  return 80;
}

// ============================================
// iOS PARITY: Tag Derivation
// From: GWSpec.swift GWMovie.deriveTags()
// ============================================

function deriveTags(movie: Movie): string[] {
  const tags: string[] = [];
  const ep = movie.emotional_profile;

  if (!ep) {
    return ['medium', 'safe_bet', 'full_attention'];
  }

  // Cognitive Load
  const complexity = ep.complexity ?? 5;
  if (complexity <= 3) tags.push('light');
  else if (complexity <= 6) tags.push('medium');
  else tags.push('heavy');

  // Emotional Outcome
  const darkness = ep.darkness ?? 5;
  const comfort = ep.comfort ?? 5;
  if (darkness >= 7) tags.push('dark');
  else if (comfort >= 7) tags.push('feel_good');
  else if (comfort >= 5 && darkness <= 4) tags.push('uplifting');
  else tags.push('bittersweet');

  // Energy
  const energy = ep.energy ?? 5;
  if (energy <= 3) tags.push('calm');
  else if (energy >= 7) tags.push('high_energy');
  else tags.push('tense');

  // Attention
  const mentalStim = ep.mentalStimulation ?? 5;
  if (mentalStim <= 3) tags.push('background_friendly');
  else if ((ep.rewatchability ?? 5) >= 7) tags.push('rewatchable');
  else tags.push('full_attention');

  // Regret Risk
  const intensity = ep.emotionalIntensity ?? 5;
  const rating = movie.imdb_rating ?? movie.vote_average ?? 7.0;
  if (rating >= 7.5 && intensity <= 6) tags.push('safe_bet');
  else if (intensity >= 8 || darkness >= 8) tags.push('acquired_taste');
  else tags.push('polarizing');

  return tags;
}

// ============================================
// iOS PARITY: Scoring Formula
// From: GWSpec.swift computeScore()
// ============================================

function computeScore(movie: Movie, intentTags: string[]): number {
  const movieTags = new Set(movie.tags ?? deriveTags(movie));
  const intentTagSet = new Set(intentTags);

  // Tag alignment
  let intersectionCount = 0;
  for (const tag of intentTagSet) {
    if (movieTags.has(tag)) intersectionCount++;
  }
  const tagAlignment = intentTagSet.size > 0 ? intersectionCount / intentTagSet.size : 0.5;

  // Regret safety
  let regretSafety = 0.6;
  if (movieTags.has('safe_bet')) regretSafety = 1.0;
  else if (movieTags.has('polarizing')) regretSafety = 0.4;

  // iOS formula: (tagAlignment * 0.6) + (regretSafety * 0.4)
  return (tagAlignment * 0.6) + (regretSafety * 0.4);
}

// ============================================
// iOS PARITY: Movie Validation
// From: GWRecommendationEngine.swift isValidMovie()
// ============================================

interface ValidationProfile {
  preferredLanguages: string[];
  platforms: string[];
  runtimeWindow: { min: number; max: number };
  mood: string;
  intentTags: string[];
  excludedIds: Set<string>;
}

function isValidMovie(movie: Movie, profile: ValidationProfile): boolean {
  // Rule 0: Must be available (ott_providers NOT NULL)
  if (!movie.ott_providers || movie.ott_providers.length === 0) {
    return false;
  }

  // Rule 0b: Must have poster (displayable)
  if (!movie.poster_path) {
    return false;
  }

  // Rule 1: Language match (skip if no preferences)
  if (profile.preferredLanguages.length > 0) {
    const movieLang = (movie.original_language ?? 'en').toLowerCase();
    const langMatch = profile.preferredLanguages.some(lang => {
      const l = lang.toLowerCase();
      return movieLang.includes(l) ||
             (l === 'english' && movieLang === 'en') ||
             (l === 'hindi' && movieLang === 'hi');
    });
    if (!langMatch) return false;
  }

  // Rule 2: Platform intersection (skip if no preferences)
  if (profile.platforms.length > 0) {
    const moviePlatforms = new Set(
      movie.ott_providers.map(p => p.name.toLowerCase().replace(/ /g, '_'))
    );
    const userPlatforms = new Set(
      profile.platforms.map(p => p.toLowerCase().replace(/ /g, '_'))
    );

    let hasMatch = false;
    for (const userPlatform of userPlatforms) {
      for (const moviePlatform of moviePlatforms) {
        if (platformsMatch(userPlatform, moviePlatform)) {
          hasMatch = true;
          break;
        }
      }
      if (hasMatch) break;
    }
    if (!hasMatch) return false;
  }

  // Rule 3: Not already interacted
  if (profile.excludedIds.has(movie.id)) {
    return false;
  }

  // Rule 4: Runtime in window
  const runtime = movie.runtime ?? 120;
  if (runtime < profile.runtimeWindow.min || runtime > profile.runtimeWindow.max) {
    return false;
  }

  // Rule 5: GoodScore threshold
  const goodscore = getGoodscore(movie);
  const threshold = getGoodscoreThreshold(profile.mood, getCurrentTimeOfDay());
  if (goodscore < threshold) {
    return false;
  }

  // Rule 6: Tag intersection (skip if no intent tags)
  if (profile.intentTags.length > 0) {
    const movieTags = new Set(movie.tags ?? deriveTags(movie));
    const hasTagMatch = profile.intentTags.some(tag => movieTags.has(tag));
    if (!hasTagMatch) return false;
  }

  return true;
}

function platformsMatch(user: string, movie: string): boolean {
  const variations: Record<string, string[]> = {
    'netflix': ['netflix'],
    'prime': ['prime', 'amazon'],
    'jio_hotstar': ['hotstar', 'jiohotstar', 'jio_hotstar', 'disney+_hotstar'],
    'apple_tv': ['apple', 'apple_tv', 'apple_tv+'],
    'sony_liv': ['sony', 'sonyliv', 'sony_liv'],
    'zee5': ['zee5', 'zee_5']
  };

  const userVariations = variations[user];
  if (userVariations) {
    return userVariations.some(v => movie.includes(v));
  }
  return movie.includes(user) || user.includes(movie);
}

function getGoodscore(movie: Movie): number {
  const rating = movie.imdb_rating ?? movie.vote_average ?? 7.0;
  // Convert to 0-100 scale if needed
  return rating > 10 ? rating : rating * 10;
}

// ============================================
// MAIN EXPORT: Get ONE available movie
// iOS Parity with web-appropriate defaults
// ============================================

/**
 * Get ONE available movie from Supabase.
 * Implements iOS recommendation engine logic.
 *
 * Web defaults (anonymous user):
 * - Languages: [] (no filter)
 * - Platforms: [] (no filter)
 * - Runtime: 60-180 min
 * - Mood: 'neutral'
 * - Intent tags: ['safe_bet', 'feel_good']
 *
 * @param excludeIds - Movie IDs to exclude (seen/rejected)
 */
export async function getOneAvailableMovie(excludeIds: string[] = []): Promise<Movie | null> {
  // Web defaults for anonymous users
  // iOS requires full profile, web uses sensible defaults
  const profile: ValidationProfile = {
    preferredLanguages: [], // No language filter for web
    platforms: [], // No platform filter for web
    runtimeWindow: { min: 60, max: 180 },
    mood: 'neutral',
    intentTags: ['safe_bet', 'feel_good'],
    excludedIds: new Set(excludeIds),
  };

  // Fetch movies with availability pre-filter
  const { data: movies, error } = await supabase
    .from('movies')
    .select('*')
    .not('ott_providers', 'is', null)
    .not('poster_path', 'is', null)
    .limit(500); // Fetch batch for filtering

  if (error || !movies || movies.length === 0) {
    return null;
  }

  // Apply iOS validation rules
  const validMovies: { movie: Movie; score: number }[] = [];

  for (const movie of movies as Movie[]) {
    if (isValidMovie(movie, profile)) {
      const score = computeScore(movie, profile.intentTags);
      validMovies.push({ movie, score });
    }
  }

  if (validMovies.length === 0) {
    // Fallback: return any available movie if strict rules fail
    const fallbackMovies = (movies as Movie[]).filter(m =>
      m.ott_providers && m.ott_providers.length > 0 && m.poster_path
    );
    if (fallbackMovies.length > 0) {
      const randomIdx = Math.floor(Math.random() * Math.min(fallbackMovies.length, 100));
      return fallbackMovies[randomIdx];
    }
    return null;
  }

  // iOS logic: Sort by score (descending), then by ID for determinism
  validMovies.sort((a, b) => {
    if (a.score !== b.score) return b.score - a.score;
    return a.movie.id.localeCompare(b.movie.id);
  });

  // Return highest scoring movie
  return validMovies[0].movie;
}

// ============================================
// DISPLAY HELPERS
// ============================================

export function getPosterUrl(path: string | null): string {
  if (!path) return '/placeholder-poster.svg';
  return `https://image.tmdb.org/t/p/w500${path}`;
}

export function getBackdropUrl(path: string | null): string {
  if (!path) return '';
  return `https://image.tmdb.org/t/p/w1280${path}`;
}

export function getProviderLogoUrl(path: string): string {
  return `https://image.tmdb.org/t/p/original${path}`;
}

/**
 * Generate "Why this movie" explanation
 * iOS Parity: Uses feels_like, emotional_synopsis, or quirky summary
 */
export function getWhyThisMovie(movie: Movie): string {
  // Priority 1: feels_like field (pre-written hook)
  if (movie.feels_like) {
    return movie.feels_like;
  }

  // Priority 2: emotional_synopsis (truncated)
  if (movie.emotional_synopsis) {
    const firstSentence = movie.emotional_synopsis.split('.')[0];
    return firstSentence.length > 100
      ? firstSentence.substring(0, 100) + '...'
      : firstSentence + '.';
  }

  // Priority 3: Generate quirky summary (iOS Movie.quirkySummary)
  return generateQuirkySummary(movie);
}

function generateQuirkySummary(movie: Movie): string {
  const genres = movie.genres?.map(g => g.name) ?? [];
  const rating = movie.imdb_rating ?? movie.vote_average ?? 7.0;
  const year = movie.year ?? 2020;
  const runtime = movie.runtime ?? 120;

  const parts: string[] = [];

  // Rating-based opener
  if (rating >= 8.5) parts.push('A certified banger.');
  else if (rating >= 7.5) parts.push('Solid pick for tonight.');
  else if (rating >= 6.5) parts.push('Worth your time if you\'re in the mood.');
  else parts.push('A bit of a wildcard, but hey.');

  // Genre-based flavor
  if (genres.includes('Comedy') && genres.includes('Drama')) {
    parts.push('Funny and heartfelt — the sweet spot.');
  } else if (genres.includes('Comedy')) {
    parts.push('Guaranteed laughs.');
  } else if (genres.includes('Thriller') || genres.includes('Mystery')) {
    parts.push('Keep you guessing till the end.');
  } else if (genres.includes('Action')) {
    parts.push('Buckle up, it\'s a ride.');
  } else if (genres.includes('Romance')) {
    parts.push('All the feels, no shame.');
  } else if (genres.includes('Horror')) {
    parts.push('Sleep with the lights on.');
  } else if (genres.includes('Drama')) {
    parts.push('Emotionally rewarding stuff.');
  }

  // Runtime comment
  if (runtime <= 100) parts.push('Quick watch, no commitment.');
  else if (runtime >= 150) parts.push('A proper sit-down experience.');

  // Era flavor
  if (year < 2000) parts.push('Classic vibes.');
  else if (year >= 2020) parts.push('Fresh off the press.');

  return parts.slice(0, 3).join(' ');
}
