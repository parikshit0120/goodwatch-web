// =====================================================
// GENERATE MULTI-AXIS SCORES FOR MOVIES
// Uses Gemini to analyze movies and assign axis scores
// Run: npx ts-node generate-movie-axes.ts
// =====================================================

import { createClient } from '@supabase/supabase-js';
import { GoogleGenerativeAI } from '@google/generative-ai';

const SUPABASE_URL = 'https://jdjqrlkynwfhbtyuddjk.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpkanFybGt5bndmaGJ0eXVkZGprIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ0NzUwMTEsImV4cCI6MjA4MDA1MTAxMX0.KDRMLCewVMp3lwphkUvtoWOkg6kyAk8iSbVkRKiHYSk';
const GEMINI_API_KEY = process.env.GEMINI_API_KEY || 'YOUR_GEMINI_API_KEY';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);

interface Movie {
  id: string;
  title: string;
  overview: string;
  genres: { id: number; name: string }[];
  release_date: string;
  vote_average: number;
}

interface MovieAxes {
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
}

const AXIS_PROMPT = `You are a film analyst. Given a movie's title, overview, and genres, provide numerical scores (1-10) for each axis.

AXES TO SCORE:
- pacing: 1=slow burn, meditative | 10=fast-paced, action-packed
- intensity: 1=subtle, understated | 10=emotionally intense, dramatic
- humor: 1=completely serious | 10=primarily comedic
- darkness: 1=light, uplifting | 10=dark, grim, disturbing themes
- warmth: 1=cold, cynical, nihilistic | 10=warm, hopeful, heartwarming
- complexity: 1=simple, straightforward plot | 10=complex, layered narrative
- realism: 1=fantastical, surreal | 10=grounded, realistic
- cerebral: 1=primarily emotional experience | 10=primarily intellectual experience
- romance: 1=no romantic elements | 10=romance is central focus
- suspense: 1=calm, no tension | 10=edge-of-seat suspense
- violence: 1=no violence | 10=graphic violence
- accessibility: 1=niche/arthouse | 10=mainstream crowd-pleaser

RESPOND ONLY WITH JSON in this exact format, no other text:
{"pacing":N,"intensity":N,"humor":N,"darkness":N,"warmth":N,"complexity":N,"realism":N,"cerebral":N,"romance":N,"suspense":N,"violence":N,"accessibility":N}`;

async function generateAxesForMovie(movie: Movie): Promise<MovieAxes | null> {
  const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-lite' });
  
  const prompt = `${AXIS_PROMPT}

MOVIE:
Title: ${movie.title}
Year: ${movie.release_date?.substring(0, 4) || 'Unknown'}
Genres: ${movie.genres?.map(g => g.name).join(', ') || 'Unknown'}
Overview: ${movie.overview || 'No overview available'}
Rating: ${movie.vote_average}/10`;

  try {
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text().trim();
    
    // Extract JSON from response
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      console.error(`No JSON found in response for ${movie.title}`);
      return null;
    }
    
    const axes = JSON.parse(jsonMatch[0]) as MovieAxes;
    
    // Validate all values are 1-10
    for (const [key, value] of Object.entries(axes)) {
      if (typeof value !== 'number' || value < 1 || value > 10) {
        console.error(`Invalid value for ${key}: ${value}`);
        return null;
      }
    }
    
    return axes;
  } catch (error) {
    console.error(`Error generating axes for ${movie.title}:`, error);
    return null;
  }
}

async function processMovies(batchSize: number = 50, startFrom: number = 0) {
  console.log('Starting movie axes generation...');
  
  // First get movies that already have axes
  const { data: existingAxes } = await supabase
    .from('movie_axes')
    .select('movie_id');
  
  const existingIds = new Set(existingAxes?.map(a => a.movie_id) || []);
  console.log(`Found ${existingIds.size} movies already with axes`);
  
  // Get all movies with good data
  const { data: allMovies, error } = await supabase
    .from('movies')
    .select('id, title, overview, genres, release_date, vote_average')
    .not('overview', 'is', null)
    .order('vote_average', { ascending: false })
    .range(startFrom, startFrom + batchSize + existingIds.size);
  
  if (error) {
    console.error('Error fetching movies:', error);
    return;
  }
  
  // Filter out movies that already have axes
  const movies = allMovies?.filter(m => !existingIds.has(m.id)).slice(0, batchSize);
  
  if (!movies || movies.length === 0) {
    console.log('No movies to process!');
    return;
  }
  
  console.log(`Processing ${movies.length} movies...`);
  
  let processed = 0;
  let failed = 0;
  
  for (const movie of movies) {
    console.log(`[${processed + 1}/${movies.length}] Processing: ${movie.title}`);
    
    const axes = await generateAxesForMovie(movie as Movie);
    
    if (axes) {
      // Insert into database
      const { error: insertError } = await supabase
        .from('movie_axes')
        .upsert({
          movie_id: movie.id,
          ...axes,
          confidence: 0.8,
          source: 'ai_generated',
        }, { onConflict: 'movie_id' });
      
      if (insertError) {
        console.error(`Error inserting axes for ${movie.title}:`, insertError);
        failed++;
      } else {
        processed++;
        console.log(`  ✓ Saved axes: pacing=${axes.pacing}, intensity=${axes.intensity}, humor=${axes.humor}`);
      }
    } else {
      failed++;
    }
    
    // Rate limiting - wait between requests
    await new Promise(resolve => setTimeout(resolve, 500));
  }
  
  console.log(`\nComplete! Processed: ${processed}, Failed: ${failed}`);
}

