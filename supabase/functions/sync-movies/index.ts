// GoodWatch Movie Sync Service
// Fetches movies from TMDB, checks OTT availability, and detects new releases
// Mirrors the iOS app's logic for consistency

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// TMDB API Configuration
const TMDB_BASE_URL = "https://api.themoviedb.org/3";
const TMDB_IMAGE_BASE = "https://image.tmdb.org/t/p/w780";

// Indian OTT Provider IDs from TMDB (for region=IN)
const OTT_PROVIDERS: Record<number, { id: string; name: string }> = {
  8: { id: "netflix", name: "Netflix" },
  119: { id: "prime", name: "Prime Video" },
  122: { id: "jiohotstar", name: "JioHotstar" }, // Disney+ Hotstar India
  237: { id: "sonyliv", name: "SonyLIV" },
  232: { id: "zee5", name: "Zee5" },
  220: { id: "jiocinema", name: "JioCinema" },
  350: { id: "appletv", name: "Apple TV+" },
};

// Quality gates matching iOS app (for first-time/cold users)
const QUALITY_GATE = {
  minRating: 6.5,
  minVotes: 500,
};

// Emotional profile interface
interface EmotionalProfile {
  energy?: number;
  humour?: number;
  comfort?: number;
  darkness?: number;
  complexity?: number;
  rewatchability?: number;
  mentalStimulation?: number;
  emotionalIntensity?: number;
}

// Derive mood tags from emotional profile (exact iOS logic)
function deriveMoodTags(emotionalProfile: EmotionalProfile | null, rating: number): string[] {
  // No emotional profile → default tags
  if (!emotionalProfile) {
    return ["medium", "polarizing", "full_attention"];
  }

  const tags: string[] = [];
  const ep = emotionalProfile;

  // 1. Cognitive Load (1 tag)
  const complexity = ep.complexity ?? 5;
  if (complexity <= 3) {
    tags.push("light");
  } else if (complexity <= 6) {
    tags.push("medium");
  } else {
    tags.push("heavy");
  }

  // 2. Emotional Outcome (1 tag)
  const darkness = ep.darkness ?? 5;
  const comfort = ep.comfort ?? 5;
  if (darkness >= 7) {
    tags.push("dark");
  } else if (comfort >= 7) {
    tags.push("feel_good");
  } else if (comfort >= 5 && darkness <= 4) {
    tags.push("uplifting");
  } else {
    tags.push("bittersweet");
  }

  // 3. Energy (1 tag)
  const energy = ep.energy ?? 5;
  if (energy <= 3) {
    tags.push("calm");
  } else if (energy >= 7) {
    tags.push("high_energy");
  } else {
    tags.push("tense");
  }

  // 4. Attention Required (1 tag)
  const mentalStim = ep.mentalStimulation ?? 5;
  const rewatchability = ep.rewatchability ?? 5;
  if (mentalStim <= 3) {
    tags.push("background_friendly");
  } else if (rewatchability >= 7) {
    tags.push("rewatchable");
  } else {
    tags.push("full_attention");
  }

  // 5. Regret Risk (1 tag)
  const intensity = ep.emotionalIntensity ?? 5;
  if (rating >= 7.5 && intensity <= 6) {
    tags.push("safe_bet");
  } else if (intensity >= 8 || darkness >= 8) {
    tags.push("acquired_taste");
  } else {
    tags.push("polarizing");
  }

  return tags;
}

// Format runtime to human readable
function formatRuntime(minutes: number): string {
  if (!minutes) return "2h 0m";
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
}

// Fetch movies from TMDB
async function fetchTMDBMovies(tmdbApiKey: string, page: number = 1): Promise<any[]> {
  // Fetch popular movies available in India
  const url = `${TMDB_BASE_URL}/discover/movie?api_key=${tmdbApiKey}&watch_region=IN&with_watch_monetization_types=flatrate&sort_by=popularity.desc&page=${page}&vote_count.gte=${QUALITY_GATE.minVotes}&vote_average.gte=${QUALITY_GATE.minRating}`;

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`TMDB API error: ${response.status}`);
  }

  const data = await response.json();
  return data.results || [];
}

