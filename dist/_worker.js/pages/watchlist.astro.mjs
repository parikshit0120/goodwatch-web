globalThis.process ??= {}; globalThis.process.env ??= {};
/* empty css                                 */
import { e as createAstro, f as createComponent, k as renderComponent, l as renderScript, r as renderTemplate, m as maybeRenderHead, h as addAttribute } from '../chunks/astro/server_Cyy51z0E.mjs';
import { $ as $$Layout } from '../chunks/Layout_B6Hz-kRD.mjs';
import { s as supabase, f as getPosterUrl } from '../chunks/supabase_MFvNP5ai.mjs';
export { renderers } from '../renderers.mjs';

const $$Astro = createAstro("https://goodwatch.movie");
const prerender = false;
const $$Watchlist = createComponent(async ($$result, $$props, $$slots) => {
  const Astro2 = $$result.createAstro($$Astro, $$props, $$slots);
  Astro2.self = $$Watchlist;
  const userId = Astro2.cookies.get("gw_user_id")?.value || "anonymous";
  const { data: watchlistItems } = await supabase.from("user_watchlist").select(`
    id,
    tmdb_id,
    planned_date,
    watch_context,
    priority,
    status,
    created_at,
    movie_id
  `).eq("user_id", userId).eq("status", "queued").order("priority", { ascending: false }).order("created_at", { ascending: false });
  let watchlist = [];
  if (watchlistItems && watchlistItems.length > 0) {
    const movieIds = watchlistItems.map((w) => w.movie_id).filter(Boolean);
    const { data: movies } = await supabase.from("movies").select("id, tmdb_id, title, year, poster_path, runtime, imdb_rating, genres").in("id", movieIds);
    if (movies) {
      watchlist = watchlistItems.map((item) => {
        const movie = movies.find((m) => m.id === item.movie_id);
        return movie ? { ...item, movie } : null;
      }).filter(Boolean);
    }
  }
  const today = (/* @__PURE__ */ new Date()).toISOString().split("T")[0];
  const tomorrow = new Date(Date.now() + 864e5).toISOString().split("T")[0];
  const weekEnd = new Date(Date.now() + 7 * 864e5).toISOString().split("T")[0];
  const tonight = watchlist.filter((w) => w.planned_date === today);
  const tomorrowNight = watchlist.filter((w) => w.planned_date === tomorrow);
  const thisWeek = watchlist.filter((w) => w.planned_date > tomorrow && w.planned_date <= weekEnd);
  const later = watchlist.filter((w) => !w.planned_date || w.planned_date > weekEnd);
  return renderTemplate`${renderComponent($$result, "Layout", $$Layout, { "title": "Watchlist - GoodWatch", "description": "Your upcoming movie nights" }, { "default": async ($$result2) => renderTemplate` ${maybeRenderHead()}<main class="min-h-screen bg-gw-bg px-4 py-8"> <div class="max-w-4xl mx-auto"> <h1 class="text-3xl font-bold mb-2">Upcoming Nights</h1> <p class="text-gw-text-secondary mb-8">Plan what you'll watch and when.</p> ${watchlist.length === 0 ? renderTemplate`<div class="text-center py-16"> <div class="w-20 h-20 mx-auto mb-6 rounded-full bg-gw-card border border-gw-border flex items-center justify-center"> <svg class="w-10 h-10 text-gw-text-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24"> <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"></path> </svg> </div> <h2 class="text-xl font-semibold mb-2">No movies saved yet</h2> <p class="text-gw-text-secondary mb-6">Save movies from Tonight's Pick to plan your week.</p> <a href="/tonight" class="inline-flex items-center gap-2 bg-gw-accent hover:bg-gw-accent-hover text-gw-bg px-6 py-3 rounded-full font-semibold transition">
Get Tonight's Pick
</a> </div>` : renderTemplate`<div class="space-y-8"> ${tonight.length > 0 && renderTemplate`<section> <h2 class="text-lg font-semibold mb-4 flex items-center gap-2"> <span class="w-2 h-2 bg-gw-accent rounded-full"></span>
Tonight
</h2> <div class="grid gap-4"> ${tonight.map((item) => renderTemplate`<div class="bg-gw-card border border-gw-border rounded-xl p-4 flex gap-4"> <img${addAttribute(getPosterUrl(item.movie.poster_path, "w154"), "src")}${addAttribute(item.movie.title, "alt")} class="w-20 h-28 object-cover rounded-lg"> <div class="flex-1"> <h3 class="font-semibold">${item.movie.title}</h3> <p class="text-sm text-gw-text-secondary">${item.movie.year} • ${item.movie.runtime}m</p> ${item.watch_context && renderTemplate`<span class="inline-block mt-2 px-2 py-1 bg-gw-bg rounded text-xs">${item.watch_context}</span>`} </div> <a${addAttribute(`/movie/${item.tmdb_id}`, "href")} class="self-center bg-gw-accent hover:bg-gw-accent-hover text-gw-bg px-4 py-2 rounded-full text-sm font-medium transition">
Watch
</a> </div>`)} </div> </section>`} ${tomorrowNight.length > 0 && renderTemplate`<section> <h2 class="text-lg font-semibold mb-4 text-gw-text-secondary">Tomorrow</h2> <div class="grid gap-4"> ${tomorrowNight.map((item) => renderTemplate`<div class="bg-gw-card border border-gw-border rounded-xl p-4 flex gap-4"> <img${addAttribute(getPosterUrl(item.movie.poster_path, "w154"), "src")}${addAttribute(item.movie.title, "alt")} class="w-16 h-24 object-cover rounded-lg"> <div class="flex-1"> <h3 class="font-semibold">${item.movie.title}</h3> <p class="text-sm text-gw-text-secondary">${item.movie.year}</p> </div> <button class="self-center text-gw-text-secondary hover:text-white"${addAttribute(item.id, "data-plan")}>Reschedule</button> </div>`)} </div> </section>`} ${thisWeek.length > 0 && renderTemplate`<section> <h2 class="text-lg font-semibold mb-4 text-gw-text-secondary">This Week</h2> <div class="grid gap-4"> ${thisWeek.map((item) => renderTemplate`<div class="bg-gw-card border border-gw-border rounded-xl p-4 flex gap-4"> <img${addAttribute(getPosterUrl(item.movie.poster_path, "w154"), "src")}${addAttribute(item.movie.title, "alt")} class="w-16 h-24 object-cover rounded-lg"> <div class="flex-1"> <h3 class="font-semibold">${item.movie.title}</h3> <p class="text-sm text-gw-text-secondary">${item.movie.year} • ${new Date(item.planned_date).toLocaleDateString("en-US", { weekday: "short" })}</p> </div> </div>`)} </div> </section>`} ${later.length > 0 && renderTemplate`<section> <h2 class="text-lg font-semibold mb-4 text-gw-text-secondary">Saved for Later</h2> <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4"> ${later.map((item) => renderTemplate`<a${addAttribute(`/movie/${item.tmdb_id}`, "href")} class="group"> <div class="aspect-[2/3] rounded-lg overflow-hidden mb-2"> <img${addAttribute(getPosterUrl(item.movie.poster_path, "w342"), "src")}${addAttribute(item.movie.title, "alt")} class="w-full h-full object-cover group-hover:scale-105 transition"> </div> <h3 class="font-medium text-sm truncate">${item.movie.title}</h3> <p class="text-xs text-gw-text-secondary">${item.movie.year}</p> </a>`)} </div> </section>`} ${later.length > 3 && renderTemplate`<div class="bg-gw-card/50 border border-gw-border rounded-xl p-4 text-center"> <p class="text-sm text-gw-text-secondary">You have ${later.length} movies without a date.</p> <button class="mt-2 text-gw-accent hover:underline text-sm">Plan your week →</button> </div>`} </div>`} </div> </main> ` })} <!-- Plan Date Modal --> <div id="plan-modal" class="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm hidden"> <div class="min-h-screen flex items-center justify-center px-4"> <div class="w-full max-w-sm bg-gw-card border border-gw-border rounded-2xl p-6"> <h3 class="text-lg font-bold mb-4">When do you want to watch?</h3> <div class="space-y-2"> <button class="w-full text-left px-4 py-3 bg-gw-bg hover:bg-gw-border rounded-lg transition" data-date="today">🌙 Tonight</button> <button class="w-full text-left px-4 py-3 bg-gw-bg hover:bg-gw-border rounded-lg transition" data-date="tomorrow">📅 Tomorrow</button> <button class="w-full text-left px-4 py-3 bg-gw-bg hover:bg-gw-border rounded-lg transition" data-date="weekend">🎉 This Weekend</button> <button class="w-full text-left px-4 py-3 bg-gw-bg hover:bg-gw-border rounded-lg transition" data-date="later">📌 Save for Later</button> </div> <div class="mt-4 pt-4 border-t border-gw-border"> <p class="text-sm text-gw-text-secondary mb-3">Watching with?</p> <div class="flex gap-2"> <button class="flex-1 px-3 py-2 bg-gw-bg hover:bg-gw-accent hover:text-gw-bg rounded-lg text-sm transition" data-context="solo">Solo</button> <button class="flex-1 px-3 py-2 bg-gw-bg hover:bg-gw-accent hover:text-gw-bg rounded-lg text-sm transition" data-context="partner">Partner</button> <button class="flex-1 px-3 py-2 bg-gw-bg hover:bg-gw-accent hover:text-gw-bg rounded-lg text-sm transition" data-context="family">Family</button> </div> </div> <button id="close-plan-modal" class="mt-4 w-full py-2 text-gw-text-secondary hover:text-white">Cancel</button> </div> </div> </div> ${renderScript($$result, "/Users/parikshitjhajharia/Desktop/GOODWATCH/goodwatch-web/src/pages/watchlist.astro?astro&type=script&index=0&lang.ts")}`;
}, "/Users/parikshitjhajharia/Desktop/GOODWATCH/goodwatch-web/src/pages/watchlist.astro", void 0);

const $$file = "/Users/parikshitjhajharia/Desktop/GOODWATCH/goodwatch-web/src/pages/watchlist.astro";
const $$url = "/watchlist";

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: $$Watchlist,
  file: $$file,
  prerender,
  url: $$url
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
