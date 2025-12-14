globalThis.process ??= {}; globalThis.process.env ??= {};
/* empty css                                    */
import { e as createAstro, f as createComponent, k as renderComponent, r as renderTemplate, m as maybeRenderHead, h as addAttribute, n as Fragment } from '../../chunks/astro/server_Cyy51z0E.mjs';
import { $ as $$Layout } from '../../chunks/Layout_B6Hz-kRD.mjs';
import { D as DECADES, j as getMoviesByDecade, a as generateItemListSchema, b as generateBreadcrumbSchema, G as GENRES, f as getPosterUrl, e as slugify } from '../../chunks/supabase_MFvNP5ai.mjs';
export { renderers } from '../../renderers.mjs';

const $$Astro = createAstro("https://goodwatch.movie");
const prerender = false;
const $$decade = createComponent(async ($$result, $$props, $$slots) => {
  const Astro2 = $$result.createAstro($$Astro, $$props, $$slots);
  Astro2.self = $$decade;
  const { decade } = Astro2.params;
  const displayDecade = decade + "s";
  if (!DECADES.includes(displayDecade)) {
    return Astro2.redirect("/decade");
  }
  const movies = await getMoviesByDecade(displayDecade, 30);
  const siteUrl = "https://goodwatch.movie";
  const itemListSchema = generateItemListSchema(`Best ${displayDecade} Movies`, movies, siteUrl);
  const breadcrumbSchema = generateBreadcrumbSchema([
    { name: "Home", url: "/" },
    { name: "Decades", url: "/decade" },
    { name: displayDecade, url: `/decade/${decade}` }
  ], siteUrl);
  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": [
      {
        "@type": "Question",
        "name": `What are the best movies from the ${displayDecade}?`,
        "acceptedAnswer": {
          "@type": "Answer",
          "text": `The ${displayDecade} produced many classic films. Top picks include ${movies.slice(0, 5).map((m) => m.title).join(", ")}. Browse our full list of ${movies.length}+ highly-rated ${displayDecade} movies.`
        }
      },
      {
        "@type": "Question",
        "name": `What defines ${displayDecade} cinema?`,
        "acceptedAnswer": {
          "@type": "Answer",
          "text": `${displayDecade} movies are known for their distinctive style and storytelling. This era produced memorable films across all genres, from blockbusters to indie classics.`
        }
      }
    ]
  };
  const combinedSchema = [itemListSchema, breadcrumbSchema, faqSchema];
  return renderTemplate`${renderComponent($$result, "Layout", $$Layout, { "title": `Best ${displayDecade} Movies | ${movies.length}+ Classic Films`, "description": `Discover the greatest movies from the ${displayDecade}. Browse ${movies.length}+ critically acclaimed films from this iconic decade. From blockbusters to hidden gems.`, "schema": combinedSchema }, { "default": async ($$result2) => renderTemplate` ${maybeRenderHead()}<div class="max-w-7xl mx-auto px-4 py-12"> <!-- Breadcrumb --> <nav class="text-sm text-gw-text-secondary mb-6"> <a href="/" class="hover:text-white">Home</a> <span class="mx-2">›</span> <a href="/decade" class="hover:text-white">Decades</a> <span class="mx-2">›</span> <span class="text-white">${displayDecade}</span> </nav> <h1 class="text-4xl md:text-5xl font-bold mb-4">Best ${displayDecade} Movies</h1> <p class="text-xl text-gw-text-secondary mb-12 max-w-3xl">
Explore the greatest films from the ${displayDecade}. From iconic blockbusters to hidden gems,
      discover ${movies.length}+ movies that defined this era of cinema.
</p> <!-- Movies Grid --> <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 mb-16"> ${movies.map((movie) => renderTemplate`<a${addAttribute(`/movie/${movie.tmdb_id}`, "href")} class="group"> <div class="aspect-[2/3] rounded-lg overflow-hidden bg-gw-card mb-2"> <img${addAttribute(getPosterUrl(movie.poster_path, "w300"), "src")}${addAttribute(`${movie.title} (${movie.year}) poster`, "alt")} class="w-full h-full object-cover group-hover:scale-105 transition duration-300" loading="lazy"> </div> <h3 class="font-medium text-sm line-clamp-1 group-hover:text-gw-accent transition"> ${movie.title} </h3> <div class="flex items-center gap-2 text-xs text-gw-text-secondary"> <span>${movie.year}</span> ${movie.vote_average && renderTemplate`${renderComponent($$result2, "Fragment", Fragment, {}, { "default": async ($$result3) => renderTemplate` <span>•</span> <span class="flex items-center gap-1"> <svg class="w-3 h-3 text-yellow-400" fill="currentColor" viewBox="0 0 24 24"> <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"></path> </svg> ${movie.vote_average.toFixed(1)} </span> ` })}`} </div> </a>`)} </div> <!-- SEO Content --> <section class="border-t border-gw-border pt-12"> <h2 class="text-2xl font-bold mb-6">Why ${displayDecade} Movies Still Matter</h2> <div class="prose prose-invert max-w-none"> <p class="text-gw-text-secondary mb-4">
The ${displayDecade} was a transformative period for cinema. This decade produced films that 
          continue to influence filmmakers today and remain beloved by audiences worldwide.
</p> <p class="text-gw-text-secondary mb-4">
From groundbreaking special effects to innovative storytelling, ${displayDecade} movies 
          pushed the boundaries of what was possible in film. Many of these classics have stood 
          the test of time and remain essential viewing.
</p> </div> <!-- Other Decades --> <div class="mt-12"> <h3 class="text-xl font-bold mb-4">Explore Other Decades</h3> <div class="flex flex-wrap gap-3"> ${DECADES.filter((d) => d !== displayDecade).map((d) => renderTemplate`<a${addAttribute(`/decade/${d.toLowerCase().replace("s", "")}`, "href")} class="px-4 py-2 bg-gw-card hover:bg-gw-border border border-gw-border rounded-full transition text-sm"> ${d} </a>`)} </div> </div> <!-- Genre Links --> <div class="mt-8"> <h3 class="text-xl font-bold mb-4">Browse by Genre</h3> <div class="flex flex-wrap gap-3"> ${GENRES.slice(0, 8).map((genre) => renderTemplate`<a${addAttribute(`/genre/${slugify(genre)}`, "href")} class="px-4 py-2 bg-gw-card hover:bg-gw-accent hover:text-gw-bg border border-gw-border rounded-full transition text-sm"> ${genre} </a>`)} </div> </div> </section> </div> ` })}`;
}, "/Users/parikshitjhajharia/Desktop/GOODWATCH/goodwatch-web/src/pages/decade/[decade].astro", void 0);

const $$file = "/Users/parikshitjhajharia/Desktop/GOODWATCH/goodwatch-web/src/pages/decade/[decade].astro";
const $$url = "/decade/[decade]";

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: $$decade,
  file: $$file,
  prerender,
  url: $$url
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
