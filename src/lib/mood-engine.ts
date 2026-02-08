/**
 * GoodWatch Mood-Movie Engine
 * 
 * Core intellectual property - deterministic, explainable mood matching
 * NO ML, NO randomness, fully client-side capable
 */

// =============================================================================
// PART 1: EMOTIONAL DIMENSIONS (8 dimensions, locked)
// =============================================================================

export interface EmotionalProfile {
  emotionalIntensity: number;  // 0-10: flat/background → emotionally overwhelming
  mentalStimulation: number;   // 0-10: brain-off → mind-bending
  comfort: number;             // 0-10: unsettling → safe/warm
  energy: number;              // 0-10: slow/meditative → fast/adrenaline
  darkness: number;            // 0-10: light → disturbing/heavy
  humour: number;              // 0-10: serious → comedy-driven
  complexity: number;          // 0-10: simple → layered/nonlinear
  rewatchability: number;      // 0-10: one-time → endlessly rewatchable
}

export type DimensionKey = keyof EmotionalProfile;

export const DIMENSION_LABELS: Record<DimensionKey, { low: string; high: string; name: string }> = {
  emotionalIntensity: { low: 'Calm', high: 'Intense', name: 'Emotional Intensity' },
  mentalStimulation: { low: 'Easy', high: 'Demanding', name: 'Mental Stimulation' },
  comfort: { low: 'Unsettling', high: 'Comforting', name: 'Comfort' },
  energy: { low: 'Slow', high: 'Fast-paced', name: 'Energy' },
  darkness: { low: 'Light', high: 'Dark', name: 'Darkness' },
  humour: { low: 'Serious', high: 'Funny', name: 'Humour' },
  complexity: { low: 'Simple', high: 'Complex', name: 'Complexity' },
  rewatchability: { low: 'Once', high: 'Rewatch', name: 'Rewatchability' },
};

// =============================================================================
// PART 2: MOVIE EMOTIONAL PROFILE SCHEMA
// =============================================================================

export interface MovieEmotionalData {
  movieId: number;
  tmdbId: number;
  title: string;
  emotionalProfile: EmotionalProfile;
  archetype: 'light' | 'fun' | 'stimulating' | 'deep';
}

// =============================================================================
// PART 3: MOOD TARGET PROFILES
// =============================================================================

export interface DimensionTarget {
  min: number;
  max: number;
  weight: number;
}

export interface MoodProfile {
  name: string;
  slug: string;
  description: string;
  targets: Record<DimensionKey, DimensionTarget>;
  failConditions?: Array<{ dimension: DimensionKey; operator: '>' | '<'; value: number }>;
}

