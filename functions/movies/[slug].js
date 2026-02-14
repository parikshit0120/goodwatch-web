/**
 * Cloudflare Pages Function - Dynamic Movie Pages
 *
 * Handles movies that don't have static pages (11K-20K range)
 * Falls back to Supabase API to generate page on-demand
 */

const SUPABASE_URL = 'https://jdjqrlkynwfhbtyuddjk.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpkanFybGt5bndmaGJ0eXVkZGprIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ0NzUwMTEsImV4cCI6MjA4MDA1MTAxMX0.KDRMLCewVMp3lwphkUvtoWOkg6kyAk8iSbVkRKiHYSk';

export async function onRequest(context) {
  const { params, request } = context;
  const slug = params.slug;

  // Extract title and year from slug (e.g., "lost-on-a-mountain-in-maine-2024")
  const match = slug.match(/^(.+)-(\d{4})$/);
  if (!match) {
    return new Response('Invalid movie slug format', { status: 400 });
  }

  const [, titleSlug, year] = match;
  const title = titleSlug.replace(/-/g, ' ');

  try {
    // Query Supabase for movie by title + year
    const url = new URL(`${SUPABASE_URL}/rest/v1/movies`);
    url.searchParams.append('select', '*');
    url.searchParams.append('year', `eq.${year}`);
    url.searchParams.append('title', `ilike.${title}`);
    url.searchParams.append('limit', '1');

    const response = await fetch(url, {
      headers: {
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
      },
    });

    if (!response.ok) {
      return new Response('Failed to fetch movie data', { status: 500 });
    }

    const movies = await response.json();
    if (!movies || movies.length === 0) {
      return new Response('Movie not found', { status: 404 });
    }

    const movie = movies[0];

    // Generate HTML (same template as static generator)
    const html = generateMoviePageHTML(movie);

    return new Response(html, {
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'Cache-Control': 'public, max-age=3600, s-maxage=86400', // Cache for 1 hour browser, 24h CDN
      },
    });
  } catch (error) {
    console.error('Error generating dynamic movie page:', error);
    return new Response('Internal server error', { status: 500 });
  }
}

