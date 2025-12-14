globalThis.process ??= {}; globalThis.process.env ??= {};
/* empty css                               */
import { e as createAstro, f as createComponent, k as renderComponent, r as renderTemplate, m as maybeRenderHead, h as addAttribute, l as Fragment } from '../chunks/astro/server_AFKA17W8.mjs';
import { $ as $$Layout } from '../chunks/Layout_D6ytcMm7.mjs';
import { o as searchMovies, p as getTrendingMovies, e as getPosterUrl } from '../chunks/supabase_CNgPmO2d.mjs';
export { renderers } from '../renderers.mjs';

const $$Astro = createAstro("https://goodwatch.movie");
const prerender = false;
const $$Search = createComponent(async ($$result, $$props, $$slots) => {
  const Astro2 = $$result.createAstro($$Astro, $$props, $$slots);
  Astro2.self = $$Search;
  const query = Astro2.url.searchParams.get("q") || "";
  const results = query ? await searchMovies(query, 30) : [];
  const trending = !query ? await getTrendingMovies(12) : [];
  return renderTemplate`${renderComponent($$result, "Layout", $$Layout, { "title": query ? `Search: ${query}` : "Search Movies", "description": query ? `Search results for "${query}" on GoodWatch. Find movies that match your search.` : "Search for movies on GoodWatch. Find any film by title, actor, or keyword.", "noindex": !query }, { "default": async ($$result2) => renderTemplate` ${maybeRenderHead()}<section class="py-16 px-4"> <div class="max-w-4xl mx-auto"> <!-- Search Form --> <form action="/search" method="get" class="mb-12"> <div class="relative"> <input type="search" name="q"${addAttribute(query, "value")} placeholder="Search movies..." class="w-full bg-gw-card border border-gw-border rounded-full px-6 py-4 text-lg focus:outline-none focus:border-gw-accent transition pl-14" autofocus> <svg class="w-6 h-6 text-gw-text-secondary absolute left-5 top-1/2 -translate-y-1/2" fill="none" stroke="currentColor" viewBox="0 0 24 24"> <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path> </svg> </div> </form> ${query ? renderTemplate`<!-- Search Results -->
        <div> <h1 class="text-2xl font-bold mb-2"> ${results.length > 0 ? `Found ${results.length} results for "${query}"` : `No results for "${query}"`} </h1> ${results.length === 0 && renderTemplate`<p class="text-gw-text-secondary mb-8">Try a different search term or browse by mood or genre.</p>`} ${results.length > 0 && renderTemplate`<div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 mt-8"> ${results.map((movie) => renderTemplate`<a${addAttribute(`/movie/${movie.tmdb_id}`, "href")} class="group"> <div class="aspect-[2/3] rounded-lg overflow-hidden bg-gw-card mb-2"> <img${addAttribute(getPosterUrl(movie.poster_path, "w300"), "src")}${addAttribute(movie.title, "alt")} class="w-full h-full object-cover group-hover:scale-105 transition duration-300" loading="lazy"> </div> <h3 class="font-medium text-sm line-clamp-1 group-hover:text-gw-accent transition"> ${movie.title} </h3> <div class="flex items-center gap-2 text-xs text-gw-text-secondary"> <span>${movie.year}</span> ${movie.vote_average && renderTemplate`${renderComponent($$result2, "Fragment", Fragment, {}, { "default": async ($$result3) => renderTemplate` <span>•</span> <span class="flex items-center gap-1"> <svg class="w-3 h-3 text-yellow-400" fill="currentColor" viewBox="0 0 24 24"> <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"></path> </svg> ${movie.vote_average.toFixed(1)} </span> ` })}`} </div> </a>`)} </div>`} </div>` : renderTemplate`<!-- Trending (no search) -->
        <div> <h1 class="text-2xl font-bold mb-6">Trending Movies</h1> <p class="text-gw-text-secondary mb-8">
Search for any movie, or check out what's popular right now.
</p> <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4"> ${trending.map((movie) => renderTemplate`<a${addAttribute(`/movie/${movie.tmdb_id}`, "href")} class="group"> <div class="aspect-[2/3] rounded-lg overflow-hidden bg-gw-card mb-2"> <img${addAttribute(getPosterUrl(movie.poster_path, "w300"), "src")}${addAttribute(movie.title, "alt")} class="w-full h-full object-cover group-hover:scale-105 transition duration-300" loading="lazy"> </div> <h3 class="font-medium text-sm line-clamp-1 group-hover:text-gw-accent transition"> ${movie.title} </h3> </a>`)} </div> </div>`} </div> </section> ` })}`;
}, "/Users/parikshitjhajharia/Desktop/GOODWATCH/goodwatch-web/src/pages/search.astro", void 0);

const $$file = "/Users/parikshitjhajharia/Desktop/GOODWATCH/goodwatch-web/src/pages/search.astro";
const $$url = "/search";

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: $$Search,
  file: $$file,
  prerender,
  url: $$url
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