export const MOOD_PROFILES: Record<string, MoodProfile> = {
  'comforting': {
    name: 'Comforting',
    slug: 'comforting',
    description: 'Warm, familiar films that feel like a cozy blanket',
    targets: {
      comfort: { min: 8, max: 10, weight: 2.0 },
      darkness: { min: 0, max: 2, weight: 1.8 },
      emotionalIntensity: { min: 2, max: 5, weight: 1.5 },
      mentalStimulation: { min: 1, max: 4, weight: 1.2 },
      rewatchability: { min: 7, max: 10, weight: 1.3 },
      energy: { min: 2, max: 5, weight: 1.0 },
      humour: { min: 3, max: 7, weight: 0.8 },
      complexity: { min: 1, max: 4, weight: 0.7 },
    },
    failConditions: [
      { dimension: 'darkness', operator: '>', value: 4 },
      { dimension: 'emotionalIntensity', operator: '>', value: 7 },
    ],
  },

  'feel-good': {
    name: 'Feel-Good',
    slug: 'feel-good',
    description: 'Movies that leave you smiling and uplifted',
    targets: {
      humour: { min: 6, max: 10, weight: 2.0 },
      comfort: { min: 7, max: 10, weight: 1.5 },
      darkness: { min: 0, max: 2, weight: 1.8 },
      energy: { min: 4, max: 7, weight: 1.2 },
      emotionalIntensity: { min: 2, max: 5, weight: 1.0 },
      rewatchability: { min: 6, max: 10, weight: 1.2 },
      mentalStimulation: { min: 1, max: 4, weight: 0.6 },
      complexity: { min: 1, max: 3, weight: 0.5 },
    },
    failConditions: [
      { dimension: 'darkness', operator: '>', value: 3 },
    ],
  },

  'mind-bending': {
    name: 'Mind-Bending',
    slug: 'mind-bending',
    description: 'Films that challenge perception and twist reality',
    targets: {
      mentalStimulation: { min: 8, max: 10, weight: 2.2 },
      complexity: { min: 7, max: 10, weight: 2.0 },
      emotionalIntensity: { min: 5, max: 8, weight: 1.2 },
      comfort: { min: 0, max: 4, weight: -1.0 },
      rewatchability: { min: 6, max: 9, weight: 1.0 },
      darkness: { min: 3, max: 7, weight: 0.8 },
      energy: { min: 4, max: 7, weight: 0.6 },
      humour: { min: 0, max: 3, weight: 0.3 },
    },
  },

  'intense': {
    name: 'Intense',
    slug: 'intense',
    description: 'Gripping films that demand your full attention',
    targets: {
      emotionalIntensity: { min: 8, max: 10, weight: 2.2 },
      energy: { min: 7, max: 10, weight: 1.8 },
      darkness: { min: 5, max: 9, weight: 1.3 },
      mentalStimulation: { min: 5, max: 8, weight: 1.2 },
      comfort: { min: 0, max: 3, weight: -1.2 },
      rewatchability: { min: 4, max: 7, weight: 0.8 },
      humour: { min: 0, max: 2, weight: 0.4 },
      complexity: { min: 4, max: 7, weight: 0.6 },
    },
  },

  'relaxing': {
    name: 'Relaxing',
    slug: 'relaxing',
    description: 'Low-effort films perfect for unwinding',
    targets: {
      mentalStimulation: { min: 0, max: 3, weight: 2.0 },
      complexity: { min: 0, max: 3, weight: 2.0 },
      comfort: { min: 6, max: 9, weight: 1.5 },
      emotionalIntensity: { min: 0, max: 3, weight: 1.5 },
      rewatchability: { min: 7, max: 10, weight: 1.3 },
      energy: { min: 0, max: 4, weight: 1.0 },
      darkness: { min: 0, max: 2, weight: 1.0 },
      humour: { min: 3, max: 6, weight: 0.5 },
    },
    failConditions: [
      { dimension: 'emotionalIntensity', operator: '>', value: 5 },
      { dimension: 'mentalStimulation', operator: '>', value: 5 },
    ],
  },

  'thrilling': {
    name: 'Thrilling',
    slug: 'thrilling',
    description: 'Edge-of-your-seat excitement and suspense',
    targets: {
      energy: { min: 6, max: 9, weight: 2.0 },
      emotionalIntensity: { min: 6, max: 9, weight: 1.8 },
      mentalStimulation: { min: 4, max: 7, weight: 1.2 },
      darkness: { min: 3, max: 6, weight: 1.0 },
      comfort: { min: 2, max: 5, weight: 0.8 },
      complexity: { min: 3, max: 6, weight: 0.7 },
      rewatchability: { min: 5, max: 8, weight: 0.8 },
      humour: { min: 1, max: 4, weight: 0.4 },
    },
  },

  'funny': {
    name: 'Funny',
    slug: 'funny',
    description: 'Guaranteed laughs and good times',
    targets: {
      humour: { min: 8, max: 10, weight: 2.5 },
      energy: { min: 5, max: 8, weight: 1.5 },
      comfort: { min: 5, max: 8, weight: 1.2 },
      darkness: { min: 0, max: 2, weight: 1.5 },
      emotionalIntensity: { min: 2, max: 5, weight: 0.8 },
      mentalStimulation: { min: 2, max: 5, weight: 0.6 },
      complexity: { min: 1, max: 4, weight: 0.5 },
      rewatchability: { min: 6, max: 10, weight: 1.0 },
    },
  },

  'emotional': {
    name: 'Emotional',
    slug: 'emotional',
    description: 'Films that move you deeply',
    targets: {
      emotionalIntensity: { min: 8, max: 10, weight: 2.2 },
      darkness: { min: 4, max: 8, weight: 1.5 },
      complexity: { min: 5, max: 8, weight: 1.2 },
      mentalStimulation: { min: 4, max: 7, weight: 0.8 },
      comfort: { min: 0, max: 3, weight: -1.0 },
      energy: { min: 2, max: 5, weight: 0.6 },
      rewatchability: { min: 4, max: 7, weight: 0.7 },
      humour: { min: 0, max: 2, weight: 0.3 },
    },
  },

  'dark': {
    name: 'Dark',
    slug: 'dark',
    description: 'Films that explore heavy, complex themes',
    targets: {
      darkness: { min: 7, max: 10, weight: 2.2 },
      emotionalIntensity: { min: 6, max: 9, weight: 1.8 },
      complexity: { min: 5, max: 8, weight: 1.3 },
      mentalStimulation: { min: 5, max: 8, weight: 1.0 },
      comfort: { min: 0, max: 2, weight: -1.5 },
      humour: { min: 0, max: 2, weight: 0.5 },
      energy: { min: 3, max: 6, weight: 0.6 },
      rewatchability: { min: 3, max: 6, weight: 0.5 },
    },
  },

  'romantic': {
    name: 'Romantic',
    slug: 'romantic',
    description: 'Love stories and heartfelt connections',
    targets: {
      emotionalIntensity: { min: 5, max: 8, weight: 1.8 },
      comfort: { min: 5, max: 8, weight: 1.5 },
      darkness: { min: 0, max: 3, weight: 1.3 },
      humour: { min: 3, max: 7, weight: 1.0 },
      energy: { min: 3, max: 6, weight: 0.8 },
      complexity: { min: 2, max: 5, weight: 0.6 },
      rewatchability: { min: 6, max: 9, weight: 1.0 },
      mentalStimulation: { min: 2, max: 5, weight: 0.5 },
    },
  },

  'nostalgic': {
    name: 'Nostalgic',
    slug: 'nostalgic',
    description: 'Films that evoke warm memories',
    targets: {
      rewatchability: { min: 8, max: 10, weight: 2.0 },
      comfort: { min: 7, max: 10, weight: 1.8 },
      emotionalIntensity: { min: 3, max: 6, weight: 1.0 },
      mentalStimulation: { min: 2, max: 5, weight: 0.6 },
      energy: { min: 2, max: 5, weight: 0.5 },
      darkness: { min: 0, max: 3, weight: 0.7 },
      humour: { min: 3, max: 6, weight: 0.6 },
      complexity: { min: 2, max: 5, weight: 0.5 },
    },
  },

  'inspirational': {
    name: 'Inspirational',
    slug: 'inspirational',
    description: 'Films that motivate and uplift the spirit',
    targets: {
      emotionalIntensity: { min: 6, max: 9, weight: 1.8 },
      comfort: { min: 5, max: 8, weight: 1.5 },
      darkness: { min: 1, max: 4, weight: 1.2 },
      energy: { min: 5, max: 8, weight: 1.3 },
      rewatchability: { min: 6, max: 9, weight: 1.0 },
      humour: { min: 2, max: 5, weight: 0.6 },
      complexity: { min: 3, max: 6, weight: 0.5 },
      mentalStimulation: { min: 3, max: 6, weight: 0.5 },
    },
  },

  'adventurous': {
    name: 'Adventurous',
    slug: 'adventurous',
    description: 'Epic journeys and exciting quests',
    targets: {
      energy: { min: 7, max: 10, weight: 2.0 },
      emotionalIntensity: { min: 5, max: 8, weight: 1.5 },
      comfort: { min: 4, max: 7, weight: 1.0 },
      mentalStimulation: { min: 3, max: 6, weight: 0.8 },
      darkness: { min: 2, max: 5, weight: 0.7 },
      humour: { min: 3, max: 6, weight: 0.8 },
      complexity: { min: 3, max: 6, weight: 0.6 },
      rewatchability: { min: 6, max: 9, weight: 1.0 },
    },
  },

  'mysterious': {
    name: 'Mysterious',
    slug: 'mysterious',
    description: 'Puzzles, secrets, and intrigue',
    targets: {
      mentalStimulation: { min: 6, max: 9, weight: 2.0 },
      complexity: { min: 5, max: 8, weight: 1.8 },
      darkness: { min: 4, max: 7, weight: 1.3 },
      emotionalIntensity: { min: 4, max: 7, weight: 1.0 },
      energy: { min: 3, max: 6, weight: 0.8 },
      comfort: { min: 2, max: 5, weight: 0.6 },
      humour: { min: 0, max: 3, weight: 0.4 },
      rewatchability: { min: 5, max: 8, weight: 0.8 },
    },
  },

  'thought-provoking': {
    name: 'Thought-Provoking',
    slug: 'thought-provoking',
    description: 'Films that stay with you and spark reflection',
    targets: {
      mentalStimulation: { min: 7, max: 10, weight: 2.2 },
      complexity: { min: 6, max: 9, weight: 1.8 },
      emotionalIntensity: { min: 5, max: 8, weight: 1.2 },
      darkness: { min: 3, max: 7, weight: 1.0 },
      rewatchability: { min: 5, max: 8, weight: 0.8 },
      comfort: { min: 1, max: 4, weight: 0.5 },
      energy: { min: 3, max: 6, weight: 0.5 },
      humour: { min: 0, max: 4, weight: 0.3 },
    },
  },

  'uplifting': {
    name: 'Uplifting',
    slug: 'uplifting',
    description: 'Films that restore hope and positivity',
    targets: {
      comfort: { min: 7, max: 10, weight: 2.0 },
      emotionalIntensity: { min: 5, max: 8, weight: 1.5 },
      darkness: { min: 0, max: 3, weight: 1.8 },
      humour: { min: 4, max: 7, weight: 1.0 },
      energy: { min: 4, max: 7, weight: 1.0 },
      rewatchability: { min: 6, max: 9, weight: 1.0 },
      mentalStimulation: { min: 2, max: 5, weight: 0.5 },
      complexity: { min: 2, max: 5, weight: 0.5 },
    },
    failConditions: [
      { dimension: 'darkness', operator: '>', value: 4 },
    ],
  },
};

