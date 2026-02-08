/**
 * GoodWatch Movie Emotional Profile Scorer
 * Scores ALL 20K movies using Claude API
 */

import Anthropic from '@anthropic-ai/sdk';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://jdjqrlkynwfhbtyuddjk.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpkanFybGt5bndmaGJ0eXVkZGprIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ0NzUwMTEsImV4cCI6MjA4MDA1MTAxMX0.KDRMLCewVMp3lwphkUvtoWOkg6kyAk8iSbVkRKiHYSk';

const BATCH_SIZE = 25;
const DELAY_MS = 300;

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
const anthropic = new Anthropic();

const SYSTEM_PROMPT = `You score movies on 8 emotional dimensions (0-10 integers only).

DIMENSIONS:
emotionalIntensity: 0=flat/calm → 10=overwhelming/cathartic
mentalStimulation: 0=brain-off → 10=mind-bending
comfort: 0=unsettling → 10=warm/safe/familiar
energy: 0=slow/meditative → 10=fast/adrenaline
darkness: 0=light/bright → 10=disturbing/heavy
humour: 0=serious → 10=comedy-driven
complexity: 0=simple/linear → 10=layered/nonlinear
rewatchability: 0=once enough → 10=endlessly rewatchable

ARCHETYPE: "light" | "fun" | "stimulating" | "deep"

Return ONLY a JSON array. No markdown, no explanation.
Example: [{"id":123,"a":"fun","eI":5,"mS":4,"c":7,"e":8,"d":2,"h":7,"x":3,"r":8}]

Keys: id=tmdb_id, a=archetype, eI=emotionalIntensity, mS=mentalStimulation, c=comfort, e=energy, d=darkness, h=humour, x=complexity, r=rewatchability`;

async function getUnscoredCount() {
  const { count } = await supabase
    .from('movies')
    .select('*', { count: 'exact', head: true })
    .is('emotional_profile', null)
    .not('poster_path', 'is', null);
  return count || 0;
}

async function fetchBatch(limit) {
  const { data } = await supabase
    .from('movies')
    .select('tmdb_id, title, year, genres, overview')
    .is('emotional_profile', null)
    .not('poster_path', 'is', null)
    .order('vote_count', { ascending: false })
    .limit(limit);
  return data || [];
}

async function scoreBatch(movies) {
  const input = movies.map(m => {
    const g = m.genres?.map(x => x.name).join(',') || '';
    const o = (m.overview || '').substring(0, 150);
    return `${m.tmdb_id}|${m.title}|${m.year}|${g}|${o}`;
  }).join('\n');

  const resp = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 4096,
    system: SYSTEM_PROMPT,
    messages: [{ role: 'user', content: `Score these movies:\n${input}` }]
  });

  let json = resp.content[0].text.trim();
  if (json.startsWith('```')) json = json.replace(/```json?|```/g, '').trim();
  return JSON.parse(json);
}

async function saveBatch(scores) {
  let ok = 0, fail = 0;
  for (const s of scores) {
    const profile = {
      emotionalIntensity: s.eI,
      mentalStimulation: s.mS,
      comfort: s.c,
      energy: s.e,
      darkness: s.d,
      humour: s.h,
      complexity: s.x,
      rewatchability: s.r
    };
    const { error } = await supabase
      .from('movies')
      .update({ emotional_profile: profile, archetype: s.a })
      .eq('tmdb_id', s.id);
    error ? fail++ : ok++;
  }
  return { ok, fail };
}

async function main() {
  console.log('GoodWatch Emotional Scorer - ALL MOVIES');
  console.log('='.repeat(50));
  
  const total = await getUnscoredCount();
  console.log(`Unscored movies: ${total}`);
  
  let processed = 0, success = 0, failed = 0, batch = 0;
  
  while (true) {
    const movies = await fetchBatch(BATCH_SIZE);
    if (!movies.length) break;
    
    batch++;
    process.stdout.write(`[${batch}] Scoring ${movies.length} movies... `);
    
    try {
      const scores = await scoreBatch(movies);
      const { ok, fail } = await saveBatch(scores);
      success += ok; failed += fail;
      console.log(`OK:${ok} FAIL:${fail} | Total: ${success}/${total} (${((success/total)*100).toFixed(1)}%)`);
    } catch (e) {
      console.log(`ERROR: ${e.message}`);
      failed += movies.length;
    }
    
    processed += movies.length;
    if (processed < total) await new Promise(r => setTimeout(r, DELAY_MS));
  }
  
  console.log('='.repeat(50));
  console.log(`DONE! Success: ${success}, Failed: ${failed}`);
}

main().catch(console.error);
