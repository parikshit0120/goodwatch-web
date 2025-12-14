globalThis.process ??= {}; globalThis.process.env ??= {};
/* empty css                                  */
import { e as createAstro, f as createComponent, k as renderComponent, r as renderTemplate, m as maybeRenderHead, h as addAttribute, l as Fragment } from '../../chunks/astro/server_AFKA17W8.mjs';
import { $ as $$Layout } from '../../chunks/Layout_D6ytcMm7.mjs';
import { M as MOODS, s as slugify, k as getMoviesByMood, e as getPosterUrl } from '../../chunks/supabase_CNgPmO2d.mjs';
export { renderers } from '../../renderers.mjs';

const $$Astro = createAstro("https://goodwatch.movie");
const prerender = false;
const $$mood = createComponent(async ($$result, $$props, $$slots) => {
  const Astro2 = $$result.createAstro($$Astro, $$props, $$slots);
  Astro2.self = $$mood;
  const { mood } = Astro2.params;
  const moodName = MOODS.find((m) => slugify(m) === mood) || mood?.replace(/-/g, " ");
  if (!moodName) {
    return Astro2.redirect("/moods");
  }
  const movies = await getMoviesByMood(moodName, 48);
  const moodDescriptions = {
    "feel-good": {
      title: "Feel-Good Movies to Watch",
      description: "Discover the best feel-good movies that will lift your spirits. From heartwarming comedies to inspiring dramas, find films that leave you smiling.",
      h1: "Feel-Good Movies That Will Brighten Your Day"
    },
    "thrilling": {
      title: "Thrilling Movies to Keep You on Edge",
      description: "Looking for excitement? Browse our collection of thrilling movies packed with suspense, action, and edge-of-your-seat moments.",
      h1: "Thrilling Movies for an Adrenaline Rush"
    },
    "romantic": {
      title: "Romantic Movies for Date Night",
      description: "Find the perfect romantic movie for any occasion. From classic love stories to modern rom-coms, discover films that capture the heart.",
      h1: "Romantic Movies That Will Make You Believe in Love"
    },
    "mind-bending": {
      title: "Mind-Bending Movies That Will Blow Your Mind",
      description: "Challenge your perception with mind-bending movies. Explore films with plot twists, complex narratives, and thought-provoking concepts.",
      h1: "Mind-Bending Movies to Make You Think"
    },
    "nostalgic": {
      title: "Nostalgic Movies That Bring Back Memories",
      description: "Take a trip down memory lane with nostalgic movies. Rediscover classics and films that capture the feeling of simpler times.",
      h1: "Nostalgic Movies for When You Want to Remember"
    },
    "dark": {
      title: "Dark Movies for When You Want Intensity",
      description: "Explore dark, intense films that don't shy away from difficult themes. From noir to psychological drama, find movies with depth.",
      h1: "Dark Movies for Those Who Like Intensity"
    },
    "inspirational": {
      title: "Inspirational Movies to Motivate You",
      description: "Get inspired with movies that motivate and uplift. Watch true stories and fictional tales of triumph, perseverance, and human spirit.",
      h1: "Inspirational Movies to Fuel Your Dreams"
    },
    "relaxing": {
      title: "Relaxing Movies for a Chill Night",
      description: "Unwind with relaxing movies perfect for a calm evening. Find gentle comedies, beautiful visuals, and stress-free entertainment.",
      h1: "Relaxing Movies for When You Need to Unwind"
    },
    "adventurous": {
      title: "Adventure Movies for Thrill Seekers",
      description: "Embark on epic journeys with adventure movies. Explore new worlds, witness daring quests, and experience excitement from your couch.",
      h1: "Adventure Movies That Will Take You Places"
    },
    "emotional": {
      title: "Emotional Movies That Will Move You",
      description: "Sometimes you need a good cry. Find emotional movies that touch the heart, from powerful dramas to bittersweet stories.",
      h1: "Emotional Movies for When You Want to Feel"
    },
    "funny": {
      title: "Funny Movies to Make You Laugh",
      description: "Need a laugh? Browse our collection of the funniest movies. From slapstick to witty humor, find films guaranteed to make you smile.",
      h1: "Funny Movies Guaranteed to Make You Laugh"
    },
    "intense": {
      title: "Intense Movies That Demand Your Attention",
      description: "Looking for movies that grip you from start to finish? Discover intense films with gripping plots and unforgettable moments.",
      h1: "Intense Movies You Won't Be Able to Look Away From"
    },
    "mysterious": {
      title: "Mysterious Movies Full of Secrets",
      description: "Love a good mystery? Find films full of secrets, twists, and puzzles waiting to be solved. Perfect for detective minds.",
      h1: "Mysterious Movies to Keep You Guessing"
    },
    "uplifting": {
      title: "Uplifting Movies to Boost Your Mood",
      description: "Lift your spirits with uplifting movies that celebrate life, hope, and the human spirit. Perfect when you need positivity.",
      h1: "Uplifting Movies for When You Need Hope"
    },
    "thought-provoking": {
      title: "Thought-Provoking Movies to Challenge Your Mind",
      description: "Engage your brain with thought-provoking movies. Find films that raise questions, spark discussions, and leave you pondering.",
      h1: "Thought-Provoking Movies That Stay With You"
    }
  };
  const seo = moodDescriptions[mood] || {
    title: `${moodName} Movies to Watch`,
    description: `Discover the best ${moodName?.toLowerCase()} movies. Find films that match exactly how you're feeling right now.`,
    h1: `Best ${moodName} Movies`
  };
  const schema = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    "name": seo.title,
    "description": seo.description,
    "url": `https://goodwatch.app/mood/${mood}`,
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
  return renderTemplate`${renderComponent($$result, "Layout", $$Layout, { "title": seo.title, "description": seo.description, "schema": schema }, { "default": async ($$result2) => renderTemplate`  ${maybeRenderHead()}<section class="py-16 px-4 text-center border-b border-gw-border"> <div class="max-w-4xl mx-auto"> <nav class="text-sm text-gw-text-secondary mb-6"> <a href="/" class="hover:text-white transition">Home</a> <span class="mx-2">/</span> <a href="/moods" class="hover:text-white transition">Moods</a> <span class="mx-2">/</span> <span class="text-white">${moodName}</span> </nav> <h1 class="text-3xl md:text-5xl font-bold mb-4">${seo.h1}</h1> <p class="text-xl text-gw-text-secondary max-w-2xl mx-auto"> ${seo.description} </p> <div class="mt-8"> <span class="text-gw-accent font-semibold">${movies.length} movies</span> <span class="text-gw-text-secondary"> match this mood</span> </div> </div> </section>  <section class="py-12 px-4"> <div class="max-w-7xl mx-auto"> ${movies.length > 0 ? renderTemplate`<div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4 md:gap-6"> ${movies.map((movie) => renderTemplate`<a${addAttribute(`/movie/${movie.tmdb_id}`, "href")} class="group"> <div class="aspect-[2/3] rounded-lg overflow-hidden bg-gw-card mb-2"> <img${addAttribute(getPosterUrl(movie.poster_path, "w300"), "src")}${addAttribute(movie.title, "alt")} class="w-full h-full object-cover group-hover:scale-105 transition duration-300" loading="lazy"> </div> <h3 class="font-medium text-sm line-clamp-1 group-hover:text-gw-accent transition"> ${movie.title} </h3> <div class="flex items-center gap-2 text-xs text-gw-text-secondary"> <span>${movie.year}</span> ${movie.vote_average && renderTemplate`${renderComponent($$result2, "Fragment", Fragment, {}, { "default": async ($$result3) => renderTemplate` <span>•</span> <span class="flex items-center gap-1"> <svg class="w-3 h-3 text-yellow-400" fill="currentColor" viewBox="0 0 24 24"> <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"></path> </svg> ${movie.vote_average.toFixed(1)} </span> ` })}`} </div> </a>`)} </div>` : renderTemplate`<div class="text-center py-20"> <p class="text-gw-text-secondary text-lg">No movies found for this mood yet.</p> <a href="/moods" class="inline-block mt-4 text-gw-accent hover:text-gw-accent-hover transition">
Browse other moods →
</a> </div>`} </div> </section>  <section class="py-12 px-4 bg-gw-card/50 border-t border-gw-border"> <div class="max-w-7xl mx-auto"> <h2 class="text-2xl font-bold mb-6 text-center">Explore Other Moods</h2> <div class="flex flex-wrap justify-center gap-3"> ${MOODS.filter((m) => slugify(m) !== mood).map((m) => renderTemplate`<a${addAttribute(`/mood/${slugify(m)}`, "href")} class="px-5 py-2.5 bg-gw-card hover:bg-gw-accent hover:text-gw-bg border border-gw-border rounded-full transition font-medium"> ${m} </a>`)} </div> </div> </section>  <section class="py-12 px-4 border-t border-gw-border"> <div class="max-w-4xl mx-auto"> <h2 class="text-xl font-bold mb-4">About ${moodName} Movies</h2> <p class="text-gw-text-secondary">
Finding the right movie for your mood can be challenging. That's why we've curated this collection 
        of ${moodName?.toLowerCase()} movies that perfectly match when you're feeling ${moodName?.toLowerCase()}. 
        Whether you're looking for something to watch alone or with friends, these films deliver exactly 
        what you need. Each movie has been tagged based on its emotional tone, themes, and viewer feedback 
        to help you find your perfect match.
</p> </div> </section> ` })}`;
}, "/Users/parikshitjhajharia/Desktop/GOODWATCH/goodwatch-web/src/pages/mood/[mood].astro", void 0);

const $$file = "/Users/parikshitjhajharia/Desktop/GOODWATCH/goodwatch-web/src/pages/mood/[mood].astro";
const $$url = "/mood/[mood]";

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: $$mood,
  file: $$file,
  prerender,
  url: $$url
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
