globalThis.process ??= {}; globalThis.process.env ??= {};
/* empty css                               */
import { f as createComponent, k as renderComponent, r as renderTemplate, m as maybeRenderHead, h as addAttribute } from '../chunks/astro/server_AFKA17W8.mjs';
import { $ as $$Layout } from '../chunks/Layout_D6ytcMm7.mjs';
export { renderers } from '../renderers.mjs';

const $$Lists = createComponent(($$result, $$props, $$slots) => {
  const lists = [
    {
      href: "/movies-for/date-night",
      title: "Perfect Date Night",
      description: "Romantic picks for a cozy evening",
      emoji: "\u{1F495}"
    },
    {
      href: "/best/mind-bending-sci-fi",
      title: "Mind-Blowing Plot Twists",
      description: "Films that will leave you speechless",
      emoji: "\u{1F92F}"
    },
    {
      href: "/movies-for/feeling-down",
      title: "Comfort Movies",
      description: "Feel-good films for when you need a lift",
      emoji: "\u{1F6CB}\uFE0F"
    },
    {
      href: "/best/feel-good-comedies",
      title: "Feel-Good Comedies",
      description: "Heartwarming laughs guaranteed",
      emoji: "\u{1F604}"
    },
    {
      href: "/best/dark-thrillers",
      title: "Dark Thrillers",
      description: "Intense psychological suspense",
      emoji: "\u{1F631}"
    },
    {
      href: "/movies-for/family-night",
      title: "Family Movie Night",
      description: "Films the whole family can enjoy",
      emoji: "\u{1F468}\u200D\u{1F469}\u200D\u{1F467}\u200D\u{1F466}"
    },
    {
      href: "/movies-for/rainy-day",
      title: "Rainy Day Movies",
      description: "Cozy picks for staying in",
      emoji: "\u{1F327}\uFE0F"
    },
    {
      href: "/best/inspirational-dramas",
      title: "Inspirational Stories",
      description: "Movies that will motivate you",
      emoji: "\u2728"
    }
  ];
  return renderTemplate`${renderComponent($$result, "Layout", $$Layout, { "title": "Curated Movie Lists", "description": "Browse curated movie lists for every occasion. From date night picks to mind-bending thrillers, find the perfect collection for your next movie session." }, { "default": ($$result2) => renderTemplate` ${maybeRenderHead()}<section class="py-16 px-4"> <div class="max-w-4xl mx-auto text-center mb-12"> <h1 class="text-3xl md:text-5xl font-bold mb-4">Curated Lists</h1> <p class="text-xl text-gw-text-secondary">
Hand-picked collections for every occasion. Find your next movie night sorted.
</p> </div> <div class="max-w-5xl mx-auto"> <div class="grid md:grid-cols-2 gap-6"> ${lists.map((list) => renderTemplate`<a${addAttribute(list.href, "href")} class="bg-gw-card hover:bg-gw-border border border-gw-border rounded-xl p-6 transition group flex items-start gap-4"> <span class="text-4xl">${list.emoji}</span> <div> <h3 class="font-bold text-lg group-hover:text-gw-accent transition mb-1"> ${list.title} </h3> <p class="text-gw-text-secondary text-sm"> ${list.description} </p> </div> </a>`)} </div> </div> <!-- More Collections --> <div class="max-w-5xl mx-auto mt-12"> <h2 class="text-2xl font-bold mb-6">More Ways to Discover</h2> <div class="grid sm:grid-cols-3 gap-4"> <a href="/movies-for" class="bg-gw-card hover:bg-gw-border border border-gw-border rounded-xl p-5 transition text-center"> <span class="text-2xl block mb-2">🎯</span> <span class="font-medium">Movies For...</span> <p class="text-xs text-gw-text-secondary mt-1">By occasion</p> </a> <a href="/best" class="bg-gw-card hover:bg-gw-border border border-gw-border rounded-xl p-5 transition text-center"> <span class="text-2xl block mb-2">🏆</span> <span class="font-medium">Best Of</span> <p class="text-xs text-gw-text-secondary mt-1">By mood + genre</p> </a> <a href="/decade" class="bg-gw-card hover:bg-gw-border border border-gw-border rounded-xl p-5 transition text-center"> <span class="text-2xl block mb-2">📅</span> <span class="font-medium">By Decade</span> <p class="text-xs text-gw-text-secondary mt-1">Classic eras</p> </a> </div> </div> <!-- App CTA --> <div class="max-w-4xl mx-auto mt-16 text-center"> <div class="bg-gw-card border border-gw-border rounded-xl p-8"> <h2 class="text-xl font-bold mb-2">Create Your Own Lists</h2> <p class="text-gw-text-secondary mb-4">
Coming soon: Save and share your own curated movie collections.
</p> <a href="/app" class="inline-block text-gw-accent hover:text-gw-accent-hover transition font-medium">
Get the app →
</a> </div> </div> </section> ` })}`;
}, "/Users/parikshitjhajharia/Desktop/GOODWATCH/goodwatch-web/src/pages/lists.astro", void 0);

const $$file = "/Users/parikshitjhajharia/Desktop/GOODWATCH/goodwatch-web/src/pages/lists.astro";
const $$url = "/lists";

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: $$Lists,
  file: $$file,
  url: $$url
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
