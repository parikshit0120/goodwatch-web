globalThis.process ??= {}; globalThis.process.env ??= {};
/* empty css                                    */
import { f as createComponent, k as renderComponent, l as renderScript, r as renderTemplate, m as maybeRenderHead } from '../../chunks/astro/server_Cyy51z0E.mjs';
import { $ as $$Layout } from '../../chunks/Layout_B6Hz-kRD.mjs';
export { renderers } from '../../renderers.mjs';

const $$Callback = createComponent(async ($$result, $$props, $$slots) => {
  return renderTemplate`${renderComponent($$result, "Layout", $$Layout, { "title": "Signing in... | GoodWatch", "description": "Completing your sign in to GoodWatch", "noindex": true }, { "default": async ($$result2) => renderTemplate` ${maybeRenderHead()}<div class="min-h-[60vh] flex items-center justify-center"> <div class="text-center"> <div class="w-16 h-16 border-4 border-gw-accent border-t-transparent rounded-full animate-spin mx-auto mb-6"></div> <h1 class="text-2xl font-bold mb-2">Signing you in...</h1> <p class="text-gw-text-secondary">Just a moment while we set things up.</p> </div> </div> ` })} ${renderScript($$result, "/Users/parikshitjhajharia/Desktop/GOODWATCH/goodwatch-web/src/pages/auth/callback.astro?astro&type=script&index=0&lang.ts")}`;
}, "/Users/parikshitjhajharia/Desktop/GOODWATCH/goodwatch-web/src/pages/auth/callback.astro", void 0);

const $$file = "/Users/parikshitjhajharia/Desktop/GOODWATCH/goodwatch-web/src/pages/auth/callback.astro";
const $$url = "/auth/callback";

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: $$Callback,
  file: $$file,
  url: $$url
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
