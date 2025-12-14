globalThis.process ??= {}; globalThis.process.env ??= {};
/* empty css                                  */
import { e as createAstro, f as createComponent, k as renderComponent, r as renderTemplate, m as maybeRenderHead, h as addAttribute, l as Fragment } from '../../chunks/astro/server_AFKA17W8.mjs';
import { $ as $$Layout } from '../../chunks/Layout_D6ytcMm7.mjs';
import { g as getMoviesByMoodAndGenre, a as generateItemListSchema, b as generateBreadcrumbSchema, c as getRelatedMoods, d as getRelatedGenres, s as slugify, e as getPosterUrl } from '../../chunks/supabase_CNgPmO2d.mjs';
export { renderers } from '../../renderers.mjs';

const $$Astro = createAstro("https://goodwatch.movie");
const prerender = false;
const $$combo = createComponent(async ($$result, $$props, $$slots) => {
  const Astro2 = $$result.createAstro($$Astro, $$props, $$slots);
  Astro2.self = $$combo;
  const BEST_COMBINATIONS = [
    // Mood + Genre combinations
    { slug: "feel-good-comedies", title: "Feel-Good Comedies", mood: "Feel-Good", genre: "Comedy", description: "Heartwarming comedies that will lift your spirits" },
    { slug: "romantic-dramas", title: "Romantic Dramas", mood: "Romantic", genre: "Drama", description: "Emotional love stories that tug at your heartstrings" },
    { slug: "thrilling-action", title: "Thrilling Action Movies", mood: "Thrilling", genre: "Action", description: "Heart-pounding action films that keep you on the edge" },
    { slug: "mind-bending-sci-fi", title: "Mind-Bending Sci-Fi", mood: "Mind-Bending", genre: "Science Fiction", description: "Sci-fi films that will make you question reality" },
    { slug: "dark-thrillers", title: "Dark Thrillers", mood: "Dark", genre: "Thriller", description: "Intense psychological thrillers with dark themes" },
    { slug: "inspirational-dramas", title: "Inspirational Dramas", mood: "Inspirational", genre: "Drama", description: "True stories and fictional tales that inspire" },
    { slug: "funny-animations", title: "Funny Animated Movies", mood: "Funny", genre: "Animation", description: "Hilarious animated films for all ages" },
    { slug: "adventurous-fantasy", title: "Adventurous Fantasy Films", mood: "Adventurous", genre: "Fantasy", description: "Epic fantasy adventures in magical worlds" },
    { slug: "emotional-romance", title: "Emotional Romance Movies", mood: "Emotional", genre: "Romance", description: "Romance films that will make you feel deeply" },
    { slug: "mysterious-crime", title: "Mysterious Crime Films", mood: "Mysterious", genre: "Crime", description: "Crime movies with twists you won't see coming" },
    { slug: "nostalgic-family", title: "Nostalgic Family Movies", mood: "Nostalgic", genre: "Family", description: "Classic family films that bring back memories" },
    { slug: "intense-horror", title: "Intense Horror Movies", mood: "Intense", genre: "Horror", description: "Horror films that will truly terrify you" },
    { slug: "uplifting-musicals", title: "Uplifting Musicals", mood: "Uplifting", genre: "Music", description: "Musical films that will have you singing along" },
    { slug: "thought-provoking-documentaries", title: "Thought-Provoking Documentaries", mood: "Thought-Provoking", genre: "Documentary", description: "Documentaries that change how you see the world" },
    { slug: "relaxing-comedies", title: "Relaxing Comedies", mood: "Relaxing", genre: "Comedy", description: "Light-hearted comedies perfect for unwinding" }
  ];
  const { combo: comboSlug } = Astro2.params;
  const combo = BEST_COMBINATIONS.find((c) => c.slug === comboSlug);
  if (!combo) {
    return Astro2.redirect("/best");
  }
  const movies = await getMoviesByMoodAndGenre(combo.mood, combo.genre, 30);
  const siteUrl = "https://goodwatch.movie";
  const itemListSchema = generateItemListSchema(`Best ${combo.title}`, movies, siteUrl);
  const breadcrumbSchema = generateBreadcrumbSchema([
    { name: "Home", url: "/" },
    { name: "Best Movies", url: "/best" },
    { name: combo.title, url: `/best/${combo.slug}` }
  ], siteUrl);
  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": [
      {
        "@type": "Question",
        "name": `What are the best ${combo.title.toLowerCase()} to watch?`,
        "acceptedAnswer": {
          "@type": "Answer",
          "text": `Top ${combo.title.toLowerCase()} include ${movies.slice(0, 5).map((m) => m.title).join(", ")}. We've curated ${movies.length}+ films that combine ${combo.mood.toLowerCase()} vibes with ${combo.genre.toLowerCase()} elements.`
        }
      },
      {
        "@type": "Question",
        "name": `Where can I stream ${combo.title.toLowerCase()}?`,
        "acceptedAnswer": {
          "@type": "Answer",
          "text": `Many ${combo.title.toLowerCase()} are available on popular streaming services like Netflix, Prime Video, and Disney+. Click on any movie to see its current streaming availability.`
        }
      }
    ]
  };
  const combinedSchema = [itemListSchema, breadcrumbSchema, faqSchema];
  const relatedMoods = getRelatedMoods(combo.mood);
  const relatedGenres = getRelatedGenres(combo.genre);
  return renderTemplate`${renderComponent($$result, "Layout", $$Layout, { "title": `Best ${combo.title} | ${movies.length}+ Must-Watch Movies`, "description": `${combo.description}. Discover ${movies.length}+ of the best ${combo.title.toLowerCase()} to watch in 2025. Curated recommendations with streaming info.`, "schema": combinedSchema }, { "default": async ($$result2) => renderTemplate` ${maybeRenderHead()}<div class="max-w-7xl mx-auto px-4 py-12"> <!-- Breadcrumb --> <nav class="text-sm text-gw-text-secondary mb-6"> <a href="/" class="hover:text-white">Home</a> <span class="mx-2">›</span> <a href="/best" class="hover:text-white">Best Movies</a> <span class="mx-2">›</span> <span class="text-white">${combo.title}</span> </nav> <h1 class="text-4xl md:text-5xl font-bold mb-4">Best ${combo.title}</h1> <p class="text-xl text-gw-text-secondary mb-8 max-w-3xl"> ${combo.description}. Browse ${movies.length}+ hand-picked films that perfectly blend