// Default axes based on genre (fallback when AI is not available)
const GENRE_DEFAULTS: Record<string, Partial<MovieAxes>> = {
  'Action': { pacing: 8, intensity: 8, suspense: 7, violence: 7 },
  'Comedy': { humor: 8, warmth: 7, darkness: 2, accessibility: 8 },
  'Drama': { intensity: 7, complexity: 6, cerebral: 6 },
  'Horror': { darkness: 8, suspense: 9, intensity: 8, violence: 6 },
  'Romance': { romance: 9, warmth: 8, humor: 5 },
  'Thriller': { suspense: 9, intensity: 8, pacing: 7, darkness: 6 },
  'Science Fiction': { cerebral: 7, complexity: 7, realism: 3 },
  'Fantasy': { realism: 2, complexity: 6, warmth: 6 },
  'Animation': { accessibility: 8, warmth: 7, violence: 2 },
  'Documentary': { realism: 10, cerebral: 8, complexity: 6 },
  'Crime': { darkness: 7, suspense: 7, violence: 6, complexity: 6 },
  'Mystery': { suspense: 8, complexity: 8, cerebral: 7 },
  'Family': { warmth: 9, accessibility: 10, violence: 1, darkness: 1 },
  'War': { intensity: 9, darkness: 8, violence: 8, realism: 7 },
  'Musical': { warmth: 7, accessibility: 8, romance: 6 },
};

async function seedPopularMovies() {
  console.log('Seeding top-rated movies with default axes...');
  
  // Get top 50 movies by rating that don't have axes yet
  const { data: existingAxes } = await supabase.from('movie_axes').select('movie_id');
  const existingIds = new Set(existingAxes?.map(a => a.movie_id) || []);
  
  const { data: movies, error } = await supabase
    .from('movies')
    .select('id, title, genres, vote_average')
    .order('vote_average', { ascending: false })
    .limit(100);
  
  if (error || !movies) {
    console.error('Error fetching movies:', error);
    return;
  }
  
  const moviesToSeed = movies.filter(m => !existingIds.has(m.id)).slice(0, 50);
  console.log(`Found ${moviesToSeed.length} movies to seed`);
  
  for (const movie of moviesToSeed) {
    // Start with default values
    const axes: MovieAxes = {
      pacing: 5, intensity: 5, humor: 5, darkness: 5, warmth: 5,
      complexity: 5, realism: 5, cerebral: 5, romance: 3,
      suspense: 5, violence: 3, accessibility: 5
    };
    
    // Apply genre-based defaults
    const genres = movie.genres || [];
    for (const genre of genres) {
      const genreName = typeof genre === 'string' ? genre : genre.name;
      const defaults = GENRE_DEFAULTS[genreName];
      if (defaults) {
        Object.assign(axes, defaults);
      }
    }
    
    // Insert axes
    const { error: insertError } = await supabase
      .from('movie_axes')
      .upsert({
        movie_id: movie.id,
        ...axes,
        confidence: 0.6, // Lower confidence for genre-based defaults
        source: 'genre_default',
      }, { onConflict: 'movie_id' });
    
    if (!insertError) {
      console.log(`  ✓ Seeded: ${movie.title}`);
    } else {
      console.log(`  ✗ Error seeding ${movie.title}:`, insertError.message);
    }
  }
  
  console.log('Seeding complete!');
}

// Main execution
async function main() {
  const args = process.argv.slice(2);
  
  if (args.includes('--seed')) {
    await seedPopularMovies();
  } else {
    const batchSize = parseInt(args[0]) || 50;
    const startFrom = parseInt(args[1]) || 0;
    await processMovies(batchSize, startFrom);
  }
}

main().catch(console.error);