// =============================================================================
// PART 4: MOOD COMPATIBILITY SCORING ALGORITHM
// =============================================================================

export interface DimensionScore {
  dimension: DimensionKey;
  movieValue: number;
  targetMin: number;
  targetMax: number;
  distance: number;
  weight: number;
  contribution: number;
  inRange: boolean;
}

export interface MoodCompatibilityResult {
  score: number;                    // 0-100
  band: 'perfect' | 'good' | 'stretch' | 'poor';
  bandLabel: string;
  dimensionScores: DimensionScore[];
  topContributors: DimensionScore[];  // Top 3 positive contributors
  warnings: string[];                  // Negative signals
  failedHard: boolean;                // Failed a hard condition
  explanation: string;                // Human-readable why this fits
}

/**
 * Calculate distance from target range
 * Returns 0 if within range, positive number if outside
 */
function calculateDistance(value: number, min: number, max: number): number {
  if (value >= min && value <= max) {
    return 0;
  }
  if (value < min) {
    return min - value;
  }
  return value - max;
}

/**
 * Calculate mood compatibility score for a movie
 */
export function calculateMoodCompatibility(
  movie: MovieEmotionalData,
  moodSlug: string
): MoodCompatibilityResult {
  const moodProfile = MOOD_PROFILES[moodSlug];
  
  if (!moodProfile) {
    return {
      score: 0,
      band: 'poor',
      bandLabel: 'Unknown Mood',
      dimensionScores: [],
      topContributors: [],
      warnings: ['Unknown mood profile'],
      failedHard: true,
      explanation: 'Could not match to this mood.',
    };
  }

  const dimensionScores: DimensionScore[] = [];
  let totalWeightedScore = 0;
  let totalWeight = 0;
  const warnings: string[] = [];
  let failedHard = false;

  // Check fail conditions first
  if (moodProfile.failConditions) {
    for (const condition of moodProfile.failConditions) {
      const movieValue = movie.emotionalProfile[condition.dimension];
      const failed = condition.operator === '>' 
        ? movieValue > condition.value 
        : movieValue < condition.value;
      
      if (failed) {
        failedHard = true;
        const label = DIMENSION_LABELS[condition.dimension].name;
        warnings.push(`Too ${condition.operator === '>' ? 'high' : 'low'} ${label.toLowerCase()}`);
      }
    }
  }

  // Calculate score for each dimension
  for (const [dim, target] of Object.entries(moodProfile.targets) as [DimensionKey, DimensionTarget][]) {
    const movieValue = movie.emotionalProfile[dim];
    const distance = calculateDistance(movieValue, target.min, target.max);
    const inRange = distance === 0;
    
    // Score: 10 if in range, decreases by 2 for each point of distance
    const rawScore = Math.max(0, 10 - (distance * 2));
    const weightedContribution = rawScore * Math.abs(target.weight);
    
    // Negative weights invert the logic (e.g., comfort should be LOW for intense)
    const contribution = target.weight < 0 
      ? (10 - rawScore) * Math.abs(target.weight)
      : weightedContribution;

    dimensionScores.push({
      dimension: dim,
      movieValue,
      targetMin: target.min,
      targetMax: target.max,
      distance,
      weight: target.weight,
      contribution,
      inRange,
    });

    totalWeightedScore += contribution;
    totalWeight += Math.abs(target.weight) * 10; // Max possible contribution
  }

  // Normalize to 0-100
  let score = Math.round((totalWeightedScore / totalWeight) * 100);
  
  // Apply hard fail penalty
  if (failedHard) {
    score = Math.min(score, 45); // Cap at 45 if failed hard condition
  }

  // Determine band
  let band: 'perfect' | 'good' | 'stretch' | 'poor';
  let bandLabel: string;
  
  if (score >= 85) {
    band = 'perfect';
    bandLabel = `Perfect for ${moodProfile.name}`;
  } else if (score >= 70) {
    band = 'good';
    bandLabel = `Great for ${moodProfile.name}`;
  } else if (score >= 55) {
    band = 'stretch';
    bandLabel = `Mostly ${moodProfile.name}`;
  } else {
    band = 'poor';
    bandLabel = `Not quite ${moodProfile.name}`;
  }

  // Sort by contribution to find top contributors
  const sortedByContribution = [...dimensionScores]
    .filter(d => d.weight > 0) // Only positive weights
    .sort((a, b) => b.contribution - a.contribution);
  
  const topContributors = sortedByContribution.slice(0, 3);

  // Generate human explanation
  const explanation = generateExplanation(moodProfile, topContributors, warnings);

  // Add warnings for dimensions significantly out of range
  for (const ds of dimensionScores) {
    if (ds.distance >= 3 && ds.weight > 0.5) {
      const label = DIMENSION_LABELS[ds.dimension];
      if (ds.movieValue > ds.targetMax) {
        warnings.push(`${label.high} for this mood`);
      } else if (ds.movieValue < ds.targetMin) {
        warnings.push(`Less ${label.name.toLowerCase()} than typical`);
      }
    }
  }

  return {
    score,
    band,
    bandLabel,
    dimensionScores,
    topContributors,
    warnings: warnings.slice(0, 3), // Max 3 warnings
    failedHard,
    explanation,
  };
}

