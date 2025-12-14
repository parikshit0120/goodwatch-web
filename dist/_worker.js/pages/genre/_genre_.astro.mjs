globalThis.process ??= {}; globalThis.process.env ??= {};
/* empty css                                  */
import { e as createAstro, f as createComponent, k as renderComponent, r as renderTemplate, m as maybeRenderHead, h as addAttribute, l as Fragment } from '../../chunks/astro/server_AFKA17W8.mjs';
import { $ as $$Layout } from '../../chunks/Layout_D6ytcMm7.mjs';
import { G as GENRES, s as slugify, j as getMoviesByGenre, e as getPosterUrl } from '../../chunks/supabase_CNgPmO2d.mjs';
export { renderers } from '../../renderers.mjs';

const $$Astro = createAstro("https://goodwatch.movie");
const prerender = false;
const $$genre = createComponent(async ($$result, $$props, $$slots) => {
  const Astro2 = $$result.createAstro($$Astro, $$props, $$slots);
  Astro2.self = $$genre;
  const { genre } = Astro2.params;
  const genreName = GENRES.find((g) => slugify(g) === genre) || genre?.replace(/-/g, " ");
  if (!genreName) {
    return Astro2.redirect("/genres");
  }
  const movies = await getMoviesByGenre(genreName, 48);
  const genreDescriptions = {
    "action": {
      title: "Best Action Movies to Watch",
      description: "Discover explosive action movies packed with thrilling stunts, epic battles, and non-stop excitement. From blockbusters to hidden gems.",
      h1: "Action Movies That Will Get Your Heart Racing"
    },
    "comedy": {
      title: "Best Comedy Movies to Watch",
      description: "Find the funniest comedy movies to brighten your day. From laugh-out-loud comedies to witty satires, discover films that entertain.",
      h1: "Comedy Movies Guaranteed to Make You Laugh"
    },
    "drama": {
      title: "Best Drama Movies to Watch",
      description: "Explore powerful drama movies with compelling stories and outstanding performances. Find films that move you emotionally.",
      h1: "Drama Movies With Stories That Stay With You"
    },
    "horror": {
      title: "Best Horror Movies to Watch",
      description: "Dare to watch the scariest horror movies. From psychological terror to supernatural chills, find films that will haunt you.",
      h1: "Horror Movies for the Brave"
    },
    "science-fiction": {
      title: "Best Sci-Fi Movies to Watch",
      description: "Journey through the best science fiction movies. Explore futuristic worlds, alien encounters, and mind-bending technology.",
      h1: "Sci-Fi Movies That Expand Your Imagination"
    },
    "thriller": {
      title: "Best Thriller Movies to Watch",
      description: "Experience edge-of-your-seat thriller movies. Suspenseful plots, unexpected twists, and gripping tension await.",
      h1: "Thriller Movies to Keep You Guessing"
    },
    "romance": {
      title: "Best Romance Movies to Watch",
      description: "Fall in love with the best romance movies. From classic love stories to modern rom-coms, find your perfect romantic film.",
      h1: "Romance Movies for Every Kind of Love Story"
    },
    "animation": {
      title: "Best Animated Movies to Watch",
      description: "Discover amazing animated movies for all ages. From heartwarming tales to artistic masterpieces, explore the world of animation.",
      h1: "Animated Movies That Captivate All Ages"
    },
    "documentary": {
      title: "Best Documentary Movies to Watch",
      description: "Learn and be inspired by the best documentaries. Real stories, fascinating subjects, and eye-opening perspectives.",
      h1: "Documentaries That Open Your Eyes"
    },
    "fantasy": {
      title: "Best Fantasy Movies to Watch",
      description: "Escape to magical worlds with the best fantasy movies. Epic adventures, mythical creatures, and enchanting stories await.",
      h1: "Fantasy Movies to Transport You to Another World"
    }
  };
  const seo = genreDescriptions[genre] || {
    title: `Best ${genreName} Movies to Watch`,
    description: `Discover the best ${genreName?.toLowerCase()} movies. Browse our curated collection and find your next favorite film.`,
    h1: `Best ${genreName} Movies`
  };
  const schema = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    "name": seo.title,
    "description": seo.description,
    "url": `https://goodwatch.app/genre/${genre}`,
    "mainEntity": {
      "@type": "ItemList",
      "numberOfItems": movies.length,
      "itemListElement": movies.slice(0, 10).map((movie, index) => ({
        "@type": "ListItem",
        "position": index + 1,
        "item": {
          "@type": "Movie",
          "name": movie.title,
          "url": `https://goodwatch.app/movie/${movie.tmdb_id}`
        }
      }))
    }
  };
  return renderTemplate`${renderComponent($$result, "Layout", $$Layout, { "title": seo.title, "description": seo.description, "schema": schema }, { "default": async ($$result2) => renderTemplate`  ${maybeRenderHead()}<section class="py-16 px-4 text-center border-b border-gw-border"> <div class="max-w-4xl mx-auto"> <nav class="text-sm text-gw-text-secondary mb-6"> <a href="/" class="hover:text-white transition">Home</a> <span class="mx-2">/</span> <a href="/genres" class="hover:text-white transition">Genres</a> <span class="mx-2">/</span> <span class="text-white">${genreName}</span> </nav> <h1 class="text-3xl md:text-5xl font-bold mb-4">${seo.h1}</h1> <p class="text-xl text-gw-text-secondary max-w-2xl mx-auto"> ${seo.description} </p> <div class="mt-8"> <span class="text-gw-accent font-semibold">${movies.length} movies</span> <span class="text-gw-text-secondary"> in this genre</span> </div> </div> </section>  <section class="py-12 px-4"> <div class="max-w-7xl mx-auto"> ${movies.length > 0 ? renderTemplate`<div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4 md:gap-6"> ${movies.map((movie) => renderTemplate`<a${addAttribute(`/movie/${movie.tmdb_id}`, "href")} class="group"> <div class="aspect-[2/3] rounded-lg overflow-hidden bg-gw-card mb-2"> <img${addAttribute(getPosterUrl(movie.poster_path, "w300"), "src")}${addAttribute(movie.title, "alt")} class="w-full h-full object-cover group-hover:scale-105 transition duration-300" loading="lazy"> </div> <h3 class="font-medium text-sm line-clamp-1 group-hover:text-gw-accent transition"> ${movie.title} </h3> <div class="flex items-center gap-2 text-xs text-gw-text-secondary"> <span>${movie.year}</span> ${movie.vote_average && renderTemplate`${renderComponent($$result2, "Fragment", Fragment, {}, { "default": async ($$result3) => renderTemplate` <span>•</span> <span class="flex items-center gap-1"> <svg class="w-3 h-3 text-yellow-400" fill="currentColor" viewBox="0 0 24 24"> <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"></path> </svg> ${movie.vote_average.toFixed(1)} </span> ` })}`} </div> </a>`)} </div>` : renderTemplate`<div class="text-center py-20"> <p class="text-gw-text-secondary text-lg">No movies found in this genre yet.</p> <a href="/genres" class="inline-block mt-4 text-gw-accent hover:text-gw-accent-hover transition">
Browse other genres →
</a> </div>`} </div> </section>  <section class="py-12 px-4 bg-gw-card/50 border-t border-gw-border"> <div class="max-w-7xl mx-auto"> <h2 class="text-2xl font-bold mb-6 text-center">Explore Other Genres</h2> <div class="flex flex-wrap justify-center gap-3"> ${GENRES.filter((g) => slugify(g) !== genre).map((g) => renderTemplate`<a${addAttribute(`/genre/${slugify(g)}`, "href")} class="px-5 py-2.5 bg-gw-card hover:bg-gw-accent hover:text-gw-bg border border-gw-border rounded-full transition font-medium"> ${g} </a>`)} </div> </div> </section> ` })}`;
}, "/Users/parikshitjhajharia/Desktop/GOODWATCH/goodwatch-web/src/pages/genre/[genre].astro", void 0);

const $$file = "/Users/parikshitjhajharia/Desktop/GOODWATCH/goodwatch-web/src/pages/genre/[genre].astro";
const $$url = "/genre/[genre]";

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: $$genre,
  file: $$file,
  prerender,
  url: $$url
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
