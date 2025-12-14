globalThis.process ??= {}; globalThis.process.env ??= {};
/* empty css                               */
import { f as createComponent, k as renderComponent, r as renderTemplate, m as maybeRenderHead } from '../chunks/astro/server_AFKA17W8.mjs';
import { $ as $$Layout } from '../chunks/Layout_D6ytcMm7.mjs';
export { renderers } from '../renderers.mjs';

const $$404 = createComponent(($$result, $$props, $$slots) => {
  return renderTemplate`${renderComponent($$result, "Layout", $$Layout, { "title": "Page Not Found", "description": "The page you're looking for doesn't exist.", "noindex": true }, { "default": ($$result2) => renderTemplate` ${maybeRenderHead()}<section class="py-20 px-4 text-center min-h-[60vh] flex items-center justify-center"> <div> <h1 class="text-6xl font-bold text-gw-accent mb-4">404</h1> <h2 class="text-2xl font-bold mb-4">Page Not Found</h2> <p class="text-gw-text-secondary mb-8 max-w-md mx-auto">
Looks like this page took an unexpected plot twist. Let's get you back on track.
</p> <div class="flex flex-wrap justify-center gap-4"> <a href="/" class="bg-gw-accent hover:bg-gw-accent-hover text-gw-bg px-6 py-3 rounded-full font-semibold transition">
Go Home
</a> <a href="/moods" class="bg-gw-card hover:bg-gw-border border border-gw-border px-6 py-3 rounded-full font-semibold transition">
Browse by Mood
</a> </div> </div> </section> ` })}`;
}, "/Users/parikshitjhajharia/Desktop/GOODWATCH/goodwatch-web/src/pages/404.astro", void 0);

const $$file = "/Users/parikshitjhajharia/Desktop/GOODWATCH/goodwatch-web/src/pages/404.astro";
const $$url = "/404";

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: $$404,
  file: $$file,
  url: $$url
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
