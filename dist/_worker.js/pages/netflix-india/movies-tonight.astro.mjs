globalThis.process ??= {}; globalThis.process.env ??= {};
/* empty css                                    */
import { f as createComponent, k as renderComponent, r as renderTemplate, m as maybeRenderHead, h as addAttribute } from '../../chunks/astro/server_Cyy51z0E.mjs';
import { $ as $$Layout } from '../../chunks/Layout_B6Hz-kRD.mjs';
import { s as supabase, f as getPosterUrl } from '../../chunks/supabase_MFvNP5ai.mjs';
export { renderers } from '../../renderers.mjs';

const prerender = false;
const $$MoviesTonight = createComponent(async ($$result, $$props, $$slots) => {
  const { data: snapshots } = await supabase.from("decision_snapshots").select("tmdb_id, confidence_score, providers, movie_id").eq("region", "IN").eq("is_valid", true).gte("confidence_score", 0.4).order("confidence_score", { ascending: false }).limit(200);
  const netflixSnapshots = snapshots?.filter(
    (s) => s.providers?.some(
      (p) => p.name?.toLowerCase().includes("netflix") && p.type === "flatrate"
    )
  ) || [];
  let movies = [];
  if (netflixSnapshots.length > 0) {
    const movieIds = netflixSnapshots.map((s) => s.movie_id).filter(Boolean);
    const { data: movieData } = await supabase.from("movies").select("id, tmdb_id, title, year, poster_path, overview, runtime, genres, imdb_rating, imdb_votes, original_language").in("id", movieIds).not("imdb_rating", "is", null).gte("imdb_rating", 6).order("imdb_votes", { ascending: false });
    if (movieData) {
      movies = movieData.slice(0, 30);
    }
  }
  const topRated = [...movies].sort((a, b) => (b.imdb_rating || 0) - (a.imdb_rating || 0)).slice(0, 10);
  const hindiMovies = movies.filter((m) => m.original_language === "hi").slice(0, 8);
  const englishMovies = movies.filter((m) => m.original_language === "en").slice(0, 8);
  const shortMovies = movies.filter((m) => m.runtime && m.runtime <= 100).slice(0, 6);
  function getGenreName(g) {
    return typeof g === "string" ? g : g?.name || "";
  }
  const today = (/* @__PURE__ */ new Date()).toLocaleDateString("en-IN", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric"
  });
  return renderTemplate`${renderComponent($$result, "Layout", $$Layout, { "title": "Best Movies on Netflix India Tonight - Updated Daily | GoodWatch", "description": "Discover the best movies streaming on Netflix India right now. Updated daily with IMDb ratings. Hindi, English & regional films available to watch tonight." }, { "default": async ($$result2) => renderTemplate` ${maybeRenderHead()}<main class="min-h-screen bg-gw-bg"> <article class="max-w-4xl mx-auto px-4 py-12"> <!-- Header --> <header class="mb-12"> <div class="flex items-center gap-3 mb-4"> <img src="https://image.tmdb.org/t/p/w92/pbpMk2JmcoNnQwx5JGpXngfoWtp.jpg" alt="Netflix" class="w-10 h-10 rounded"> <h1 class="text-3xl md:text-4xl font-bold">
Best Movies on Netflix India
</h1> </div> <p class="text-gw-text-secondary text-lg leading-relaxed mb-4">
Looking for something to watch on Netflix tonight? Here are the best movies currently streaming 
          on Netflix India — from Hollywood blockbusters to Bollywood hits, all verified available.
</p> <p class="text-sm text-gw-text-secondary"> <span class="text-gw-accent">●</span> Updated: ${today} · ${movies.length} movies verified
</p> </header> <!-- Top Rated on Netflix --> <section class="mb-16"> <h2 class="text-2xl font-semibold mb-6">Highest Rated on Netflix India</h2> <div class="grid gap-4"> ${topRated.map((movie, i) => renderTemplate`<a${addAttribute(`/movie/${movie.tmdb_id}`, "href")} class="flex gap-4 bg-gw-card border border-gw-border rounded-xl p-4 hover:border-gw-accent/50 transition group"> <div class="w-8 h-8 bg-gw-accent text-gw-bg rounded-full flex items-center justify-center font-bold text-sm flex-shrink-0"> ${i + 1} </div> <img${addAttribute(getPosterUrl(movie.poster_path, "w154"), "src")}${addAttribute(movie.title, "alt")} class="w-16 h-24 object-cover rounded-lg flex-shrink-0"${addAttribute(i < 5 ? "eager" : "lazy", "loading")}> <div class="flex-1 min-w-0"> <h3 class="font-semibold group-hover:text-gw-accent transition">${movie.title}</h3> <div class="flex flex-wrap items-center gap-2 text-sm text-gw-text-secondary mt-1"> <span>${movie.year}</span> ${movie.runtime && renderTemplate`<span>· ${movie.runtime} min</span>`} ${movie.imdb_rating && renderTemplate`<span class="flex items-center gap-1">
· <span class="bg-[#F5C518] text-black text-xs font-bold px-1 rounded">IMDb</span> <strong class="text-white">${Number(movie.imdb_rating).toFixed(1)}</strong> </span>`} </div> ${movie.genres && renderTemplate`<p class="text-xs text-gw-text-secondary mt-1"> ${movie.genres.slice(0, 3).map((g) => getGenreName(g)).join(" \xB7 ")} </p>`} </div> </a>`)} </div> </section> <!-- Hindi Movies --> ${hindiMovies.length > 0 && renderTemplate`<section class="mb-16"> <h2 class="text-2xl font-semibold mb-6">Best Hindi Movies on Netflix</h2> <div class="grid grid-cols-2 md:grid-cols-4 gap-4"> ${hindiMovies.map((movie, i) => renderTemplate`<a${addAttribute(`/movie/${movie.tmdb_id}`, "href")} class="group"> <div class="aspect-[2/3] rounded-lg overflow-hidden mb-2"> <img${addAttribute(getPosterUrl(movie.poster_path, "w342"), "src")}${addAttribute(movie.title, "alt")} class="w-full h-full object-cover group-hover:scale-105 transition" loading="lazy"> </div> <h3 class="font-medium text-sm truncate group-hover:text-gw-accent">${movie.title}</h3> <p class="text-xs text-gw-text-secondary"> ${movie.year} · IMDb ${Number(movie.imdb_rating).toFixed(1)} </p> </a>`)} </div> <a href="/browse?provider=netflix&language=hi" class="text-sm text-gw-accent mt-4 inline-block">
See all Hindi movies on Netflix →
</a> </section>`} <!-- English Movies --> ${englishMovies.length > 0 && renderTemplate`<section class="mb-16"> <h2 class="text-2xl font-semibold mb-6">Best English Movies on Netflix India</h2> <div class="grid grid-cols-2 md:grid-cols-4 gap-4"> ${englishMovies.map((movie, i) => renderTemplate`<a${addAttribute(`/movie/${movie.tmdb_id}`, "href")} class="group"> <div class="aspect-[2/3] rounded-lg overflow-hidden mb-2"> <img${addAttribute(getPosterUrl(movie.poster_path, "w342"), "src")}${addAttribute(movie.title, "alt")} class="w-full h-full object-cover group-hover:scale-105 transition" loading="lazy"> </div> <h3 class="font-medium text-sm truncate group-hover:text-gw-accent">${movie.title}</h3> <p class="text-xs text-gw-text-secondary"> ${movie.year} · IMDb ${Number(movie.imdb_rating).toFixed(1)} </p> </a>`)} </div> </section>`} <!-- Quick Watches --> ${shortMovies.length > 0 && renderTemplate`<section class="mb-16"> <h2 class="text-2xl font-semibold mb-6">Quick Watches (Under 100 min)</h2> <div class="grid gap-3"> ${shortMovies.map((movie) => renderTemplate`<a${addAttribute(`/movie/${movie.tmdb_id}`, "href")} class="flex items-center gap-4 bg-gw-card/50 border border-gw-border rounded-lg p-3 hover:border-gw-accent/50 transition"> <img${addAttribute(getPosterUrl(movie.poster_path, "w92"), "src")}${addAttribute(movie.title, "alt")} class="w-12 h-16 object-cover rounded" loading="lazy"> <div class="flex-1"> <h3 class="font-medium">${movie.title}</h3> <p class="text-sm text-gw-text-secondary">${movie.year} · ${movie.runtime} min · IMDb ${Number(movie.imdb_rating).toFixed(1)}</p> </div> </a>`)} </div> </section>`} <!-- Other Platforms --> <section class="mb-16"> <h2 class="text-2xl font-semibold mb-6">Also Check</h2> <div class="grid md:grid-cols-3 gap-4"> <a href="/prime-video-india/movies-tonight" class="bg-gw-card border border-gw-border rounded-xl p-4 hover:border-gw-accent/50 transition"> <h3 class="font-medium mb-1">Prime Video India</h3> <p class="text-sm text-gw-text-secondary">Best movies on Amazon Prime</p> </a> <a href="/jiohotstar/movies-tonight" class="bg-gw-card border border-gw-border rounded-xl p-4 hover:border-gw-accent/50 transition"> <h3 class="font-medium mb-1">JioHotstar</h3> <p class="text-sm text-gw-text-secondary">Movies streaming on Hotstar</p> </a> <a href="/movies-to-watch-tonight" class="bg-gw-card border border-gw-border rounded-xl p-4 hover:border-gw-accent/50 transition"> <h3 class="font-medium mb-1">All Platforms</h3> <p class="text-sm text-gw-text-secondary">Best across all OTTs</p> </a> </div> </section> <!-- FAQs --> <section class="mb-16"> <h2 class="text-2xl font-semibold mb-6">FAQs</h2> <div class="space-y-4" itemscope itemtype="https://schema.org/FAQPage"> <div itemscope itemprop="mainEntity" itemtype="https://schema.org/Question" class="bg-gw-card border border-gw-border rounded-xl p-5"> <h3 itemprop="name" class="font-medium mb-2">What are the best movies on Netflix India right now?</h3> <div itemscope itemprop="acceptedAnswer" itemtype="https://schema.org/Answer"> <p itemprop="text" class="text-sm text-gw-text-secondary">
The top-rated movies on Netflix India include ${topRated.slice(0, 3).map((m) => m.title).join(", ")}, 
                and more. This list is updated daily based on IMDb ratings and verified availability.
</p> </div> </div> <div itemscope itemprop="mainEntity" itemtype="https://schema.org/Question" class="bg-gw-card border border-gw-border rounded-xl p-5"> <h3 itemprop="name" class="font-medium mb-2">Does Netflix India have good Hindi movies?</h3> <div itemscope itemprop="acceptedAnswer" itemtype="https://schema.org/Answer"> <p itemprop="text" class="text-sm text-gw-text-secondary">
Yes, Netflix India has a solid collection of Hindi movies including originals and theatrical releases.
                Popular Hindi films currently streaming include ${hindiMovies.slice(0, 2).map((m) => m.title).join(" and ")}.
</p> </div> </div> <div itemscope itemprop="mainEntity" itemtype="https://schema.org/Question" class="bg-gw-card border border-gw-border rounded-xl p-5"> <h3 itemprop="name" class="font-medium mb-2">How often is this list updated?</h3> <div itemscope itemprop="acceptedAnswer" itemtype="https://schema.org/Answer"> <p itemprop="text" class="text-sm text-gw-text-secondary">
This list is updated daily. We verify availability on Netflix India and refresh IMDb ratings 
                to ensure you're seeing accurate information about what's actually watchable tonight.
</p> </div> </div> </div> </section> <!-- CTA --> <section class="text-center py-8 border-t border-gw-border"> <h2 class="text-xl font-semibold mb-3">Too many choices?</h2> <p class="text-gw-text-secondary mb-6">Get one perfect recommendation based on your mood and available time.</p> <a href="/tonight" class="inline-flex items-center gap-2 bg-gw-accent hover:bg-gw-accent-hover text-gw-bg px-6 py-3 rounded-full font-semibold transition">
Pick for me →
</a> </section> </article> </main> ` })}`;
}, "/Users/parikshitjhajharia/Desktop/GOODWATCH/goodwatch-web/src/pages/netflix-india/movies-tonight.astro", void 0);

const $$file = "/Users/parikshitjhajharia/Desktop/GOODWATCH/goodwatch-web/src/pages/netflix-india/movies-tonight.astro";
const $$url = "/netflix-india/movies-tonight";

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: $$MoviesTonight,
  file: $$file,
  prerender,
  url: $$url
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
