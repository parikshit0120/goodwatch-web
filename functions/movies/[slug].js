/**
 * Cloudflare Pages Function — Dynamic movie page fallback
 *
 * Used ONLY for movies without static pages (new releases without composite_score yet).
 * Uses EXACT same HTML template as tools/generate_movie_pages.py to maintain format.
 *
 * Invariants enforced:
 * - INV-WEB-01: Movie page format matches static generator exactly
 * - INV-WEB-02: Only used when static page doesn't exist (404 fallback)
 */

const SUPABASE_URL = "https://jdjqrlkynwfhbtyuddjk.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpkanFybGt5bndmaGJ0eXVkZGprIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ0NzUwMTEsImV4cCI6MjA4MDA1MTAxMX0.KDRMLCewVMp3lwphkUvtoWOkg6kyAk8iSbVkRKiHYSk";
const SITE_URL = "https://goodwatch.movie";
const TMDB_IMAGE_BASE = "https://image.tmdb.org/t/p";

// Helper functions (copied from generate_movie_pages.py)

function slugify(title, year) {
    const slug = title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');
    return year ? `${slug}-${year}` : slug;
}

function slugifySimple(text) {
    return text
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');
}

function escape(text) {
    if (!text) return '';
    return text
        .toString()
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

function goodscore(movie) {
    const score = movie.composite_score;
    if (score === null || score === undefined) return null;
    return Math.round(score * 10);
}

function goodscoreColor(score) {
    if (score >= 80) return 'text-green-400';
    if (score >= 60) return 'text-yellow-400';
    return 'text-red-400';
}

function goodscoreBg(score) {
    if (score >= 80) return 'bg-green-400/10 border-green-400/30';
    if (score >= 60) return 'bg-yellow-400/10 border-yellow-400/30';
    return 'bg-red-400/10 border-red-400/30';
}

function formatRuntime(runtime) {
    if (!runtime || runtime <= 0) return null;
    const hours = Math.floor(runtime / 60);
    const mins = runtime % 60;
    if (hours > 0 && mins > 0) return `${hours}h ${mins}m`;
    if (hours > 0) return `${hours}h`;
    return `${mins}m`;
}

function getGenreNames(genres) {
    if (!genres) return [];
    if (typeof genres === 'string') return [];
    const result = [];
    for (const g of genres) {
        if (typeof g === 'object' && g.name) {
            result.push(g.name);
        } else if (typeof g === 'string' && g) {
            result.push(g);
        }
    }
    return result;
}

function parseOttProviders(ottData) {
    if (!ottData) return [];
    if (typeof ottData === 'string') {
        try {
            ottData = JSON.parse(ottData);
        } catch {
            return [];
        }
    }
    const providers = [];
    const seenNames = new Set();

    if (ottData.flatrate) {
        for (const p of ottData.flatrate) {
            if (p.provider_name && !seenNames.has(p.provider_name)) {
                seenNames.add(p.provider_name);
                providers.push({
                    type: 'flatrate',
                    name: p.provider_name,
                    logo: p.logo_path || '',
                });
            }
        }
    }
    return providers;
}

const LANG_MAP = {
    "en": "English", "hi": "Hindi", "ta": "Tamil", "te": "Telugu",
    "ml": "Malayalam", "kn": "Kannada", "bn": "Bengali", "mr": "Marathi",
    "pa": "Punjabi", "gu": "Gujarati", "ja": "Japanese", "ko": "Korean",
    "zh": "Chinese", "cn": "Cantonese", "es": "Spanish", "fr": "French",
    "de": "German", "it": "Italian", "pt": "Portuguese", "ru": "Russian"
};

function langName(code) {
    if (!code) return null;
    return LANG_MAP[code] || code.toUpperCase();
}

const PLATFORM_URL_MAP = {
    "Netflix": "https://www.netflix.com",
    "Amazon Prime Video": "https://www.primevideo.com",
    "Apple TV": "https://tv.apple.com",
    "Apple TV+": "https://tv.apple.com",
    "JioHotstar": "https://www.hotstar.com",
    "Hotstar": "https://www.hotstar.com",
    "Disney+ Hotstar": "https://www.hotstar.com",
    "Sony LIV": "https://www.sonyliv.com",
    "ZEE5": "https://www.zee5.com"
};

function getPlatformUrl(name) {
    if (!name) return null;
    const url = PLATFORM_URL_MAP[name];
    if (url) return url;
    const nameLower = name.toLowerCase();
    for (const [key, val] of Object.entries(PLATFORM_URL_MAP)) {
        if (key.toLowerCase() === nameLower) return val;
    }
    return null;
}

function smartTruncate(text, maxLen = 155) {
    if (!text || text.length <= maxLen) return text;
    const truncated = text.substring(0, maxLen);
    for (const sep of ['. ', '! ', '? ']) {
        const idx = truncated.lastIndexOf(sep);
        if (idx > maxLen * 0.5) {
            return truncated.substring(0, idx + 1);
        }
    }
    const idx = truncated.lastIndexOf(' ');
    if (idx > maxLen * 0.6) {
        return truncated.substring(0, idx) + '...';
    }
    return truncated + '...';
}

// HTML template functions (EXACT copies from generate_movie_pages.py)

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
        ogImgTag = `    <meta property="og:image" content="${escape(ogImage)}">
    <meta name="twitter:image" content="${escape(ogImage)}">
`;
    }
    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${escape(title)}</title>
    <meta name="description" content="${escape(smartTruncate(description))}">
    <meta name="robots" content="index, follow">
    <link rel="canonical" href="${escape(canonical)}">
    <meta property="og:type" content="website">
    <meta property="og:url" content="${escape(canonical)}">
    <meta property="og:title" content="${escape(title)}">
    <meta property="og:description" content="${escape(smartTruncate(description))}">
    <meta name="twitter:card" content="summary_large_image">
    <meta name="twitter:title" content="${escape(title)}">
    <meta name="twitter:description" content="${escape(smartTruncate(description))}">
