globalThis.process ??= {}; globalThis.process.env ??= {};
/* empty css                                    */
import { e as createAstro, f as createComponent, k as renderComponent, r as renderTemplate, m as maybeRenderHead, h as addAttribute, n as Fragment } from '../../chunks/astro/server_Cyy51z0E.mjs';
import { $ as $$Layout } from '../../chunks/Layout_B6Hz-kRD.mjs';
import { M as MOODS, e as slugify, s as supabase, f as getPosterUrl } from '../../chunks/supabase_MFvNP5ai.mjs';
/* empty css                                     */
export { renderers } from '../../renderers.mjs';

const $$Astro = createAstro("https://goodwatch.movie");
const prerender = false;
const $$mood = createComponent(async ($$result, $$props, $$slots) => {
  const Astro2 = $$result.createAstro($$Astro, $$props, $$slots);
  Astro2.self = $$mood;
  const { mood } = Astro2.params;
  const moodName = MOODS.find((m) => slugify(m) === mood) || mood?.replace(/-/g, " ");
  if (!moodName) {
    return Astro2.redirect("/moods");
  }
  const MOOD_TARGETS = {
    "feel-good": [
      { dimension: "humour", min: 6, max: 10, weight: 2 },
      { dimension: "comfort", min: 6, max: 10, weight: 1.5 },
      { dimension: "darkness", min: 0, max: 3, weight: 1.8 },
      { dimension: "rewatchability", min: 5, max: 10, weight: 1 }
    ],
    "thrilling": [
      { dimension: "energy", min: 6, max: 10, weight: 2 },
      { dimension: "emotionalIntensity", min: 6, max: 10, weight: 1.8 },
      { dimension: "mentalStimulation", min: 4, max: 10, weight: 1.2 }
    ],
    "romantic": [
      { dimension: "emotionalIntensity", min: 5, max: 8, weight: 1.8 },
      { dimension: "comfort", min: 5, max: 10, weight: 1.5 },
      { dimension: "darkness", min: 0, max: 4, weight: 1.3 }
    ],
    "mind-bending": [
      { dimension: "mentalStimulation", min: 7, max: 10, weight: 2.2 },
      { dimension: "complexity", min: 6, max: 10, weight: 2 },
      { dimension: "rewatchability", min: 5, max: 10, weight: 1 }
    ],
    "relaxing": [
      { dimension: "mentalStimulation", min: 0, max: 4, weight: 2 },
      { dimension: "complexity", min: 0, max: 4, weight: 2 },
      { dimension: "comfort", min: 5, max: 10, weight: 1.5 },
      { dimension: "emotionalIntensity", min: 0, max: 4, weight: 1.5 }
    ],
    "emotional": [
      { dimension: "emotionalIntensity", min: 7, max: 10, weight: 2.2 },
      { dimension: "comfort", min: 0, max: 6, weight: 1 }
    ],
    "funny": [
      { dimension: "humour", min: 7, max: 10, weight: 2.5 },
      { dimension: "darkness", min: 0, max: 3, weight: 1.5 },
      { dimension: "comfort", min: 5, max: 10, weight: 1 }
    ],
    "dark": [
      { dimension: "darkness", min: 6, max: 10, weight: 2.2 },
      { dimension: "emotionalIntensity", min: 5, max: 10, weight: 1.5 }
    ],
    "intense": [
      { dimension: "emotionalIntensity", min: 7, max: 10, weight: 2.2 },
      { dimension: "energy", min: 6, max: 10, weight: 1.8 },
      { dimension: "darkness", min: 4, max: 10, weight: 1.3 }
    ],
    "nostalgic": [
      { dimension: "rewatchability", min: 7, max: 10, weight: 2 },
      { dimension: "comfort", min: 6, max: 10, weight: 1.8 },
      { dimension: "darkness", min: 0, max: 4, weight: 1 }
    ],
    "inspirational": [
      { dimension: "emotionalIntensity", min: 5, max: 9, weight: 1.8 },
      { dimension: "comfort", min: 4, max: 9, weight: 1.5 },
      { dimension: "darkness", min: 0, max: 5, weight: 1.2 }
    ],
    "adventurous": [
      { dimension: "energy", min: 6, max: 10, weight: 2 },
      { dimension: "emotionalIntensity", min: 4, max: 8, weight: 1.5 },
      { dimension: "comfort", min: 4, max: 8, weight: 1 }
    ],
    "mysterious": [
      { dimension: "mentalStimulation", min: 6, max: 10, weight: 2 },
      { dimension: "complexity", min: 5, max: 10, weight: 1.8 },
      { dimension: "darkness", min: 3, max: 8, weight: 1.3 }
    ],
    "uplifting": [
      { dimension: "comfort", min: 6, max: 10, weight: 2 },
      { dimension: "darkness", min: 0, max: 3, weight: 1.8 },
      { dimension: "emotionalIntensity", min: 4, max: 8, weight: 1.2 }
    ],
    "thought-provoking": [
      { dimension: "mentalStimulation", min: 6, max: 10, weight: 2.2 },
      { dimension: "complexity", min: 5, max: 10, weight: 1.8 }
    ]
  };
  function calculateMoodScore(profile, moodSlug) {
    const targets = MOOD_TARGETS[moodSlug];
    if (!targets || !profile) return 0;
    let totalScore = 0;
    let totalWeight = 0;
    for (const target of targets) {
      const value = profile[target.dimension] ?? 5;
      let dimScore = 10;
      if (value < target.min) dimScore = Math.max(0, 10 - (target.min - value) * 2);
      else if (value > target.max) dimScore = Math.max(0, 10 - (value - target.max) * 2);
      totalScore += dimScore * target.weight;
      totalWeight += target.weight * 10;
    }
    return Math.round(totalScore / totalWeight * 100);
  }
  function generateExplanation(profile, moodSlug) {
    if (!profile) return [];
    const explanations = [];
    if (profile.comfort >= 7) explanations.push("Warm and familiar");
    if (profile.darkness <= 2) explanations.push("Light and uplifting");
    if (profile.humour >= 7) explanations.push("Plenty of laughs");
    if (profile.energy >= 7) explanations.push("High energy");
    if (profile.mentalStimulation >= 7) explanations.push("Thought-provoking");
    if (profile.complexity >= 7) explanations.push("Layered storytelling");
    if (profile.emotionalIntensity >= 7) explanations.push("Deeply moving");
    if (profile.rewatchability >= 8) explanations.push("Highly rewatchable");
    if (profile.emotionalIntensity <= 3 && profile.complexity <= 3) explanations.push("Easy watch");
    return explanations.slice(0, 3);
  }
  const { data: allMovies } = await supabase.from("movies").select("tmdb_id, title, year, poster_path, vote_average, vote_count, emotional_profile, archetype, imdb_rating").not("emotional_profile", "is", null).not("poster_path", "is", null).gte("vote_count", 50).order("vote_count", { ascending: false }).limit(500);
  const scoredMovies = (allMovies || []).map((m) => ({
    ...m,
    moodScore: calculateMoodScore(m.emotional_profile, mood),
    explanations: generateExplanation(m.emotional_profile)
  })).filter((m) => m.moodScore >= 50).sort((a, b) => b.moodScore - a.moodScore);
  const perfectFit = scoredMovies.filter((m) => m.moodScore >= 80).slice(0, 8);
  const goodFit = scoredMovies.filter((m) => m.moodScore >= 65 && m.moodScore < 80).slice(0, 12);
  const worthTrying = scoredMovies.filter((m) => m.moodScore >= 50 && m.moodScore < 65).slice(0, 10);
  const sections = [
    { title: `Perfect ${moodName} Movies`, subtitle: "These fit the mood exactly", movies: perfectFit, band: "perfect" },
    { title: `Great ${moodName} Picks`, subtitle: "Strong matches for this mood", movies: goodFit, band: "good" },
    { title: "Worth Trying", subtitle: "A bit of a stretch but still fits", movies: worthTrying, band: "stretch" }
  ].filter((s) => s.movies.length > 0);
  const totalMovies = perfectFit.length + goodFit.length + worthTrying.length;
  const moodDescriptions = {
    "feel-good": { title: "Feel-Good Movies to Watch", description: "Discover the best feel-good movies that will lift your spirits.", h1: "Feel-Good Movies That Will Brighten Your Day" },
    "thrilling": { title: "Thrilling Movies to Keep You on Edge", description: "Browse thrilling movies packed with suspense and excitement.", h1: "Thrilling Movies for an Adrenaline Rush" },
    "romantic": { title: "Romantic Movies for Date Night", description: "Find the perfect romantic movie for any occasion.", h1: "Romantic Movies That Will Make You Believe in Love" },
    "mind-bending": { title: "Mind-Bending Movies That Will Blow Your Mind", description: "Challenge your perception with mind-bending films.", h1: "Mind-Bending Movies to Make You Think" },
    "relaxing": { title: "Relaxing Movies for a Chill Night", description: "Unwind with relaxing movies perfect for a calm evening.", h1: "Relaxing Movies for When You Need to Unwind" },
    "emotional": { title: "Emotional Movies That Will Move You", description: "Find emotional movies that touch the heart.", h1: "Emotional Movies for When You Want to Feel" },
    "funny": { title: "Funny Movies to Make You Laugh", description: "Browse the funniest movies guaranteed to make you smile.", h1: "Funny Movies Guaranteed to Make You Laugh" },
    "dark": { title: "Dark Movies for When You Want Intensity", description: "Explore dark films that do not shy away from difficult themes.", h1: "Dark Movies for Those Who Like Intensity" },
    "intense": { title: "Intense Movies That Demand Your Attention", description: "Discover intense films with gripping plots.", h1: "Intense Movies You Will Not Be Able to Look Away From" },
    "nostalgic": { title: "Nostalgic Movies That Bring Back Memories", description: "Rediscover classics that capture simpler times.", h1: "Nostalgic Movies for When You Want to Remember" },
    "inspirational": { title: "Inspirational Movies to Motivate You", description: "Get inspired with movies that motivate and uplift.", h1: "Inspirational Movies to Fuel Your Dreams" },
    "adventurous": { title: "Adventure Movies for Thrill Seekers", description: "Embark on epic journeys with adventure movies.", h1: "Adventure Movies That Will Take You Places" },
    "mysterious": { title: "Mysterious Movies Full of Secrets", description: "Films full of secrets, twists, and puzzles.", h1: "Mysterious Movies to Keep You Guessing" },
    "uplifting": { title: "Uplifting Movies to Boost Your Mood", description: "Lift your spirits with uplifting movies.", h1: "Uplifting Movies for When You Need Hope" },
    "thought-provoking": { title: "Thought-Provoking Movies to Challenge Your Mind", description: "Films that raise questions and spark discussions.", h1: "Thought-Provoking Movies That Stay With You" }
  };
  const seo = moodDescriptions[mood] || {
    title: `${moodName} Movies to Watch`,
    description: `Discover the best ${moodName?.toLowerCase()} movies ranked by emotional fit.`,
    h1: `Best ${moodName} Movies`
  };
  return renderTemplate`${renderComponent($$result, "Layout", $$Layout, { "title": seo.title, "description": seo.description, "data-astro-cid-hnff2wym": true }, { "default": async ($$result2) => renderTemplate`  ${maybeRenderHead()}<section class="py-16 px-4 text-center border-b border-gw-border" data-astro-cid-hnff2wym> <div class="max-w-4xl mx-auto" data-astro-cid-hnff2wym> <nav class="text-sm text-gw-text-secondary mb-6" data-astro-cid-hnff2wym> <a href="/" class="hover:text-white transition" data-astro-cid-hnff2wym>Home</a> <span class="mx-2" data-astro-cid-hnff2wym>/</span> <a href="/moods" class="hover:text-white transition" data-astro-cid-hnff2wym>Moods</a> <span class="mx-2" data-astro-cid-hnff2wym>/</span> <span class="text-white" data-astro-cid-hnff2wym>${moodName}</span> </nav> <h1 class="text-3xl md:text-5xl font-bold mb-4" data-astro-cid-hnff2wym>${seo.h1}</h1> <p class="text-xl text-gw-text-secondary max-w-2xl mx-auto" data-astro-cid-hnff2wym>${seo.description}</p> <p class="mt-4 text-sm text-gw-text-secondary" data-astro-cid-hnff2wym>
Movies ranked by emotional fit, not popularity
</p> <div class="mt-6" data-astro-cid-hnff2wym> <span class="text-gw-accent font-semibold" data-astro-cid-hnff2wym>${totalMovies} movies</span> <span class="text-gw-text-secondary" data-astro-cid-hnff2wym> match this mood</span> </div> </div> </section>  ${sections.map((section, idx) => renderTemplate`<section${addAttribute(`py-10 px-4 ${idx % 2 === 1 ? "bg-gw-card/30" : ""}`, "class")} data-astro-cid-hnff2wym> <div class="max-w-7xl mx-auto" data-astro-cid-hnff2wym> <div class="flex items-center gap-3 mb-6" data-astro-cid-hnff2wym> <h2 class="text-2xl font-bold" data-astro-cid-hnff2wym>${section.title}</h2> <span${addAttribute(`text-xs px-2 py-1 rounded-full ${section.band === "perfect" ? "bg-green-500/20 text-green-400" : section.band === "good" ? "bg-blue-500/20 text-blue-400" : "bg-yellow-500/20 text-yellow-400"}`, "class")} data-astro-cid-hnff2wym> ${section.band === "perfect" ? "Perfect Fit" : section.band === "good" ? "Great Match" : "Worth Trying"} </span> </div> <p class="text-gw-text-secondary text-sm mb-6" data-astro-cid-hnff2wym>${section.subtitle}</p> ${idx === 0 ? renderTemplate`<!-- First section: larger cards -->
          <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-6" data-astro-cid-hnff2wym> ${section.movies.map((movie, i) => renderTemplate`<a${addAttribute(`/movie/${movie.tmdb_id}`, "href")} class="group" data-astro-cid-hnff2wym> <div class="aspect-[2/3] rounded-xl overflow-hidden bg-gw-card mb-3 ring-2 ring-transparent group-hover:ring-gw-accent transition relative" data-astro-cid-hnff2wym> <img${addAttribute(getPosterUrl(movie.poster_path, "w342"), "src")}${addAttribute(movie.title, "alt")} class="w-full h-full object-cover group-hover:scale-105 transition duration-300"${addAttribute(i < 4 ? "eager" : "lazy", "loading")} data-astro-cid-hnff2wym> <div class="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-3" data-astro-cid-hnff2wym> <div class="flex flex-wrap gap-1" data-astro-cid-hnff2wym> ${movie.explanations.slice(0, 2).map((exp) => renderTemplate`<span class="text-xs bg-white/20 backdrop-blur px-2 py-0.5 rounded" data-astro-cid-hnff2wym>${exp}</span>`)} </div> </div> </div> <h3 class="font-semibold line-clamp-1 group-hover:text-gw-accent transition" data-astro-cid-hnff2wym>${movie.title}</h3> <div class="flex items-center gap-2 text-sm text-gw-text-secondary mt-1" data-astro-cid-hnff2wym> <span data-astro-cid-hnff2wym>${movie.year}</span> ${movie.imdb_rating && renderTemplate`${renderComponent($$result2, "Fragment", Fragment, { "data-astro-cid-hnff2wym": true }, { "default": async ($$result3) => renderTemplate` <span class="text-gw-border" data-astro-cid-hnff2wym>·</span> <span class="flex items-center gap-1" data-astro-cid-hnff2wym> <span class="text-yellow-500" data-astro-cid-hnff2wym>IMDb</span> ${movie.imdb_rating.toFixed(1)} </span> ` })}`} </div> </a>`)} </div>` : renderTemplate`<!-- Other sections: horizontal scroll -->
          <div class="flex gap-4 overflow-x-auto pb-4 -mx-4 px-4 scrollbar-hide" data-astro-cid-hnff2wym> ${section.movies.map((movie) => renderTemplate`<a${addAttribute(`/movie/${movie.tmdb_id}`, "href")} class="group flex-shrink-0 w-36" data-astro-cid-hnff2wym> <div class="aspect-[2/3] rounded-lg overflow-hidden bg-gw-card mb-2 relative" data-astro-cid-hnff2wym> <img${addAttribute(getPosterUrl(movie.poster_path, "w185"), "src")}${addAttribute(movie.title, "alt")} class="w-full h-full object-cover group-hover:scale-105 transition duration-300" loading="lazy" data-astro-cid-hnff2wym> </div> <h3 class="font-medium text-sm line-clamp-1 group-hover:text-gw-accent transition" data-astro-cid-hnff2wym>${movie.title}</h3> <div class="text-xs text-gw-text-secondary" data-astro-cid-hnff2wym>${movie.year}</div> </a>`)} </div>`} </div> </section>`)} ${sections.length === 0 && renderTemplate`<section class="py-20 px-4 text-center" data-astro-cid-hnff2wym> <p class="text-gw-text-secondary text-lg" data-astro-cid-hnff2wym>No movies found for this mood yet.</p> <a href="/moods" class="inline-block mt-4 text-gw-accent hover:text-gw-accent-hover transition" data-astro-cid-hnff2wym>
Browse other moods
</a> </section>`} <section class="py-12 px-4 bg-gw-card/50 border-t border-gw-border" data-astro-cid-hnff2wym> <div class="max-w-7xl mx-auto" data-astro-cid-hnff2wym> <h2 class="text-2xl font-bold mb-6 text-center" data-astro-cid-hnff2wym>Explore Other Moods</h2> <div class="flex flex-wrap justify-center gap-3" data-astro-cid-hnff2wym> ${MOODS.filter((m) => slugify(m) !== mood).slice(0, 10).map((m) => renderTemplate`<a${addAttribute(`/mood/${slugify(m)}`, "href")} class="px-5 py-2.5 bg-gw-card hover:bg-gw-accent hover:text-gw-bg border border-gw-border rounded-full transition font-medium" data-astro-cid-hnff2wym> ${m} </a>`)} </div> </div> </section> ` })} `;
}, "/Users/parikshitjhajharia/Desktop/GOODWATCH/goodwatch-web/src/pages/mood/[mood].astro", void 0);

const $$file = "/Users/parikshitjhajharia/Desktop/GOODWATCH/goodwatch-web/src/pages/mood/[mood].astro";
const $$url = "/mood/[mood]";

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: $$mood,
  file: $$file,
  prerender,
  url: $$url
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