function generateExplanation(
  mood: MoodProfile,
  topContributors: DimensionScore[],
  warnings: string[]
): string {
  if (topContributors.length === 0) {
    return `May not be the best fit for ${mood.name}.`;
  }

  const reasons: string[] = [];
  
  for (const contrib of topContributors.slice(0, 2)) {
    const label = DIMENSION_LABELS[contrib.dimension];
    if (contrib.inRange) {
      if (contrib.movieValue >= 7) {
        reasons.push(`${label.high.toLowerCase()}`);
      } else if (contrib.movieValue <= 3) {
        reasons.push(`${label.low.toLowerCase()}`);
      } else {
        reasons.push(`balanced ${label.name.toLowerCase()}`);
      }
    }
  }

  if (reasons.length === 0) {
    return `A decent match for ${mood.name}.`;
  }

  const reasonText = reasons.join(' and ');
  return `${reasonText.charAt(0).toUpperCase() + reasonText.slice(1)} makes this ${mood.name.toLowerCase()}.`;
}

// =============================================================================
// PART 5: RANKING & SECTIONING
// =============================================================================

export interface RankedMovie {
  movie: MovieEmotionalData;
  compatibility: MoodCompatibilityResult;
}

export interface MoodSection {
  title: string;
  subtitle: string;
  band: 'perfect' | 'good' | 'stretch';
  movies: RankedMovie[];
}