${combo.mood.toLowerCase()} vibes with ${combo.genre.toLowerCase()} storytelling.
</p> <!-- Quick filters --> <div class="flex flex-wrap gap-2 mb-8"> <a${addAttribute(`/mood/${slugify(combo.mood)}`, "href")} class="px-3 py-1 bg-gw-accent/20 text-gw-accent rounded-full text-sm"> ${combo.mood} </a> <a${addAttribute(`/genre/${slugify(combo.genre)}`, "href")} class="px-3 py-1 bg-gw-accent/20 text-gw-accent rounded-full text-sm"> ${combo.genre} </a> </div> <!-- Movies Grid --> <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 mb-16"> ${movies.map((movie) => renderTemplate`<a${addAttribute(`/movie/${movie.tmdb_id}`, "href")} class="group"> <div class="aspect-[2/3] rounded-lg overflow-hidden bg-gw-card mb-2"> <img${addAttribute(getPosterUrl(movie.poster_path, "w300"), "src")}${addAttribute(`${movie.title} poster`, "alt")} class="w-full h-full object-cover group-hover:scale-105 transition duration-300" loading="lazy"> </div> <h3 class="font-medium text-sm line-clamp-1 group-hover:text-gw-accent transition"> ${movie.title} </h3> <div class="flex items-center gap-2 text-xs text-gw-text-secondary"> <span>${movie.year}</span> ${movie.vote_average && renderTemplate`${renderComponent($$result2, "Fragment", Fragment, {}, { "default": async ($$result3) => renderTemplate` <span>•</span> <span class="flex items-center gap-1"> <svg class="w-3 h-3 text-yellow-400" fill="currentColor" viewBox="0 0 24 24"> <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"></path> </svg> ${movie.vote_average.toFixed(1)} </span> ` })}`} </div> </a>`)} </div> <!-- SEO Content --> <section class="border-t border-gw-border pt-12"> <h2 class="text-2xl font-bold mb-6">What Makes Great ${combo.title}?</h2> <div class="prose prose-invert max-w-none"> <p class="text-gw-text-secondary mb-4">
The best ${combo.title.toLowerCase()} combine the emotional impact of ${combo.mood.toLowerCase()} storytelling 
          with the conventions of the ${combo.genre.toLowerCase()} genre. This unique blend creates films that 
          entertain while resonating on a deeper level.
</p> <p class="text-gw-text-secondary mb-4">
Our curation considers critical acclaim, audience ratings, and that special quality that makes 
          certain films stand out. Whether you're a longtime fan or new to ${combo.title.toLowerCase()}, 
          you'll find something to love in this collection.
</p> </div> <!-- Related Categories --> <div class="mt-12"> <h3 class="text-xl font-bold mb-4">Similar Moods</h3> <div class="flex flex-wrap gap-3"> ${relatedMoods.map((mood) => renderTemplate`<a${addAttribute(`/mood/${slugify(mood)}`, "href")} class="px-4 py-2 bg-gw-card hover:bg-gw-accent hover:text-gw-bg border border-gw-border rounded-full transition text-sm"> ${mood} </a>`)} </div> </div> <div class="mt-8"> <h3 class="text-xl font-bold mb-4">Related Genres</h3> <div class="flex flex-wrap gap-3"> ${relatedGenres.map((genre) => renderTemplate`<a${addAttribute(`/genre/${slugify(genre)}`, "href")} class="px-4 py-2 bg-gw-card hover:bg-gw-border border border-gw-border rounded-full transition text-sm"> ${genre} </a>`)} </div> </div> </section> </div> ` })}`;
}, "/Users/parikshitjhajharia/Desktop/GOODWATCH/goodwatch-web/src/pages/best/[combo].astro", void 0);

const $$file = "/Users/parikshitjhajharia/Desktop/GOODWATCH/goodwatch-web/src/pages/best/[combo].astro";
const $$url = "/best/[combo]";

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: $$combo,
  file: $$file,
  prerender,
  url: $$url
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
