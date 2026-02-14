/**
 * GoodWatch — Dynamic Movie Page (Cloudflare Pages Function)
 *
 * Renders movie detail pages on-demand at the edge.
 * HTML output matches generate_movie_pages.py exactly.
 *
 * Route: /movies/:slug/
 * Example: /movies/the-godfather-1972/
 */

const SUPABASE_URL = "https://jdjqrlkynwfhbtyuddjk.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpkanFybGt5bndmaGJ0eXVkZGprIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ0NzUwMTEsImV4cCI6MjA4MDA1MTAxMX0.KDRMLCewVMp3lwphkUvtoWOkg6kyAk8iSbVkRKiHYSk";
const TMDB_IMAGE_BASE = "https://image.tmdb.org/t/p";
const SITE_URL = "https://goodwatch.movie";

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//  HELPERS
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

function escapeHtml(str) {
  if (!str) return "";
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#x27;");
}

function slugify(title, year) {
  let s = title.toLowerCase().trim();
  s = s.replace(/[''']/g, "");
  s = s.replace(/[^a-z0-9\s-]/g, "");
  s = s.replace(/[\s-]+/g, "-").replace(/^-|-$/g, "");
  if (year) s = `${s}-${year}`;
  return s;
}

function slugifySimple(text) {
  let s = String(text).toLowerCase().trim();
  s = s.replace(/[^a-z0-9\s-]/g, "");
  s = s.replace(/[\s-]+/g, "-").replace(/^-|-$/g, "");
  return s;
}

function goodscore(movie) {
  const cs = movie.composite_score;
  if (cs) return Math.round(cs * 10);
  const imdb = movie.imdb_rating;
  const tmdb = movie.vote_average;
  if (imdb && tmdb) return Math.round((imdb * 0.75 + tmdb * 0.25) * 10);
  if (imdb) return Math.round(imdb * 10);
  if (tmdb) return Math.round(tmdb * 10);
  return null;
}

function goodscoreColor(score) {
  if (score === null || score === undefined) return "text-gw-text-muted";
  if (score >= 80) return "text-green-400";
  if (score >= 65) return "text-gw-accent";
  if (score >= 50) return "text-yellow-400";
  return "text-red-400";
}

function goodscoreBg(score) {
  if (score === null || score === undefined) return "bg-gray-800";
  if (score >= 80) return "bg-green-900/40 border-green-700/50";
  if (score >= 65) return "bg-yellow-900/30 border-gw-accent/30";
  if (score >= 50) return "bg-yellow-900/30 border-yellow-700/50";
  return "bg-red-900/30 border-red-700/50";
}

function formatRuntime(minutes) {
  if (!minutes) return null;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h > 0 && m > 0) return `${h}h ${m}m`;
  if (h > 0) return `${h}h`;
  return `${m}m`;
}

function parseOttProviders(ott) {
  if (!ott) return [];
  if (typeof ott === "string") {
    try { return JSON.parse(ott); } catch { return []; }
  }
  if (Array.isArray(ott)) return ott;
  return [];
}

function getGenreNames(genres) {
  if (!genres) return [];
  if (typeof genres === "string") {
    try {
      const parsed = JSON.parse(genres);
      if (Array.isArray(parsed)) return getGenreNames(parsed);
    } catch {}
    // Comma-separated string
    return genres.split(",").map(g => g.trim()).filter(Boolean);
  }
  if (!Array.isArray(genres)) return [];
  const result = [];
  for (const g of genres) {
    if (typeof g === "object" && g !== null) {
      const name = g.name || "";
      if (name) result.push(name);
    } else if (typeof g === "string" && g) {
      result.push(g);
    }
  }
  return result;
}

const PLATFORM_URL_MAP = {
  "Netflix": "https://www.netflix.com",
  "Netflix Kids": "https://www.netflix.com/kids",
  "Amazon Prime Video": "https://www.primevideo.com",
  "Amazon Prime Video with Ads": "https://www.primevideo.com",
  "Apple TV": "https://tv.apple.com",
  "Apple TV+": "https://tv.apple.com",
  "JioHotstar": "https://www.hotstar.com",
  "Hotstar": "https://www.hotstar.com",
  "Disney+ Hotstar": "https://www.hotstar.com",
  "Crunchyroll": "https://www.crunchyroll.com",
  "Sony LIV": "https://www.sonyliv.com",
  "SonyLIV": "https://www.sonyliv.com",
  "ZEE5": "https://www.zee5.com",
  "Zee5": "https://www.zee5.com",
  "Lionsgate Play": "https://www.lionsgateplay.com",
  "Aha": "https://www.aha.video",
  "AHA": "https://www.aha.video",
  "Hoichoi": "https://www.hoichoi.tv",
  "Sun NXT": "https://www.sunnxt.com",
  "Sun Nxt": "https://www.sunnxt.com",
  "Hungama Play": "https://www.hungama.com",
  "ManoramaMAX": "https://www.manoramamax.com",
  "ManoramamMAX": "https://www.manoramamax.com",
  "ShemarooMe": "https://www.shemaroome.com",
  "Shemaroome": "https://www.shemaroome.com",
  "Discovery": "https://www.discoveryplus.com",
  "Discovery+": "https://www.discoveryplus.com",
  "Tata Play": "https://www.tataplay.com",
  "Vi movies and tv": "https://www.vi.in",
  "Vi Movies and TV": "https://www.vi.in",
  "Shahid VIP": "https://shahid.mbc.net",
  "Tentkotta": "https://www.tentkotta.com",
  "Chaupal": "https://www.chaupal.tv",
  "KablOne": "https://www.kableone.com",
  "VROTT": "https://www.vrott.com",
  "Eros Now": "https://erosnow.com",
};

function getPlatformUrl(name) {
  if (!name) return null;
  const url = PLATFORM_URL_MAP[name];
  if (url) return url;
  const nameLower = name.toLowerCase();
  for (const [key, val] of Object.entries(PLATFORM_URL_MAP)) {
    if (key.toLowerCase() === nameLower) return val;
  }
  if (nameLower.includes("amazon channel")) return "https://www.primevideo.com";
  if (nameLower.includes("apple tv channel")) return "https://tv.apple.com";
  return null;
}

const LANG_MAP = {
  "en": "English", "hi": "Hindi", "ta": "Tamil", "te": "Telugu",
  "ml": "Malayalam", "kn": "Kannada", "bn": "Bengali", "mr": "Marathi",
  "pa": "Punjabi", "gu": "Gujarati", "ja": "Japanese", "ko": "Korean",
  "zh": "Chinese", "cn": "Cantonese", "es": "Spanish", "fr": "French",
  "de": "German", "it": "Italian", "pt": "Portuguese", "ru": "Russian",
  "ar": "Arabic", "tr": "Turkish", "th": "Thai", "da": "Danish",
  "sv": "Swedish", "no": "Norwegian", "fi": "Finnish", "pl": "Polish",
  "nl": "Dutch", "cs": "Czech", "el": "Greek", "ro": "Romanian",
  "hu": "Hungarian", "id": "Indonesian", "ms": "Malay", "vi": "Vietnamese",
  "tl": "Tagalog", "uk": "Ukrainian", "he": "Hebrew", "fa": "Persian",
};

function langName(code) {
  if (!code) return null;
  return LANG_MAP[String(code)] || String(code).toUpperCase();
}

function smartTruncate(text, maxLen = 155) {
  if (!text || text.length <= maxLen) return text;
  const truncated = text.substring(0, maxLen);
  for (const sep of [". ", "! ", "? "]) {
    const idx = truncated.lastIndexOf(sep);
    if (idx > maxLen * 0.5) return truncated.substring(0, idx + 1);
  }
  const idx = truncated.lastIndexOf(" ");
  if (idx > maxLen * 0.6) return truncated.substring(0, idx) + "...";
  return truncated + "...";
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//  HTML TEMPLATES (exact copy from generate_movie_pages.py)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

function ratingBarHtml(label, value, maxVal = 100, color = "bg-gw-accent") {
  if (value === null || value === undefined) return "";
  const pct = Math.min(Math.round(value / maxVal * 100), 100);
  return `<div class="flex items-center gap-3">
        <span class="text-sm text-gw-text-muted w-24 shrink-0">${escapeHtml(label)}</span>
        <div class="flex-1 bg-gw-bg rounded-full h-2">
            <div class="${color} h-2 rounded-full" style="width: ${pct}%"></div>
        </div>
        <span class="text-sm font-medium w-12 text-right">${value}</span>
    </div>`;
}

function navHtml(depth = "../../") {
  return `<nav class="fixed top-0 left-0 right-0 z-50 bg-gw-bg/80 backdrop-blur-lg border-b border-gw-border">
    <div class="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex items-center justify-between h-16">
            <a href="${depth}" class="flex items-center gap-2">
                <img src="${depth}assets/images/logo.png?v=2" alt="GoodWatch Logo" width="32" height="32" class="rounded-lg">
                <span class="text-xl font-semibold">GoodWatch</span>
            </a>
            <div class="flex items-center gap-4">
                <a href="${depth}movies/" class="text-sm text-gw-text-muted hover:text-gw-text transition-colors">Movies</a>
                <a href="${depth}blog/" class="text-sm text-gw-text-muted hover:text-gw-text transition-colors">Blog</a>
                <a href="${depth}#download" class="hidden sm:inline-flex items-center px-4 py-2 bg-gw-accent hover:bg-gw-accent-hover text-white font-medium rounded-lg transition-colors text-sm">
                    Download App
                </a>
            </div>
        </div>
    </div>
</nav>`;
}

function footerHtml(depth = "../../") {
  return `<footer class="bg-gw-surface border-t border-gw-border py-8">
    <div class="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex flex-col sm:flex-row items-center justify-between gap-4">
            <a href="${depth}" class="flex items-center gap-2">
                <img src="${depth}assets/images/logo.png?v=2" alt="GoodWatch Logo" width="24" height="24" class="rounded-lg">
                <span class="font-semibold">GoodWatch</span>
            </a>
            <div class="flex gap-6 text-sm text-gw-text-muted">
                <a href="${depth}movies/" class="hover:text-gw-text transition-colors">Movies</a>
                <a href="${depth}blog/" class="hover:text-gw-text transition-colors">Blog</a>
                <a href="${depth}privacy.html" class="hover:text-gw-text transition-colors">Privacy</a>
                <a href="${depth}terms.html" class="hover:text-gw-text transition-colors">Terms</a>
                <a href="mailto:hello@goodwatch.movie" class="hover:text-gw-text transition-colors">Contact</a>
            </div>
            <p class="text-sm text-gw-text-muted">&copy; 2026 GoodWatch</p>
        </div>
    </div>
</footer>`;
}

function headHtml(title, description, canonical, ogImage = null, depth = "../../") {
  let ogImgTag = "";
  if (ogImage) {
    ogImgTag = `    <meta property="og:image" content="${escapeHtml(ogImage)}">\n    <meta name="twitter:image" content="${escapeHtml(ogImage)}">\n`;
  }
  return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${escapeHtml(title)}</title>
    <meta name="description" content="${escapeHtml(smartTruncate(description))}">
    <meta name="robots" content="index, follow">
    <link rel="canonical" href="${escapeHtml(canonical)}">
    <meta property="og:type" content="website">
    <meta property="og:url" content="${escapeHtml(canonical)}">
    <meta property="og:title" content="${escapeHtml(title)}">
    <meta property="og:description" content="${escapeHtml(smartTruncate(description))}">
    <meta name="twitter:card" content="summary_large_image">
    <meta name="twitter:title" content="${escapeHtml(title)}">
    <meta name="twitter:description" content="${escapeHtml(smartTruncate(description))}">
${ogImgTag}    <link rel="icon" type="image/png" href="${depth}favicon.png">
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="${depth}assets/css/styles.css">
</head>`;
}

function movieGridCard(m, depth = "../../") {
  const title = m.title || "Unknown";
  const year = m.year || "";
  const score = goodscore(m);
  const poster = m.poster_path || "";
  const genres = getGenreNames(m.genres);
  const slug = slugify(title, year);
  const posterImg = poster
    ? `<img src="${TMDB_IMAGE_BASE}/w342${poster}" alt="${escapeHtml(title)}" class="w-full h-full object-cover" loading="lazy">`
    : '<div class="w-full h-full bg-gw-surface flex items-center justify-center"><span class="text-4xl">🎬</span></div>';
  let scoreBadge = "";
  if (score !== null) {
    const sc = goodscoreColor(score);
    scoreBadge = `<div class="absolute top-2 right-2 bg-black/70 backdrop-blur-sm rounded-lg px-2 py-1"><span class="${sc} text-sm font-bold">${score}</span></div>`;
  }
  const genreText = genres.length > 0 ? escapeHtml(genres.slice(0, 2).join(", ")) : "";
  return `<a href="${depth}movies/${slug}/" class="group block">
        <div class="relative aspect-[2/3] rounded-xl overflow-hidden mb-2">
            ${posterImg}
            ${scoreBadge}
            <div class="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors"></div>
        </div>
        <h3 class="font-medium text-sm group-hover:text-gw-accent transition-colors truncate">${escapeHtml(title)}</h3>
        <div class="flex items-center gap-1 text-xs text-gw-text-muted">
            <span>${year}</span>
            ${genreText ? `<span class="text-gw-border">·</span><span>${genreText}</span>` : ''}
        </div>
    </a>`;
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//  MOVIE PAGE GENERATOR (exact replica of Python generate_movie_page)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

function generateMoviePage(movie, similarMovies = [], depth = "../../") {
  const title = movie.title || "Unknown";
  const year = movie.year || "";
  const overview = movie.overview || "";
  const posterPath = movie.poster_path || "";
  const backdropPath = movie.backdrop_path || "";
  const contentType = movie.content_type || "movie";
  const runtime = movie.runtime;
  const language = movie.original_language;
  const director = movie.director;
  let castList = movie.cast_list || [];
  if (typeof castList === "string") {
    try { castList = JSON.parse(castList); } catch { castList = []; }
  }
  let tags = movie.tags || [];
  if (typeof tags === "string") {
    try { tags = JSON.parse(tags); } catch { tags = []; }
  }
  const releaseDate = movie.release_date || "";

  const score = goodscore(movie);
  const imdb = movie.imdb_rating;
  const imdbVotes = movie.imdb_votes;
  const tmdbRating = movie.vote_average;
  const rtCritics = movie.rt_critics_score;
  const rtAudience = movie.rt_audience_score;
  const metacritic = movie.metacritic_score;

  const genres = getGenreNames(movie.genres);
  const providers = parseOttProviders(movie.ott_providers);

  const slug = slugify(title, year);
  const canonical = `${SITE_URL}/movies/${slug}/`;
  const titleWithYear = year ? `${title} (${year})` : title;

  const posterUrl = posterPath ? `${TMDB_IMAGE_BASE}/w500${posterPath}` : "";
  const backdropUrl = backdropPath ? `${TMDB_IMAGE_BASE}/w1280${backdropPath}` : "";
  const ogImage = posterPath ? `${TMDB_IMAGE_BASE}/w780${posterPath}` : null;

  const typeLabel = contentType === "tv" ? "TV Series" : "Movie";
  const pageTitle = `${title} (${year}) — GoodScore, Ratings & Where to Stream | GoodWatch`;
  const scoreText = score ? `GoodScore: ${score}/100. ` : "";
  const genreText = genres.length > 0 ? `${genres.slice(0, 3).join(", ")}. ` : "";
  const desc = overview
    ? `${scoreText}${genreText}${overview}`
    : `${scoreText}${genreText}Find ratings and streaming info for ${title}.`;

  // Score badge
  let scoreHtml = "";
  if (score !== null && score !== undefined) {
    const sc = goodscoreColor(score);
    const sb = goodscoreBg(score);
    scoreHtml = `<div class="flex items-center gap-3">
            <div class="${sb} border rounded-2xl px-5 py-3 text-center">
                <div class="${sc} text-4xl font-bold">${score}</div>
                <div class="text-xs text-gw-text-muted mt-1">GoodScore</div>
            </div>
        </div>`;
  }

  // Genre tags — link to genre hub pages
  let genreHtml = "";
  if (genres.length > 0) {
    const tagsHtml = genres.map(g =>
      `<a href="${depth}genres/${slugifySimple(g)}/" class="px-3 py-1 bg-gw-bg border border-gw-border rounded-full text-sm text-gw-text-muted hover:text-gw-accent hover:border-gw-accent transition-colors">${escapeHtml(g)}</a>`
    ).join(" ");
    genreHtml = `<div class="flex flex-wrap gap-2">${tagsHtml}</div>`;
  }

  // Mood tags
  let tagHtml = "";
  if (tags.length > 0) {
    const tagItems = tags.slice(0, 6).map(t =>
      `<span class="px-2 py-0.5 bg-gw-accent/10 text-gw-accent rounded text-xs">${escapeHtml(t)}</span>`
    ).join(" ");
    tagHtml = `<div class="flex flex-wrap gap-1.5 mt-3">${tagItems}</div>`;
  }

  // Meta info line
  const metaParts = [];
  if (year) metaParts.push(String(year));
  if (runtime) {
    const formatted = formatRuntime(runtime);
    if (formatted) metaParts.push(formatted);
  }
  if (language) {
    const ln = langName(language);
    if (ln) metaParts.push(`<a href="${depth}languages/${slugifySimple(ln)}/" class="hover:text-gw-accent transition-colors">${escapeHtml(ln)}</a>`);
  }
  metaParts.push(typeLabel);
  const metaLine = metaParts.map(p => `<span>${p}</span>`).join(' <span class="text-gw-border">·</span> ');

  // Credits with director link
  let creditsHtml = "";
  if (director || (castList && castList.length > 0)) {
    const parts = [];
    if (director) {
      const dirSlug = slugifySimple(director);
      parts.push(
        `<div><span class="text-gw-text-muted text-sm">Directed by</span> ` +
        `<a href="${depth}directors/${dirSlug}/" class="text-sm font-medium hover:text-gw-accent transition-colors">${escapeHtml(director)}</a></div>`
      );
    }
    if (Array.isArray(castList) && castList.length > 0) {
      const castDisplay = castList.slice(0, 6);
      if (castDisplay.length > 0) {
        const castStr = castDisplay.map(c => escapeHtml(c)).join(", ");
        parts.push(`<div><span class="text-gw-text-muted text-sm">Starring</span> <span class="text-sm">${castStr}</span></div>`);
      }
    }
    creditsHtml = '<div class="space-y-2 mt-4">' + parts.join("") + "</div>";
  }

  // Streaming providers — link to actual OTT platform websites
  let providersHtml = "";
  let flatrate = providers.filter(p => p.type === "flatrate");
  if (flatrate.length === 0) flatrate = providers;
  if (flatrate.length > 0) {
    const provItems = [];
    for (const p of flatrate.slice(0, 6)) {
      const pname = escapeHtml(p.name || "");
      const rawName = p.name || "";
      const platformUrl = getPlatformUrl(rawName);
      const pslug = slugifySimple(rawName);
      const logo = p.logo || "";
      let href, targetAttr;
      if (platformUrl) {
        href = platformUrl;
        targetAttr = ' target="_blank" rel="noopener noreferrer"';
      } else {
        href = `${depth}streaming/${pslug}/`;
        targetAttr = '';
      }
      if (logo) {
        const logoUrl = `${TMDB_IMAGE_BASE}/w92${logo}`;
        provItems.push(
          `<a href="${href}"${targetAttr} class="flex items-center gap-2 px-3 py-2 bg-gw-bg border border-gw-border rounded-xl hover:border-gw-accent/30 transition-colors">` +
          `<img src="${logoUrl}" alt="${pname}" class="w-8 h-8 rounded-lg" loading="lazy">` +
          `<span class="text-sm">${pname}</span></a>`
        );
      } else {
        provItems.push(
          `<a href="${href}"${targetAttr} class="flex items-center gap-2 px-3 py-2 bg-gw-bg border border-gw-border rounded-xl hover:border-gw-accent/30 transition-colors">` +
          `<span class="text-sm">${pname}</span></a>`
        );
      }
    }
    providersHtml = `<div class="mt-6">
            <h2 class="text-sm font-medium text-gw-text-muted mb-3">Where to Stream</h2>
            <div class="flex flex-wrap gap-2">${provItems.join("")}</div>
        </div>`;
  }

  // Ratings breakdown
  const ratingsHtmlParts = [];
  if (imdb) ratingsHtmlParts.push(ratingBarHtml("IMDb", imdb, 10, "bg-yellow-500"));
  if (rtCritics) ratingsHtmlParts.push(ratingBarHtml("RT Critics", rtCritics, 100, "bg-red-500"));
  if (rtAudience) ratingsHtmlParts.push(ratingBarHtml("RT Audience", rtAudience, 100, "bg-red-400"));
  if (metacritic) ratingsHtmlParts.push(ratingBarHtml("Metacritic", metacritic, 100, "bg-blue-500"));
  if (tmdbRating) ratingsHtmlParts.push(ratingBarHtml("TMDB", tmdbRating, 10, "bg-teal-500"));

  let ratingsSection = "";
  if (ratingsHtmlParts.length > 0) {
    ratingsSection = `<div class="bg-gw-surface rounded-2xl border border-gw-border p-6 mt-6">
            <h2 class="text-lg font-semibold mb-4">Ratings Breakdown</h2>
            <div class="space-y-3">${ratingsHtmlParts.join("")}</div>
        </div>`;
  }

  // Backdrop
  let backdropSection = "";
  if (backdropUrl) {
    backdropSection = `<div class="absolute inset-0 z-0">
        <img src="${backdropUrl}" alt="" class="w-full h-full object-cover opacity-20" loading="eager">
        <div class="absolute inset-0 bg-gradient-to-b from-gw-bg/60 via-gw-bg/80 to-gw-bg"></div>
    </div>`;
  }

  // JSON-LD
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": contentType === "movie" ? "Movie" : "TVSeries",
    "name": title,
    "datePublished": releaseDate || (year ? String(year) : ""),
    "description": overview ? overview.substring(0, 500) : "",
    "url": canonical,
  };
  if (director) jsonLd.director = { "@type": "Person", "name": director };
  if (castList && Array.isArray(castList) && castList.length > 0) {
    jsonLd.actor = castList.slice(0, 6).map(c => ({ "@type": "Person", "name": c }));
  }
  if (genres.length > 0) jsonLd.genre = genres;
  if (score !== null && score !== undefined) {
    jsonLd.aggregateRating = { "@type": "AggregateRating", "ratingValue": score, "bestRating": 100, "worstRating": 0, "ratingCount": imdbVotes || (movie.vote_count || 0) };
  } else if (imdb) {
    jsonLd.aggregateRating = { "@type": "AggregateRating", "ratingValue": imdb, "bestRating": 10, "ratingCount": imdbVotes || 0 };
  }
  if (posterUrl) jsonLd.image = posterUrl;
  if (runtime) jsonLd.duration = `PT${runtime}M`;
  if (language) jsonLd.inLanguage = language;

  const breadcrumbLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [
      { "@type": "ListItem", "position": 1, "name": "Home", "item": SITE_URL + "/" },
      { "@type": "ListItem", "position": 2, "name": "Movies", "item": SITE_URL + "/movies/" },
      { "@type": "ListItem", "position": 3, "name": titleWithYear, "item": canonical },
    ],
  };

  const jsonLdScript = `<script type="application/ld+json">${JSON.stringify(jsonLd)}</script>\n<script type="application/ld+json">${JSON.stringify(breadcrumbLd)}</script>`;

  let overviewSection = "";
  if (overview) {
    overviewSection = `<div class="mt-6">
            <h2 class="text-lg font-semibold mb-3">Synopsis</h2>
            <p class="text-gw-text-muted leading-relaxed">${escapeHtml(overview)}</p>
        </div>`;
  }

  // Similar Movies
  let similarHtml = "";
  if (similarMovies.length > 0) {
    const cards = similarMovies.slice(0, 8).map(sm => movieGridCard(sm, depth));
    similarHtml = `<div class="mt-10">
            <h2 class="text-xl font-semibold mb-6">Similar Movies You Might Like</h2>
            <div class="grid grid-cols-2 sm:grid-cols-4 gap-4">${cards.join("")}</div>
        </div>`;
  }

  const ctaHtml = `<div class="bg-gw-surface rounded-2xl border border-gw-border p-6 mt-6 text-center">
        <p class="text-gw-text-muted mb-3">Can't decide what to watch?</p>
        <h2 class="text-xl font-semibold mb-4">GoodWatch picks the perfect movie for you</h2>
        <a href="${depth}#download" class="inline-flex items-center px-6 py-3 bg-gw-accent hover:bg-gw-accent-hover text-white font-medium rounded-xl transition-colors">Get the App — It's Free</a>
    </div>`;

  const breadcrumbNav = `<nav class="text-sm text-gw-text-muted mb-4" aria-label="Breadcrumb">
        <a href="${depth}" class="hover:text-gw-accent transition-colors">Home</a>
        <span class="mx-1">›</span>
        <a href="${depth}movies/" class="hover:text-gw-accent transition-colors">Movies</a>
        <span class="mx-1">›</span>
        <span class="text-gw-text">${escapeHtml(title)}</span>
    </nav>`;

  const posterSection = posterUrl
    ? `<img src="${posterUrl}" alt="${escapeHtml(title)} poster" class="w-64 rounded-2xl shadow-2xl mx-auto md:mx-0" loading="eager">`
    : '<div class="w-64 h-96 bg-gw-surface rounded-2xl border border-gw-border flex items-center justify-center mx-auto md:mx-0"><span class="text-gw-text-muted text-4xl">🎬</span></div>';

  const html = `${headHtml(pageTitle, desc, canonical, ogImage, depth)}
${jsonLdScript}
<body class="bg-gw-bg text-gw-text font-sans antialiased">

${navHtml(depth)}

<main class="pt-16 pb-16 min-h-screen">
    <div class="relative overflow-hidden">
        ${backdropSection}
        <div class="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-12">
            ${breadcrumbNav}
            <div class="flex flex-col md:flex-row gap-8">
                <div class="shrink-0">
                    ${posterSection}
                </div>
                <div class="flex-1 min-w-0">
                    <h1 class="text-3xl sm:text-4xl font-bold mb-2">${escapeHtml(titleWithYear)}</h1>
                    <div class="flex flex-wrap items-center gap-1.5 text-gw-text-muted text-sm mb-4">${metaLine}</div>
                    ${genreHtml}
                    ${tagHtml}
                    <div class="mt-5">${scoreHtml}</div>
                    ${creditsHtml}
                    ${providersHtml}
                </div>
            </div>
        </div>
    </div>
    <div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        ${overviewSection}
        ${ratingsSection}
        ${similarHtml}
        ${ctaHtml}
    </div>
</main>

${footerHtml(depth)}

</body>
</html>`;

  return html;
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//  404 PAGE
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

function generate404Page(slug) {
  const depth = "../../";
  return `${headHtml("Movie Not Found | GoodWatch", "The movie you're looking for doesn't exist in our database.", `${SITE_URL}/movies/${escapeHtml(slug)}/`, null, depth)}
<body class="bg-gw-bg text-gw-text font-sans antialiased">

${navHtml(depth)}

<main class="pt-24 pb-16 min-h-screen">
    <div class="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <div class="text-6xl mb-6">🎬</div>
        <h1 class="text-3xl font-bold mb-4">Movie Not Found</h1>
        <p class="text-gw-text-muted text-lg mb-8">We couldn't find a movie matching "<strong>${escapeHtml(slug)}</strong>" in our database.</p>
        <div class="flex flex-col sm:flex-row gap-4 justify-center">
            <a href="${depth}movies/" class="inline-flex items-center px-6 py-3 bg-gw-accent hover:bg-gw-accent-hover text-white font-medium rounded-xl transition-colors">Browse All Movies</a>
            <a href="${depth}" class="inline-flex items-center px-6 py-3 bg-gw-surface border border-gw-border hover:border-gw-accent/30 text-gw-text font-medium rounded-xl transition-colors">Back to Home</a>
        </div>
    </div>
</main>

${footerHtml(depth)}

</body>
</html>`;
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//  SUPABASE QUERIES
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

async function fetchMovieBySlug(slug) {
  // Parse slug to extract title and year
  // Slug format: "the-godfather-1972" → title parts = "the-godfather", year = 1972
  const yearMatch = slug.match(/-(\d{4})$/);
  let year = null;
  let titleSlug = slug;
  if (yearMatch) {
    year = parseInt(yearMatch[1]);
    titleSlug = slug.substring(0, slug.length - 5); // remove -YYYY
  }

  const selectFields = "id,tmdb_id,title,year,content_type,genres,overview,poster_path,backdrop_path,imdb_rating,imdb_votes,vote_average,vote_count,rt_critics_score,rt_audience_score,metacritic_score,composite_score,rating_confidence,runtime,original_language,ott_providers,director,cast_list,tags,emotional_profile,archetype,release_date";
  const headers = {
    "apikey": SUPABASE_KEY,
    "Authorization": `Bearer ${SUPABASE_KEY}`,
  };

  // Reconstruct approximate title from slug for search
  const titleWords = titleSlug.replace(/-/g, " ").trim();

  // Strategy 1: Search by title ilike with year filter (most precise)
  if (titleWords && year) {
    // Use % wildcards between words to handle punctuation differences
    const ilike = `%${titleWords.split(" ").join("%")}%`;
    const params = new URLSearchParams({
      select: selectFields,
      title: `ilike.${ilike}`,
      year: `eq.${year}`,
      limit: "20",
    });
    const url = `${SUPABASE_URL}/rest/v1/movies?${params}`;
    const resp = await fetch(url, { headers });
    if (resp.ok) {
      const movies = await resp.json();
      for (const m of movies) {
        const mSlug = slugify(m.title || "", m.year);
        if (mSlug === slug) return m;
      }
      // Also try with ID suffix (deduped slugs)
      for (const m of movies) {
        const mSlug = slugify(m.title || "", m.year);
        if (slug.startsWith(mSlug)) return m;
      }
      // Relaxed match — if only one result, return it
      if (movies.length === 1) return movies[0];
    }
  }

  // Strategy 2: Search by title ilike without year (handles year mismatches)
  if (titleWords) {
    const ilike = `%${titleWords.split(" ").join("%")}%`;
    const params = new URLSearchParams({
      select: selectFields,
      title: `ilike.${ilike}`,
      limit: "20",
    });
    const url = `${SUPABASE_URL}/rest/v1/movies?${params}`;
    const resp = await fetch(url, { headers });
    if (resp.ok) {
      const movies = await resp.json();
      for (const m of movies) {
        const mSlug = slugify(m.title || "", m.year);
        if (mSlug === slug) return m;
      }
      for (const m of movies) {
        const mSlug = slugify(m.title || "", m.year);
        if (slug.startsWith(mSlug)) return m;
      }
      if (movies.length === 1) return movies[0];
    }
  }

  // Strategy 3: Fetch by year and scan (fallback for non-Latin titles)
  if (year) {
    const params = new URLSearchParams({
      select: selectFields,
      year: `eq.${year}`,
      limit: "1000",
    });
    const url = `${SUPABASE_URL}/rest/v1/movies?${params}`;
    const resp = await fetch(url, { headers });
    if (resp.ok) {
      const movies = await resp.json();
      for (const m of movies) {
        const mSlug = slugify(m.title || "", m.year);
        if (mSlug === slug) return m;
      }
      for (const m of movies) {
        const mSlug = slugify(m.title || "", m.year);
        if (slug.startsWith(mSlug)) return m;
      }
    }
  }

  return null;
}

async function fetchSimilarMovies(movie) {
  const genres = getGenreNames(movie.genres);
  if (genres.length === 0) return [];

  // Fetch movies with same genres, ordered by score
  const primaryGenre = genres[0];
  const selectFields = "id,title,year,poster_path,genres,vote_average,imdb_rating,composite_score";

  const params = new URLSearchParams({
    select: selectFields,
    genres: `cs.[{"name":"${primaryGenre}"}]`,
    "id": `neq.${movie.id}`,
    order: "composite_score.desc.nullslast,imdb_rating.desc.nullslast",
    limit: "20",
  });

  const url = `${SUPABASE_URL}/rest/v1/movies?${params}`;
  try {
    const resp = await fetch(url, {
      headers: {
        "apikey": SUPABASE_KEY,
        "Authorization": `Bearer ${SUPABASE_KEY}`,
      },
    });
    if (!resp.ok) return [];
    const movies = await resp.json();

    // Sort by score (same logic as Python: by genre overlap and score proximity)
    const movieGenres = new Set(genres.slice(0, 3));
    const scored = movies.map(m => {
      const mGenres = getGenreNames(m.genres);
      const overlap = mGenres.filter(g => movieGenres.has(g)).length;
      const mScore = goodscore(m) || 0;
      return { movie: m, overlap, score: mScore };
    });
    scored.sort((a, b) => {
      if (b.overlap !== a.overlap) return b.overlap - a.overlap;
      return b.score - a.score;
    });
    return scored.slice(0, 8).map(s => s.movie);
  } catch {
    return [];
  }
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//  MAIN HANDLER
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export async function onRequest(context) {
  let slug = "";
  try {
    const { params } = context;

    // [slug] matches a single path segment: /movies/:slug
    // params.slug is a string, e.g., "the-godfather-1972"
    slug = String(params.slug || "").trim();

    if (!slug || slug === "index.html" || slug === "_slugs.json") {
      return context.next();
    }

    const movie = await fetchMovieBySlug(slug);

    if (!movie) {
      return new Response(generate404Page(slug), {
        status: 404,
        headers: {
          "Content-Type": "text/html;charset=UTF-8",
          "X-GoodWatch-Source": "dynamic",
          "Cache-Control": "public, max-age=300, s-maxage=300",
        },
      });
    }

    let similarMovies = [];
    try {
      similarMovies = await fetchSimilarMovies(movie);
    } catch {
      // Non-fatal — continue without similar movies
    }

    const html = generateMoviePage(movie, similarMovies);

    return new Response(html, {
      status: 200,
      headers: {
        "Content-Type": "text/html;charset=UTF-8",
        "X-GoodWatch-Source": "dynamic",
        "Cache-Control": "public, max-age=3600, s-maxage=3600",
      },
    });
  } catch (err) {
    // Minimal fallback that can't fail
    return new Response(
      `<!DOCTYPE html><html><head><title>Error | GoodWatch</title></head><body style="background:#0A0A0F;color:#E8E6E3;font-family:Inter,sans-serif;text-align:center;padding:100px 20px"><h1>Something went wrong</h1><p>Error loading movie page for "${escapeHtml(slug)}"</p><p style="color:#666;font-size:12px">${escapeHtml(String(err))}</p><a href="/movies/" style="color:#D4A843">Browse All Movies</a></body></html>`,
      {
        status: 500,
        headers: {
          "Content-Type": "text/html;charset=UTF-8",
          "X-GoodWatch-Source": "dynamic-error",
          "Cache-Control": "no-cache",
        },
      }
    );
  }
}