// Fetch watch providers for a movie
async function fetchWatchProviders(tmdbApiKey: string, movieId: number): Promise<string[]> {
  const url = `${TMDB_BASE_URL}/movie/${movieId}/watch/providers?api_key=${tmdbApiKey}`;

  try {
    const response = await fetch(url);
    if (!response.ok) return [];

    const data = await response.json();
    const indiaProviders = data.results?.IN?.flatrate || [];

    // Map TMDB provider IDs to our platform IDs
    const platforms: string[] = [];
    for (const provider of indiaProviders) {
      const mapped = OTT_PROVIDERS[provider.provider_id];
      if (mapped) {
        platforms.push(mapped.id);
      }
    }

    return platforms;
  } catch {
    return [];
  }
}

// Fetch movie details (for runtime, genres, etc.)
async function fetchMovieDetails(tmdbApiKey: string, movieId: number): Promise<any> {
  const url = `${TMDB_BASE_URL}/movie/${movieId}?api_key=${tmdbApiKey}`;

  try {
    const response = await fetch(url);
    if (!response.ok) return null;
    return await response.json();
  } catch {
    return null;
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // Get environment variables
    const tmdbApiKey = Deno.env.get("TMDB_API_KEY");
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    if (!tmdbApiKey) {
      throw new Error("TMDB_API_KEY not configured");
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    console.log("Starting movie sync...");

    // Step 1: Snapshot current platform availability (for new release detection)
    const { data: existingMovies } = await supabase
      .from("movies")
      .select("id, tmdb_id, platforms");

    const existingPlatformMap = new Map<number, Set<string>>();
    for (const movie of existingMovies || []) {
      if (movie.tmdb_id) {
        existingPlatformMap.set(movie.tmdb_id, new Set(movie.platforms || []));
      }
    }

    console.log(`Existing movies in DB: ${existingPlatformMap.size}`);

    // Step 2: Fetch movies from TMDB (multiple pages for better coverage)
    const allMovies: any[] = [];
    for (let page = 1; page <= 5; page++) {
      const movies = await fetchTMDBMovies(tmdbApiKey, page);
      allMovies.push(...movies);
      // Small delay to avoid rate limiting
      await new Promise((r) => setTimeout(r, 250));
    }

    console.log(`Fetched ${allMovies.length} movies from TMDB`);

    // Step 3: Process each movie
    const moviesToUpsert: any[] = [];
    const newReleases: any[] = [];
    let processedCount = 0;

    for (const movie of allMovies) {
      try {
        // Fetch watch providers
        const platforms = await fetchWatchProviders(tmdbApiKey, movie.id);

        // Skip if no platforms available
        if (platforms.length === 0) continue;

        // Fetch full movie details
        const details = await fetchMovieDetails(tmdbApiKey, movie.id);
        if (!details) continue;

        // Extract genres
        const genres = (details.genres || []).map((g: any) => g.name);

        // Build emotional profile (simplified - could be enhanced with AI)
        // For now, derive from genres
        const emotionalProfile = deriveEmotionalProfileFromGenres(genres);

        // Derive mood tags
        const rating = movie.vote_average || 0;
        const moodTags = deriveMoodTags(emotionalProfile, rating);

        // Build movie record
        const movieRecord = {
          tmdb_id: movie.id,
          title: movie.title,
          original_title: movie.original_title,
          year: movie.release_date ? parseInt(movie.release_date.split("-")[0]) : null,
          overview: movie.overview,
          poster_url: movie.poster_path ? `${TMDB_IMAGE_BASE}${movie.poster_path}` : null,
          backdrop_url: movie.backdrop_path ? `${TMDB_IMAGE_BASE}${movie.backdrop_path}` : null,
          rating: rating,
          vote_count: movie.vote_count || 0,
          popularity: movie.popularity || 0,
          runtime_minutes: details.runtime || 120,
          genres: genres,
          platforms: platforms,
          mood_tags: moodTags,
          original_language: movie.original_language,
          synced_at: new Date().toISOString(),
        };

        moviesToUpsert.push(movieRecord);

        // Check for new releases (platform newly available)
        const existingPlatforms = existingPlatformMap.get(movie.id) || new Set();
        for (const platform of platforms) {
          if (!existingPlatforms.has(platform)) {
            newReleases.push({
              tmdb_id: movie.id,
              title: movie.title,
              platform: platform,
              release_date: new Date().toISOString().split("T")[0],
            });
          }
        }

        processedCount++;

        // Rate limiting
        await new Promise((r) => setTimeout(r, 100));
      } catch (err) {
        console.error(`Error processing movie ${movie.id}:`, err);
      }
    }

    console.log(`Processed ${processedCount} movies, ${newReleases.length} new releases detected`);

    // Step 4: Upsert movies to database
    if (moviesToUpsert.length > 0) {
      const { error: upsertError } = await supabase
        .from("movies")
        .upsert(moviesToUpsert, {
          onConflict: "tmdb_id",
          ignoreDuplicates: false,
        });

      if (upsertError) {
        console.error("Error upserting movies:", upsertError);
      } else {
        console.log(`Upserted ${moviesToUpsert.length} movies`);
      }
    }

    // Step 5: Record new releases
    if (newReleases.length > 0) {
      // Get movie IDs for the new releases
      const tmdbIds = newReleases.map((r) => r.tmdb_id);
      const { data: movieIds } = await supabase
        .from("movies")
        .select("id, tmdb_id")
        .in("tmdb_id", tmdbIds);

      const tmdbToId = new Map<number, string>();
      for (const m of movieIds || []) {
        tmdbToId.set(m.tmdb_id, m.id);
      }

      const releaseRecords = newReleases
        .filter((r) => tmdbToId.has(r.tmdb_id))
        .map((r) => ({
          movie_id: tmdbToId.get(r.tmdb_id),
          platform: r.platform,
          release_date: r.release_date,
        }));

      if (releaseRecords.length > 0) {
        const { error: releaseError } = await supabase
          .from("ott_releases")
          .upsert(releaseRecords, {
            onConflict: "movie_id,platform",
            ignoreDuplicates: true,
          });

        if (releaseError) {
          console.error("Error recording releases:", releaseError);
        } else {
          console.log(`Recorded ${releaseRecords.length} new releases`);
        }
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        movies_processed: processedCount,
        movies_upserted: moviesToUpsert.length,
        new_releases_detected: newReleases.length,
        synced_at: new Date().toISOString(),
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Sync error:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});

// Derive emotional profile from genres (simplified heuristic)
function deriveEmotionalProfileFromGenres(genres: string[]): EmotionalProfile {
  const genreSet = new Set(genres.map((g) => g.toLowerCase()));

  const profile: EmotionalProfile = {
    energy: 5,
    humour: 5,
    comfort: 5,
    darkness: 5,
    complexity: 5,
    rewatchability: 5,
    mentalStimulation: 5,
    emotionalIntensity: 5,
  };

  // Action/Adventure → high energy
  if (genreSet.has("action") || genreSet.has("adventure")) {
    profile.energy = 8;
  }

  // Comedy → high humour, comfort
  if (genreSet.has("comedy")) {
    profile.humour = 8;
    profile.comfort = 7;
    profile.darkness = 3;
  }

  // Drama → emotional intensity
  if (genreSet.has("drama")) {
    profile.emotionalIntensity = 7;
  }

  // Horror/Thriller → darkness, intensity
  if (genreSet.has("horror")) {
    profile.darkness = 9;
    profile.emotionalIntensity = 8;
    profile.comfort = 2;
  }

  if (genreSet.has("thriller")) {
    profile.darkness = 7;
    profile.energy = 7;
    profile.mentalStimulation = 7;
  }

  // Romance → comfort, feel-good
  if (genreSet.has("romance")) {
    profile.comfort = 7;
    profile.emotionalIntensity = 6;
  }

  // Sci-Fi/Mystery → mental stimulation, complexity
  if (genreSet.has("science fiction") || genreSet.has("mystery")) {
    profile.mentalStimulation = 8;
    profile.complexity = 7;
  }

  // Animation/Family → comfort, rewatchability
  if (genreSet.has("animation") || genreSet.has("family")) {
    profile.comfort = 8;
    profile.rewatchability = 8;
    profile.darkness = 2;
  }

  // Documentary → mental stimulation
  if (genreSet.has("documentary")) {
    profile.mentalStimulation = 8;
    profile.complexity = 6;
    profile.energy = 3;
  }

  // Crime → darkness, complexity
  if (genreSet.has("crime")) {
    profile.darkness = 7;
    profile.complexity = 7;
  }

  // War → darkness, intensity
  if (genreSet.has("war")) {
    profile.darkness = 8;
    profile.emotionalIntensity = 8;
  }

  return profile;
}
