// GoodWatch Weekly Digest Generator
// Supabase Edge Function
// Generates structured data for the weekly newsletter

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

// GoodWatch quality gates
const QUALITY_GATES = {
  MIN_RATING: 6.5,
  MIN_VOTES: 500,
  MAX_PER_PLATFORM: 3,
};

// Platform display names
const PLATFORM_NAMES: Record<string, string> = {
  netflix: "Netflix",
  prime: "Prime Video",
  jiohotstar: "JioHotstar",
  sonyliv: "SonyLIV",
  zee5: "Zee5",
  jiocinema: "JioCinema",
  appletv: "Apple TV+",
};

interface Movie {
  release_id: string;
  movie_id: string;
  platform: string;
  release_date: string;
  title: string;
  year: number;
  rating: number;
  vote_count: number;
  runtime_minutes: number;
  poster_url: string | null;
  mood_tags: string[] | null;
  genres: string[] | null;
}

interface DigestMovie {
  title: string;
  year: number;
  rating: number;
  runtime: string;
  poster_url: string | null;
  mood_tag: string | null;
  genres: string[];
}

interface WeeklyDigest {
  week_of: string;
  week_start: string;
  week_end: string;
  platforms: Record<string, DigestMovie[]>;
  total_new_releases: number;
  total_quality_picks: number;
  generated_at: string;
}

function formatRuntime(minutes: number): string {
  if (!minutes) return "";
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (hours > 0) {
    return `${hours}h ${mins}m`;
  }
  return `${mins}m`;
}

function formatDateRange(start: Date, end: Date): string {
  const options: Intl.DateTimeFormatOptions = {
    month: "short",
    day: "numeric",
  };
  const startStr = start.toLocaleDateString("en-US", options);
  const endStr = end.toLocaleDateString("en-US", {
    ...options,
    year: "numeric",
  });
  return `${startStr} - ${endStr}`;
}

function getPrimaryMoodTag(tags: string[] | null): string | null {
  if (!tags || tags.length === 0) return null;

  // Priority order for display
  const priority = [
    "feel_good",
    "uplifting",
    "gripping",
    "tense",
    "dark",
    "emotional",
    "light",
    "thought_provoking",
  ];

  for (const p of priority) {
    if (tags.includes(p)) {
      // Format for display
      return p.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
    }
  }

  // Return first tag if no priority match
  return tags[0].replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // Initialize Supabase client
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Calculate date range (past 7 days)
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 7);

    const startDateStr = startDate.toISOString().split("T")[0];
    const endDateStr = endDate.toISOString().split("T")[0];

    // Fetch weekly releases using the helper function
    const { data: releases, error: releasesError } = await supabase.rpc(
      "get_weekly_releases",
      {
        start_date: startDateStr,
        end_date: endDateStr,
      }
    );

    if (releasesError) {
      throw new Error(`Failed to fetch releases: ${releasesError.message}`);
    }

    const allReleases: Movie[] = releases || [];

    // Apply quality gates
    const qualityReleases = allReleases.filter(
      (movie) =>
        movie.rating >= QUALITY_GATES.MIN_RATING &&
        movie.vote_count >= QUALITY_GATES.MIN_VOTES &&
        movie.mood_tags &&
        movie.mood_tags.length > 0
    );

    // Group by platform and limit to top N per platform
    const platformGroups: Record<string, DigestMovie[]> = {};

    for (const movie of qualityReleases) {
      const platform = movie.platform;

      if (!platformGroups[platform]) {
        platformGroups[platform] = [];
      }

      // Only add if we haven't hit the limit
      if (platformGroups[platform].length < QUALITY_GATES.MAX_PER_PLATFORM) {
        platformGroups[platform].push({
          title: movie.title,
          year: movie.year,
          rating: movie.rating,
          runtime: formatRuntime(movie.runtime_minutes),
          poster_url: movie.poster_url,
          mood_tag: getPrimaryMoodTag(movie.mood_tags),
          genres: movie.genres || [],
        });
      }
    }

    // Sort platforms by number of releases (most first)
    const sortedPlatforms: Record<string, DigestMovie[]> = {};
    const platformOrder = Object.keys(platformGroups).sort(
      (a, b) => platformGroups[b].length - platformGroups[a].length
    );

    for (const platform of platformOrder) {
      sortedPlatforms[platform] = platformGroups[platform];
    }

    // Calculate totals
    const totalQualityPicks = Object.values(sortedPlatforms).reduce(
      (sum, movies) => sum + movies.length,
      0
    );

    // Build digest response
    const digest: WeeklyDigest = {
      week_of: formatDateRange(startDate, endDate),
      week_start: startDateStr,
      week_end: endDateStr,
      platforms: sortedPlatforms,
      total_new_releases: allReleases.length,
      total_quality_picks: totalQualityPicks,
      generated_at: new Date().toISOString(),
    };

    return new Response(JSON.stringify(digest), {
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json",
      },
    });
  } catch (error) {
    console.error("Error generating digest:", error);

    return new Response(
      JSON.stringify({
        error: "Failed to generate digest",
        details: error.message,
      }),
      {
        status: 500,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  }
});