/**
 * Rank movies for a mood and divide into sections
 */
export function rankMoviesForMood(
  movies: MovieEmotionalData[],
  moodSlug: string
): MoodSection[] {
  // Calculate compatibility for all movies
  const ranked: RankedMovie[] = movies
    .map(movie => ({
      movie,
      compatibility: calculateMoodCompatibility(movie, moodSlug),
    }))
    .filter(r => !r.compatibility.failedHard) // Remove hard fails
    .sort((a, b) => b.compatibility.score - a.compatibility.score);

  const moodProfile = MOOD_PROFILES[moodSlug];
  const moodName = moodProfile?.name || moodSlug;

  // Divide into sections by band
  const perfect = ranked.filter(r => r.compatibility.band === 'perfect');
  const good = ranked.filter(r => r.compatibility.band === 'good');
  const stretch = ranked.filter(r => r.compatibility.band === 'stretch');

  const sections: MoodSection[] = [];

  if (perfect.length > 0) {
    sections.push({
      title: `Perfect ${moodName} Movies`,
      subtitle: 'These fit the mood exactly',
      band: 'perfect',
      movies: perfect.slice(0, 8),
    });
  }

  if (good.length > 0) {
    sections.push({
      title: `Great ${moodName} Picks`,
      subtitle: 'Strong matches for this mood',
      band: 'good',
      movies: good.slice(0, 10),
    });
  }

  if (stretch.length > 0 && sections.length < 3) {
    sections.push({
      title: 'Worth Considering',
      subtitle: 'A slight stretch but still fits',
      band: 'stretch',
      movies: stretch.slice(0, 8),
    });
  }

  return sections;
}

