globalThis.process ??= {}; globalThis.process.env ??= {};
/* empty css                                 */
import { f as createComponent, k as renderComponent, r as renderTemplate, m as maybeRenderHead, h as addAttribute } from '../chunks/astro/server_Cyy51z0E.mjs';
import { $ as $$Layout } from '../chunks/Layout_B6Hz-kRD.mjs';
import { h as getTopRatedMovies, i as getHiddenGems, M as MOODS, G as GENRES, f as getPosterUrl, e as slugify } from '../chunks/supabase_MFvNP5ai.mjs';
export { renderers } from '../renderers.mjs';

const $$Index = createComponent(async ($$result, $$props, $$slots) => {
  const topRated = await getTopRatedMovies(6);
  const hiddenGems = await getHiddenGems(6);
  const siteUrl = "https://goodwatch.movie";
  const BEST_COMBINATIONS = [
    { slug: "feel-good-comedies", title: "Feel-Good Comedies", mood: "Feel-Good", genre: "Comedy" },
    { slug: "romantic-dramas", title: "Romantic Dramas", mood: "Romantic", genre: "Drama" },
    { slug: "thrilling-action", title: "Thrilling Action Movies", mood: "Thrilling", genre: "Action" },
    { slug: "mind-bending-sci-fi", title: "Mind-Bending Sci-Fi", mood: "Mind-Bending", genre: "Science Fiction" },
    { slug: "dark-thrillers", title: "Dark Thrillers", mood: "Dark", genre: "Thriller" },
    { slug: "inspirational-dramas", title: "Inspirational Dramas", mood: "Inspirational", genre: "Drama" },
    { slug: "funny-animations", title: "Funny Animated Movies", mood: "Funny", genre: "Animation" },
    { slug: "adventurous-fantasy", title: "Adventurous Fantasy Films", mood: "Adventurous", genre: "Fantasy" },
    { slug: "emotional-romance", title: "Emotional Romance Movies", mood: "Emotional", genre: "Romance" },
    { slug: "mysterious-crime", title: "Mysterious Crime Films", mood: "Mysterious", genre: "Crime" },
    { slug: "nostalgic-family", title: "Nostalgic Family Movies", mood: "Nostalgic", genre: "Family" },
    { slug: "intense-horror", title: "Intense Horror Movies", mood: "Intense", genre: "Horror" },
    { slug: "uplifting-musicals", title: "Uplifting Musicals", mood: "Uplifting", genre: "Music" },
    { slug: "thought-provoking-documentaries", title: "Thought-Provoking Documentaries", mood: "Thought-Provoking", genre: "Documentary" },
    { slug: "relaxing-comedies", title: "Relaxing Comedies", mood: "Relaxing", genre: "Comedy" }
  ];
  const schema = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    "name": "Best Movies - Curated Lists",
    "description": "Discover the best movies across every mood and genre combination. Curated lists of must-watch films.",
    "url": `${siteUrl}/best`
  };
  return renderTemplate`${renderComponent($$result, "Layout", $$Layout, { "title": "Best Movies 2025 | Curated Lists by Mood & Genre", "description": "Discover the best movies to watch in 2025. Browse curated lists by mood and genre: feel-good comedies, dark thrillers, mind-bending sci-fi and more.", "schema": schema }, { "default": async ($$result2) => renderTemplate` ${maybeRenderHead()}<div class="max-w-7xl mx-auto px-4 py-12"> <nav class="text-sm text-gw-text-secondary mb-6"> <a href="/" class="hover:text-white">Home</a> <span class="mx-2">›</span> <span class="text-white">Best Movies</span> </nav> <h1 class="text-4xl md:text-5xl font-bold mb-4">Best Movies to Watch</h1> <p class="text-xl text-gw-text-secondary mb-12 max-w-3xl">
Curated lists combining mood and genre for the perfect movie recommendation.
      Find exactly what you're in the mood for.
</p> <!-- Curated Combinations --> <section class="mb-16"> <h2 class="text-2xl font-bold mb-6">Best By Category</h2> <div class="grid sm:grid-cols-2 lg:grid-cols-3 gap-4"> ${BEST_COMBINATIONS.map((combo) => renderTemplate`<a${addAttribute(`/best/${combo.slug}`, "href")} class="bg-gw-card hover:bg-gw-border border border-gw-border rounded-xl p-5 transition group"> <h3 class="font-bold mb-2 group-hover:text-gw-accent transition">
Best ${combo.title} </h3> <div class="flex gap-2"> <span class="text-xs px-2 py-1 bg-gw-bg rounded-full text-gw-text-secondary">${combo.mood}</span> <span class="text-xs px-2 py-1 bg-gw-bg rounded-full text-gw-text-secondary">${combo.genre}</span> </div> </a>`)} </div> </section> <!-- Top Rated --> <section class="mb-16"> <div class="flex items-center justify-between mb-6"> <h2 class="text-2xl font-bold">Top Rated of All Time</h2> </div> <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-4"> ${topRated.map((movie) => renderTemplate`<a${addAttribute(`/movie/${movie.tmdb_id}`, "href")} class="group"> <div class="aspect-[2/3] rounded-lg overflow-hidden bg-gw-card mb-2"> <img${addAttribute(getPosterUrl(movie.poster_path, "w300"), "src")}${addAttribute(movie.title, "alt")} class="w-full h-full object-cover group-hover:scale-105 transition duration-300" loading="lazy"> </div> <h3 class="font-medium text-sm line-clamp-1">${movie.title}</h3> <span class="text-xs text-gw-text-secondary flex items-center gap-1"> <svg class="w-3 h-3 text-yellow-400" fill="currentColor" viewBox="0 0 24 24"> <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"></path> </svg> ${movie.vote_average?.toFixed(1)} </span> </a>`)} </div> </section> <!-- Hidden Gems --> <section class="mb-16"> <div class="flex items-center justify-between mb-6"> <h2 class="text-2xl font-bold">Hidden Gems</h2> </div> <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-4"> ${hiddenGems.map((movie) => renderTemplate`<a${addAttribute(`/movie/${movie.tmdb_id}`, "href")} class="group"> <div class="aspect-[2/3] rounded-lg overflow-hidden bg-gw-card mb-2"> <img${addAttribute(getPosterUrl(movie.poster_path, "w300"), "src")}${addAttribute(movie.title, "alt")} class="w-full h-full object-cover group-hover:scale-105 transition duration-300" loading="lazy"> </div> <h3 class="font-medium text-sm line-clamp-1">${movie.title}</h3> <span class="text-xs text-gw-text-secondary flex items-center gap-1"> <svg class="w-3 h-3 text-yellow-400" fill="currentColor" viewBox="0 0 24 24"> <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"></path> </svg> ${movie.vote_average?.toFixed(1)} </span> </a>`)} </div> </section> <!-- Browse Links --> <section class="border-t border-gw-border pt-12"> <h2 class="text-2xl font-bold mb-6">More Ways to Discover</h2> <div class="grid md:grid-cols-2 gap-8"> <div> <h3 class="text-lg font-bold mb-4">By Mood</h3> <div class="flex flex-wrap gap-2"> ${MOODS.map((mood) => renderTemplate`<a${addAttribute(`/mood/${slugify(mood)}`, "href")} class="px-3 py-1.5 bg-gw-card hover:bg-gw-accent hover:text-gw-bg border border-gw-border rounded-full text-sm transition"> ${mood} </a>`)} </div> </div> <div> <h3 class="text-lg font-bold mb-4">By Genre</h3> <div class="flex flex-wrap gap-2"> ${GENRES.map((genre) => renderTemplate`<a${addAttribute(`/genre/${slugify(genre)}`, "href")} class="px-3 py-1.5 bg-gw-card hover:bg-gw-border border border-gw-border rounded-full text-sm transition"> ${genre} </a>`)} </div> </div> </div> </section> </div> ` })}`;
}, "/Users/parikshitjhajharia/Desktop/GOODWATCH/goodwatch-web/src/pages/best/index.astro", void 0);

const $$file = "/Users/parikshitjhajharia/Desktop/GOODWATCH/goodwatch-web/src/pages/best/index.astro";
const $$url = "/best";

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: $$Index,
  file: $$file,
  url: $$url
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
