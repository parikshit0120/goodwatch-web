// generate-reflections.ts
// Run this as a cron job (daily) to generate taste reflections for users

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
);

interface ReflectionData {
  userId: string;
  type: string;
  title: string;
  body: string;
  data: any;
}

async function generateReflectionsForUser(userId: string): Promise<ReflectionData[]> {
  const reflections: ReflectionData[] = [];
  
  // Get user's recent watch history (last 14 days)
  const { data: recentWatches } = await supabase
    .from('user_watch_history')
    .select(`
      *,
      movies (
        genres,
        mood_tags,
        runtime,
        vote_average
      )
    `)
    .eq('user_id', userId)
    .gte('created_at', new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString())
    .order('created_at', { ascending: false });
  
  if (!recentWatches || recentWatches.length < 3) {
    return reflections;
  }
  
  // Get older history for comparison (14-28 days ago)
  const { data: olderWatches } = await supabase
    .from('user_watch_history')
    .select(`
      *,
      movies (
        genres,
        mood_tags,
        runtime
      )
    `)
    .eq('user_id', userId)
    .gte('created_at', new Date(Date.now() - 28 * 24 * 60 * 60 * 1000).toISOString())
    .lt('created_at', new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString());
  
  // Analyze mood shifts
  const recentMoods = recentWatches
    .flatMap(w => w.movies?.mood_tags || [])
    .reduce((acc: Record<string, number>, mood: string) => {
      acc[mood] = (acc[mood] || 0) + 1;
      return acc;
    }, {});
  
  const olderMoods = (olderWatches || [])
    .flatMap(w => w.movies?.mood_tags || [])
    .reduce((acc: Record<string, number>, mood: string) => {
      acc[mood] = (acc[mood] || 0) + 1;
      return acc;
    }, {});
  
  // Detect mood drift
  const darkMoods = ['intense', 'dark', 'thriller', 'suspenseful', 'gritty'];
  const lightMoods = ['feel-good', 'comedy', 'heartwarming', 'lighthearted', 'fun'];
  
  const recentDarkCount = darkMoods.reduce((sum, m) => sum + (recentMoods[m] || 0), 0);
  const recentLightCount = lightMoods.reduce((sum, m) => sum + (recentMoods[m] || 0), 0);
  const olderDarkCount = darkMoods.reduce((sum, m) => sum + (olderMoods[m] || 0), 0);
  const olderLightCount = lightMoods.reduce((sum, m) => sum + (olderMoods[m] || 0), 0);
  
  if (recentDarkCount > recentLightCount && recentDarkCount > olderDarkCount + 2) {
    reflections.push({
      userId,
      type: 'mood_shift',
      title: "You're drifting towards darker films",
      body: `Your last ${recentWatches.length} picks have been more intense. Need something lighter?`,
      data: { recentDarkCount, recentLightCount }
    });
  } else if (recentLightCount > recentDarkCount && recentLightCount > olderLightCount + 2) {
    reflections.push({
      userId,
      type: 'mood_shift',
      title: "You've been keeping it light lately",
      body: "Lots of feel-good picks recently. Perfect for the season!",
      data: { recentLightCount, recentDarkCount }
    });
  }
  
  // Detect genre discovery
  const recentGenres = recentWatches
    .flatMap(w => w.movies?.genres || [])
    .reduce((acc: Record<string, number>, genre: string) => {
      acc[genre] = (acc[genre] || 0) + 1;
      return acc;
    }, {});
  
  const olderGenres = (olderWatches || [])
    .flatMap(w => w.movies?.genres || [])
    .reduce((acc: Record<string, number>, genre: string) => {
      acc[genre] = (acc[genre] || 0) + 1;
      return acc;
    }, {});
  
  // Find new genre interest
  for (const [genre, count] of Object.entries(recentGenres)) {
    if (count >= 3 && (!olderGenres[genre] || olderGenres[genre] < 2)) {
      reflections.push({
        userId,
        type: 'genre_discovery',
        title: `Discovering ${genre}?`,
        body: `You've watched ${count} ${genre.toLowerCase()} films recently. Want more recommendations?`,
        data: { genre, count }
      });
      break; // Only one genre discovery per cycle
    }
  }
  
  // Detect genre avoidance
  for (const [genre, oldCount] of Object.entries(olderGenres)) {
    if (oldCount >= 3 && (!recentGenres[genre] || recentGenres[genre] === 0)) {
      reflections.push({
        userId,
        type: 'mood_shift',
        title: `Taking a break from ${genre}?`,
        body: `You haven't watched any ${genre.toLowerCase()} in two weeks.`,
        data: { genre, oldCount }
      });
      break;
    }
  }
  
  // Detect runtime changes
  const recentAvgRuntime = recentWatches
    .filter(w => w.movies?.runtime)
    .reduce((sum, w) => sum + w.movies!.runtime, 0) / recentWatches.length;
  
  const olderAvgRuntime = (olderWatches || [])
    .filter(w => w.movies?.runtime)
    .reduce((sum, w) => sum + w.movies!.runtime, 0) / (olderWatches?.length || 1);
  
  if (recentAvgRuntime > olderAvgRuntime + 20 && recentAvgRuntime > 120) {
    reflections.push({
      userId,
      type: 'runtime_change',
      title: "Going for longer films",
      body: `Average runtime up to ${Math.round(recentAvgRuntime)} minutes. Ready for epics!`,
      data: { recentAvgRuntime, olderAvgRuntime }
    });
  } else if (recentAvgRuntime < olderAvgRuntime - 20 && recentAvgRuntime < 100) {
    reflections.push({
      userId,
      type: 'runtime_change',
      title: "Preferring shorter films",
      body: `Your picks are averaging ${Math.round(recentAvgRuntime)} minutes. Quick watches work!`,
      data: { recentAvgRuntime, olderAvgRuntime }
    });
  }
  
  // Streak detection
  const lovedCount = recentWatches.filter(w => w.reaction === 'loved').length;
  if (lovedCount >= 5) {
    reflections.push({
      userId,
      type: 'streak',
      title: "5 great picks in a row!",
      body: "Your taste profile is dialed in. Keep it going!",
      data: { lovedCount }
    });
  }
  
  // Milestone
  const { count: totalWatches } = await supabase
    .from('user_watch_history')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('status', 'finished');
  
  const milestones = [10, 25, 50, 100, 250, 500];
  for (const milestone of milestones) {
    if (totalWatches === milestone) {
      reflections.push({
        userId,
        type: 'milestone',
        title: `${milestone} movies watched!`,
        body: "You're a certified movie buff now.",
        data: { totalWatches: milestone }
      });
      break;
    }
  }
  
  return reflections;
}

async function main() {
  console.log('Generating taste reflections...');
  
  // Get all users with recent activity
  const { data: activeUsers } = await supabase
    .from('user_watch_history')
    .select('user_id')
    .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())
    .order('user_id');
  
  const uniqueUsers = [...new Set(activeUsers?.map(u => u.user_id) || [])];
  console.log(`Found ${uniqueUsers.length} active users`);
  
  let totalReflections = 0;
  
  for (const userId of uniqueUsers) {
    const reflections = await generateReflectionsForUser(userId);
    
    for (const reflection of reflections) {
      // Check if similar reflection already exists (prevent duplicates)
      const { data: existing } = await supabase
        .from('taste_reflections')
        .select('id')
        .eq('user_id', userId)
        .eq('reflection_type', reflection.type)
        .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())
        .limit(1);
      
      if (!existing || existing.length === 0) {
        await supabase
          .from('taste_reflections')
          .insert({
            user_id: userId,
            reflection_type: reflection.type,
            title: reflection.title,
            body: reflection.body,
            data: reflection.data,
            valid_until: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
          });
        totalReflections++;
      }
    }
  }
  
  console.log(`Generated ${totalReflections} new reflections`);
}

main().catch(console.error);
