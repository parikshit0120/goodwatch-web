globalThis.process ??= {}; globalThis.process.env ??= {};
/* empty css                               */
import { f as createComponent, k as renderComponent, r as renderTemplate, m as maybeRenderHead, h as addAttribute } from '../chunks/astro/server_AFKA17W8.mjs';
import { $ as $$Layout } from '../chunks/Layout_D6ytcMm7.mjs';
export { renderers } from '../renderers.mjs';

const $$Blog = createComponent(($$result, $$props, $$slots) => {
  const posts = [
    {
      slug: "scroll-fatigue",
      title: "The Hidden Cost of Endless Scrolling: How Decision Fatigue is Ruining Movie Night",
      description: "Why spending 30 minutes choosing a movie is worse than watching a bad one.",
      category: "Psychology",
      date: "Dec 10, 2025",
      readTime: "7 min read"
    },
    {
      slug: "netflix-algorithm",
      title: "How Netflix's Algorithm Really Works (And Why It Fails You)",
      description: "Inside the recommendation engine that keeps you scrolling but never satisfied.",
      category: "Technology",
      date: "Dec 9, 2025",
      readTime: "8 min read"
    },
    {
      slug: "ott-platforms-global",
      title: "The Global Streaming Wars: How OTT Platforms Are Reshaping Entertainment",
      description: "From Netflix to regional players, the battle for your screen time.",
      category: "Industry",
      date: "Dec 8, 2025",
      readTime: "6 min read"
    },
    {
      slug: "brain-rot-choice-paradox",
      title: "Brain Rot and the Choice Paradox: Why More Options Make Us Miserable",
      description: "The psychology behind why 15,000 movies leave us watching nothing.",
      category: "Psychology",
      date: "Dec 7, 2025",
      readTime: "7 min read"
    },
    {
      slug: "best-netflix-movies-2025",
      title: "Best Movies on Netflix Right Now (December 2025)",
      description: "Our curated picks for what to actually watch this month.",
      category: "Recommendations",
      date: "Dec 6, 2025",
      readTime: "5 min read"
    },
    {
      slug: "highest-grossing-2025",
      title: "Highest Grossing Movies of 2025: What Made Them Work",
      description: "Breaking down the biggest box office hits and what they mean for cinema.",
      category: "Analysis",
      date: "Dec 5, 2025",
      readTime: "6 min read"
    },
    {
      slug: "imdb-ratings-fail",
      title: "Why IMDb Ratings Don't Help You Pick a Movie",
      description: "The problem with crowdsourced ratings and what to use instead.",
      category: "Opinion",
      date: "Dec 4, 2025",
      readTime: "5 min read"
    },
    {
      slug: "death-of-movie-night",
      title: "The Death of Spontaneous Movie Night: How Streaming Killed the Magic",
      description: "Remember when picking a movie was exciting? What happened?",
      category: "Culture",
      date: "Dec 3, 2025",
      readTime: "6 min read"
    },
    {
      slug: "psychology-of-recommendations",
      title: "The Psychology of Movie Recommendations: Why We Trust Strangers",
      description: "How social proof and cognitive biases shape what we watch.",
      category: "Psychology",
      date: "Dec 2, 2025",
      readTime: "7 min read"
    },
    {
      slug: "pick-movie-five-minutes",
      title: "How to Pick a Movie in Under 5 Minutes (A Practical Guide)",
      description: "Simple strategies to end the endless scroll and start watching.",
      category: "Guide",
      date: "Dec 1, 2025",
      readTime: "4 min read"
    }
  ];
  return renderTemplate`${renderComponent($$result, "Layout", $$Layout, { "title": "Blog | GoodWatch", "description": "Articles about movies, streaming, and the psychology of choice. Tips to find your next favorite film." }, { "default": ($$result2) => renderTemplate` ${maybeRenderHead()}<section class="py-16 px-4"> <div class="max-w-4xl mx-auto"> <div class="text-center mb-12"> <h1 class="text-4xl md:text-5xl font-bold mb-4">GoodWatch Blog</h1> <p class="text-xl text-gw-text-secondary">
Thoughts on movies, streaming, and escaping the endless scroll.
</p> </div> <div class="space-y-8"> ${posts.map((post) => renderTemplate`<article class="bg-gw-card border border-gw-border rounded-xl p-6 hover:border-gw-accent/50 transition"> <a${addAttribute(`/blog/${post.slug}`, "href")} class="block"> <div class="flex items-center gap-3 text-sm text-gw-text-secondary mb-3"> <span class="px-2 py-1 bg-gw-accent/10 text-gw-accent rounded text-xs">${post.category}</span> <span>${post.date}</span> <span>•</span> <span>${post.readTime}</span> </div> <h2 class="text-2xl font-bold mb-2 hover:text-gw-accent transition">${post.title}</h2> <p class="text-gw-text-secondary">${post.description}</p> </a> </article>`)} </div> </div> </section> ` })}`;
}, "/Users/parikshitjhajharia/Desktop/GOODWATCH/goodwatch-web/src/pages/blog.astro", void 0);

const $$file = "/Users/parikshitjhajharia/Desktop/GOODWATCH/goodwatch-web/src/pages/blog.astro";
const $$url = "/blog";

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: $$Blog,
  file: $$file,
  url: $$url
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
