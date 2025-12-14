globalThis.process ??= {}; globalThis.process.env ??= {};
/* empty css                                 */
import { e as createAstro, f as createComponent, r as renderTemplate, ap as defineScriptVars, k as renderComponent, m as maybeRenderHead, h as addAttribute } from '../chunks/astro/server_Cyy51z0E.mjs';
import { $ as $$Layout } from '../chunks/Layout_B6Hz-kRD.mjs';
import { s as supabase, f as getPosterUrl } from '../chunks/supabase_MFvNP5ai.mjs';
export { renderers } from '../renderers.mjs';

var __freeze = Object.freeze;
var __defProp = Object.defineProperty;
var __template = (cooked, raw) => __freeze(__defProp(cooked, "raw", { value: __freeze(raw || cooked.slice()) }));
var _a;
const $$Astro = createAstro("https://goodwatch.movie");
const prerender = false;
const $$Tonight = createComponent(async ($$result, $$props, $$slots) => {
  const Astro2 = $$result.createAstro($$Astro, $$props, $$slots);
  Astro2.self = $$Tonight;
  const visitorId = Astro2.cookies.get("gw_user_id")?.value || crypto.randomUUID();
  if (!Astro2.cookies.get("gw_user_id")) {
    Astro2.cookies.set("gw_user_id", visitorId, { path: "/", maxAge: 60 * 60 * 24 * 365 });
  }
  const { data: snapshots, error: snapError } = await supabase.from("decision_snapshots").select("tmdb_id, confidence_score, providers, verified_at, movie_id").eq("region", "IN").eq("is_valid", true).gte("confidence_score", 0.4).order("confidence_score", { ascending: false }).limit(100);
  if (snapError) console.error("Snapshot error:", snapError);
  let tonightMovies = [];
  if (snapshots && snapshots.length > 0) {
    const movieIds = snapshots.map((s) => s.movie_id).filter(Boolean);
    const { data: movies } = await supabase.from("movies").select("id, tmdb_id, title, year, poster_path, backdrop_path, overview, runtime, genres, imdb_rating, imdb_votes").in("id", movieIds);
    if (movies) {
      tonightMovies = snapshots.map((snap) => {
        const movie = movies.find((m) => m.id === snap.movie_id);
        return movie ? { ...snap, movie } : null;
      }).filter(Boolean);
    }
  }
  const shuffled = tonightMovies.sort(() => Math.random() - 0.5);
  const pickA = shuffled[0];
  const pickB = shuffled[1];
  const movieA = pickA?.movie;
  const movieB = pickB?.movie;
  const hasRecommendation = !!movieA;
  const hasDecisionMode = !!movieA && !!movieB;
  function getProvider(snap) {
    if (!snap?.providers?.length) return null;
    const p = snap.providers.find((x) => x.type === "flatrate") || snap.providers[0];
    return { name: p.name, logo: p.logo_path };
  }
  function getProviderUrl(name, title) {
    const q = encodeURIComponent(title.trim());
    const urls = {
      "Netflix": `https://www.netflix.com/search?q=${q}`,
      "Amazon Prime Video": `https://www.primevideo.com/search?phrase=${q}`,
      "JioHotstar": `https://www.hotstar.com/in/search?q=${q}`,
      "Disney+ Hotstar": `https://www.hotstar.com/in/search?q=${q}`,
      "SonyLIV": `https://www.sonyliv.com/search?searchTerm=${q}`,
      "Sony Liv": `https://www.sonyliv.com/search?searchTerm=${q}`,
      "ZEE5": `https://www.zee5.com/search?q=${q}`,
      "Zee5": `https://www.zee5.com/search?q=${q}`,
      "JioCinema": `https://www.jiocinema.com/search/${q}`,
      "Jio Cinema": `https://www.jiocinema.com/search/${q}`,
      "Apple TV+": `https://tv.apple.com/search?term=${q}`
    };
    return urls[name] || `https://www.google.com/search?q=${q}+watch+online+${encodeURIComponent(name)}`;
  }
  function getGenreName(g) {
    return typeof g === "string" ? g : g?.name || "";
  }
  const providerA = pickA ? getProvider(pickA) : null;
  const providerB = pickB ? getProvider(pickB) : null;
  return renderTemplate(_a || (_a = __template(["", " <script>(function(){", "\n  // Different pick\n  document.getElementById('btn-different')?.addEventListener('click', () => window.location.reload());\n  \n  // Decision mode\n  const decisionOverlay = document.getElementById('decision-overlay');\n  document.getElementById('btn-decide')?.addEventListener('click', () => decisionOverlay?.classList.remove('hidden'));\n  document.getElementById('btn-close-decide')?.addEventListener('click', () => decisionOverlay?.classList.add('hidden'));\n  \n  document.querySelectorAll('[data-pick]').forEach(btn => {\n    btn.addEventListener('click', () => {\n      const pick = btn.dataset.pick;\n      const tmdbId = pick === 'A' ? tmdbIdA : tmdbIdB;\n      window.location.href = `/movie/${tmdbId}`;\n    });\n  });\n  \n  // Save for later\n  document.getElementById('btn-save')?.addEventListener('click', async () => {\n    const btn = document.getElementById('btn-save');\n    await fetch('/api/watchlist', {\n      method: 'POST',\n      headers: { 'Content-Type': 'application/json' },\n      body: JSON.stringify({ userId: visitorId, tmdbId: tmdbIdA, sourcePage: 'tonight' })\n    }).catch(() => {});\n    if (btn) btn.innerHTML = '\u2713 Saved';\n  });\n  \n  // Feedback modal\n  const feedbackModal = document.getElementById('feedback-modal');\n  const feedbackOptions = document.getElementById('feedback-options');\n  const providerSelect = document.getElementById('provider-select');\n  const feedbackThanks = document.getElementById('feedback-thanks');\n  \n  document.getElementById('btn-wrong')?.addEventListener('click', () => feedbackModal?.classList.remove('hidden'));\n  document.getElementById('btn-close-feedback')?.addEventListener('click', () => feedbackModal?.classList.add('hidden'));\n  \n  let selectedIssue = null;\n  \n  document.querySelectorAll('[data-issue]').forEach(btn => {\n    btn.addEventListener('click', async () => {\n      selectedIssue = btn.dataset.issue;\n      if (selectedIssue === 'different_provider') {\n        feedbackOptions?.classList.add('hidden');\n        providerSelect?.classList.remove('hidden');\n      } else {\n        await submitFeedback(selectedIssue, null);\n      }\n    });\n  });\n  \n  document.querySelectorAll('[data-correct]').forEach(btn => {\n    btn.addEventListener('click', async () => {\n      await submitFeedback('different_provider', btn.dataset.correct);\n    });\n  });\n  \n  async function submitFeedback(issue, correctProvider) {\n    feedbackOptions?.classList.add('hidden');\n    providerSelect?.classList.add('hidden');\n    feedbackThanks?.classList.remove('hidden');\n    document.getElementById('btn-close-feedback')?.classList.add('hidden');\n    \n    await fetch('/api/provider-feedback', {\n      method: 'POST',\n      headers: { 'Content-Type': 'application/json' },\n      body: JSON.stringify({\n        userId: visitorId,\n        tmdbId: tmdbIdA,\n        reportedProvider: providerNameA,\n        issueType: issue,\n        correctProvider: correctProvider,\n        sourcePage: 'tonight'\n      })\n    }).catch(console.error);\n    \n    setTimeout(() => window.location.reload(), 1500);\n  }\n})();<\/script>"], ["", " <script>(function(){", "\n  // Different pick\n  document.getElementById('btn-different')?.addEventListener('click', () => window.location.reload());\n  \n  // Decision mode\n  const decisionOverlay = document.getElementById('decision-overlay');\n  document.getElementById('btn-decide')?.addEventListener('click', () => decisionOverlay?.classList.remove('hidden'));\n  document.getElementById('btn-close-decide')?.addEventListener('click', () => decisionOverlay?.classList.add('hidden'));\n  \n  document.querySelectorAll('[data-pick]').forEach(btn => {\n    btn.addEventListener('click', () => {\n      const pick = btn.dataset.pick;\n      const tmdbId = pick === 'A' ? tmdbIdA : tmdbIdB;\n      window.location.href = \\`/movie/\\${tmdbId}\\`;\n    });\n  });\n  \n  // Save for later\n  document.getElementById('btn-save')?.addEventListener('click', async () => {\n    const btn = document.getElementById('btn-save');\n    await fetch('/api/watchlist', {\n      method: 'POST',\n      headers: { 'Content-Type': 'application/json' },\n      body: JSON.stringify({ userId: visitorId, tmdbId: tmdbIdA, sourcePage: 'tonight' })\n    }).catch(() => {});\n    if (btn) btn.innerHTML = '\u2713 Saved';\n  });\n  \n  // Feedback modal\n  const feedbackModal = document.getElementById('feedback-modal');\n  const feedbackOptions = document.getElementById('feedback-options');\n  const providerSelect = document.getElementById('provider-select');\n  const feedbackThanks = document.getElementById('feedback-thanks');\n  \n  document.getElementById('btn-wrong')?.addEventListener('click', () => feedbackModal?.classList.remove('hidden'));\n  document.getElementById('btn-close-feedback')?.addEventListener('click', () => feedbackModal?.classList.add('hidden'));\n  \n  let selectedIssue = null;\n  \n  document.querySelectorAll('[data-issue]').forEach(btn => {\n    btn.addEventListener('click', async () => {\n      selectedIssue = btn.dataset.issue;\n      if (selectedIssue === 'different_provider') {\n        feedbackOptions?.classList.add('hidden');\n        providerSelect?.classList.remove('hidden');\n      } else {\n        await submitFeedback(selectedIssue, null);\n      }\n    });\n  });\n  \n  document.querySelectorAll('[data-correct]').forEach(btn => {\n    btn.addEventListener('click', async () => {\n      await submitFeedback('different_provider', btn.dataset.correct);\n    });\n  });\n  \n  async function submitFeedback(issue, correctProvider) {\n    feedbackOptions?.classList.add('hidden');\n    providerSelect?.classList.add('hidden');\n    feedbackThanks?.classList.remove('hidden');\n    document.getElementById('btn-close-feedback')?.classList.add('hidden');\n    \n    await fetch('/api/provider-feedback', {\n      method: 'POST',\n      headers: { 'Content-Type': 'application/json' },\n      body: JSON.stringify({\n        userId: visitorId,\n        tmdbId: tmdbIdA,\n        reportedProvider: providerNameA,\n        issueType: issue,\n        correctProvider: correctProvider,\n        sourcePage: 'tonight'\n      })\n    }).catch(console.error);\n    \n    setTimeout(() => window.location.reload(), 1500);\n  }\n})();<\/script>"])), renderComponent($$result, "Layout", $$Layout, { "title": "Tonight's Pick - GoodWatch", "description": "Your movie for tonight." }, { "default": async ($$result2) => renderTemplate` ${maybeRenderHead()}<main class="min-h-screen bg-gw-bg"> ${!hasRecommendation ? renderTemplate`<!-- EMPTY STATE -->
      <section class="min-h-screen flex items-center justify-center px-4"> <div class="max-w-md text-center"> <div class="w-20 h-20 mx-auto mb-6 rounded-full bg-gw-card border border-gw-border flex items-center justify-center"> <svg class="w-10 h-10 text-gw-text-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24"> <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"></path> </svg> </div> <h1 class="text-2xl font-bold mb-3">Nothing I'm confident about tonight.</h1> <p class="text-gw-text-secondary mb-8">I don't see anything that's both a good fit and definitely available right now. A few quick swipes will help me do better.</p> <div class="flex flex-col sm:flex-row gap-3 justify-center"> <a href="/discover" class="inline-flex items-center justify-center gap-2 bg-gw-accent hover:bg-gw-accent-hover text-gw-bg px-6 py-3 rounded-full font-semibold transition">
Swipe to teach me
</a> <a href="/moods" class="inline-flex items-center justify-center gap-2 bg-gw-card hover:bg-gw-border border border-gw-border px-6 py-3 rounded-full font-semibold transition">
Try a different mood
</a> </div> <p class="text-sm text-gw-text-secondary mt-8">Come back tomorrow — I'll have better picks.</p> </div> </section>` : renderTemplate`<!-- TONIGHT'S PICK -->
      <section class="relative min-h-screen"> ${movieA.backdrop_path && renderTemplate`<div class="absolute inset-0 z-0"> <img${addAttribute(`https://image.tmdb.org/t/p/w1280${movieA.backdrop_path}`, "src")} alt="" class="w-full h-full object-cover"> <div class="absolute inset-0 bg-gradient-to-t from-gw-bg via-gw-bg/80 to-gw-bg/40"></div> </div>`} <div class="relative z-10 max-w-4xl mx-auto px-4 pt-20 pb-12"> <div class="text-center mb-8"> <p class="text-gw-accent font-medium mb-2">Tonight's Pick</p> <p class="text-gw-text-secondary text-sm">${(/* @__PURE__ */ new Date()).toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}</p> </div> <!-- Main Card --> <div class="bg-gw-card/90 backdrop-blur-sm border border-gw-border rounded-2xl overflow-hidden shadow-2xl"> <div class="flex flex-col md:flex-row"> <div class="md:w-1/3 flex-shrink-0"> <img${addAttribute(getPosterUrl(movieA.poster_path, "w500"), "src")}${addAttribute(movieA.title, "alt")} class="w-full h-64 md:h-full object-cover"> </div> <div class="flex-1 p-6 md:p-8"> <h1 class="text-2xl md:text-3xl font-bold mb-2">${movieA.title}</h1> <div class="flex flex-wrap items-center gap-3 text-sm text-gw-text-secondary mb-4"> <span>${movieA.year}</span> ${movieA.runtime && renderTemplate`<span>• ${Math.floor(movieA.runtime / 60)}h ${movieA.runtime % 60}m</span>`} ${movieA.imdb_rating && renderTemplate`<span class="flex items-center gap-1"> <span>•</span> <span class="bg-[#F5C518] text-black text-xs font-bold px-1.5 py-0.5 rounded">IMDb</span> <span class="font-medium text-white">${Number(movieA.imdb_rating).toFixed(1)}</span> </span>`} </div> ${movieA.genres && movieA.genres.length > 0 && renderTemplate`<div class="flex flex-wrap gap-2 mb-4"> ${movieA.genres.slice(0, 3).map((g) => renderTemplate`<span class="px-2 py-1 bg-gw-bg/50 rounded text-xs">${getGenreName(g)}</span>`)} </div>`} ${movieA.overview && renderTemplate`<p class="text-gw-text-secondary text-sm mb-6 line-clamp-3">${movieA.overview}</p>`} ${providerA && renderTemplate`<div class="space-y-3"> <div class="flex items-center gap-2 text-sm text-gw-text-secondary"> ${providerA.logo && renderTemplate`<img${addAttribute(`https://image.tmdb.org/t/p/w92${providerA.logo}`, "src")}${addAttribute(providerA.name, "alt")} class="w-6 h-6 rounded">`} <span>Available on ${providerA.name}</span> </div> <a${addAttribute(getProviderUrl(providerA.name, movieA.title), "href")} target="_blank" rel="noopener noreferrer" class="inline-flex items-center gap-2 bg-gw-accent hover:bg-gw-accent-hover text-gw-bg px-6 py-3 rounded-full font-semibold transition" id="watch-btn"> <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"></path></svg>
Watch now
</a> </div>`} </div> </div> </div> <!-- Action Buttons --> <div class="flex flex-wrap justify-center gap-3 mt-6"> <button id="btn-different" class="flex items-center gap-2 bg-gw-card hover:bg-gw-border border border-gw-border px-4 py-2 rounded-full text-sm transition"> <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"> <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path> </svg>
Different pick
</button> ${hasDecisionMode && renderTemplate`<button id="btn-decide" class="flex items-center gap-2 bg-gw-card hover:bg-gw-border border border-gw-border px-4 py-2 rounded-full text-sm transition"> <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"> <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 9l4-4 4 4m0 6l-4 4-4-4"></path> </svg>
Help me decide
</button>`} <button id="btn-save" class="flex items-center gap-2 bg-gw-card hover:bg-gw-border border border-gw-border px-4 py-2 rounded-full text-sm transition"> <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"> <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"></path> </svg>
Save for later
</button> </div> <div class="text-center mt-8"> <button id="btn-wrong" class="text-sm text-gw-text-secondary hover:text-gw-accent transition">Wrong source?</button> </div> </div> </section>
      
      <!-- DECISION MODE OVERLAY -->
      ${hasDecisionMode && renderTemplate`<div id="decision-overlay" class="fixed inset-0 z-50 bg-gw-bg/95 backdrop-blur-sm hidden"> <div class="min-h-screen flex flex-col items-center justify-center px-4 py-8"> <div class="text-center mb-8"> <h2 class="text-2xl font-bold mb-2">Help me decide</h2> <p class="text-gw-text-secondary">Pick one. I'll remember.</p> </div> <div class="w-full max-w-4xl grid grid-cols-1 md:grid-cols-2 gap-6"> <!-- Option A --> <button class="group bg-gw-card border-2 border-gw-border hover:border-gw-accent rounded-2xl overflow-hidden transition-all text-left" data-pick="A"> <div class="aspect-[2/3] relative"> <img${addAttribute(getPosterUrl(movieA.poster_path, "w500"), "src")}${addAttribute(movieA.title, "alt")} class="w-full h-full object-cover"> <div class="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent"></div> <div class="absolute bottom-0 left-0 right-0 p-4"> <h3 class="text-lg font-bold mb-1">${movieA.title}</h3> <div class="flex items-center gap-2 text-sm text-gray-300"> <span>${movieA.year}</span> ${movieA.imdb_rating && renderTemplate`<span>• IMDb ${Number(movieA.imdb_rating).toFixed(1)}</span>`} </div> ${providerA && renderTemplate`<p class="text-xs text-gray-400 mt-2">On ${providerA.name}</p>`} </div> </div> </button> <!-- Option B --> <button class="group bg-gw-card border-2 border-gw-border hover:border-gw-accent rounded-2xl overflow-hidden transition-all text-left" data-pick="B"> <div class="aspect-[2/3] relative"> <img${addAttribute(getPosterUrl(movieB.poster_path, "w500"), "src")}${addAttribute(movieB.title, "alt")} class="w-full h-full object-cover"> <div class="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent"></div> <div class="absolute bottom-0 left-0 right-0 p-4"> <h3 class="text-lg font-bold mb-1">${movieB.title}</h3> <div class="flex items-center gap-2 text-sm text-gray-300"> <span>${movieB.year}</span> ${movieB.imdb_rating && renderTemplate`<span>• IMDb ${Number(movieB.imdb_rating).toFixed(1)}</span>`} </div> ${providerB && renderTemplate`<p class="text-xs text-gray-400 mt-2">On ${providerB.name}</p>`} </div> </div> </button> </div> <button id="btn-close-decide" class="mt-8 text-gw-text-secondary hover:text-white transition">Never mind, go back</button> </div> </div>`}
      
      <!-- FEEDBACK MODAL -->
      <div id="feedback-modal" class="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm hidden"> <div class="min-h-screen flex items-center justify-center px-4"> <div class="w-full max-w-md bg-gw-card border border-gw-border rounded-2xl p-6"> <h3 class="text-lg font-bold mb-4">What's wrong?</h3> <div id="feedback-options" class="space-y-2"> <button class="w-full text-left px-4 py-3 bg-gw-bg hover:bg-gw-border rounded-lg transition" data-issue="not_available">❌ Not available on this service</button> <button class="w-full text-left px-4 py-3 bg-gw-bg hover:bg-gw-border rounded-lg transition" data-issue="different_provider">🔁 Available on a different service</button> <button class="w-full text-left px-4 py-3 bg-gw-bg hover:bg-gw-border rounded-lg transition" data-issue="rent_only">💸 It's only rent / buy</button> <button class="w-full text-left px-4 py-3 bg-gw-bg hover:bg-gw-border rounded-lg transition" data-issue="link_broken">🔗 Link didn't work</button> </div> <div id="provider-select" class="hidden mt-4"> <p class="text-sm text-gw-text-secondary mb-3">Where did you find it?</p> <div class="flex flex-wrap gap-2"> <button class="px-3 py-2 bg-gw-bg hover:bg-gw-accent hover:text-gw-bg rounded-lg text-sm transition" data-correct="Netflix">Netflix</button> <button class="px-3 py-2 bg-gw-bg hover:bg-gw-accent hover:text-gw-bg rounded-lg text-sm transition" data-correct="Amazon Prime Video">Prime</button> <button class="px-3 py-2 bg-gw-bg hover:bg-gw-accent hover:text-gw-bg rounded-lg text-sm transition" data-correct="JioHotstar">JioHotstar</button> <button class="px-3 py-2 bg-gw-bg hover:bg-gw-accent hover:text-gw-bg rounded-lg text-sm transition" data-correct="SonyLIV">SonyLIV</button> <button class="px-3 py-2 bg-gw-bg hover:bg-gw-accent hover:text-gw-bg rounded-lg text-sm transition" data-correct="ZEE5">ZEE5</button> <button class="px-3 py-2 bg-gw-bg hover:bg-gw-accent hover:text-gw-bg rounded-lg text-sm transition" data-correct="JioCinema">JioCinema</button> </div> </div> <div id="feedback-thanks" class="hidden text-center py-6"> <p class="text-lg font-medium">Thanks — I'll fix this.</p> <p class="text-sm text-gw-text-secondary mt-2">Finding you another pick...</p> </div> <button id="btn-close-feedback" class="mt-4 w-full py-2 text-gw-text-secondary hover:text-white transition">Cancel</button> </div> </div> </div>`} </main> ` }), defineScriptVars({
    visitorId,
    movieIdA: movieA?.id,
    tmdbIdA: movieA?.tmdb_id,
    providerNameA: providerA?.name,
    movieIdB: movieB?.id,
    tmdbIdB: movieB?.tmdb_id,
    providerNameB: providerB?.name
  }));
}, "/Users/parikshitjhajharia/Desktop/GOODWATCH/goodwatch-web/src/pages/tonight.astro", void 0);

const $$file = "/Users/parikshitjhajharia/Desktop/GOODWATCH/goodwatch-web/src/pages/tonight.astro";
const $$url = "/tonight";

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: $$Tonight,
  file: $$file,
  prerender,
  url: $$url
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
