globalThis.process ??= {}; globalThis.process.env ??= {};
import { q as getAllMoviesForSitemap, M as MOODS, s as slugify, G as GENRES, O as OCCASIONS, D as DECADES } from '../chunks/supabase_CNgPmO2d.mjs';
export { renderers } from '../renderers.mjs';

const prerender = false;
const BEST_COMBINATIONS = [
  "feel-good-comedies",
  "romantic-dramas",
  "thrilling-action",
  "mind-bending-sci-fi",
  "dark-thrillers",
  "inspirational-dramas",
  "funny-animations",
  "adventurous-fantasy",
  "emotional-romance",
  "mysterious-crime",
  "nostalgic-family",
  "intense-horror",
  "uplifting-musicals",
  "thought-provoking-documentaries",
  "relaxing-comedies"
];
const GET = async () => {
  const movies = await getAllMoviesForSitemap();
  const siteUrl = "https://goodwatch.movie";
  const staticPages = [
    { url: "", priority: "1.0", changefreq: "daily" },
    { url: "/moods", priority: "0.9", changefreq: "weekly" },
    { url: "/genres", priority: "0.9", changefreq: "weekly" },
    { url: "/search", priority: "0.7", changefreq: "daily" },
    { url: "/app", priority: "0.8", changefreq: "monthly" },
    { url: "/lists", priority: "0.8", changefreq: "weekly" },
    { url: "/movies-for", priority: "0.9", changefreq: "weekly" },
    { url: "/best", priority: "0.9", changefreq: "weekly" },
    { url: "/decade", priority: "0.8", changefreq: "monthly" }
  ];
  const moodPages = MOODS.map((mood) => ({
    url: `/mood/${slugify(mood)}`,
    priority: "0.8",
    changefreq: "weekly"
  }));
  const genrePages = GENRES.map((genre) => ({
    url: `/genre/${slugify(genre)}`,
    priority: "0.8",
    changefreq: "weekly"
  }));
  const occasionPages = OCCASIONS.map((occasion) => ({
    url: `/movies-for/${occasion.slug}`,
    priority: "0.8",
    changefreq: "weekly"
  }));
  const decadePages = DECADES.map((decade) => ({
    url: `/decade/${decade.toLowerCase().replace("s", "")}`,
    priority: "0.8",
    changefreq: "monthly"
  }));
  const bestPages = BEST_COMBINATIONS.map((combo) => ({
    url: `/best/${combo}`,
    priority: "0.8",
    changefreq: "weekly"
  }));
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${staticPages.map((page) => `  <url>
    <loc>${siteUrl}${page.url}</loc>
    <changefreq>${page.changefreq}</changefreq>
    <priority>${page.priority}</priority>
  </url>`).join("\n")}
${moodPages.map((page) => `  <url>
    <loc>${siteUrl}${page.url}</loc>
    <changefreq>${page.changefreq}</changefreq>
    <priority>${page.priority}</priority>
  </url>`).join("\n")}
${genrePages.map((page) => `  <url>
    <loc>${siteUrl}${page.url}</loc>
    <changefreq>${page.changefreq}</changefreq>
    <priority>${page.priority}</priority>
  </url>`).join("\n")}
${occasionPages.map((page) => `  <url>
    <loc>${siteUrl}${page.url}</loc>
    <changefreq>${page.changefreq}</changefreq>
    <priority>${page.priority}</priority>
  </url>`).join("\n")}
${decadePages.map((page) => `  <url>
    <loc>${siteUrl}${page.url}</loc>
    <changefreq>${page.changefreq}</changefreq>
    <priority>${page.priority}</priority>
  </url>`).join("\n")}
${bestPages.map((page) => `  <url>
    <loc>${siteUrl}${page.url}</loc>
    <changefreq>${page.changefreq}</changefreq>
    <priority>${page.priority}</priority>
  </url>`).join("\n")}
${movies.map((movie) => `  <url>
    <loc>${siteUrl}/movie/${movie.tmdb_id}</loc>
    <changefreq>monthly</changefreq>
    <priority>0.6</priority>
  </url>`).join("\n")}
</urlset>`;
  return new Response(xml, {
    headers: {
      "Content-Type": "application/xml",
      "Cache-Control": "public, max-age=3600"
    }
  });
};

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  GET,
  prerender
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
