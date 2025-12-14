globalThis.process ??= {}; globalThis.process.env ??= {};
import { e as createAstro, f as createComponent, r as renderTemplate, o as renderSlot, p as renderHead, n as renderScript, u as unescapeHTML, h as addAttribute } from './astro/server_AFKA17W8.mjs';
/* empty css                       */

var __freeze = Object.freeze;
var __defProp = Object.defineProperty;
var __template = (cooked, raw) => __freeze(__defProp(cooked, "raw", { value: __freeze(cooked.slice()) }));
var _a, _b;
const $$Astro = createAstro("https://goodwatch.movie");
const $$Layout = createComponent(($$result, $$props, $$slots) => {
  const Astro2 = $$result.createAstro($$Astro, $$props, $$slots);
  Astro2.self = $$Layout;
  const {
    title,
    description,
    image = "/og-default.jpg",
    type = "website",
    canonical,
    noindex = false,
    schema
  } = Astro2.props;
  const siteUrl = "https://goodwatch.movie";
  const fullTitle = title.includes("GoodWatch") ? title : `${title} | GoodWatch`;
  const canonicalUrl = canonical || new URL(Astro2.url.pathname, siteUrl).href;
  const ogImage = image.startsWith("http") ? image : `${siteUrl}${image}`;
  return renderTemplate(_b || (_b = __template(['<html lang="en"> <head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><!-- Primary Meta Tags --><title>', '</title><meta name="title"', '><meta name="description"', ">", '<!-- Canonical --><link rel="canonical"', '><!-- Open Graph / Facebook --><meta property="og:type"', '><meta property="og:url"', '><meta property="og:title"', '><meta property="og:description"', '><meta property="og:image"', '><meta property="og:site_name" content="GoodWatch"><!-- Twitter --><meta name="twitter:card" content="summary_large_image"><meta name="twitter:url"', '><meta name="twitter:title"', '><meta name="twitter:description"', '><meta name="twitter:image"', '><!-- Favicon --><link rel="icon" type="image/svg+xml" href="/favicon.svg"><link rel="apple-touch-icon" href="/favicon.svg"><!-- Fonts --><link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin><link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet"><!-- Schema.org Structured Data -->', `<!-- Default Organization Schema --><script type="application/ld+json">
    {
      "@context": "https://schema.org",
      "@type": "WebSite",
      "name": "GoodWatch",
      "url": "https://goodwatch.movie",
      "description": "Discover your next favorite movie based on your mood. Browse movies by mood, genre, or explore curated recommendations.",
      "potentialAction": {
        "@type": "SearchAction",
        "target": "https://goodwatch.movie/search?q={search_term_string}",
        "query-input": "required name=search_term_string"
      }
    }
  <\/script><!-- Organization Schema --><script type="application/ld+json">
    {
      "@context": "https://schema.org",
      "@type": "Organization",
      "name": "GoodWatch",
      "url": "https://goodwatch.movie",
      "logo": "https://goodwatch.movie/favicon.svg",
      "sameAs": [],
      "description": "GoodWatch helps you discover movies based on how you're feeling. Find the perfect movie for your mood."
    }
  <\/script><!-- Google Analytics --><script async src="https://www.googletagmanager.com/gtag/js?id=G-9DJ2HVCQ3M"><\/script>`, "", '</head> <body class="bg-gw-bg text-gw-text min-h-screen font-sans antialiased"> <!-- Navigation --> <nav class="fixed top-0 left-0 right-0 z-50 bg-gw-bg/80 backdrop-blur-lg border-b border-gw-border"> <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8"> <div class="flex items-center justify-between h-16"> <!-- Logo --> <a href="/" class="flex items-center gap-2"> <svg class="w-8 h-8" viewBox="0 0 24 24"> <rect x="0" y="0" width="24" height="24" rx="3" fill="#E63946"></rect> <rect x="1.5" y="2" width="3" height="3.5" rx="0.5" fill="#0D0D0F"></rect> <rect x="1.5" y="7.5" width="3" height="3.5" rx="0.5" fill="#0D0D0F"></rect> <rect x="1.5" y="13" width="3" height="3.5" rx="0.5" fill="#0D0D0F"></rect> <rect x="1.5" y="18.5" width="3" height="3.5" rx="0.5" fill="#0D0D0F"></rect> <rect x="19.5" y="2" width="3" height="3.5" rx="0.5" fill="#0D0D0F"></rect> <rect x="19.5" y="7.5" width="3" height="3.5" rx="0.5" fill="#0D0D0F"></rect> <rect x="19.5" y="13" width="3" height="3.5" rx="0.5" fill="#0D0D0F"></rect> <rect x="19.5" y="18.5" width="3" height="3.5" rx="0.5" fill="#0D0D0F"></rect> <rect x="6" y="2" width="12" height="9" rx="1" fill="#0D0D0F"></rect> <rect x="6" y="13" width="12" height="9" rx="1" fill="#0D0D0F"></rect> </svg> <span class="text-xl font-bold">GoodWatch</span> </a> <!-- Nav Links --> <div class="hidden md:flex items-center gap-8"> <a href="/moods" class="text-gw-text-secondary hover:text-white transition">Moods</a> <a href="/genres" class="text-gw-text-secondary hover:text-white transition">Genres</a> <a href="/lists" class="text-gw-text-secondary hover:text-white transition">Lists</a> <a href="/search" class="text-gw-text-secondary hover:text-white transition">Search</a> </div> <!-- CTA --> <a href="/app" class="bg-gw-accent hover:bg-gw-accent-hover text-gw-bg px-4 py-2 rounded-full font-semibold text-sm transition">\nGet the App\n</a> </div> </div> </nav> <!-- Main Content --> <main class="pt-16"> ', ' </main> <!-- Footer --> <footer class="bg-gw-card border-t border-gw-border mt-20"> <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12"> <div class="grid grid-cols-2 md:grid-cols-4 gap-8"> <!-- Brand --> <div class="col-span-2 md:col-span-1"> <a href="/" class="flex items-center gap-2 mb-4"> <svg class="w-8 h-8" viewBox="0 0 24 24"> <rect x="0" y="0" width="24" height="24" rx="3" fill="#E63946"></rect> <rect x="1.5" y="2" width="3" height="3.5" rx="0.5" fill="#0D0D0F"></rect> <rect x="1.5" y="7.5" width="3" height="3.5" rx="0.5" fill="#0D0D0F"></rect> <rect x="1.5" y="13" width="3" height="3.5" rx="0.5" fill="#0D0D0F"></rect> <rect x="1.5" y="18.5" width="3" height="3.5" rx="0.5" fill="#0D0D0F"></rect> <rect x="19.5" y="2" width="3" height="3.5" rx="0.5" fill="#0D0D0F"></rect> <rect x="19.5" y="7.5" width="3" height="3.5" rx="0.5" fill="#0D0D0F"></rect> <rect x="19.5" y="13" width="3" height="3.5" rx="0.5" fill="#0D0D0F"></rect> <rect x="19.5" y="18.5" width="3" height="3.5" rx="0.5" fill="#0D0D0F"></rect> <rect x="6" y="2" width="12" height="9" rx="1" fill="#0D0D0F"></rect> <rect x="6" y="13" width="12" height="9" rx="1" fill="#0D0D0F"></rect> </svg> <span class="text-lg font-bold">GoodWatch</span> </a> <p class="text-gw-text-secondary text-sm">\nDiscover your next favorite movie based on how you feel.\n</p> </div> <!-- Discover --> <div> <h4 class="font-semibold mb-4">Discover</h4> <ul class="space-y-2 text-sm text-gw-text-secondary"> <li><a href="/moods" class="hover:text-white transition">Browse by Mood</a></li> <li><a href="/genres" class="hover:text-white transition">Browse by Genre</a></li> <li><a href="/decade" class="hover:text-white transition">Browse by Decade</a></li> <li><a href="/best" class="hover:text-white transition">Best Movies</a></li> <li><a href="/movies-for" class="hover:text-white transition">Movies For...</a></li> <li><a href="/search" class="hover:text-white transition">Search</a></li> </ul> </div> <!-- Moods --> <div> <h4 class="font-semibold mb-4">Popular Moods</h4> <ul class="space-y-2 text-sm text-gw-text-secondary"> <li><a href="/mood/feel-good" class="hover:text-white transition">Feel-Good</a></li> <li><a href="/mood/thrilling" class="hover:text-white transition">Thrilling</a></li> <li><a href="/mood/nostalgic" class="hover:text-white transition">Nostalgic</a></li> <li><a href="/mood/mind-bending" class="hover:text-white transition">Mind-Bending</a></li> </ul> </div> <!-- Company --> <div> <h4 class="font-semibold mb-4">GoodWatch</h4> <ul class="space-y-2 text-sm text-gw-text-secondary"> <li><a href="/app" class="hover:text-white transition">Get the App</a></li> <li><a href="/blog" class="hover:text-white transition">Blog</a></li> <li><a href="/about" class="hover:text-white transition">About</a></li> <li><a href="/privacy" class="hover:text-white transition">Privacy</a></li> <li><a href="/terms" class="hover:text-white transition">Terms</a></li> </ul> </div> </div> <div class="border-t border-gw-border mt-8 pt-8 text-center text-sm text-gw-text-secondary"> <p>&copy; ', " GoodWatch. Movie data from TMDB.</p> </div> </div> </footer> </body></html>"])), fullTitle, addAttribute(fullTitle, "content"), addAttribute(description, "content"), noindex && renderTemplate`<meta name="robots" content="noindex, nofollow">`, addAttribute(canonicalUrl, "href"), addAttribute(type, "content"), addAttribute(canonicalUrl, "content"), addAttribute(fullTitle, "content"), addAttribute(description, "content"), addAttribute(ogImage, "content"), addAttribute(canonicalUrl, "content"), addAttribute(fullTitle, "content"), addAttribute(description, "content"), addAttribute(ogImage, "content"), schema && renderTemplate(_a || (_a = __template(['<script type="application/ld+json">', "<\/script>"])), unescapeHTML(JSON.stringify(schema))), renderScript($$result, "/Users/parikshitjhajharia/Desktop/GOODWATCH/goodwatch-web/src/layouts/Layout.astro?astro&type=script&index=0&lang.ts"), renderHead(), renderSlot($$result, $$slots["default"]), (/* @__PURE__ */ new Date()).getFullYear());
}, "/Users/parikshitjhajharia/Desktop/GOODWATCH/goodwatch-web/src/layouts/Layout.astro", void 0);

export { $$Layout as $ };
