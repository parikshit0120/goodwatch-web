globalThis.process ??= {}; globalThis.process.env ??= {};
/* empty css                               */
import { f as createComponent, k as renderComponent, r as renderTemplate, m as maybeRenderHead, h as addAttribute } from '../chunks/astro/server_AFKA17W8.mjs';
import { $ as $$Layout } from '../chunks/Layout_D6ytcMm7.mjs';
import { G as GENRES, s as slugify } from '../chunks/supabase_CNgPmO2d.mjs';
export { renderers } from '../renderers.mjs';

const $$Genres = createComponent(($$result, $$props, $$slots) => {
  const genreIcons = {
    "Action": "\u{1F4A5}",
    "Adventure": "\u{1F5FA}\uFE0F",
    "Animation": "\u{1F3A8}",
    "Comedy": "\u{1F602}",
    "Crime": "\u{1F52B}",
    "Documentary": "\u{1F4F9}",
    "Drama": "\u{1F3AD}",
    "Family": "\u{1F468}\u200D\u{1F469}\u200D\u{1F467}\u200D\u{1F466}",
    "Fantasy": "\u{1F9D9}",
    "History": "\u{1F4DC}",
    "Horror": "\u{1F47B}",
    "Music": "\u{1F3B5}",
    "Mystery": "\u{1F50D}",
    "Romance": "\u{1F495}",
    "Science Fiction": "\u{1F680}",
    "Thriller": "\u{1F630}",
    "War": "\u2694\uFE0F",
    "Western": "\u{1F920}"
  };
  return renderTemplate`${renderComponent($$result, "Layout", $$Layout, { "title": "Browse Movies by Genre", "description": "Explore movies by genre. From action-packed blockbusters to heartfelt dramas, find films in every category you love." }, { "default": ($$result2) => renderTemplate` ${maybeRenderHead()}<section class="py-16 px-4"> <div class="max-w-4xl mx-auto text-center mb-12"> <h1 class="text-3xl md:text-5xl font-bold mb-4">Browse by Genre</h1> <p class="text-xl text-gw-text-secondary">
Explore our collection of movies organized by genre. Find exactly what you're looking for.
</p> </div> <div class="max-w-5xl mx-auto"> <div class="grid grid-cols-2 md:grid-cols-3 gap-4"> ${GENRES.map((genre) => renderTemplate`<a${addAttribute(`/genre/${slugify(genre)}`, "href")} class="bg-gw-card hover:bg-gw-accent hover:text-gw-bg border border-gw-border rounded-xl p-6 text-center transition group"> <span class="text-4xl mb-3 block">${genreIcons[genre] || "\u{1F3AC}"}</span> <span class="font-semibold text-lg">${genre}</span> </a>`)} </div> </div> </section>  <section class="py-12 px-4 border-t border-gw-border"> <div class="max-w-4xl mx-auto"> <h2 class="text-2xl font-bold mb-4">Find Your Favorite Movie Genre</h2> <p class="text-gw-text-secondary mb-4">
Whether you're in the mood for an action-packed adventure, a heartfelt romantic comedy, 
        or a spine-chilling horror film, our genre-based browsing makes it easy to find your next watch.
</p> <p class="text-gw-text-secondary">
Each genre page features curated collections of the best films, sorted by popularity and ratings. 
        Discover hidden gems alongside blockbuster hits in every category.
</p> </div> </section> ` })}`;
}, "/Users/parikshitjhajharia/Desktop/GOODWATCH/goodwatch-web/src/pages/genres.astro", void 0);

const $$file = "/Users/parikshitjhajharia/Desktop/GOODWATCH/goodwatch-web/src/pages/genres.astro";
const $$url = "/genres";

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: $$Genres,
  file: $$file,
  url: $$url
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
