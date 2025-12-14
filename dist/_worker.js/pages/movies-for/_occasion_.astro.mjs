globalThis.process ??= {}; globalThis.process.env ??= {};
/* empty css                                    */
import { e as createAstro, f as createComponent, k as renderComponent, r as renderTemplate, m as maybeRenderHead, h as addAttribute, n as Fragment } from '../../chunks/astro/server_Cyy51z0E.mjs';
import { $ as $$Layout } from '../../chunks/Layout_B6Hz-kRD.mjs';
import { O as OCCASIONS, o as getMoviesByMood, a as generateItemListSchema, b as generateBreadcrumbSchema, M as MOODS, f as getPosterUrl, e as slugify } from '../../chunks/supabase_MFvNP5ai.mjs';
export { renderers } from '../../renderers.mjs';

const $$Astro = createAstro("https://goodwatch.movie");
const prerender = false;
const $$occasion = createComponent(async ($$result, $$props, $$slots) => {
  const Astro2 = $$result.createAstro($$Astro, $$props, $$slots);
  Astro2.self = $$occasion;
  const { occasion: occasionSlug } = Astro2.params;
  const occasion = OCCASIONS.find((o) => o.slug === occasionSlug);
  if (!occasion) {
    return Astro2.redirect("/movies-for");
  }
  const movies = await getMoviesByMood(occasion.mood, 30);
  const siteUrl = "https://goodwatch.movie";
  const itemListSchema = generateItemListSchema(`Best Movies for ${occasion.name}`, movies, siteUrl);
  const breadcrumbSchema = generateBreadcrumbSchema([
    { name: "Home", url: "/" },
    { name: "Movies For", url: "/movies-for" },
    { name: occasion.name, url: `/movies-for/${occasion.slug}` }
  ], siteUrl);
  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": [
      {
        "@type": "Question",
        "name": `What are the best movies to watch for ${occasion.name.toLowerCase()}?`,
        "acceptedAnswer": {
          "@type": "Answer",
          "text": `We've curated ${movies.length} perfect movies for ${occasion.name.toLowerCase()}. Top picks include ${movies.slice(0, 3).map((m) => m.title).join(", ")}. These ${occasion.mood.toLowerCase()} films are hand-selected to match the mood you're looking for.`
        }
      },
      {
        "@type": "Question",
        "name": `How do I find movies perfect for ${occasion.name.toLowerCase()}?`,
        "acceptedAnswer": {
          "@type": "Answer",
          "text": `GoodWatch curates movies by mood and occasion. For ${occasion.name.toLowerCase()}, we recommend ${occasion.mood.toLowerCase()} movies that ${occasion.description.toLowerCase()}.`
        }
      }
    ]
  };
  const combinedSchema = [itemListSchema, breadcrumbSchema, faqSchema];
  return renderTemplate`${renderComponent($$result, "Layout", $$Layout, { "title": `Best Movies for ${occasion.name} | ${movies.length}+ Recommendations`, "description": `${occasion.description}. Discover ${movies.length}+ hand-picked ${occasion.mood.toLowerCase()} movies perfect for ${occasion.name.toLowerCase()}. Updated for 2025.`, "schema": combinedSchema }, { "default": async ($$result2) => renderTemplate` ${maybeRenderHead()}<div class="max-w-7xl mx-auto px-4 py-12"> <!-- Breadcrumb --> <nav class="text-sm text-gw-text-secondary mb-6"> <a href="/" class="hover:text-white">Home</a> <span class="mx-2">›</span> <a href="/movies-for" class="hover:text-white">Movies For</a> <span class="mx-2">›</span> <span class="text-white">${occasion.name}</span> </nav> <!-- Hero --> <div class="mb-12"> <h1 class="text-4xl md:text-5xl font-bold mb-4">
Best Movies for ${occasion.name} </h1> <p class="text-xl text-gw-text-secondary max-w-3xl"> ${occasion.description}. We've curated ${movies.length}+ ${occasion.mood.toLowerCase()} movies 
        that are perfect for this occasion.
