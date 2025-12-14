globalThis.process ??= {}; globalThis.process.env ??= {};
/* empty css                                 */
import { e as createAstro, f as createComponent, r as renderTemplate, ap as defineScriptVars, k as renderComponent, m as maybeRenderHead, h as addAttribute } from '../chunks/astro/server_Cyy51z0E.mjs';
import { $ as $$Layout } from '../chunks/Layout_B6Hz-kRD.mjs';
import { s as supabase, f as getPosterUrl } from '../chunks/supabase_MFvNP5ai.mjs';
export { renderers } from '../renderers.mjs';

var __freeze = Object.freeze;
var __defProp = Object.defineProperty;
var __template = (cooked, raw) => __freeze(__defProp(cooked, "raw", { value: __freeze(cooked.slice()) }));
var _a;
const $$Astro = createAstro("https://goodwatch.movie");
const prerender = false;
const $$Taste = createComponent(async ($$result, $$props, $$slots) => {
  const Astro2 = $$result.createAstro($$Astro, $$props, $$slots);
  Astro2.self = $$Taste;
  const userId = Astro2.cookies.get("gw_user_id")?.value || "anonymous";
  const { data: profile } = await supabase.from("user_taste_profile").select("*").eq("user_id", userId).single();
  const { data: reflections } = await supabase.from("taste_reflections").select("*").eq("user_id", userId).eq("is_dismissed", false).gte("valid_until", (/* @__PURE__ */ new Date()).toISOString()).order("created_at", { ascending: false }).limit(5);
  const { data: recentWatches } = await supabase.from("user_watch_history").select("*, movie_id").eq("user_id", userId).eq("status", "finished").order("finished_at", { ascending: false }).limit(10);
  let watchedMovies = [];
  if (recentWatches && recentWatches.length > 0) {
    const movieIds = recentWatches.map((w) => w.movie_id).filter(Boolean);
    const { data: movies } = await supabase.from("movies").select("id, title, poster_path, year").in("id", movieIds);
    if (movies) {
      watchedMovies = recentWatches.map((w) => ({
        ...w,
        movie: movies.find((m) => m.id === w.movie_id)
      })).filter((w) => w.movie);
    }
  }
  const totalWatches = profile?.total_watches || 0;
  const totalLoved = profile?.total_loved || 0;
  const totalSwipes = profile?.total_swipes || 0;
  const reflectionIcons = {
    mood_shift: "\u{1F319}",
    genre_discovery: "",
    runtime_change: "\u23F1\uFE0F",
    streak: "\u{1F525}",
    milestone: "\u{1F3C6}"
  };
  return renderTemplate(_a || (_a = __template(["", " <script>(function(){", "\n  // Dismiss reflections\n  document.querySelectorAll('.dismiss-reflection').forEach(btn => {\n    btn.addEventListener('click', async () => {\n      const id = (btn as HTMLElement).dataset.id;\n      const card = btn.closest('[data-reflection-id]');\n      card?.remove();\n      \n      await fetch('/api/dismiss-reflection', {\n        method: 'POST',\n        headers: { 'Content-Type': 'application/json' },\n        body: JSON.stringify({ reflectionId: id, userId })\n      }).catch(() => {});\n    });\n  });\n  \n  // Share profile\n  document.getElementById('share-profile')?.addEventListener('click', async () => {\n    if (navigator.share) {\n      await navigator.share({\n        title: 'My Movie Taste - GoodWatch',\n        text: 'Check out my movie taste on GoodWatch!',\n        url: window.location.href\n      }).catch(() => {});\n    } else {\n      await navigator.clipboard.writeText(window.location.href);\n      alert('Link copied!');\n    }\n  });\n})();<\/script>"])), renderComponent($$result, "Layout", $$Layout, { "title": "Your Taste - GoodWatch", "description": "Your movie taste profile" }, { "default": async ($$result2) => renderTemplate` ${maybeRenderHead()}<main class="min-h-screen bg-gw-bg px-4 py-8"> <div class="max-w-2xl mx-auto"> <h1 class="text-3xl font-bold mb-8">Your Taste</h1> <!-- Stats --> <div class="grid grid-cols-3 gap-4 mb-8"> <div class="bg-gw-card border border-gw-border rounded-xl p-4 text-center"> <p class="text-3xl font-bold">${totalWatches}</p> <p class="text-sm text-gw-text-secondary">Watched</p> </div> <div class="bg-gw-card border border-gw-border rounded-xl p-4 text-center"> <p class="text-3xl font-bold text-green-500">${totalLoved}</p> <p class="text-sm text-gw-text-secondary">Loved</p> </div> <div class="bg-gw-card border border-gw-border rounded-xl p-4 text-center"> <p class="text-3xl font-bold">${totalSwipes}</p> <p class="text-sm text-gw-text-secondary">Swipes</p> </div> </div> <!-- Taste Reflections --> ${reflections && reflections.length > 0 && renderTemplate`<section class="mb-8"> <h2 class="text-lg font-semibold mb-4">Insights</h2> <div class="space-y-3"> ${reflections.map((r) => renderTemplate`<div class="bg-gw-card border border-gw-border rounded-xl p-4 flex items-start gap-3"${addAttribute(r.id, "data-reflection-id")}> <span class="text-2xl">${reflectionIcons[r.reflection_type] || "\u{1F4A1}"}</span> <div class="flex-1"> <h3 class="font-medium">${r.title}</h3> ${r.body && renderTemplate`<p class="text-sm text-gw-text-secondary mt-1">${r.body}</p>`} </div> <button class="text-gw-text-secondary hover:text-white dismiss-reflection"${addAttribute(r.id, "data-id")}>✕</button> </div>`)} </div> </section>`} <!-- Taste Axes --> ${profile && renderTemplate`<section class="mb-8"> <h2 class="text-lg font-semibold mb-4">Your Preferences</h2> <div class="bg-gw-card border border-gw-border rounded-xl p-6 space-y-4"> <div> <div class="flex justify-between text-sm mb-1"> <span>Light & Fun</span> <span>Heavy & Deep</span> </div> <div class="h-3 bg-gw-border rounded-full overflow-hidden"> <div class="h-full bg-gradient-to-r from-yellow-400 to-purple-600 rounded-full"${addAttribute(`width: ${((profile.axis_light_heavy || 0) + 1) / 2 * 100}%`, "style")}></div> </div> </div> <div> <div class="flex justify-between text-sm mb-1"> <span>Quick Watch</span> <span>Epic Journey</span> </div> <div class="h-3 bg-gw-border rounded-full overflow-hidden"> <div class="h-full bg-gradient-to-r from-green-400 to-blue-600 rounded-full"${addAttribute(`width: ${((profile.axis_fast_slow || 0) + 1) / 2 * 100}%`, "style")}></div> </div> </div> <div> <div class="flex justify-between text-sm mb-1"> <span>Comfort Zone</span> <span>Challenge Me</span> </div> <div class="h-3 bg-gw-border rounded-full overflow-hidden"> <div class="h-full bg-gradient-to-r from-pink-400 to-orange-600 rounded-full"${addAttribute(`width: ${((profile.axis_familiar_challenging || 0) + 1) / 2 * 100}%`, "style")}></div> </div> </div> </div> </section>`} <!-- Top Genres --> ${profile?.preferred_genres && profile.preferred_genres.length > 0 && renderTemplate`<section class="mb-8"> <h2 class="text-lg font-semibold mb-4">Top Genres</h2> <div class="flex flex-wrap gap-2"> ${profile.preferred_genres.slice(0, 6).map((genre, i) => renderTemplate`<span${addAttribute(`px-4 py-2 rounded-full ${i === 0 ? "bg-gw-accent text-gw-bg" : "bg-gw-card border border-gw-border"}`, "class")}> ${genre} </span>`)} </div> </section>`} <!-- Recently Watched --> ${watchedMovies.length > 0 && renderTemplate`<section class="mb-8"> <h2 class="text-lg font-semibold mb-4">Recently Watched</h2> <div class="flex gap-3 overflow-x-auto pb-2"> ${watchedMovies.map((w) => renderTemplate`<a${addAttribute(`/movie/${w.tmdb_id}`, "href")} class="flex-shrink-0 w-24"> <div class="aspect-[2/3] rounded-lg overflow-hidden mb-1 relative"> <img${addAttribute(getPosterUrl(w.movie.poster_path, "w185"), "src")}${addAttribute(w.movie.title, "alt")} class="w-full h-full object-cover"> ${w.reaction === "loved" && renderTemplate`<span class="absolute top-1 right-1 bg-green-500 text-white text-xs px-1 rounded">💚</span>`} </div> <p class="text-xs truncate">${w.movie.title}</p> </a>`)} </div> </section>`} <!-- Share Card --> <section class="mb-8"> <div class="bg-gradient-to-br from-gw-accent/20 to-gw-card border border-gw-border rounded-xl p-6 text-center"> <h2 class="text-lg font-semibold mb-2">Share Your Taste</h2> <p class="text-sm text-gw-text-secondary mb-4">Let friends know what you're into</p> <button id="share-profile" class="bg-gw-accent hover:bg-gw-accent-hover text-gw-bg px-6 py-2 rounded-full font-medium transition">
Share Profile →
</button> </div> </section> ${!profile && totalWatches === 0 && renderTemplate`<div class="text-center py-12"> <p class="text-gw-text-secondary mb-4">Watch and rate some movies to build your taste profile!</p> <a href="/tonight" class="inline-flex bg-gw-accent hover:bg-gw-accent-hover text-gw-bg px-6 py-3 rounded-full font-semibold transition">
Get Started
</a> </div>`} </div> </main> ` }), defineScriptVars({ userId }));
}, "/Users/parikshitjhajharia/Desktop/GOODWATCH/goodwatch-web/src/pages/taste.astro", void 0);

const $$file = "/Users/parikshitjhajharia/Desktop/GOODWATCH/goodwatch-web/src/pages/taste.astro";
const $$url = "/taste";

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: $$Taste,
  file: $$file,
  prerender,
  url: $$url
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
