globalThis.process ??= {}; globalThis.process.env ??= {};
/* empty css                                  */
import { e as createAstro, f as createComponent, k as renderComponent, n as renderScript, r as renderTemplate, u as unescapeHTML, h as addAttribute, l as Fragment, m as maybeRenderHead } from '../../chunks/astro/server_AFKA17W8.mjs';
import { $ as $$Layout } from '../../chunks/Layout_D6ytcMm7.mjs';
import { l as getMovieByTmdbId, e as getPosterUrl, m as getBackdropUrl, n as formatRuntime } from '../../chunks/supabase_CNgPmO2d.mjs';
export { renderers } from '../../renderers.mjs';

var __freeze = Object.freeze;
var __defProp = Object.defineProperty;
var __template = (cooked, raw) => __freeze(__defProp(cooked, "raw", { value: __freeze(cooked.slice()) }));
var _a;
const $$Astro = createAstro("https://goodwatch.movie");
const prerender = false;
const $$id = createComponent(async ($$result, $$props, $$slots) => {
  const Astro2 = $$result.createAstro($$Astro, $$props, $$slots);
  Astro2.self = $$id;
  const { id } = Astro2.params;
  const tmdbId = parseInt(id);
  if (isNaN(tmdbId)) {
    return Astro2.redirect("/404");
  }
  const movie = await getMovieByTmdbId(tmdbId);
  if (!movie) {
    return Astro2.redirect("/404");
  }
  const movieSchema = {
    "@context": "https://schema.org",
    "@type": "Movie",
    "name": movie.title,
    "description": movie.overview || `Watch ${movie.title} - discover this ${movie.genres?.join(", ")} film.`,
    "image": getPosterUrl(movie.poster_path, "w500"),
    "datePublished": movie.release_date,
    "duration": movie.runtime ? `PT${movie.runtime}M` : void 0,
    "genre": movie.genres,
    "director": movie.director ? {
      "@type": "Person",
      "name": movie.director
    } : void 0,
    "actor": movie.movie_cast?.slice(0, 5).map((name) => ({
      "@type": "Person",
      "name": name
    })),
    "aggregateRating": movie.vote_average && movie.vote_count ? {
      "@type": "AggregateRating",
      "ratingValue": movie.vote_average.toFixed(1),
      "bestRating": "10",
      "worstRating": "0",
      "ratingCount": movie.vote_count
    } : void 0,
    "keywords": [...movie.genres || [], ...movie.mood_tags || []].join(", ")
  };
  Object.keys(movieSchema).forEach((key) => {
    if (movieSchema[key] === void 0) {
      delete movieSchema[key];
    }
  });
  const seoDescription = movie.overview ? movie.overview.slice(0, 155) + (movie.overview.length > 155 ? "..." : "") : `Discover ${movie.title} (${movie.year}) - a ${movie.genres?.slice(0, 2).join(", ")} film. Find out where to watch and see if it matches your mood.`;
  const streamingProviders = movie.streaming_providers?.IN?.flatrate || movie.streaming_providers?.US?.flatrate || [];
  return renderTemplate`${renderComponent($$result, "Layout", $$Layout, { "title": `${movie.title} (${movie.year}) - Where to Watch & Movie Details`, "description": seoDescription, "image": getBackdropUrl(movie.backdrop_path, "w1280"), "type": "article", "schema": movieSchema }, { "default": async ($$result2) => renderTemplate(_a || (_a = __template(["  ", '<section class="relative min-h-[50vh] md:min-h-[60vh]"> ', ' <div class="relative z-10 max-w-7xl mx-auto px-4 pt-20 pb-8 md:pt-32 md:pb-16"> <div class="flex flex-col md:flex-row gap-8"> <!-- Poster --> <div class="flex-shrink-0 mx-auto md:mx-0"> <img', "", ' class="w-48 md:w-64 rounded-xl shadow-2xl"> </div> <!-- Info --> <div class="flex-1 text-center md:text-left"> <h1 class="text-3xl md:text-5xl font-bold mb-3">', "</h1> ", ' <!-- Meta info --> <div class="flex flex-wrap justify-center md:justify-start items-center gap-4 text-sm text-gw-text-secondary mb-6"> ', " ", " ", " ", " </div> <!-- Genres --> ", ' <!-- Actions --> <div class="flex flex-wrap justify-center md:justify-start gap-3"> <button class="flex items-center gap-2 bg-gw-accent hover:bg-gw-accent-hover text-gw-bg px-6 py-3 rounded-full font-semibold transition"', ' id="add-to-watchlist"> <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"> <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"></path> </svg>\nAdd to Watchlist\n</button> <button class="flex items-center gap-2 bg-gw-card hover:bg-gw-border border border-gw-border px-6 py-3 rounded-full font-semibold transition" id="share-movie"> <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"> <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z"></path> </svg>\nShare\n</button> </div> </div> </div> </div> </section>  <section class="max-w-7xl mx-auto px-4 py-12"> <div class="grid grid-cols-1 lg:grid-cols-3 gap-12"> <!-- Main Content --> <div class="lg:col-span-2 space-y-10"> <!-- Overview --> ', " <!-- Cast --> ", " <!-- Director --> ", " <!-- Mood Tags --> ", ' </div> <!-- Sidebar --> <div class="space-y-8"> <!-- Where to Watch --> <div class="bg-gw-card border border-gw-border rounded-xl p-6"> <h3 class="text-xl font-bold mb-4">Where to Watch</h3> ', ' </div> <!-- Movie Details --> <div class="bg-gw-card border border-gw-border rounded-xl p-6"> <h3 class="text-xl font-bold mb-4">Details</h3> <dl class="space-y-4 text-sm"> ', " ", " ", " ", ' </dl> </div> <!-- Get App CTA --> <div class="bg-gradient-to-br from-gw-accent/20 to-gw-accent/5 border border-gw-accent/30 rounded-xl p-6 text-center"> <h3 class="text-lg font-bold mb-2">Discover More Movies</h3> <p class="text-sm text-gw-text-secondary mb-4">\nSwipe through movies that match your mood with the GoodWatch app.\n</p> <a href="/app" class="inline-block bg-gw-accent hover:bg-gw-accent-hover text-gw-bg px-6 py-2.5 rounded-full font-semibold text-sm transition">\nGet the App\n</a> </div> </div> </div> </section>  <script type="application/ld+json">', "<\/script> "])), maybeRenderHead(), movie.backdrop_path && renderTemplate`<div class="absolute inset-0"> <img${addAttribute(getBackdropUrl(movie.backdrop_path, "w1280"), "src")}${addAttribute(movie.title, "alt")} class="w-full h-full object-cover"> <div class="absolute inset-0 bg-gradient-to-t from-gw-bg via-gw-bg/70 to-transparent"></div> <div class="absolute inset-0 bg-gradient-to-r from-gw-bg/90 via-transparent to-transparent"></div> </div>`, addAttribute(getPosterUrl(movie.poster_path, "w500"), "src"), addAttribute(`${movie.title} poster`, "alt"), movie.title, movie.tagline && renderTemplate`<p class="text-lg text-gw-text-secondary italic mb-4">"${movie.tagline}"</p>`, movie.year && renderTemplate`<span>${movie.year}</span>`, movie.runtime && renderTemplate`${renderComponent($$result2, "Fragment", Fragment, {}, { "default": async ($$result3) => renderTemplate` <span>•</span> <span>${formatRuntime(movie.runtime)}</span> ` })}`, movie.vote_average && renderTemplate`${renderComponent($$result2, "Fragment", Fragment, {}, { "default": async ($$result3) => renderTemplate` <span>•</span> <span class="flex items-center gap-1 text-yellow-400"> <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"> <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"></path> </svg> ${movie.vote_average.toFixed(1)} </span> ` })}`, movie.language && renderTemplate`${renderComponent($$result2, "Fragment", Fragment, {}, { "default": async ($$result3) => renderTemplate` <span>•</span> <span class="uppercase">${movie.language}</span> ` })}`, movie.genres && movie.genres.length > 0 && renderTemplate`<div class="flex flex-wrap justify-center md:justify-start gap-2 mb-6"> ${movie.genres.map((genre) => renderTemplate`<a${addAttribute(`/genre/${genre.toLowerCase().replace(/\s+/g, "-")}`, "href")} class="px-3 py-1 bg-gw-card border border-gw-border rounded-full text-sm hover:bg-gw-accent hover:text-gw-bg hover:border-gw-accent transition"> ${genre} </a>`)} </div>`, addAttribute(movie.tmdb_id, "data-movie-id"), movie.overview && renderTemplate`<div> <h2 class="text-2xl font-bold mb-4">Overview</h2> <p class="text-gw-text-secondary leading-relaxed text-lg">${movie.overview}</p> </div>`, movie.movie_cast && movie.movie_cast.length > 0 && renderTemplate`<div> <h2 class="text-2xl font-bold mb-4">Cast</h2> <div class="flex flex-wrap gap-2"> ${movie.movie_cast.slice(0, 10).map((actor) => renderTemplate`<span class="px-3 py-1.5 bg-gw-card border border-gw-border rounded-full text-sm"> ${actor} </span>`)} </div> </div>`, movie.director && renderTemplate`<div> <h2 class="text-2xl font-bold mb-4">Director</h2> <span class="px-4 py-2 bg-gw-card border border-gw-border rounded-full"> ${movie.director} </span> </div>`, movie.mood_tags && movie.mood_tags.length > 0 && renderTemplate`<div> <h2 class="text-2xl font-bold mb-4">Perfect For</h2> <div class="flex flex-wrap gap-2"> ${movie.mood_tags.map((mood) => renderTemplate`<a${addAttribute(`/mood/${mood.toLowerCase().replace(/\s+/g, "-")}`, "href")} class="px-4 py-2 bg-gw-accent/20 text-gw-accent border border-gw-accent/30 rounded-full hover:bg-gw-accent hover:text-gw-bg transition"> ${mood} </a>`)} </div> </div>`, streamingProviders.length > 0 ? renderTemplate`<div class="space-y-3"> ${streamingProviders.map((provider) => renderTemplate`<div class="flex items-center gap-3 p-3 bg-gw-bg rounded-lg"> ${provider.logo_path && renderTemplate`<img${addAttribute(`https://image.tmdb.org/t/p/w92${provider.logo_path}`, "src")}${addAttribute(provider.provider_name, "alt")} class="w-10 h-10 rounded-lg">`} <span class="font-medium">${provider.provider_name}</span> </div>`)} </div>` : renderTemplate`<p class="text-gw-text-secondary">
Streaming availability not found. Check your local services.
</p>`, movie.release_date && renderTemplate`<div> <dt class="text-gw-text-secondary">Release Date</dt> <dd class="font-medium">${new Date(movie.release_date).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}</dd> </div>`, movie.runtime && renderTemplate`<div> <dt class="text-gw-text-secondary">Runtime</dt> <dd class="font-medium">${formatRuntime(movie.runtime)}</dd> </div>`, movie.language && renderTemplate`<div> <dt class="text-gw-text-secondary">Language</dt> <dd class="font-medium uppercase">${movie.language}</dd> </div>`, movie.vote_count && renderTemplate`<div> <dt class="text-gw-text-secondary">Ratings</dt> <dd class="font-medium">${movie.vote_count.toLocaleString()} votes</dd> </div>`, unescapeHTML(JSON.stringify({
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [
      { "@type": "ListItem", "position": 1, "name": "Home", "item": "https://goodwatch.app" },
      { "@type": "ListItem", "position": 2, "name": "Movies", "item": "https://goodwatch.app/movies" },
      { "@type": "ListItem", "position": 3, "name": movie.title, "item": `https://goodwatch.app/movie/${movie.tmdb_id}` }
    ]
  }))) })} ${renderScript($$result, "/Users/parikshitjhajharia/Desktop/GOODWATCH/goodwatch-web/src/pages/movie/[id].astro?astro&type=script&index=0&lang.ts")}`;
}, "/Users/parikshitjhajharia/Desktop/GOODWATCH/goodwatch-web/src/pages/movie/[id].astro", void 0);

const $$file = "/Users/parikshitjhajharia/Desktop/GOODWATCH/goodwatch-web/src/pages/movie/[id].astro";
const $$url = "/movie/[id]";

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: $$id,
  file: $$file,
  prerender,
  url: $$url
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
