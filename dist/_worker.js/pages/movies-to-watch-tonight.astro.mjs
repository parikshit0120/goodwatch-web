globalThis.process ??= {}; globalThis.process.env ??= {};
/* empty css                                 */
import { f as createComponent, k as renderComponent, r as renderTemplate, m as maybeRenderHead, h as addAttribute } from '../chunks/astro/server_Cyy51z0E.mjs';
import { $ as $$Layout } from '../chunks/Layout_B6Hz-kRD.mjs';
import { s as supabase, f as getPosterUrl } from '../chunks/supabase_MFvNP5ai.mjs';
export { renderers } from '../renderers.mjs';

const prerender = false;
const $$MoviesToWatchTonight = createComponent(async ($$result, $$props, $$slots) => {
  const { data: snapshots } = await supabase.from("decision_snapshots").select("tmdb_id, confidence_score, providers, movie_id").eq("region", "IN").eq("is_valid", true).gte("confidence_score", 0.4).order("confidence_score", { ascending: false }).limit(50);
  let movies = [];
  if (snapshots && snapshots.length > 0) {
    const movieIds = snapshots.map((s) => s.movie_id).filter(Boolean);
    const { data: movieData } = await supabase.from("movies").select("id, tmdb_id, title, year, poster_path, overview, runtime, genres, imdb_rating, imdb_votes").in("id", movieIds).not("imdb_rating", "is", null).gte("imdb_rating", 6.5).order("imdb_votes", { ascending: false });
    if (movieData) {
      movies = snapshots.map((snap) => {
        const movie = movieData.find((m) => m.id === snap.movie_id);
        if (!movie) return null;
        const provider = snap.providers?.find((p) => p.type === "flatrate");
        return { ...movie, provider: provider?.name || null };
      }).filter(Boolean).slice(0, 15);
    }
  }
  const comforting = movies.filter(
    (m) => m.genres?.some((g) => ["Comedy", "Romance", "Family", "Animation"].includes(g.name || g))
  ).slice(0, 5);
  const thrilling = movies.filter(
    (m) => m.genres?.some((g) => ["Thriller", "Action", "Crime", "Mystery"].includes(g.name || g))
  ).slice(0, 5);
  const relaxing = movies.filter(
    (m) => m.genres?.some((g) => ["Drama", "Documentary"].includes(g.name || g)) && m.runtime < 120
  ).slice(0, 5);
  const today = (/* @__PURE__ */ new Date()).toLocaleDateString("en-IN", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric"
  });
  return renderTemplate`${renderComponent($$result, "Layout", $$Layout, { "title": "Good Movies to Watch Tonight (India) - Updated Daily | GoodWatch", "description": "Not sure what to watch tonight? Here are the best movies streaming right now on Netflix, Prime Video & JioHotstar in India. Updated daily with availability checked." }, { "default": async ($$result2) => renderTemplate` ${maybeRenderHead()}<main class="min-h-screen bg-gw-bg"> <article class="max-w-4xl mx-auto px-4 py-12"> <!-- H1 + Intro --> <header class="mb-12"> <h1 class="text-3xl md:text-4xl font-bold mb-4">
Good Movies to Watch Tonight
</h1> <p class="text-gw-text-secondary text-lg leading-relaxed mb-4">
Not sure what to watch tonight? These movies are worth your time, easy to start, 
          and available to stream right now in India on Netflix, Prime Video, JioHotstar & more.
</p> <p class="text-sm text-gw-text-secondary"> <span class="text-gw-accent">●</span> Updated: ${today} · Availability verified
</p> </header> <!-- Top Picks --> <section class="mb-16"> <h2 class="text-2xl font-semibold mb-6">Tonight's Top Picks</h2> <div class="grid gap-6"> ${movies.slice(0, 7).map((movie, i) => renderTemplate`<a${addAttribute(`/movie/${movie.tmdb_id}`, "href")} class="flex gap-4 bg-gw-card border border-gw-border rounded-xl p-4 hover:border-gw-accent/50 transition group"> <img${addAttribute(getPosterUrl(movie.poster_path, "w185"), "src")}${addAttribute(movie.title, "alt")} class="w-20 h-28 object-cover rounded-lg flex-shrink-0"${addAttribute(i < 3 ? "eager" : "lazy", "loading")}> <div class="flex-1 min-w-0"> <h3 class="font-semibold text-lg group-hover:text-gw-accent transition">${movie.title}</h3> <div class="flex flex-wrap items-center gap-2 text-sm text-gw-text-secondary mt-1"> <span>${movie.year}</span> ${movie.runtime && renderTemplate`<span>· ${Math.floor(movie.runtime / 60)}h ${movie.runtime % 60}m</span>`} ${movie.imdb_rating && renderTemplate`<span class="flex items-center gap-1">
· <span class="bg-[#F5C518] text-black text-xs font-bold px-1 rounded">IMDb</span> ${Number(movie.imdb_rating).toFixed(1)} </span>`} </div> ${movie.provider && renderTemplate`<p class="text-sm text-gw-accent mt-2">Available on ${movie.provider}</p>`} ${movie.overview && renderTemplate`<p class="text-sm text-gw-text-secondary mt-2 line-clamp-2">${movie.overview}</p>`} </div> </a>`)} </div> </section> <!-- By Mood --> <section class="mb-16"> <h2 class="text-2xl font-semibold mb-6">Pick by Mood</h2> <div class="grid md:grid-cols-3 gap-6"> ${comforting.length > 0 && renderTemplate`<div> <h3 class="font-medium mb-3 text-gw-text-secondary">Comforting & Light</h3> <ul class="space-y-2"> ${comforting.map((m) => renderTemplate`<li> <a${addAttribute(`/movie/${m.tmdb_id}`, "href")} class="text-sm hover:text-gw-accent transition"> ${m.title} (${m.year})
</a> </li>`)} </ul> <a href="/mood/comforting" class="text-sm text-gw-accent mt-3 inline-block">See all comforting →</a> </div>`} ${thrilling.length > 0 && renderTemplate`<div> <h3 class="font-medium mb-3 text-gw-text-secondary">Thrilling & Intense</h3> <ul class="space-y-2"> ${thrilling.map((m) => renderTemplate`<li> <a${addAttribute(`/movie/${m.tmdb_id}`, "href")} class="text-sm hover:text-gw-accent transition"> ${m.title} (${m.year})
</a> </li>`)} </ul> <a href="/mood/thrilling" class="text-sm text-gw-accent mt-3 inline-block">See all thrillers →</a> </div>`} ${relaxing.length > 0 && renderTemplate`<div> <h3 class="font-medium mb-3 text-gw-text-secondary">Relaxing & Easy</h3> <ul class="space-y-2"> ${relaxing.map((m) => renderTemplate`<li> <a${addAttribute(`/movie/${m.tmdb_id}`, "href")} class="text-sm hover:text-gw-accent transition"> ${m.title} (${m.year})
</a> </li>`)} </ul> <a href="/mood/relaxing" class="text-sm text-gw-accent mt-3 inline-block">See all relaxing →</a> </div>`} </div> </section> <!-- By Time --> <section class="mb-16"> <h2 class="text-2xl font-semibold mb-6">Pick by Time & Effort</h2> <div class="grid md:grid-cols-2 gap-4"> <a href="/browse?runtime=90" class="bg-gw-card border border-gw-border rounded-xl p-4 hover:border-gw-accent/50 transition"> <h3 class="font-medium mb-1">Under 90 Minutes</h3> <p class="text-sm text-gw-text-secondary">Quick watches for a short evening</p> </a> <a href="/browse?effort=low" class="bg-gw-card border border-gw-border rounded-xl p-4 hover:border-gw-accent/50 transition"> <h3 class="font-medium mb-1">No Heavy Thinking</h3> <p class="text-sm text-gw-text-secondary">Easy to follow, low mental effort</p> </a> <a href="/mood/comforting" class="bg-gw-card border border-gw-border rounded-xl p-4 hover:border-gw-accent/50 transition"> <h3 class="font-medium mb-1">After a Long Day</h3> <p class="text-sm text-gw-text-secondary">Comforting movies to unwind</p> </a> <a href="/browse?language=hi" class="bg-gw-card border border-gw-border rounded-xl p-4 hover:border-gw-accent/50 transition"> <h3 class="font-medium mb-1">Hindi Movies Tonight</h3> <p class="text-sm text-gw-text-secondary">Best Bollywood picks streaming now</p> </a> </div> </section> <!-- FAQs (Critical for SEO) --> <section class="mb-16"> <h2 class="text-2xl font-semibold mb-6">Frequently Asked Questions</h2> <div class="space-y-6" itemscope itemtype="https://schema.org/FAQPage"> <div itemscope itemprop="mainEntity" itemtype="https://schema.org/Question" class="bg-gw-card border border-gw-border rounded-xl p-5"> <h3 itemprop="name" class="font-medium mb-2">What is a good movie to watch tonight?</h3> <div itemscope itemprop="acceptedAnswer" itemtype="https://schema.org/Answer"> <p itemprop="text" class="text-sm text-gw-text-secondary">
A good movie to watch tonight depends on your mood and available time. For a relaxing evening, try a feel-good comedy or light drama. 
                For something engaging, go for a thriller or mystery. All movies on this page are verified to be streaming in India right now.
