globalThis.process ??= {}; globalThis.process.env ??= {};
/* empty css                               */
import { f as createComponent, k as renderComponent, n as renderScript, r as renderTemplate, m as maybeRenderHead } from '../chunks/astro/server_AFKA17W8.mjs';
import { $ as $$Layout } from '../chunks/Layout_D6ytcMm7.mjs';
export { renderers } from '../renderers.mjs';

const $$Calibrate = createComponent(async ($$result, $$props, $$slots) => {
  return renderTemplate`${renderComponent($$result, "Layout", $$Layout, { "title": "Taste Quiz | GoodWatch", "description": "Help us learn your taste in 1 minute with quick movie comparisons." }, { "default": async ($$result2) => renderTemplate` ${maybeRenderHead()}<section class="py-8 px-4 min-h-screen"> <div class="max-w-2xl mx-auto"> <div class="text-center mb-8"> <h1 class="text-2xl font-bold mb-2">Quick Taste Quiz</h1> <p class="text-gw-text-secondary">Pick the movie you'd rather watch. No wrong answers!</p> </div> <div class="max-w-md mx-auto mb-8"> <div class="flex justify-between text-sm text-gw-text-secondary mb-2"> <span>Learning your taste...</span> <span><span id="progress-count">0</span> / 10</span> </div> <div class="h-2 bg-gw-border rounded-full overflow-hidden"> <div id="progress-bar" class="h-full bg-gw-accent transition-all duration-300" style="width: 0%"></div> </div> </div> <div id="comparison-area"> <div class="flex items-center justify-center h-80"> <div class="animate-spin rounded-full h-12 w-12 border-4 border-gw-accent border-t-transparent"></div> </div> </div> <div class="flex justify-center gap-4 mt-6" id="alt-buttons" style="display:none"> <button id="btn-both" class="px-4 py-2 text-sm text-gw-text-secondary hover:text-white border border-gw-border rounded-lg hover:border-gw-accent">Both look good</button> <button id="btn-neither" class="px-4 py-2 text-sm text-gw-text-secondary hover:text-white border border-gw-border rounded-lg hover:border-gw-accent">Neither for me</button> <button id="btn-skip" class="px-4 py-2 text-sm text-gw-text-secondary hover:text-white border border-gw-border rounded-lg hover:border-gw-accent">Skip</button> </div> <div id="complete-state" style="display:none" class="text-center py-12"> <div class="text-6xl mb-4">🎬</div> <h2 class="text-2xl font-bold mb-2">All done!</h2> <p class="text-gw-text-secondary mb-6">Your recommendations are now personalized.</p> <a href="/discover" class="inline-block bg-gw-accent hover:bg-gw-accent-hover text-gw-bg px-8 py-3 rounded-full font-semibold">Start Discovering →</a> </div> </div> </section> ` })} ${renderScript($$result, "/Users/parikshitjhajharia/Desktop/GOODWATCH/goodwatch-web/src/pages/calibrate.astro?astro&type=script&index=0&lang.ts")}`;
}, "/Users/parikshitjhajharia/Desktop/GOODWATCH/goodwatch-web/src/pages/calibrate.astro", void 0);

const $$file = "/Users/parikshitjhajharia/Desktop/GOODWATCH/goodwatch-web/src/pages/calibrate.astro";
const $$url = "/calibrate";

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: $$Calibrate,
  file: $$file,
  url: $$url
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
