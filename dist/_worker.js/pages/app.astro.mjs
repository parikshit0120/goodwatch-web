globalThis.process ??= {}; globalThis.process.env ??= {};
/* empty css                               */
import { f as createComponent, k as renderComponent, r as renderTemplate, m as maybeRenderHead } from '../chunks/astro/server_AFKA17W8.mjs';
import { $ as $$Layout } from '../chunks/Layout_D6ytcMm7.mjs';
export { renderers } from '../renderers.mjs';

const $$App = createComponent(async ($$result, $$props, $$slots) => {
  return renderTemplate`${renderComponent($$result, "Layout", $$Layout, { "title": "Get the GoodWatch App", "description": "Download the GoodWatch app for iOS. Swipe to discover movies that match your mood. Your personal movie recommendation companion." }, { "default": async ($$result2) => renderTemplate` ${maybeRenderHead()}<section class="py-20 px-4"> <div class="max-w-4xl mx-auto text-center"> <!-- Hero --> <div class="mb-12"> <div class="w-24 h-24 mx-auto mb-6"> <svg viewBox="0 0 24 24" class="w-full h-full"> <rect x="0" y="0" width="24" height="24" rx="3" fill="#E63946"></rect> <rect x="1.5" y="2" width="3" height="3.5" rx="0.5" fill="#0D0D0F"></rect> <rect x="1.5" y="7.5" width="3" height="3.5" rx="0.5" fill="#0D0D0F"></rect> <rect x="1.5" y="13" width="3" height="3.5" rx="0.5" fill="#0D0D0F"></rect> <rect x="1.5" y="18.5" width="3" height="3.5" rx="0.5" fill="#0D0D0F"></rect> <rect x="19.5" y="2" width="3" height="3.5" rx="0.5" fill="#0D0D0F"></rect> <rect x="19.5" y="7.5" width="3" height="3.5" rx="0.5" fill="#0D0D0F"></rect> <rect x="19.5" y="13" width="3" height="3.5" rx="0.5" fill="#0D0D0F"></rect> <rect x="19.5" y="18.5" width="3" height="3.5" rx="0.5" fill="#0D0D0F"></rect> <rect x="6" y="2" width="12" height="9" rx="1" fill="#0D0D0F"></rect> <rect x="6" y="13" width="12" height="9" rx="1" fill="#0D0D0F"></rect> </svg> </div> <h1 class="text-4xl md:text-6xl font-bold mb-6">
Swipe. Discover. Watch.
</h1> <p class="text-xl text-gw-text-secondary max-w-2xl mx-auto mb-10">
The GoodWatch app brings movie discovery to your fingertips. 
          Swipe right on movies you love, left on ones you'll skip. 
          Your perfect movie night awaits.
</p> <!-- Download Button --> <a href="#" class="inline-flex items-center gap-3 bg-gw-accent hover:bg-gw-accent-hover text-gw-bg px-8 py-4 rounded-full font-semibold text-lg transition"> <svg class="w-7 h-7" fill="currentColor" viewBox="0 0 24 24"> <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09l.01-.01zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"></path> </svg>
Download for iOS
</a> <p class="text-sm text-gw-text-secondary mt-4">
Coming soon to the App Store
</p> </div> <!-- Features --> <div class="grid md:grid-cols-3 gap-8 mt-20"> <div class="bg-gw-card border border-gw-border rounded-xl p-8"> <div class="w-12 h-12 bg-gw-accent/20 rounded-full flex items-center justify-center mx-auto mb-4"> <svg class="w-6 h-6 text-gw-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24"> <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path> </svg> </div> <h3 class="text-xl font-bold mb-2">Mood-Based Discovery</h3> <p class="text-gw-text-secondary">
Tell us how you feel, and we'll show you movies that match your mood perfectly.
</p> </div> <div class="bg-gw-card border border-gw-border rounded-xl p-8"> <div class="w-12 h-12 bg-gw-accent/20 rounded-full flex items-center justify-center mx-auto mb-4"> <svg class="w-6 h-6 text-gw-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24"> <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"></path> </svg> </div> <h3 class="text-xl font-bold mb-2">Swipe to Decide</h3> <p class="text-gw-text-secondary">
Like Tinder, but for movies. Swipe right to save, left to skip. No more scrolling paralysis.
</p> </div> <div class="bg-gw-card border border-gw-border rounded-xl p-8"> <div class="w-12 h-12 bg-gw-accent/20 rounded-full flex items-center justify-center mx-auto mb-4"> <svg class="w-6 h-6 text-gw-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24"> <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z"></path> </svg> </div> <h3 class="text-xl font-bold mb-2">Personal Watchlist</h3> <p class="text-gw-text-secondary">
Build your movie queue and never forget what you wanted to watch.
</p> </div> </div> <!-- How It Works --> <div class="mt-20"> <h2 class="text-3xl font-bold mb-12">How It Works</h2> <div class="flex flex-col md:flex-row items-center justify-center gap-8 md:gap-16"> <div class="text-center"> <div class="w-16 h-16 bg-gw-accent text-gw-bg rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4">1</div> <h3 class="font-semibold mb-2">Pick Your Mood</h3> <p class="text-gw-text-secondary text-sm">Choose how you're feeling right now</p> </div> <svg class="w-8 h-8 text-gw-text-secondary hidden md:block" fill="none" stroke="currentColor" viewBox="0 0 24 24"> <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"></path> </svg> <div class="text-center"> <div class="w-16 h-16 bg-gw-accent text-gw-bg rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4">2</div> <h3 class="font-semibold mb-2">Swipe Movies</h3> <p class="text-gw-text-secondary text-sm">Right for yes, left for no</p> </div> <svg class="w-8 h-8 text-gw-text-secondary hidden md:block" fill="none" stroke="currentColor" viewBox="0 0 24 24"> <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"></path> </svg> <div class="text-center"> <div class="w-16 h-16 bg-gw-accent text-gw-bg rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4">3</div> <h3 class="font-semibold mb-2">Watch!</h3> <p class="text-gw-text-secondary text-sm">Find where to stream & enjoy</p> </div> </div> </div> <!-- Final CTA --> <div class="mt-20 bg-gradient-to-br from-gw-accent/20 to-gw-accent/5 border border-gw-accent/30 rounded-2xl p-12"> <h2 class="text-2xl font-bold mb-4">Ready to End the "What Should We Watch?" Debate?</h2> <p class="text-gw-text-secondary mb-8">
Join thousands of movie lovers who've found their perfect films with GoodWatch.
</p> <a href="#" class="inline-flex items-center gap-2 bg-gw-accent hover:bg-gw-accent-hover text-gw-bg px-8 py-4 rounded-full font-semibold text-lg transition">
Get Early Access
</a> </div> </div> </section> ` })}`;
}, "/Users/parikshitjhajharia/Desktop/GOODWATCH/goodwatch-web/src/pages/app.astro", void 0);

const $$file = "/Users/parikshitjhajharia/Desktop/GOODWATCH/goodwatch-web/src/pages/app.astro";
const $$url = "/app";

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: $$App,
  file: $$file,
  url: $$url
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