</p> </div> </div> <div itemscope itemprop="mainEntity" itemtype="https://schema.org/Question" class="bg-gw-card border border-gw-border rounded-xl p-5"> <h3 itemprop="name" class="font-medium mb-2">Which streaming service has the best movies in India?</h3> <div itemscope itemprop="acceptedAnswer" itemtype="https://schema.org/Answer"> <p itemprop="text" class="text-sm text-gw-text-secondary">
Netflix, Amazon Prime Video, and JioHotstar have the largest movie libraries in India. 
                GoodWatch checks availability across all major platforms so you can see exactly where each movie is streaming.
</p> </div> </div> <div itemscope itemprop="mainEntity" itemtype="https://schema.org/Question" class="bg-gw-card border border-gw-border rounded-xl p-5"> <h3 itemprop="name" class="font-medium mb-2">How do I decide what movie to watch?</h3> <div itemscope itemprop="acceptedAnswer" itemtype="https://schema.org/Answer"> <p itemprop="text" class="text-sm text-gw-text-secondary">
Start with your mood: do you want something light, intense, or emotional? 
                Then check your available time — if you have less than 2 hours, filter for shorter films.
                GoodWatch's <a href="/tonight" class="text-gw-accent">Tonight feature</a> picks one movie for you based on what's actually available.