</p> </div> <!-- Movies Grid --> <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 mb-16"> ${movies.map((movie) => renderTemplate`<a${addAttribute(`/movie/${movie.tmdb_id}`, "href")} class="group"> <div class="aspect-[2/3] rounded-lg overflow-hidden bg-gw-card mb-2"> <img${addAttribute(getPosterUrl(movie.poster_path, "w300"), "src")}${addAttribute(`${movie.title} poster`, "alt")} class="w-full h-full object-cover group-hover:scale-105 transition duration-300" loading="lazy"> </div> <h3 class="font-medium text-sm line-clamp-1 group-hover:text-gw-accent transition"> ${movie.title} </h3> <div class="flex items-center gap-2 text-xs text-gw-text-secondary"> <span>${movie.year}</span> ${movie.vote_average && renderTemplate`${renderComponent($$result2, "Fragment", Fragment, {}, { "default": async ($$result3) => renderTemplate` <span>•</span> <span class="flex items-center gap-1"> <svg class="w-3 h-3 text-yellow-400" fill="currentColor" viewBox="0 0 24 24"> <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"></path> </svg> ${movie.vote_average.toFixed(1)} </span> ` })}`} </div> </a>`)} </div> <!-- SEO Content --> <section class="border-t border-gw-border pt-12"> <h2 class="text-2xl font-bold mb-6">Finding the Perfect Movie for ${occasion.name}</h2> <div class="prose prose-invert max-w-none"> <p class="text-gw-text-secondary mb-4">
Choosing what to watch for ${occasion.name.toLowerCase()} can be overwhelming with so many options available 
          on streaming platforms. That's why we've curated this collection of ${occasion.mood.toLowerCase()} movies 
          specifically selected for this occasion.
</p> <p class="text-gw-text-secondary mb-4">
Our picks include highly-rated films across various genres, all sharing the common thread of being 
          perfect for ${occasion.name.toLowerCase()}. Whether you prefer classic favorites or newer releases, 
          you'll find something that fits the mood.
</p> <h3 class="text-xl font-bold mt-8 mb-4">What Makes a Good ${occasion.name} Movie?</h3> <p class="text-gw-text-secondary mb-4">
The best movies for ${occasion.name.toLowerCase()} share certain qualities: they're ${occasion.mood.toLowerCase()}, 
          engaging, and leave you feeling satisfied. We consider factors like pacing, tone, and emotional impact 
          when curating these recommendations.
</p> </div> <!-- Internal Links --> <div class="mt-12"> <h3 class="text-xl font-bold mb-4">Explore More Occasions</h3> <div class="flex flex-wrap gap-3"> ${OCCASIONS.filter((o) => o.slug !== occasion.slug).slice(0, 6).map((o) => renderTemplate`<a${addAttribute(`/movies-for/${o.slug}`, "href")} class="px-4 py-2 bg-gw-card hover:bg-gw-border border border-gw-border rounded-full transition text-sm"> ${o.name} </a>`)} </div> </div> <div class="mt-8"> <h3 class="text-xl font-bold mb-4">Browse by Mood</h3> <div class="flex flex-wrap gap-3"> ${MOODS.slice(0, 8).map((mood) => renderTemplate`<a${addAttribute(`/mood/${slugify(mood)}`, "href")} class="px-4 py-2 bg-gw-card hover:bg-gw-accent hover:text-gw-bg border border-gw-border rounded-full transition text-sm"> ${mood} </a>`)} </div> </div> </section> </div> ` })}`;
}, "/Users/parikshitjhajharia/Desktop/GOODWATCH/goodwatch-web/src/pages/movies-for/[occasion].astro", void 0);

const $$file = "/Users/parikshitjhajharia/Desktop/GOODWATCH/goodwatch-web/src/pages/movies-for/[occasion].astro";
const $$url = "/movies-for/[occasion]";

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: $$occasion,
  file: $$file,
  prerender,
  url: $$url
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