function generateMoviePageHTML(movie) {
  const title = movie.title || 'Unknown';
  const year = movie.year || '';
  const overview = movie.overview || 'No overview available.';
  const runtime = movie.runtime || 0;
  const poster = movie.poster_path ? `https://image.tmdb.org/t/p/w500${movie.poster_path}` : '/assets/images/placeholder-poster.jpg';
  const backdrop = movie.backdrop_path ? `https://image.tmdb.org/t/p/original${movie.backdrop_path}` : '';

  const imdbRating = movie.imdb_rating || movie.vote_average || 0;
  const imdbVotes = movie.imdb_votes || movie.vote_count || 0;
  const compositeScore = movie.composite_score || imdbRating || 0;

  const genres = (movie.genres || []).map(g => typeof g === 'object' ? g.name : g).filter(Boolean);
  const genresHTML = genres.map(g => `<span class="px-3 py-1 bg-gw-surface rounded-full text-sm">${escapeHTML(g)}</span>`).join('');

  const ottProviders = movie.ott_providers || [];
  const providersHTML = ottProviders.map(p => `
    <div class="flex items-center gap-3 p-4 bg-gw-surface rounded-xl border border-gw-border">
      <img src="https://image.tmdb.org/t/p/w92${p.logo_path}" alt="${escapeHTML(p.name)}" class="w-12 h-12 rounded-lg">
      <div>
        <div class="font-semibold">${escapeHTML(p.name)}</div>
        <div class="text-sm text-gw-text-muted">${p.type === 'flatrate' ? 'Subscription' : 'Free with Ads'}</div>
      </div>
    </div>
  `).join('');

  const cast = (movie.cast_list || []).slice(0, 5).join(', ');
  const director = movie.director || 'Unknown';

  return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${escapeHTML(title)} (${year}) — GoodWatch</title>
    <meta name="description" content="${escapeHTML(overview.substring(0, 155))}...">
    <link rel="canonical" href="https://goodwatch.movie/movies/${movie.tmdb_id ? slugify(title, year) : ''}/">
    <link rel="icon" type="image/png" href="/favicon.png">
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="/assets/css/styles.css">
</head>
<body class="bg-gw-bg text-gw-text font-sans antialiased">
    <!-- Header -->
    <header class="fixed top-0 left-0 right-0 bg-gw-bg/80 backdrop-blur-lg border-b border-gw-border z-50">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
            <a href="/" class="flex items-center gap-3">
                <span class="text-2xl">🎬</span>
                <span class="text-xl font-bold">GoodWatch</span>
            </a>
            <nav class="flex items-center gap-6 text-sm">
                <a href="/movies/" class="hover:text-gw-accent transition-colors">Movies</a>
                <a href="/genres/" class="hover:text-gw-accent transition-colors">Genres</a>
                <a href="/blog/" class="hover:text-gw-accent transition-colors">Blog</a>
            </nav>
        </div>
    </header>

    <main class="pt-24 pb-16 min-h-screen">
        ${backdrop ? `<div class="absolute top-0 left-0 right-0 h-96 overflow-hidden opacity-20">
            <img src="${backdrop}" alt="" class="w-full h-full object-cover blur-xl">
        </div>` : ''}

        <div class="relative max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
            <div class="grid md:grid-cols-[300px_1fr] gap-8 mb-12">
                <img src="${poster}" alt="${escapeHTML(title)} poster" class="w-full rounded-2xl shadow-2xl">

                <div>
                    <h1 class="text-4xl font-bold mb-2">${escapeHTML(title)}</h1>
                    <div class="flex items-center gap-4 text-gw-text-muted mb-6">
                        <span>${year}</span>
                        ${runtime ? `<span>•</span><span>${runtime} min</span>` : ''}
                        ${movie.content_type === 'tv' ? `<span class="px-2 py-1 bg-gw-accent/20 text-gw-accent rounded text-xs">TV Series</span>` : ''}
                    </div>

                    ${compositeScore > 0 ? `<div class="flex items-center gap-6 mb-6">
                        <div class="text-center">
                            <div class="text-3xl font-bold text-gw-accent">${compositeScore.toFixed(1)}</div>
                            <div class="text-xs text-gw-text-muted">GoodScore</div>
                        </div>
                        ${imdbRating > 0 ? `<div class="text-center">
                            <div class="text-2xl font-semibold">${imdbRating.toFixed(1)}</div>
                            <div class="text-xs text-gw-text-muted">IMDb (${imdbVotes.toLocaleString()} votes)</div>
                        </div>` : ''}
                    </div>` : ''}

                    ${genresHTML ? `<div class="flex flex-wrap gap-2 mb-6">${genresHTML}</div>` : ''}

                    <p class="text-gw-text-muted leading-relaxed mb-8">${escapeHTML(overview)}</p>

                    ${director !== 'Unknown' ? `<div class="mb-4">
                        <span class="text-sm text-gw-text-muted">Director:</span>
                        <span class="ml-2 font-semibold">${escapeHTML(director)}</span>
                    </div>` : ''}

                    ${cast ? `<div class="mb-4">
                        <span class="text-sm text-gw-text-muted">Cast:</span>
                        <span class="ml-2">${escapeHTML(cast)}</span>
                    </div>` : ''}
                </div>
            </div>

            ${providersHTML ? `<div class="bg-gw-bg-elevated rounded-2xl p-8 border border-gw-border">
                <h2 class="text-2xl font-bold mb-6">Where to Watch</h2>
                <div class="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    ${providersHTML}
                </div>
            </div>` : `<div class="bg-gw-bg-elevated rounded-2xl p-8 border border-gw-border text-center text-gw-text-muted">
                <p>No streaming providers available for this title in India.</p>
            </div>`}
        </div>
    </main>

    <footer class="border-t border-gw-border mt-16">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 text-center text-sm text-gw-text-muted">
            <p>© 2026 GoodWatch. One perfect movie recommendation.</p>
        </div>
    </footer>
</body>
</html>`;
}

function escapeHTML(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function slugify(title, year) {
  return title.toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '') + '-' + year;
}