// =============================================================================
// PART 7: ARCHETYPE BASELINES FOR MANUAL SCORING
// =============================================================================

export const ARCHETYPE_BASELINES: Record<string, EmotionalProfile> = {
  'light': {
    emotionalIntensity: 3,
    mentalStimulation: 2,
    comfort: 8,
    energy: 3,
    darkness: 1,
    humour: 5,
    complexity: 2,
    rewatchability: 8,
  },
  'fun': {
    emotionalIntensity: 4,
    mentalStimulation: 4,
    comfort: 6,
    energy: 7,
    darkness: 2,
    humour: 7,
    complexity: 3,
    rewatchability: 7,
  },
  'stimulating': {
    emotionalIntensity: 7,
    mentalStimulation: 8,
    comfort: 3,
    energy: 7,
    darkness: 5,
    humour: 2,
    complexity: 8,
    rewatchability: 6,
  },
  'deep': {
    emotionalIntensity: 9,
    mentalStimulation: 6,
    comfort: 2,
    energy: 4,
    darkness: 8,
    humour: 1,
    complexity: 7,
    rewatchability: 5,
  },
};

/**
 * Create a movie profile from archetype with optional adjustments
 */
export function createProfileFromArchetype(
  archetype: 'light' | 'fun' | 'stimulating' | 'deep',
  adjustments?: Partial<EmotionalProfile>
): EmotionalProfile {
  const baseline = { ...ARCHETYPE_BASELINES[archetype] };
  
  if (adjustments) {
    for (const [key, value] of Object.entries(adjustments)) {
      const dim = key as DimensionKey;
      // Clamp adjustments to ±2 from baseline
      const baseValue = baseline[dim];
      const adjusted = Math.max(0, Math.min(10, baseValue + Math.max(-2, Math.min(2, value - baseValue))));
      baseline[dim] = adjusted;
    }
  }
  
  return baseline;
}

// =============================================================================
// PART 6: UI HELPERS
// =============================================================================

export interface MoodFitBadge {
  text: string;
  variant: 'perfect' | 'good' | 'stretch' | 'warning';
}

export function getMoodFitBadge(compatibility: MoodCompatibilityResult): MoodFitBadge {
  if (compatibility.failedHard) {
    return { text: 'Not a good fit', variant: 'warning' };
  }
  
  switch (compatibility.band) {
    case 'perfect':
      return { text: compatibility.bandLabel, variant: 'perfect' };
    case 'good':
      return { text: compatibility.bandLabel, variant: 'good' };
    case 'stretch':
      return { text: compatibility.bandLabel, variant: 'stretch' };
    default:
      return { text: 'May not fit this mood', variant: 'warning' };
  }
}

export interface EmotionalBar {
  dimension: DimensionKey;
  label: string;
  value: number;
  percentage: number;
}

export function getTopEmotionalBars(profile: EmotionalProfile, count: number = 3): EmotionalBar[] {
  const entries = Object.entries(profile) as [DimensionKey, number][];
  
  return entries
    .map(([dim, value]) => ({
      dimension: dim,
      label: DIMENSION_LABELS[dim].name,
      value,
      percentage: value * 10,
    }))
    .sort((a, b) => b.value - a.value)
    .slice(0, count);
}
