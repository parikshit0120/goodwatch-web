globalThis.process ??= {}; globalThis.process.env ??= {};
/* empty css                               */
import { f as createComponent, k as renderComponent, r as renderTemplate, m as maybeRenderHead, h as addAttribute } from '../chunks/astro/server_AFKA17W8.mjs';
import { $ as $$Layout } from '../chunks/Layout_D6ytcMm7.mjs';
import { M as MOODS, s as slugify } from '../chunks/supabase_CNgPmO2d.mjs';
export { renderers } from '../renderers.mjs';

const $$Moods = createComponent(($$result, $$props, $$slots) => {
  const moodEmojis = {
    "Feel-Good": "\u{1F60A}",
    "Thrilling": "\u{1F3A2}",
    "Romantic": "\u{1F495}",
    "Mind-Bending": "\u{1F300}",
    "Nostalgic": "\u{1F4FC}",
    "Dark": "\u{1F311}",
    "Inspirational": "\u2728",
    "Relaxing": "\u{1F30A}",
    "Adventurous": "\u{1F5FA}\uFE0F",
    "Emotional": "\u{1F622}",
    "Funny": "\u{1F602}",
    "Intense": "\u{1F525}",
    "Mysterious": "\u{1F50D}",
    "Uplifting": "\u{1F388}",
    "Thought-Provoking": "\u{1F914}"
  };
  return renderTemplate`${renderComponent($$result, "Layout", $$Layout, { "title": "Browse Movies by Mood", "description": "Find the perfect movie for any mood. Whether you're feeling happy, sad, adventurous, or nostalgic - discover films that match exactly how you feel." }, { "default": ($$result2) => renderTemplate` ${maybeRenderHead()}<section class="py-16 px-4"> <div class="max-w-4xl mx-auto text-center mb-12"> <h1 class="text-3xl md:text-5xl font-bold mb-4">How Are You Feeling?</h1> <p class="text-xl text-gw-text-secondary">
Choose a mood and discover movies that match exactly how you feel right now.
</p> </div> <div class="max-w-5xl mx-auto"> <div class="grid grid-cols-2 md:grid-cols-3 gap-4"> ${MOODS.map((mood) => renderTemplate`<a${addAttribute(`/mood/${slugify(mood)}`, "href")} class="bg-gw-card hover:bg-gw-accent hover:text-gw-bg border border-gw-border rounded-xl p-6 text-center transition group"> <span class="text-4xl mb-3 block">${moodEmojis[mood] || "\u{1F3AC}"}</span> <span class="font-semibold text-lg">${mood}</span> </a>`)} </div> </div> </section>  <section class="py-12 px-4 border-t border-gw-border"> <div class="max-w-4xl mx-auto"> <h2 class="text-2xl font-bold mb-4">Find Movies by How You Feel</h2> <p class="text-gw-text-secondary mb-4">
Sometimes you know exactly what mood you're in, but not what to watch. That's where GoodWatch comes in. 
        Our mood-based movie discovery helps you find films that match your current emotional state.
</p> <p class="text-gw-text-secondary">
Whether you need a feel-good movie to lift your spirits, something thrilling to get your heart racing, 
        or a nostalgic classic to take you back in time – we've curated collections for every mood. 
        Each movie is carefully tagged based on its emotional tone, themes, and the feelings it evokes.
</p> </div> </section> ` })}`;
}, "/Users/parikshitjhajharia/Desktop/GOODWATCH/goodwatch-web/src/pages/moods.astro", void 0);

const $$file = "/Users/parikshitjhajharia/Desktop/GOODWATCH/goodwatch-web/src/pages/moods.astro";
const $$url = "/moods";

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: $$Moods,
  file: $$file,
  url: $$url
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
