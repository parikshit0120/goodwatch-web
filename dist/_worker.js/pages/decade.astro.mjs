globalThis.process ??= {}; globalThis.process.env ??= {};
/* empty css                               */
import { f as createComponent, k as renderComponent, r as renderTemplate, m as maybeRenderHead, h as addAttribute } from '../chunks/astro/server_AFKA17W8.mjs';
import { $ as $$Layout } from '../chunks/Layout_D6ytcMm7.mjs';
import { D as DECADES } from '../chunks/supabase_CNgPmO2d.mjs';
export { renderers } from '../renderers.mjs';

const $$Index = createComponent(($$result, $$props, $$slots) => {
  const siteUrl = "https://goodwatch.movie";
  const schema = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    "name": "Movies by Decade",
    "description": "Browse the best movies from every decade - from the 1970s to today.",
    "url": `${siteUrl}/decade`
  };
  const decadeDescriptions = {
    "1970s": "The golden age of New Hollywood with auteur-driven masterpieces",
    "1980s": "Blockbuster era with iconic action and adventure films",
    "1990s": "The rise of independent cinema and cult classics",
    "2000s": "CGI revolution and franchise filmmaking",
    "2010s": "Superhero dominance and streaming originals",
    "2020s": "Hybrid releases and bold new storytelling"
  };
  return renderTemplate`${renderComponent($$result, "Layout", $$Layout, { "title": "Best Movies by Decade | 1970s to Today", "description": "Explore the greatest films from every decade. From 1970s classics to 2020s hits, discover hundreds of must-watch movies organized by era.", "schema": schema }, { "default": ($$result2) => renderTemplate` ${maybeRenderHead()}<div class="max-w-7xl mx-auto px-4 py-12"> <nav class="text-sm text-gw-text-secondary mb-6"> <a href="/" class="hover:text-white">Home</a> <span class="mx-2">›</span> <span class="text-white">Decades</span> </nav> <h1 class="text-4xl md:text-5xl font-bold mb-4">Movies by Decade</h1> <p class="text-xl text-gw-text-secondary mb-12 max-w-3xl">
Every decade has its own cinematic flavor. Explore the best films from each era,
      from the auteur-driven 1970s to the streaming age of the 2020s.
</p> <div class="grid sm:grid-cols-2 lg:grid-cols-3 gap-6"> ${DECADES.map((decade) => renderTemplate`<a${addAttribute(`/decade/${decade.toLowerCase().replace("s", "")}`, "href")} class="bg-gw-card hover:bg-gw-border border border-gw-border rounded-xl p-6 transition group"> <h2 class="text-3xl font-bold mb-2 group-hover:text-gw-accent transition"> ${decade} </h2> <p class="text-gw-text-secondary text-sm mb-4"> ${decadeDescriptions[decade]} </p> <span class="text-gw-accent text-sm font-medium">
Explore ${decade} →
</span> </a>`)} </div> <section class="border-t border-gw-border mt-16 pt-12"> <h2 class="text-2xl font-bold mb-6">How Cinema Has Evolved</h2> <div class="prose prose-invert max-w-none"> <p class="text-gw-text-secondary mb-4">
Each decade brought unique innovations to filmmaking. The 1970s gave us gritty realism, 
          the 1980s delivered spectacle, and the 1990s saw the rise of indie cinema. 
          Understanding these eras helps you appreciate films in their historical context.
</p> <p class="text-gw-text-secondary">
Whether you're looking for nostalgic favorites or discovering classics for the first time,
          our decade-based browsing makes it easy to find great films from any era.
</p> </div> </section> </div> ` })}`;
}, "/Users/parikshitjhajharia/Desktop/GOODWATCH/goodwatch-web/src/pages/decade/index.astro", void 0);

const $$file = "/Users/parikshitjhajharia/Desktop/GOODWATCH/goodwatch-web/src/pages/decade/index.astro";
const $$url = "/decade";

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: $$Index,
  file: $$file,
  url: $$url
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