${ogImgTag}    <link rel="icon" type="image/png" href="${depth}favicon.png">
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="${depth}assets/css/styles.css">
</head>`;
}

function ratingBarHtml(label, value, maxVal = 100, color = "bg-gw-accent") {
    if (value === null || value === undefined) return "";
    const pct = Math.min(Math.round((value / maxVal) * 100), 100);
    return `<div class="flex items-center gap-3">
        <span class="text-sm text-gw-text-muted w-24 shrink-0">${escape(label)}</span>
        <div class="flex-1 bg-gw-bg rounded-full h-2">
            <div class="${color} h-2 rounded-full" style="width: ${pct}%"></div>
        </div>
        <span class="text-sm font-medium w-12 text-right">${value}</span>
    </div>`;
}

function generateMoviePage(movie, depth = "../../") {
    const title = movie.title || "Unknown";
    const year = movie.year || "";
    const overview = movie.overview || "";
    const posterPath = movie.poster_path || "";
    const backdropPath = movie.backdrop_path || "";
    const contentType = movie.content_type || "movie";
    const runtime = movie.runtime;
    const language = movie.original_language;
    const director = movie.director;
    const castList = movie.cast_list || [];
    const tags = movie.tags || [];
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
    const genreText = genres.length > 0 ? `${genres.slice(0, 3).join(', ')}. ` : "";
    const desc = overview ? `${scoreText}${genreText}${overview}` : `${scoreText}${genreText}Find ratings and streaming info for ${title}.`;

    // Score badge
    let scoreHtml = "";
    if (score !== null) {
        const sc = goodscoreColor(score);
        const sb = goodscoreBg(score);
        scoreHtml = `<div class="flex items-center gap-3">
            <div class="${sb} border rounded-2xl px-5 py-3 text-center">
                <div class="${sc} text-4xl font-bold">${score}</div>
                <div class="text-xs text-gw-text-muted mt-1">GoodScore</div>
            </div>
        </div>`;
    }

    // Genre tags
    let genreHtml = "";
    if (genres.length > 0) {
        const tagsHtml = genres.map(g =>
            `<a href="${depth}genres/${slugifySimple(g)}/" class="px-3 py-1 bg-gw-bg border border-gw-border rounded-full text-sm text-gw-text-muted hover:text-gw-accent hover:border-gw-accent transition-colors">${escape(g)}</a>`
        ).join(' ');
        genreHtml = `<div class="flex flex-wrap gap-2">${tagsHtml}</div>`;
    }

    // Mood tags
    let tagHtml = "";
    if (tags.length > 0) {
        const tagItems = tags.slice(0, 6).map(t =>
            `<span class="px-2 py-0.5 bg-gw-accent/10 text-gw-accent rounded text-xs">${escape(t)}</span>`
        ).join(' ');
        tagHtml = `<div class="flex flex-wrap gap-1.5 mt-3">${tagItems}</div>`;
    }

    // Meta info line
    const metaParts = [];
    if (year) metaParts.push(`<span>${year}</span>`);
    if (runtime) {
        const formatted = formatRuntime(runtime);
        if (formatted) metaParts.push(`<span>${formatted}</span>`);
    }
    if (language) {
        const ln = langName(language);
        if (ln) metaParts.push(`<span><a href="${depth}languages/${slugifySimple(ln)}/" class="hover:text-gw-accent transition-colors">${escape(ln)}</a></span>`);
    }
    metaParts.push(`<span>${typeLabel}</span>`);
    const metaLine = metaParts.join(' <span class="text-gw-border">·</span> ');

    // Credits
    let creditsHtml = "";
    if (director || (castList && castList.length > 0)) {
        const parts = [];
        if (director) {
            const dirSlug = slugifySimple(director);
            parts.push(`<div><span class="text-gw-text-muted text-sm">Directed by</span> <a href="${depth}directors/${dirSlug}/" class="text-sm font-medium hover:text-gw-accent transition-colors">${escape(director)}</a></div>`);
        }
        if (castList && castList.length > 0) {
            const castDisplay = castList.slice(0, 6);
            const castStr = castDisplay.map(c => escape(c)).join(', ');
            parts.push(`<div><span class="text-gw-text-muted text-sm">Starring</span> <span class="text-sm">${castStr}</span></div>`);
        }
        creditsHtml = `<div class="space-y-2 mt-4">${parts.join('')}</div>`;
    }

    // Streaming providers
    let providersHtml = "";
    let flatrate = providers.filter(p => p.type === "flatrate");
    if (flatrate.length === 0) flatrate = providers;
    if (flatrate.length > 0) {
        const provItems = flatrate.slice(0, 6).map(p => {
            const pname = escape(p.name || "");
            const rawName = p.name || "";
            const platformUrl = getPlatformUrl(rawName);
            const pslug = slugifySimple(rawName);
            const logo = p.logo || "";

            const href = platformUrl || `${depth}streaming/${pslug}/`;
            const targetAttr = platformUrl ? ' target="_blank" rel="noopener noreferrer"' : '';

            if (logo) {
                const logoUrl = `${TMDB_IMAGE_BASE}/w92${logo}`;
                return `<a href="${href}"${targetAttr} class="flex items-center gap-2 px-3 py-2 bg-gw-bg border border-gw-border rounded-xl hover:border-gw-accent/30 transition-colors"><img src="${logoUrl}" alt="${pname}" class="w-8 h-8 rounded-lg" loading="lazy"><span class="text-sm">${pname}</span></a>`;
            } else {
                return `<a href="${href}"${targetAttr} class="flex items-center gap-2 px-3 py-2 bg-gw-bg border border-gw-border rounded-xl hover:border-gw-accent/30 transition-colors"><span class="text-sm">${pname}</span></a>`;
            }
        }).join('');
        providersHtml = `<div class="mt-6">
            <h2 class="text-sm font-medium text-gw-text-muted mb-3">Where to Stream</h2>
            <div class="flex flex-wrap gap-2">${provItems}</div>
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
            <div class="space-y-3">${ratingsHtmlParts.join('')}</div>
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
        "description": overview.substring(0, 500),
        "url": canonical,
    };
    if (director) jsonLd.director = { "@type": "Person", "name": director };
    if (castList && castList.length > 0) {
        jsonLd.actor = castList.slice(0, 6).map(c => ({ "@type": "Person", "name": c }));
    }
    if (genres.length > 0) jsonLd.genre = genres;
    if (score !== null) {
        jsonLd.aggregateRating = {
            "@type": "AggregateRating",
            "ratingValue": score,
            "bestRating": 100,
            "worstRating": 0,
            "ratingCount": imdbVotes || movie.vote_count || 0
        };
    } else if (imdb) {
        jsonLd.aggregateRating = {
            "@type": "AggregateRating",
            "ratingValue": imdb,
            "bestRating": 10,
            "ratingCount": imdbVotes || 0
        };
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

    const jsonLdScript = `<script type="application/ld+json">${JSON.stringify(jsonLd)}</script>
<script type="application/ld+json">${JSON.stringify(breadcrumbLd)}</script>`;

    let overviewSection = "";
    if (overview) {
        overviewSection = `<div class="mt-6">
            <h2 class="text-lg font-semibold mb-3">Synopsis</h2>
            <p class="text-gw-text-muted leading-relaxed">${escape(overview)}</p>
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
        <span class="text-gw-text">${escape(title)}</span>
    </nav>`;

    const posterImg = posterUrl
        ? `<img src="${posterUrl}" alt="${escape(title)} poster" class="w-64 rounded-2xl shadow-2xl mx-auto md:mx-0" loading="eager">`
        : `<div class="w-64 h-96 bg-gw-surface rounded-2xl border border-gw-border flex items-center justify-center mx-auto md:mx-0"><span class="text-gw-text-muted text-4xl">🎬</span></div>`;

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
                    ${posterImg}
                </div>
                <div class="flex-1 min-w-0">
                    <h1 class="text-3xl sm:text-4xl font-bold mb-2">${escape(titleWithYear)}</h1>
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
        ${ctaHtml}
    </div>
</main>

${footerHtml(depth)}

</body>
</html>`;

    return html;
}

// Cloudflare Pages Function handler
export async function onRequest(context) {
    const { params, request } = context;
    const slug = params.slug;

    // Fetch movie from Supabase by slug
    const url = new URL(request.url);
    const parts = slug.split('-');
    const year = parts[parts.length - 1];
    const titlePart = parts.slice(0, -1).join(' ');

    // Query Supabase for movie matching this slug
    const selectFields =
        "id,tmdb_id,title,year,content_type,genres,overview,poster_path," +
        "backdrop_path,imdb_rating,imdb_votes,vote_average,vote_count," +
        "rt_critics_score,rt_audience_score,metacritic_score,composite_score," +
        "rating_confidence,runtime,original_language,ott_providers," +
        "director,cast_list,tags,emotional_profile,archetype,release_date";

    const supabaseUrl = `${SUPABASE_URL}/rest/v1/movies?select=${selectFields}&year=eq.${year}&limit=20`;

    const response = await fetch(supabaseUrl, {
        headers: {
            'apikey': SUPABASE_ANON_KEY,
            'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        },
    });

    if (!response.ok) {
        return new Response('Movie not found', { status: 404 });
    }

    const movies = await response.json();

    // Find exact slug match
    const movie = movies.find(m => slugify(m.title, m.year) === slug);

    if (!movie) {
        return new Response('Movie not found', { status: 404 });
    }

    // Generate HTML using exact template
    const html = generateMoviePage(movie);

    return new Response(html, {
        headers: {
            'Content-Type': 'text/html;charset=UTF-8',
            'Cache-Control': 'public, max-age=3600', // Cache for 1 hour
        },
    });
}