</p> </div> </div> <div itemscope itemprop="mainEntity" itemtype="https://schema.org/Question" class="bg-gw-card border border-gw-border rounded-xl p-5"> <h3 itemprop="name" class="font-medium mb-2">Are these movies available to stream in India?</h3> <div itemscope itemprop="acceptedAnswer" itemtype="https://schema.org/Answer"> <p itemprop="text" class="text-sm text-gw-text-secondary">
Yes. Every movie on this page is verified to be available on at least one streaming service in India (Netflix, Prime Video, JioHotstar, SonyLIV, ZEE5, or JioCinema).
                We update availability daily.
</p> </div> </div> </div> </section> <!-- CTA --> <section class="text-center py-8 border-t border-gw-border"> <h2 class="text-xl font-semibold mb-3">Can't decide?</h2> <p class="text-gw-text-secondary mb-6">Let GoodWatch pick one movie for you — no scrolling required.</p> <a href="/tonight" class="inline-flex items-center gap-2 bg-gw-accent hover:bg-gw-accent-hover text-gw-bg px-6 py-3 rounded-full font-semibold transition">
Get Tonight's Pick →
</a> </section> </article> </main> ` })}`;
}, "/Users/parikshitjhajharia/Desktop/GOODWATCH/goodwatch-web/src/pages/movies-to-watch-tonight.astro", void 0);

const $$file = "/Users/parikshitjhajharia/Desktop/GOODWATCH/goodwatch-web/src/pages/movies-to-watch-tonight.astro";
const $$url = "/movies-to-watch-tonight";

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: $$MoviesToWatchTonight,
  file: $$file,
  prerender,
  url: $$url
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
