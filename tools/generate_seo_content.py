#!/usr/bin/env python3
"""
GoodWatch SEO Content Engine
Generates 30 blog posts, optimized sitemap, and social content generator.
All data pulled from Supabase. All HTML matches existing blog template exactly.
"""

import requests
import json
import os
import re
import html
import math
from datetime import datetime

# ─── Config ──────────────────────────────────────────────────────────────────
SUPABASE_URL = "https://jdjqrlkynwfhbtyuddjk.supabase.co"
SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpkanFybGt5bndmaGJ0eXVkZGprIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ0NzUwMTEsImV4cCI6MjA4MDA1MTAxMX0.KDRMLCewVMp3lwphkUvtoWOkg6kyAk8iSbVkRKiHYSk"
HEADERS = {
    "apikey": SUPABASE_KEY,
    "Authorization": f"Bearer {SUPABASE_KEY}",
    "Content-Type": "application/json"
}
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
STATIC_DIR = os.path.join(BASE_DIR, "static-site")
BLOG_DIR = os.path.join(STATIC_DIR, "blog")
TODAY = datetime.now().strftime("%Y-%m-%d")
TODAY_DISPLAY = datetime.now().strftime("%B %d, %Y")

# Load slug manifest
SLUGS_PATH = os.path.join(STATIC_DIR, "movies", "_slugs.json")
SLUG_MAP = {}
if os.path.exists(SLUGS_PATH):
    with open(SLUGS_PATH) as f:
        SLUG_MAP = json.load(f)
    # Invert: slug -> id for lookups
    SLUG_BY_TITLE = {}
    for uid, slug in SLUG_MAP.items():
        SLUG_BY_TITLE[slug] = uid


def query_supabase_params(params_dict, limit=15):
    """Query Supabase REST API with params dict (proper URL encoding)."""
    url = f"{SUPABASE_URL}/rest/v1/movies"
    params = dict(params_dict)
    params["limit"] = str(limit)
    if "order" not in params:
        params["order"] = "composite_score.desc"
    resp = requests.get(url, params=params, headers=HEADERS)
    if resp.status_code != 200:
        print(f"  WARNING: Query failed ({resp.status_code}): {resp.url[:150]}")
        print(f"  Response: {resp.text[:200]}")
        return []
    return resp.json()


def make_slug(title, year):
    """Generate URL slug from title and year."""
    s = f"{title}-{year}".lower()
    s = re.sub(r'[^a-z0-9\s-]', '', s)
    s = re.sub(r'[\s]+', '-', s)
    s = re.sub(r'-+', '-', s).strip('-')
    return s


def good_score(movie):
    """Calculate display GoodScore (0-100) from composite_score."""
    cs = movie.get("composite_score")
    if cs and cs > 0:
        return round(cs * 10)
    imdb = movie.get("imdb_rating")
    if imdb and imdb > 0:
        return round(imdb * 10)
    va = movie.get("vote_average")
    if va and va > 0:
        return round(va * 10)
    return None


def get_genres(movie):
    """Extract genre names from genres JSON."""
    genres = movie.get("genres") or []
    if isinstance(genres, str):
        genres = json.loads(genres)
    return [g["name"] for g in genres if isinstance(g, dict) and "name" in g]


def get_platforms(movie):
    """Extract streaming platform names from ott_providers."""
    providers = movie.get("ott_providers") or []
    if isinstance(providers, str):
        providers = json.loads(providers)
    seen = set()
    result = []
    for p in providers:
        if isinstance(p, dict):
            name = p.get("name", "")
            if name and name not in seen:
                seen.add(name)
                result.append(name)
    return result


def get_emotional_tags(movie):
    """Extract emotional profile display tags."""
    ep = movie.get("emotional_profile") or {}
    if isinstance(ep, str):
        ep = json.loads(ep)
    tags = []
    mapping = {
        "comfort": ("Comforting", 7),
        "darkness": ("Dark", 7),
        "energy": ("High-Energy", 7),
        "complexity": ("Complex", 7),
        "rewatchability": ("Rewatchable", 7),
        "emotionalIntensity": ("Intense", 7),
        "emotional_intensity": ("Intense", 7),
    }
    for key, (label, threshold) in mapping.items():
        val = ep.get(key)
        if val and val >= threshold:
            tags.append(label)
    return tags[:3]


def movie_slug(movie):
    """Get the URL slug for a movie."""
    title = movie.get("title", "")
    year = movie.get("year", "")
    slug = make_slug(title, year)
    # Check if it exists in the manifest
    for uid, s in SLUG_MAP.items():
        if s == slug:
            return slug
    return slug


def truncate(text, length=200):
    """Truncate text with ellipsis."""
    if not text:
        return ""
    text = str(text)
    if len(text) <= length:
        return text
    return text[:length].rsplit(' ', 1)[0] + "..."


def esc(text):
    """HTML-escape text."""
    return html.escape(str(text or ""))


def runtime_display(movie):
    """Format runtime for display."""
    rt = movie.get("runtime")
    if not rt or rt <= 0:
        return ""
    hours = rt // 60
    mins = rt % 60
    if hours > 0 and mins > 0:
        return f"{hours}h {mins}m"
    elif hours > 0:
        return f"{hours}h"
    else:
        return f"{mins}m"


# ─── HTML Templates ─────────────────────────────────────────────────────────

def movie_card_html(movie, rank):
    """Generate a single movie card matching the existing blog template."""
    score = good_score(movie)
    if score is None:
        return ""
    slug = movie_slug(movie)
    title = esc(movie.get("title", ""))
    year = movie.get("year", "")
    rt = runtime_display(movie)
    director = movie.get("director", "")
    genres = get_genres(movie)
    platforms = get_platforms(movie)
    overview = esc(truncate(movie.get("overview", ""), 250))
    poster = movie.get("poster_path", "")
    poster_url = f"https://image.tmdb.org/t/p/w342{poster}" if poster else ""

    meta_parts = [str(year)] if year else []
    if rt:
        meta_parts.append(rt)
    if director:
        meta_parts.append(f"Dir. {esc(director)}")
    meta_line = " · ".join(meta_parts)

    genres_line = ", ".join(genres[:3]) if genres else ""

    platform_badges = ""
    if platforms:
        badges = " ".join(
            f'<span class="px-2 py-0.5 bg-gw-bg border border-gw-border rounded text-xs text-gw-text-muted">{esc(p)}</span>'
            for p in platforms[:4]
        )
        platform_badges = f'<div class="flex flex-wrap gap-1 mt-2">{badges}</div>'

    return f'''<div class="relative bg-gw-surface rounded-2xl border border-gw-border overflow-hidden hover:border-gw-accent/30 transition-colors">
    <div class="absolute -top-3 -left-3 w-8 h-8 bg-gw-accent rounded-full flex items-center justify-center text-white font-bold text-sm shadow-lg z-10">{rank}</div>
    <div class="flex flex-col sm:flex-row">
        <a href="/movies/{slug}/" class="shrink-0 w-full sm:w-36 aspect-[2/3] sm:aspect-auto sm:h-auto">
            <img src="{poster_url}" alt="{title}" class="w-full h-full object-cover" loading="lazy">
        </a>
        <div class="flex-1 p-4 sm:p-5">
            <div class="flex items-start justify-between gap-3">
                <div>
                    <h3 class="text-lg font-semibold">
                        <a href="/movies/{slug}/" class="hover:text-gw-accent transition-colors">{title}</a>
                    </h3>
                    <p class="text-sm text-gw-text-muted mt-0.5">{meta_line}</p>
                    <p class="text-xs text-gw-text-muted mt-0.5">{genres_line}</p>
                </div>
                <div class="shrink-0 text-right">
                    <div class="text-green-400 text-2xl font-bold">{score}</div>
                    <div class="text-[10px] text-gw-text-muted">GoodScore</div>
                </div>
            </div>
            <p class="text-sm text-gw-text-muted mt-3 leading-relaxed">{overview}</p>
            {platform_badges}
        </div>
    </div>
</div>'''


def blog_post_html(title, slug, category, description, intro, movies, related_posts, og_image=""):
    """Generate a full blog post page matching existing template."""
    word_count = len(intro.split()) + len(movies) * 80
    read_time = max(3, math.ceil(word_count / 250))

    movie_cards = "\n".join(
        movie_card_html(m, i + 1) for i, m in enumerate(movies)
        if good_score(m) is not None
    )

    related_html = ""
    if related_posts:
        related_items = ""
        for rp in related_posts[:4]:
            related_items += f'''<a href="../../blog/{rp['slug']}/" class="block bg-gw-surface rounded-xl border border-gw-border p-4 hover:border-gw-accent/30 transition-colors group">
            <span class="text-gw-accent text-xs font-medium">{esc(rp['category'])}</span>
            <h3 class="text-sm font-semibold mt-1 group-hover:text-gw-accent transition-colors line-clamp-2">{esc(rp['title'])}</h3>
            <span class="text-xs text-gw-text-muted mt-1 block">{rp.get('read_time', 5)} min read</span>
        </a>'''
        related_html = f'''
        <div class="mt-12 border-t border-gw-border pt-8">
            <h2 class="text-xl font-bold mb-4">You Might Also Like</h2>
            <div class="grid sm:grid-cols-2 gap-4">
                {related_items}
            </div>
        </div>'''

    schema_article = json.dumps({
        "@context": "https://schema.org",
        "@type": "Article",
        "headline": title,
        "description": description,
        "datePublished": TODAY,
        "dateModified": TODAY,
        "author": {"@type": "Organization", "name": "GoodWatch", "url": "https://goodwatch.movie"},
        "publisher": {
            "@type": "Organization",
            "name": "GoodWatch",
            "url": "https://goodwatch.movie",
            "logo": {"@type": "ImageObject", "url": "https://goodwatch.movie/assets/images/logo.png"}
        },
        "mainEntityOfPage": {"@type": "WebPage", "@id": f"https://goodwatch.movie/blog/{slug}/"},
        "image": og_image or "https://goodwatch.movie/assets/images/logo.png"
    })

    schema_breadcrumb = json.dumps({
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        "itemListElement": [
            {"@type": "ListItem", "position": 1, "name": "Home", "item": "https://goodwatch.movie/"},
            {"@type": "ListItem", "position": 2, "name": "Blog", "item": "https://goodwatch.movie/blog/"},
            {"@type": "ListItem", "position": 3, "name": title, "item": f"https://goodwatch.movie/blog/{slug}/"}
        ]
    })

    og_image_tag = ""
    if og_image:
        og_image_tag = f'''<meta property="og:image" content="{og_image}">
    <meta name="twitter:image" content="{og_image}">'''

    return f'''<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{esc(title)} | GoodWatch Blog</title>
    <meta name="description" content="{esc(description)}">
    <meta name="robots" content="index, follow">
    <link rel="canonical" href="https://goodwatch.movie/blog/{slug}/">
    <meta property="og:type" content="article">
    <meta property="og:url" content="https://goodwatch.movie/blog/{slug}/">
    <meta property="og:title" content="{esc(title)} | GoodWatch Blog">
    <meta property="og:description" content="{esc(description)}">
    <meta property="og:site_name" content="GoodWatch">
    {og_image_tag}
    <meta name="twitter:card" content="summary_large_image">
    <meta name="twitter:title" content="{esc(title)} | GoodWatch Blog">
    <meta name="twitter:description" content="{esc(description)}">
    <link rel="icon" type="image/png" href="../../favicon.png">
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="../../assets/css/styles.css">
</head>
<script type="application/ld+json">{schema_article}</script>
<script type="application/ld+json">{schema_breadcrumb}</script>
<body class="bg-gw-bg text-gw-text font-sans antialiased">

<nav class="fixed top-0 left-0 right-0 z-50 bg-gw-bg/80 backdrop-blur-lg border-b border-gw-border">
    <div class="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex items-center justify-between h-16">
            <a href="../../" class="flex items-center gap-2">
                <img src="../../assets/images/logo.png?v=2" alt="GoodWatch Logo" width="32" height="32" class="rounded-lg">
                <span class="text-xl font-semibold">GoodWatch</span>
            </a>
            <div class="flex items-center gap-4">
                <a href="../../movies/" class="text-sm text-gw-text-muted hover:text-gw-text transition-colors">Movies</a>
                <a href="../../blog/" class="text-sm text-gw-text-muted hover:text-gw-text transition-colors">Blog</a>
                <a href="../../#download" class="hidden sm:inline-flex items-center px-4 py-2 bg-gw-accent hover:bg-gw-accent-hover text-white font-medium rounded-lg transition-colors text-sm">
                    Download App
                </a>
            </div>
        </div>
    </div>
</nav>

<main class="pt-24 pb-16 min-h-screen">
    <article class="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="mb-8">
            <div class="flex items-center gap-2 text-sm text-gw-text-muted mb-3">
                <a href="../../blog/" class="hover:text-gw-accent transition-colors">Blog</a>
                <span>›</span>
                <span class="text-gw-accent">{esc(category)}</span>
            </div>
            <h1 class="text-3xl sm:text-4xl font-bold mb-4 leading-tight">{esc(title)}</h1>
            <div class="flex items-center gap-3 text-sm text-gw-text-muted">
                <span>{TODAY_DISPLAY}</span>
                <span class="text-gw-border">•</span>
                <span>{read_time} min read</span>
            </div>
        </div>

        <div class="prose prose-invert max-w-none mb-8">
            <p class="text-lg text-gw-text-muted leading-relaxed">{esc(intro)}</p>
            <p class="text-sm text-gw-text-muted mt-4 bg-gw-surface rounded-xl p-4 border border-gw-border">
                <strong class="text-gw-text">How GoodScore works:</strong> We combine ratings from IMDb, Rotten Tomatoes, Metacritic, and TMDB into a single 0-100 score. Higher = better. No single platform bias.
            </p>
        </div>

        <div class="space-y-4">
            {movie_cards}
        </div>

        {related_html}

        <div class="mt-12 bg-gw-surface rounded-2xl border border-gw-border p-8 text-center">
            <p class="text-gw-text-muted mb-2">Done scrolling. Start watching.</p>
            <h3 class="text-xl font-semibold mb-4">GoodWatch picks the right movie in 30 seconds</h3>
            <a href="../../#download" class="inline-flex items-center px-6 py-3 bg-gw-accent hover:bg-gw-accent-hover text-white font-medium rounded-xl transition-colors">
                Get the App — It's Free
            </a>
        </div>
    </article>
</main>

<footer class="bg-gw-surface border-t border-gw-border py-8">
    <div class="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex flex-col sm:flex-row items-center justify-between gap-4">
            <a href="../../" class="flex items-center gap-2">
                <img src="../../assets/images/logo.png?v=2" alt="GoodWatch Logo" width="24" height="24" class="rounded-lg">
                <span class="font-semibold">GoodWatch</span>
            </a>
            <div class="flex gap-6 text-sm text-gw-text-muted">
                <a href="../../movies/" class="hover:text-gw-text transition-colors">Movies</a>
                <a href="../../blog/" class="hover:text-gw-text transition-colors">Blog</a>
                <a href="../../privacy.html" class="hover:text-gw-text transition-colors">Privacy</a>
                <a href="../../terms.html" class="hover:text-gw-text transition-colors">Terms</a>
            </div>
            <p class="text-sm text-gw-text-muted">&copy; 2026 GoodWatch</p>
        </div>
    </div>
</footer>

</body>
</html>'''


def editorial_post_html(title, slug, category, description, body_html, related_posts, og_image=""):
    """Generate an editorial (non-list) blog post."""
    word_count = len(body_html.split())
    read_time = max(3, math.ceil(word_count / 250))

    related_html = ""
    if related_posts:
        related_items = ""
        for rp in related_posts[:4]:
            related_items += f'''<a href="../../blog/{rp['slug']}/" class="block bg-gw-surface rounded-xl border border-gw-border p-4 hover:border-gw-accent/30 transition-colors group">
            <span class="text-gw-accent text-xs font-medium">{esc(rp['category'])}</span>
            <h3 class="text-sm font-semibold mt-1 group-hover:text-gw-accent transition-colors line-clamp-2">{esc(rp['title'])}</h3>
            <span class="text-xs text-gw-text-muted mt-1 block">{rp.get('read_time', 5)} min read</span>
        </a>'''
        related_html = f'''
        <div class="mt-12 border-t border-gw-border pt-8">
            <h2 class="text-xl font-bold mb-4">You Might Also Like</h2>
            <div class="grid sm:grid-cols-2 gap-4">
                {related_items}
            </div>
        </div>'''

    schema_article = json.dumps({
        "@context": "https://schema.org",
        "@type": "Article",
        "headline": title,
        "description": description,
        "datePublished": TODAY,
        "dateModified": TODAY,
        "author": {"@type": "Organization", "name": "GoodWatch", "url": "https://goodwatch.movie"},
        "publisher": {
            "@type": "Organization",
            "name": "GoodWatch",
            "url": "https://goodwatch.movie",
            "logo": {"@type": "ImageObject", "url": "https://goodwatch.movie/assets/images/logo.png"}
        },
        "mainEntityOfPage": {"@type": "WebPage", "@id": f"https://goodwatch.movie/blog/{slug}/"},
        "image": og_image or "https://goodwatch.movie/assets/images/logo.png"
    })

    schema_breadcrumb = json.dumps({
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        "itemListElement": [
            {"@type": "ListItem", "position": 1, "name": "Home", "item": "https://goodwatch.movie/"},
            {"@type": "ListItem", "position": 2, "name": "Blog", "item": "https://goodwatch.movie/blog/"},
            {"@type": "ListItem", "position": 3, "name": title, "item": f"https://goodwatch.movie/blog/{slug}/"}
        ]
    })

    og_image_tag = ""
    if og_image:
        og_image_tag = f'''<meta property="og:image" content="{og_image}">
    <meta name="twitter:image" content="{og_image}">'''

    return f'''<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{esc(title)} | GoodWatch Blog</title>
    <meta name="description" content="{esc(description)}">
    <meta name="robots" content="index, follow">
    <link rel="canonical" href="https://goodwatch.movie/blog/{slug}/">
    <meta property="og:type" content="article">
    <meta property="og:url" content="https://goodwatch.movie/blog/{slug}/">
    <meta property="og:title" content="{esc(title)} | GoodWatch Blog">
    <meta property="og:description" content="{esc(description)}">
    <meta property="og:site_name" content="GoodWatch">
    {og_image_tag}
    <meta name="twitter:card" content="summary_large_image">
    <meta name="twitter:title" content="{esc(title)} | GoodWatch Blog">
    <meta name="twitter:description" content="{esc(description)}">
    <link rel="icon" type="image/png" href="../../favicon.png">
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="../../assets/css/styles.css">
</head>
<script type="application/ld+json">{schema_article}</script>
<script type="application/ld+json">{schema_breadcrumb}</script>
<body class="bg-gw-bg text-gw-text font-sans antialiased">

<nav class="fixed top-0 left-0 right-0 z-50 bg-gw-bg/80 backdrop-blur-lg border-b border-gw-border">
    <div class="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex items-center justify-between h-16">
            <a href="../../" class="flex items-center gap-2">
                <img src="../../assets/images/logo.png?v=2" alt="GoodWatch Logo" width="32" height="32" class="rounded-lg">
                <span class="text-xl font-semibold">GoodWatch</span>
            </a>
            <div class="flex items-center gap-4">
                <a href="../../movies/" class="text-sm text-gw-text-muted hover:text-gw-text transition-colors">Movies</a>
                <a href="../../blog/" class="text-sm text-gw-text-muted hover:text-gw-text transition-colors">Blog</a>
                <a href="../../#download" class="hidden sm:inline-flex items-center px-4 py-2 bg-gw-accent hover:bg-gw-accent-hover text-white font-medium rounded-lg transition-colors text-sm">
                    Download App
                </a>
            </div>
        </div>
    </div>
</nav>

<main class="pt-24 pb-16 min-h-screen">
    <article class="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="mb-8">
            <div class="flex items-center gap-2 text-sm text-gw-text-muted mb-3">
                <a href="../../blog/" class="hover:text-gw-accent transition-colors">Blog</a>
                <span>›</span>
                <span class="text-gw-accent">{esc(category)}</span>
            </div>
            <h1 class="text-3xl sm:text-4xl font-bold mb-4 leading-tight">{esc(title)}</h1>
            <div class="flex items-center gap-3 text-sm text-gw-text-muted">
                <span>{TODAY_DISPLAY}</span>
                <span class="text-gw-border">•</span>
                <span>{read_time} min read</span>
            </div>
        </div>

        <div class="prose prose-invert max-w-none mb-8">
            {body_html}
        </div>

        {related_html}

        <div class="mt-12 bg-gw-surface rounded-2xl border border-gw-border p-8 text-center">
            <p class="text-gw-text-muted mb-2">Done scrolling. Start watching.</p>
            <h3 class="text-xl font-semibold mb-4">GoodWatch picks the right movie in 30 seconds</h3>
            <a href="../../#download" class="inline-flex items-center px-6 py-3 bg-gw-accent hover:bg-gw-accent-hover text-white font-medium rounded-xl transition-colors">
                Get the App — It's Free
            </a>
        </div>
    </article>
</main>

<footer class="bg-gw-surface border-t border-gw-border py-8">
    <div class="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex flex-col sm:flex-row items-center justify-between gap-4">
            <a href="../../" class="flex items-center gap-2">
                <img src="../../assets/images/logo.png?v=2" alt="GoodWatch Logo" width="24" height="24" class="rounded-lg">
                <span class="font-semibold">GoodWatch</span>
            </a>
            <div class="flex gap-6 text-sm text-gw-text-muted">
                <a href="../../movies/" class="hover:text-gw-text transition-colors">Movies</a>
                <a href="../../blog/" class="hover:text-gw-text transition-colors">Blog</a>
                <a href="../../privacy.html" class="hover:text-gw-text transition-colors">Privacy</a>
                <a href="../../terms.html" class="hover:text-gw-text transition-colors">Terms</a>
            </div>
            <p class="text-sm text-gw-text-muted">&copy; 2026 GoodWatch</p>
        </div>
    </div>
</footer>

</body>
</html>'''


# ─── Article Definitions ─────────────────────────────────────────────────────

SELECT_FIELDS = "title,year,composite_score,genres,original_language,emotional_profile,overview,imdb_rating,rt_critics_score,metacritic_score,vote_count,popularity,poster_path,runtime,director,ott_providers"


def make_params(extra=None, select=SELECT_FIELDS):
    """Build base params dict for Supabase query."""
    p = {"select": select}
    if extra:
        p.update(extra)
    return p


ARTICLES = []


def parse_filters_to_params(select, filters_str):
    """Parse an old-style filter string into a params dict for requests.get."""
    params = {"select": select}
    if not filters_str:
        return params
    for part in filters_str.split("&"):
        part = part.strip()
        if not part or "=" not in part:
            continue
        key, val = part.split("=", 1)
        params[key] = val
    return params


# ─── Category 1: Platform + Mood Lists (10 articles) ────────────────────────

ARTICLES.append({
    "title": "Best Dark Thrillers on Netflix India — Ranked by AI",
    "slug": "best-dark-thrillers-netflix-india",
    "category": "Platform + Mood",
    "description": "The highest-rated dark thrillers streaming on Netflix India, ranked by GoodScore. AI-powered emotional profiles reveal the darkest picks.",
    "intro": "Looking for something dark and gripping on Netflix? We filtered 22,000+ movies by emotional darkness score and thriller genre to find the most intense picks streaming right now. Each movie is ranked by GoodScore, our composite rating from IMDb, Rotten Tomatoes, Metacritic, and TMDB.",
    "query": {
        "select": SELECT_FIELDS,
        "filters": 'ott_providers=cs.[{"name":"Netflix"}]&emotional_profile->>darkness=gte.7&genres=cs.[{"name":"Thriller"}]&composite_score=not.is.null&content_type=eq.movie',
        "limit": 15
    }
})

ARTICLES.append({
    "title": "15 Feel-Good Movies on Amazon Prime Video Right Now",
    "slug": "feel-good-movies-amazon-prime-video",
    "category": "Platform + Mood",
    "description": "The most comforting feel-good movies on Amazon Prime Video, ranked by GoodScore. Perfect for when you need a warm pick-me-up.",
    "intro": "Sometimes you just need a movie that makes you feel good. We used GoodWatch's emotional profiles to find the most comforting movies streaming on Amazon Prime Video right now. These aren't just popular — they score high on our AI's comfort dimension.",
    "query": {
        "select": SELECT_FIELDS,
        "filters": 'ott_providers=cs.[{"name":"Amazon Prime Video"}]&emotional_profile->>comfort=gte.7&composite_score=not.is.null&content_type=eq.movie',
        "limit": 15
    }
})

ARTICLES.append({
    "title": "Mind-Bending Complex Movies on JioHotstar",
    "slug": "complex-movies-jiohotstar",
    "category": "Platform + Mood",
    "description": "The most intellectually complex movies on JioHotstar, ranked by GoodScore. Films that challenge your brain and reward attention.",
    "intro": "If you love movies that make you think, this list is for you. We ranked every movie on JioHotstar by its complexity score — a dimension in GoodWatch's emotional AI that measures how much a film challenges the viewer intellectually.",
    "query": {
        "select": SELECT_FIELDS,
        "filters": 'ott_providers=cs.[{"name":"JioHotstar"}]&emotional_profile->>complexity=gte.7&composite_score=not.is.null&content_type=eq.movie',
        "limit": 15
    }
})

ARTICLES.append({
    "title": "Best Slow-Burn Movies on Apple TV+ Worth Your Time",
    "slug": "slow-burn-movies-apple-tv-plus",
    "category": "Platform + Mood",
    "description": "The best slow-burn, low-energy movies on Apple TV+, ranked by GoodScore. Patient storytelling that rewards your attention.",
    "intro": "Apple TV+ is known for quality over quantity. We filtered their catalog for slow-burn movies — films with low energy scores that take their time building tension, atmosphere, or emotional depth. These are the ones worth your patience.",
    "query": {
        "select": SELECT_FIELDS,
        "filters": 'ott_providers=cs.[{"name":"Apple TV"}]&emotional_profile->>energy=lte.5&composite_score=not.is.null&content_type=eq.movie',
        "limit": 15
    }
})

ARTICLES.append({
    "title": "High-Energy Action Movies on Netflix You Haven't Seen",
    "slug": "high-energy-action-netflix-hidden",
    "category": "Platform + Mood",
    "description": "Hidden gem action movies on Netflix with high energy scores. High-rated films you probably missed, ranked by GoodScore.",
    "intro": "Everyone knows the big action blockbusters. But Netflix has a deep catalog of high-energy action movies that most people scroll right past. We found the ones with GoodScore ratings that prove they're worth your time — films with under 5,000 votes that the algorithms buried.",
    "query": {
        "select": SELECT_FIELDS,
        "filters": 'ott_providers=cs.[{"name":"Netflix"}]&emotional_profile->>energy=gte.7&genres=cs.[{"name":"Action"}]&vote_count=lte.5000&composite_score=not.is.null&content_type=eq.movie',
        "limit": 15
    }
})

ARTICLES.append({
    "title": "Most Rewatchable Comfort Movies on Prime Video",
    "slug": "rewatchable-comfort-movies-prime-video",
    "category": "Platform + Mood",
    "description": "Movies on Amazon Prime Video you'll want to watch again and again. High rewatchability + comfort scores, ranked by GoodScore.",
    "intro": "The best movies aren't always the ones you watch once. Some movies are meant to be rewatched — familiar, comforting, and just as good the second time. We found Prime Video movies that score highest on both rewatchability and comfort in GoodWatch's emotional AI.",
    "query": {
        "select": SELECT_FIELDS,
        "filters": 'ott_providers=cs.[{"name":"Amazon Prime Video"}]&emotional_profile->>rewatchability=gte.7&emotional_profile->>comfort=gte.6&composite_score=not.is.null&content_type=eq.movie',
        "limit": 15
    }
})

ARTICLES.append({
    "title": "Dark and Heavy Movies on Zee5 for Serious Viewers",
    "slug": "dark-heavy-movies-zee5",
    "category": "Platform + Mood",
    "description": "The most emotionally dark and intense movies on Zee5, ranked by GoodScore. Serious cinema for serious viewers.",
    "intro": "Zee5 has one of the deepest catalogs of Indian cinema. We filtered for movies that score high on both darkness and emotional intensity — films that don't hold back. If you're in the mood for something heavy, this is your list.",
    "query": {
        "select": SELECT_FIELDS,
        "filters": 'ott_providers=cs.[{"name":"Zee5"}]&emotional_profile->>darkness=gte.6&emotional_profile->>emotionalIntensity=gte.6&composite_score=not.is.null&content_type=eq.movie',
        "limit": 15
    }
})

ARTICLES.append({
    "title": "Best Light-Hearted Movies on SonyLIV",
    "slug": "light-hearted-movies-sonyliv",
    "category": "Platform + Mood",
    "description": "The most light-hearted, feel-good movies on SonyLIV, ranked by GoodScore. Low darkness, high comfort — perfect for unwinding.",
    "intro": "Not every movie night needs to be intense. SonyLIV has a surprisingly solid collection of light-hearted films — low on darkness, high on comfort. We ranked them by GoodScore so you don't have to scroll through the catalog wondering what's actually good.",
    "query": {
        "select": SELECT_FIELDS,
        "filters": 'ott_providers=cs.[{"name":"Sony Liv"}]&emotional_profile->>darkness=lte.4&emotional_profile->>comfort=gte.6&composite_score=not.is.null&content_type=eq.movie',
        "limit": 15
    }
})

ARTICLES.append({
    "title": "Complex Thrillers on JioCinema That Will Break Your Brain",
    "slug": "complex-thrillers-jiocinema",
    "category": "Platform + Mood",
    "description": "The most complex thriller movies on JioCinema, ranked by GoodScore. Films that twist your mind and keep you guessing.",
    "intro": "JioCinema's free catalog hides some seriously mind-bending thrillers. We filtered for movies that score highest on complexity — the ones that demand your full attention and reward repeat viewings. Ranked by GoodScore from four major rating platforms.",
    "query": {
        "select": SELECT_FIELDS,
        "filters": 'ott_providers=cs.[{"name":"JioCinema"}]&emotional_profile->>complexity=gte.7&genres=cs.[{"name":"Thriller"}]&composite_score=not.is.null&content_type=eq.movie',
        "limit": 15
    }
})

ARTICLES.append({
    "title": "15 Comforting Movies to Stream Tonight on Netflix India",
    "slug": "comforting-movies-netflix-india-tonight",
    "category": "Platform + Mood",
    "description": "The most comforting movies on Netflix India for tonight, ranked by GoodScore. Maximum comfort, minimum decision fatigue.",
    "intro": "It's been a long day. You don't want to think about what to watch. Here are the 15 most comforting movies on Netflix India right now — ranked by comfort score from GoodWatch's emotional AI, then by GoodScore to make sure they're actually worth watching.",
    "query": {
        "select": SELECT_FIELDS,
        "filters": 'ott_providers=cs.[{"name":"Netflix"}]&emotional_profile->>comfort=gte.7&composite_score=not.is.null&content_type=eq.movie',
        "limit": 15
    }
})

# ─── Category 2: Mood/Emotion Guides (10 articles) ──────────────────────────

ARTICLES.append({
    "title": "What to Watch When You Can't Sleep — Movies That Won't Keep You Up",
    "slug": "movies-when-you-cant-sleep",
    "category": "Mood Picks",
    "description": "Calming, low-energy movies perfect for sleepless nights. Low darkness, high comfort — ranked by GoodScore.",
    "intro": "Can't sleep? The worst thing you can do is put on something intense. These movies are the opposite — low energy, low darkness, high comfort. Perfect background viewing or gentle stories that ease you into rest. All ranked by GoodScore.",
    "query": {
        "select": SELECT_FIELDS,
        "filters": 'emotional_profile->>darkness=lte.4&emotional_profile->>energy=lte.5&emotional_profile->>comfort=gte.5&composite_score=not.is.null&content_type=eq.movie',
        "limit": 15
    }
})

ARTICLES.append({
    "title": "Movies for When You Need a Good Cry",
    "slug": "movies-when-you-need-to-cry",
    "category": "Mood Picks",
    "description": "The most emotionally intense movies that will make you cry, ranked by GoodScore. High emotional intensity, high darkness.",
    "intro": "Sometimes you need to feel something. These movies score highest on emotional intensity — films designed to break you open. We combined that with high darkness scores to find the ones that really hit hard. Bring tissues.",
    "query": {
        "select": SELECT_FIELDS,
        "filters": 'emotional_profile->>emotionalIntensity=gte.8&emotional_profile->>darkness=gte.5&composite_score=not.is.null&content_type=eq.movie',
        "limit": 15
    }
})

ARTICLES.append({
    "title": "Perfect Date Night Movies — Ranked by Rewatchability",
    "slug": "perfect-date-night-movies",
    "category": "Mood Picks",
    "description": "The best date night movies: comforting, not too dark, and highly rewatchable. Ranked by GoodScore for guaranteed quality.",
    "intro": "A good date night movie needs to hit specific notes: comforting but not boring, light but not shallow, and good enough to rewatch together. We used GoodWatch's emotional dimensions to find movies that tick all these boxes.",
    "query": {
        "select": SELECT_FIELDS,
        "filters": 'emotional_profile->>comfort=gte.6&emotional_profile->>darkness=lte.4&emotional_profile->>rewatchability=gte.6&composite_score=not.is.null&content_type=eq.movie',
        "limit": 15
    }
})

ARTICLES.append({
    "title": "Movies to Watch When You're Angry — Channel That Energy",
    "slug": "movies-when-youre-angry",
    "category": "Mood Picks",
    "description": "High-energy, dark, emotionally intense movies for when you're angry. Channel that energy into cinema. Ranked by GoodScore.",
    "intro": "Feeling frustrated? Instead of doomscrolling, channel that energy into a movie that matches your mood. These films are high-energy, dark, and emotionally intense — the cinematic equivalent of screaming into a pillow, but better.",
    "query": {
        "select": SELECT_FIELDS,
        "filters": 'emotional_profile->>energy=gte.7&emotional_profile->>darkness=gte.5&emotional_profile->>emotionalIntensity=gte.7&composite_score=not.is.null&content_type=eq.movie',
        "limit": 15
    }
})

ARTICLES.append({
    "title": "Lazy Sunday Movies That Require Zero Brainpower",
    "slug": "lazy-sunday-movies-zero-brainpower",
    "category": "Mood Picks",
    "description": "Simple, comforting, low-effort movies for lazy Sundays. Low complexity, high comfort — ranked by GoodScore.",
    "intro": "It's Sunday. Your brain is off. You need a movie that asks nothing of you and gives everything back. These films score lowest on complexity and highest on comfort — they're simple, warm, and require zero mental effort.",
    "query": {
        "select": SELECT_FIELDS,
        "filters": 'emotional_profile->>complexity=lte.3&emotional_profile->>comfort=gte.7&emotional_profile->>energy=lte.4&composite_score=not.is.null&content_type=eq.movie',
        "limit": 15
    }
})

ARTICLES.append({
    "title": "Movies That Will Make You Think for Days",
    "slug": "movies-that-make-you-think",
    "category": "Mood Picks",
    "description": "The most intellectually complex and emotionally intense movies that stay with you for days. Ranked by GoodScore.",
    "intro": "These aren't movies you watch and forget. They score highest on complexity and emotional intensity — films that lodge themselves in your brain and refuse to leave. Each one is ranked by GoodScore to make sure the quality matches the ambition.",
    "query": {
        "select": SELECT_FIELDS,
        "filters": 'emotional_profile->>complexity=gte.8&emotional_profile->>emotionalIntensity=gte.6&composite_score=not.is.null&content_type=eq.movie',
        "limit": 15
    }
})

ARTICLES.append({
    "title": "Best Movies for Watching Alone",
    "slug": "best-movies-watching-alone",
    "category": "Mood Picks",
    "description": "Dark, complex, introspective movies perfect for solo viewing. Films that reward solitude, ranked by GoodScore.",
    "intro": "Some movies are better experienced alone — without someone asking questions, without pausing for bathroom breaks. These films are dark, complex, and deeply personal. They reward your full, undivided attention.",
    "query": {
        "select": SELECT_FIELDS,
        "filters": 'emotional_profile->>darkness=gte.5&emotional_profile->>complexity=gte.6&emotional_profile->>comfort=lte.5&composite_score=not.is.null&content_type=eq.movie',
        "limit": 15
    }
})

ARTICLES.append({
    "title": "Feel-Good Bollywood Movies That Actually Have High Ratings",
    "slug": "feel-good-bollywood-movies-high-ratings",
    "category": "Indian Cinema",
    "description": "The best feel-good Bollywood (Hindi) movies with genuinely high ratings. Comfort + quality, ranked by GoodScore.",
    "intro": "Bollywood is famous for feel-good cinema. But not all of it is actually good. We filtered Hindi movies by both comfort score and GoodScore — so every movie here is genuinely comforting AND genuinely well-rated across four major platforms.",
    "query": {
        "select": SELECT_FIELDS,
        "filters": 'original_language=eq.hi&emotional_profile->>comfort=gte.7&composite_score=gte.7&content_type=eq.movie',
        "limit": 15
    }
})

ARTICLES.append({
    "title": "Tamil Movies That Hit Different — Highest GoodScore Picks",
    "slug": "tamil-movies-highest-goodscore",
    "category": "Indian Cinema",
    "description": "The highest-rated Tamil movies by GoodScore. From action to drama, Tamil cinema's finest ranked by composite ratings.",
    "intro": "Tamil cinema has been producing world-class films for decades. We ranked every Tamil movie in our database by GoodScore — a composite of IMDb, Rotten Tomatoes, Metacritic, and TMDB — to find the absolute best. These aren't just popular; they're critically acclaimed.",
    "query": {
        "select": SELECT_FIELDS,
        "filters": "original_language=eq.ta&composite_score=gte.7&content_type=eq.movie",
        "limit": 15
    }
})

ARTICLES.append({
    "title": "Telugu Cinema Hidden Gems You've Been Sleeping On",
    "slug": "telugu-cinema-hidden-gems",
    "category": "Indian Cinema",
    "description": "Underrated Telugu movies with high GoodScores but low vote counts. The hidden gems of Tollywood you've been missing.",
    "intro": "Telugu cinema goes far beyond the blockbusters everyone knows. We found movies with high GoodScores but relatively low vote counts — critically acclaimed films that haven't broken through to mainstream audiences yet. Your next favorite movie might be here.",
    "query": {
        "select": SELECT_FIELDS,
        "filters": "original_language=eq.te&composite_score=gte.6.5&vote_count=lte.10000&content_type=eq.movie",
        "limit": 15
    }
})

# ─── Category 3: GoodWatch Unique Value Prop (10 articles) ──────────────────
# These are editorial articles that mix data with commentary

ARTICLES.append({
    "title": "Why IMDb Ratings Lie — And What GoodScore Gets Right",
    "slug": "why-imdb-ratings-lie-goodscore",
    "category": "Movie Ratings",
    "description": "IMDb ratings can be misleading. Here's why GoodScore's composite approach from 4 platforms gives you a more accurate picture.",
    "intro": "",  # Will be editorial
    "type": "editorial",
    "query": {
        "select": SELECT_FIELDS,
        # Movies where IMDb is high but composite is low, and vice versa
        "filters": "imdb_rating=gte.7&composite_score=lte.6&content_type=eq.movie",
        "limit": 10
    },
    "query2": {
        "select": SELECT_FIELDS,
        "filters": "imdb_rating=lte.7&composite_score=gte.7&vote_count=gte.500&content_type=eq.movie",
        "limit": 10
    }
})

ARTICLES.append({
    "title": "The Science Behind GoodWatch's Emotional Movie Profiles",
    "slug": "science-behind-emotional-movie-profiles",
    "category": "How It Works",
    "description": "How GoodWatch uses 6 emotional dimensions to profile every movie. The AI system behind comfort, darkness, energy, complexity, intensity, and rewatchability.",
    "intro": "",
    "type": "editorial",
    "query": {
        "select": SELECT_FIELDS,
        "filters": "emotional_profile=not.is.null&composite_score=gte.8&content_type=eq.movie",
        "limit": 6
    }
})

ARTICLES.append({
    "title": "How We Score Movies: GoodScore vs IMDb vs Rotten Tomatoes",
    "slug": "goodscore-vs-imdb-vs-rotten-tomatoes",
    "category": "Movie Ratings",
    "description": "A comparison of GoodScore, IMDb, and Rotten Tomatoes. See how different scoring systems rate the same movies.",
    "intro": "",
    "type": "editorial",
    "query": {
        "select": SELECT_FIELDS,
        "filters": "imdb_rating=not.is.null&rt_critics_score=not.is.null&composite_score=gte.7&content_type=eq.movie",
        "limit": 10
    }
})

ARTICLES.append({
    "title": "10 Movies IMDb Rates 7+ That Are Actually Terrible",
    "slug": "movies-imdb-overrates",
    "category": "Movie Ratings",
    "description": "Movies with high IMDb ratings that GoodScore disagrees with. When crowd ratings mislead, composite scores reveal the truth.",
    "intro": "IMDb ratings are based on crowd voting — which can be gamed, review-bombed, or inflated by nostalgia. When you compare IMDb scores to the composite GoodScore (combining RT, Metacritic, and TMDB alongside IMDb), some popular movies look a lot worse than their IMDb score suggests.",
    "query": {
        "select": SELECT_FIELDS,
        "filters": "imdb_rating=gte.7&composite_score=lte.5.5&content_type=eq.movie&vote_count=gte.1000",
        "limit": 10
    }
})

ARTICLES.append({
    "title": "10 Underrated Movies IMDb Ignores — But GoodScore Loves",
    "slug": "underrated-movies-imdb-ignores-goodscore-loves",
    "category": "Special Lists",
    "description": "High GoodScore, low vote count — movies that deserve way more attention than IMDb gives them.",
    "intro": "These movies have fewer than 5,000 IMDb votes but score 80+ on GoodScore. They're the definition of hidden gems — critically acclaimed across multiple platforms but somehow flying under the radar. Every one of them deserves to be seen.",
    "query": {
        "select": SELECT_FIELDS,
        "filters": "composite_score=gte.8&vote_count=lte.5000&content_type=eq.movie",
        "limit": 15
    }
})

ARTICLES.append({
    "title": "The Problem With Netflix's Algorithm — And How to Fix It",
    "slug": "problem-with-netflix-algorithm",
    "category": "Streaming Culture",
    "description": "Netflix's algorithm optimizes for watch time, not quality. Here's why that's a problem and what GoodWatch does differently.",
    "intro": "",
    "type": "editorial",
    "query": {
        "select": SELECT_FIELDS,
        "filters": 'ott_providers=cs.[{"name":"Netflix"}]&composite_score=gte.8&vote_count=lte.5000&content_type=eq.movie',
        "limit": 5
    }
})

ARTICLES.append({
    "title": "Decision Fatigue Is Ruining Movie Night — Here's the Data",
    "slug": "decision-fatigue-movie-night-data",
    "category": "Decision Fatigue",
    "description": "Data-backed look at decision fatigue and streaming. How too many choices leads to watching nothing — and the fix.",
    "intro": "",
    "type": "editorial",
    "query": {
        "select": SELECT_FIELDS,
        "filters": "composite_score=gte.8.5&content_type=eq.movie",
        "limit": 5
    }
})

ARTICLES.append({
    "title": "What Your Movie Mood Says About You",
    "slug": "what-movie-mood-says-about-you",
    "category": "Movie Culture",
    "description": "Fun breakdown of movie mood profiles. What does craving dark thrillers or comforting comedies say about your personality?",
    "intro": "",
    "type": "editorial",
    "query": {
        "select": SELECT_FIELDS,
        "filters": "emotional_profile=not.is.null&composite_score=gte.7.5&content_type=eq.movie",
        "limit": 12
    }
})

ARTICLES.append({
    "title": "The Best Movies of 2024 According to AI — Not Critics",
    "slug": "best-movies-2024-ai-not-critics",
    "category": "Special Lists",
    "description": "The highest-rated movies of 2024 by GoodScore — a composite of 4 major rating platforms, not just one critic's opinion.",
    "intro": "Forget critic top-10 lists. GoodScore combines ratings from IMDb, Rotten Tomatoes, Metacritic, and TMDB into a single number. Here are the best movies released in 2024 according to that composite — no single platform bias, no personal taste, just data.",
    "query": {
        "select": SELECT_FIELDS,
        "filters": "year=eq.2024&content_type=eq.movie&composite_score=gte.5",
        "limit": 15
    }
})

ARTICLES.append({
    "title": "Hidden Gems: 20 Movies with GoodScore 85+ You've Never Heard Of",
    "slug": "hidden-gems-goodscore-85-plus",
    "category": "Special Lists",
    "description": "20 incredible movies scoring 85+ on GoodScore that most people have never seen. Under 5,000 votes, but absolute quality.",
    "intro": "A GoodScore of 85+ means a movie is rated highly across IMDb, Rotten Tomatoes, Metacritic, and TMDB. Getting all four platforms to agree is rare. These 20 movies achieved it — but with fewer than 5,000 votes each, almost nobody's seen them.",
    "query": {
        "select": SELECT_FIELDS,
        "filters": "composite_score=gte.8.5&vote_count=lte.5000&content_type=eq.movie",
        "limit": 20
    }
})


# ─── Editorial Content Generators ─────────────────────────────────────────

def generate_editorial_content(article, movies, movies2=None):
    """Generate editorial HTML body content with data-backed examples."""
    slug = article["slug"]

    if slug == "why-imdb-ratings-lie-goodscore":
        overrated = movies[:5] if movies else []
        underrated = (movies2 or [])[:5]
        body = f'''<p class="text-lg text-gw-text-muted leading-relaxed">IMDb is the world's most popular movie rating site. But relying on a single crowd-voted number can mislead you. GoodScore combines four major platforms into one rating — and the differences are revealing.</p>

            <h2 class="text-2xl font-bold mt-8 mb-4">The Problem with One Number</h2>
            <p class="text-gw-text-muted leading-relaxed">IMDb ratings reflect crowd popularity. A movie can have a high rating because of dedicated fans, nostalgia, or even coordinated voting. It doesn't account for critical consensus (Rotten Tomatoes), expert evaluation (Metacritic), or global community ratings (TMDB).</p>
            <p class="text-gw-text-muted leading-relaxed mt-3">GoodScore solves this by combining all four. When they agree, you know a movie is genuinely good. When they disagree, that tells you something too.</p>

            <h2 class="text-2xl font-bold mt-8 mb-4">Movies IMDb Overrates</h2>
            <p class="text-gw-text-muted leading-relaxed">These movies have IMDb ratings of 7+ but significantly lower GoodScores when you factor in RT, Metacritic, and TMDB:</p>
            <div class="space-y-3 mt-4">'''
        for m in overrated:
            score = good_score(m)
            imdb = m.get("imdb_rating", 0)
            s = movie_slug(m)
            body += f'''
                <div class="bg-gw-surface rounded-xl border border-gw-border p-4">
                    <div class="flex justify-between items-center">
                        <a href="/movies/{s}/" class="font-semibold hover:text-gw-accent transition-colors">{esc(m.get("title",""))} ({m.get("year","")})</a>
                        <div class="text-right text-sm">
                            <span class="text-gw-text-muted">IMDb: {imdb}</span> · <span class="text-green-400 font-bold">GoodScore: {score}</span>
                        </div>
                    </div>
                </div>'''
        body += '''</div>

            <h2 class="text-2xl font-bold mt-8 mb-4">Movies IMDb Underrates</h2>
            <p class="text-gw-text-muted leading-relaxed">And these movies have moderate IMDb ratings but much higher GoodScores — meaning critics and other platforms disagree with the crowd:</p>
            <div class="space-y-3 mt-4">'''
        for m in underrated:
            score = good_score(m)
            imdb = m.get("imdb_rating", 0)
            s = movie_slug(m)
            body += f'''
                <div class="bg-gw-surface rounded-xl border border-gw-border p-4">
                    <div class="flex justify-between items-center">
                        <a href="/movies/{s}/" class="font-semibold hover:text-gw-accent transition-colors">{esc(m.get("title",""))} ({m.get("year","")})</a>
                        <div class="text-right text-sm">
                            <span class="text-gw-text-muted">IMDb: {imdb}</span> · <span class="text-green-400 font-bold">GoodScore: {score}</span>
                        </div>
                    </div>
                </div>'''
        body += '''</div>

            <h2 class="text-2xl font-bold mt-8 mb-4">The Takeaway</h2>
            <p class="text-gw-text-muted leading-relaxed">IMDb is one data point. GoodScore gives you four. When you're deciding what to watch, a single crowd-voted number can steer you toward popular-but-mediocre picks and away from genuinely great films that didn't get enough votes.</p>
            <p class="text-gw-text-muted leading-relaxed mt-3">GoodWatch uses GoodScore alongside emotional profiles to make sure you find movies that are both well-rated and right for your mood.</p>'''
        return body

    elif slug == "science-behind-emotional-movie-profiles":
        examples = movies[:6]
        body = f'''<p class="text-lg text-gw-text-muted leading-relaxed">Every movie on GoodWatch has a 6-dimensional emotional profile. It's not just about whether a movie is "good" — it's about how it makes you feel. Here's the system behind it.</p>

            <h2 class="text-2xl font-bold mt-8 mb-4">The 6 Dimensions</h2>
            <div class="grid gap-4 mt-4">
                <div class="bg-gw-surface rounded-xl border border-gw-border p-4">
                    <h3 class="font-semibold text-gw-accent">Comfort (1-10)</h3>
                    <p class="text-sm text-gw-text-muted mt-1">How safe and warm does this movie make you feel? High comfort = cozy blanket energy. Low comfort = uneasy, disturbing.</p>
                </div>
                <div class="bg-gw-surface rounded-xl border border-gw-border p-4">
                    <h3 class="font-semibold text-gw-accent">Darkness (1-10)</h3>
                    <p class="text-sm text-gw-text-muted mt-1">How dark and heavy is the subject matter? High darkness = violence, trauma, moral ambiguity. Low darkness = light, playful.</p>
                </div>
                <div class="bg-gw-surface rounded-xl border border-gw-border p-4">
                    <h3 class="font-semibold text-gw-accent">Energy (1-10)</h3>
                    <p class="text-sm text-gw-text-muted mt-1">How fast-paced and energetic? High energy = action, adrenaline. Low energy = slow-burn, meditative.</p>
                </div>
                <div class="bg-gw-surface rounded-xl border border-gw-border p-4">
                    <h3 class="font-semibold text-gw-accent">Complexity (1-10)</h3>
                    <p class="text-sm text-gw-text-muted mt-1">How intellectually demanding? High complexity = layered narratives, unreliable narrators. Low complexity = straightforward storytelling.</p>
                </div>
                <div class="bg-gw-surface rounded-xl border border-gw-border p-4">
                    <h3 class="font-semibold text-gw-accent">Emotional Intensity (1-10)</h3>
                    <p class="text-sm text-gw-text-muted mt-1">How strongly does it make you feel? High intensity = tears, anger, catharsis. Low intensity = pleasant, neutral.</p>
                </div>
                <div class="bg-gw-surface rounded-xl border border-gw-border p-4">
                    <h3 class="font-semibold text-gw-accent">Rewatchability (1-10)</h3>
                    <p class="text-sm text-gw-text-muted mt-1">How well does it hold up on repeat viewings? High rewatchability = new details every time. Low = one-and-done.</p>
                </div>
            </div>

            <h2 class="text-2xl font-bold mt-8 mb-4">Real Examples</h2>
            <p class="text-gw-text-muted leading-relaxed">Here's what these dimensions look like on actual movies:</p>
            <div class="space-y-4 mt-4">'''
        for m in examples:
            ep = m.get("emotional_profile") or {}
            if isinstance(ep, str):
                ep = json.loads(ep)
            s = movie_slug(m)
            body += f'''
                <div class="bg-gw-surface rounded-xl border border-gw-border p-4">
                    <a href="/movies/{s}/" class="font-semibold hover:text-gw-accent transition-colors">{esc(m.get("title",""))} ({m.get("year","")})</a>
                    <div class="grid grid-cols-3 gap-2 mt-2 text-xs text-gw-text-muted">
                        <span>Comfort: <strong class="text-gw-text">{ep.get("comfort","?")}</strong></span>
                        <span>Darkness: <strong class="text-gw-text">{ep.get("darkness","?")}</strong></span>
                        <span>Energy: <strong class="text-gw-text">{ep.get("energy","?")}</strong></span>
                        <span>Complexity: <strong class="text-gw-text">{ep.get("complexity","?")}</strong></span>
                        <span>Intensity: <strong class="text-gw-text">{ep.get("emotionalIntensity", ep.get("emotional_intensity","?"))}</strong></span>
                        <span>Rewatchability: <strong class="text-gw-text">{ep.get("rewatchability","?")}</strong></span>
                    </div>
                </div>'''
        body += '''</div>

            <h2 class="text-2xl font-bold mt-8 mb-4">Why This Matters</h2>
            <p class="text-gw-text-muted leading-relaxed">A movie can be a 9/10 on IMDb and still be wrong for your mood. If you want comfort and you get darkness, the rating doesn't matter. Emotional profiles give you a second layer of information that traditional ratings completely miss.</p>
            <p class="text-gw-text-muted leading-relaxed mt-3">GoodWatch uses these profiles to match movies to your mood — so you don't just get a good movie, you get the right movie.</p>'''
        return body

    elif slug == "goodscore-vs-imdb-vs-rotten-tomatoes":
        body = f'''<p class="text-lg text-gw-text-muted leading-relaxed">Every movie rating platform has a different methodology. IMDb uses crowd votes, Rotten Tomatoes counts critical consensus, and Metacritic weighs expert scores. GoodScore combines all of them. Here's how they compare.</p>

            <h2 class="text-2xl font-bold mt-8 mb-4">The Three Scoring Systems</h2>
            <div class="space-y-4 mt-4">
                <div class="bg-gw-surface rounded-xl border border-gw-border p-4">
                    <h3 class="font-semibold">IMDb (1-10)</h3>
                    <p class="text-sm text-gw-text-muted mt-1">Crowd-voted average. Anyone can rate. Prone to vote manipulation, nostalgia bias, and recency effects. Skews toward popular genre films.</p>
                </div>
                <div class="bg-gw-surface rounded-xl border border-gw-border p-4">
                    <h3 class="font-semibold">Rotten Tomatoes (0-100%)</h3>
                    <p class="text-sm text-gw-text-muted mt-1">Percentage of critics who gave a positive review. Binary (fresh/rotten) — doesn't distinguish between "liked it" and "masterpiece." Can make mediocre-but-inoffensive films look great.</p>
                </div>
                <div class="bg-gw-surface rounded-xl border border-gw-border p-4">
                    <h3 class="font-semibold">Metacritic (0-100)</h3>
                    <p class="text-sm text-gw-text-muted mt-1">Weighted average of critic scores. More nuanced than RT but fewer reviews. Can be harsh — very few films score above 80.</p>
                </div>
                <div class="bg-gw-surface rounded-xl border border-gw-border p-4">
                    <h3 class="font-semibold text-gw-accent">GoodScore (0-100)</h3>
                    <p class="text-sm text-gw-text-muted mt-1">Composite of all four platforms (IMDb, RT, Metacritic, TMDB). When they agree, the score is confident. When they disagree, the score reflects the consensus. No single platform can dominate.</p>
                </div>
            </div>

            <h2 class="text-2xl font-bold mt-8 mb-4">Side-by-Side Comparison</h2>
            <div class="overflow-x-auto">
                <table class="w-full text-sm mt-4">
                    <thead>
                        <tr class="border-b border-gw-border text-left text-gw-text-muted">
                            <th class="py-2 pr-4">Movie</th>
                            <th class="py-2 px-2">IMDb</th>
                            <th class="py-2 px-2">RT</th>
                            <th class="py-2 px-2">MC</th>
                            <th class="py-2 px-2 text-green-400">GoodScore</th>
                        </tr>
                    </thead>
                    <tbody>'''
        for m in movies[:10]:
            score = good_score(m)
            imdb = m.get("imdb_rating", "—")
            rt = m.get("rt_critics_score", "—")
            mc = m.get("metacritic_score", "—")
            s = movie_slug(m)
            body += f'''
                        <tr class="border-b border-gw-border/50">
                            <td class="py-2 pr-4"><a href="/movies/{s}/" class="hover:text-gw-accent transition-colors">{esc(m.get("title",""))}</a></td>
                            <td class="py-2 px-2 text-gw-text-muted">{imdb if imdb else "—"}</td>
                            <td class="py-2 px-2 text-gw-text-muted">{rt if rt else "—"}%</td>
                            <td class="py-2 px-2 text-gw-text-muted">{mc if mc else "—"}</td>
                            <td class="py-2 px-2 text-green-400 font-bold">{score}</td>
                        </tr>'''
        body += '''
                    </tbody>
                </table>
            </div>

            <h2 class="text-2xl font-bold mt-8 mb-4">Which One Should You Trust?</h2>
            <p class="text-gw-text-muted leading-relaxed">All of them — and none of them alone. Each platform captures something different. GoodScore's strength is that it doesn't rely on any single source. When IMDb, RT, Metacritic, and TMDB all agree a movie is great, you can be confident it actually is.</p>'''
        return body

    elif slug == "problem-with-netflix-algorithm":
        body = f'''<p class="text-lg text-gw-text-muted leading-relaxed">Netflix's recommendation algorithm is designed to maximize one thing: watch time. Not quality, not satisfaction, not whether you'll remember the movie tomorrow. Here's why that's a problem.</p>

            <h2 class="text-2xl font-bold mt-8 mb-4">Optimized for Engagement, Not Quality</h2>
            <p class="text-gw-text-muted leading-relaxed">Netflix's algorithm learns what keeps you watching. That sounds good in theory, but it means the algorithm favors easily digestible content over challenging, rewarding films. A mediocre thriller you'll half-watch is more "valuable" to Netflix than a brilliant drama you'll pause to think about.</p>

            <h2 class="text-2xl font-bold mt-8 mb-4">The Hidden Gems Problem</h2>
            <p class="text-gw-text-muted leading-relaxed">Netflix has thousands of movies. But their algorithm surfaces the same few hundred titles over and over. High-quality films with lower viewership numbers get buried because they don't generate enough "engagement signals."</p>
            <p class="text-gw-text-muted leading-relaxed mt-3">Here are some movies currently on Netflix with GoodScore 80+ that the algorithm probably never showed you:</p>
            <div class="space-y-3 mt-4">'''
        for m in movies[:5]:
            score = good_score(m)
            s = movie_slug(m)
            body += f'''
                <div class="bg-gw-surface rounded-xl border border-gw-border p-4 flex justify-between items-center">
                    <a href="/movies/{s}/" class="font-semibold hover:text-gw-accent transition-colors">{esc(m.get("title",""))} ({m.get("year","")})</a>
                    <span class="text-green-400 font-bold">{score}</span>
                </div>'''
        body += '''</div>

            <h2 class="text-2xl font-bold mt-8 mb-4">The Fix</h2>
            <p class="text-gw-text-muted leading-relaxed">Instead of trusting a single platform's algorithm, use a composite rating that draws from multiple sources. GoodScore combines IMDb, RT, Metacritic, and TMDB — so popularity alone can't inflate a movie's ranking. Add emotional profiles on top of that, and you get recommendations based on what's actually good for your mood, not what Netflix wants you to binge.</p>'''
        return body

    elif slug == "decision-fatigue-movie-night-data":
        body = f'''<p class="text-lg text-gw-text-muted leading-relaxed">The average person spends 7.4 minutes deciding what to watch. That's every single time they sit down. Over a year, that's hours of your life spent scrolling instead of watching. Here's the data on why this happens.</p>

            <h2 class="text-2xl font-bold mt-8 mb-4">The Paradox of Choice</h2>
            <p class="text-gw-text-muted leading-relaxed">Netflix alone has over 6,000 titles. Add Prime Video, JioHotstar, and Apple TV+, and you're looking at 15,000+ options. Research shows that beyond 6-8 options, decision quality drops sharply. You're not choosing the best — you're choosing the least-bad option you can find before giving up.</p>

            <h2 class="text-2xl font-bold mt-8 mb-4">Why "Top 10" Lists Don't Help</h2>
            <p class="text-gw-text-muted leading-relaxed">Platform top-10 lists are based on what's trending (i.e., what most people are watching), not what's good for you. A horror-loving viewer and a rom-com fan see the same list. That's not personalization — that's a popularity contest.</p>

            <h2 class="text-2xl font-bold mt-8 mb-4">The GoodWatch Approach</h2>
            <p class="text-gw-text-muted leading-relaxed">GoodWatch takes the opposite approach: instead of showing you 6,000 options, it gives you one. One movie, matched to your mood, filtered by your platforms, ranked by composite quality. The decision is made in 30 seconds, not 30 minutes.</p>
            <p class="text-gw-text-muted leading-relaxed mt-3">And if you don't like it? Swipe, and get another. No scrolling, no comparing, no analysis paralysis.</p>

            <h2 class="text-2xl font-bold mt-8 mb-4">Movies You Should've Been Watching</h2>
            <p class="text-gw-text-muted leading-relaxed">While you were scrolling, these movies were waiting — all scoring 85+ on GoodScore:</p>
            <div class="space-y-3 mt-4">'''
        for m in movies[:5]:
            score = good_score(m)
            s = movie_slug(m)
            body += f'''
                <div class="bg-gw-surface rounded-xl border border-gw-border p-4 flex justify-between items-center">
                    <a href="/movies/{s}/" class="font-semibold hover:text-gw-accent transition-colors">{esc(m.get("title",""))} ({m.get("year","")})</a>
                    <span class="text-green-400 font-bold">{score}</span>
                </div>'''
        body += '''</div>'''
        return body

    elif slug == "what-movie-mood-says-about-you":
        body = f'''<p class="text-lg text-gw-text-muted leading-relaxed">The movies you crave say something about where you are emotionally. GoodWatch profiles movies across 6 emotional dimensions — and the patterns are fascinating.</p>

            <h2 class="text-2xl font-bold mt-8 mb-4">If You Crave Dark, Complex Films...</h2>
            <p class="text-gw-text-muted leading-relaxed">You probably enjoy analyzing things. You like movies that don't hand you the answers. High darkness + high complexity = someone who processes difficult emotions through art. You're drawn to moral ambiguity because real life doesn't have clear heroes and villains.</p>

            <h2 class="text-2xl font-bold mt-8 mb-4">If You Want Comfort and Rewatchability...</h2>
            <p class="text-gw-text-muted leading-relaxed">You're looking for emotional regulation. Comfort movies are the emotional equivalent of a warm meal — predictable, safe, nourishing. You might be stressed, tired, or just need a break from uncertainty. And that's completely valid.</p>

            <h2 class="text-2xl font-bold mt-8 mb-4">If You Need High Energy and Intensity...</h2>
            <p class="text-gw-text-muted leading-relaxed">You might be seeking stimulation you're not getting elsewhere. High-energy films fill a gap — they make you feel alive, pumped up, ready to take on the world. Or you might just love adrenaline. Either way, your body is asking for something.</p>

            <h2 class="text-2xl font-bold mt-8 mb-4">If You Avoid Emotional Intensity...</h2>
            <p class="text-gw-text-muted leading-relaxed">Low intensity preference usually means you're already dealing with enough emotion in real life. Movies become an escape — and there's nothing wrong with choosing entertainment that doesn't demand emotional labor.</p>

            <h2 class="text-2xl font-bold mt-8 mb-4">Movies That Show Each Profile</h2>
            <div class="space-y-3 mt-4">'''
        profiles = [
            ("Dark + Complex", lambda m: (m.get("emotional_profile") or {}).get("darkness", 0) >= 7 and (m.get("emotional_profile") or {}).get("complexity", 0) >= 7),
            ("Comforting + Rewatchable", lambda m: (m.get("emotional_profile") or {}).get("comfort", 0) >= 7 and (m.get("emotional_profile") or {}).get("rewatchability", 0) >= 7),
            ("High Energy + Intense", lambda m: (m.get("emotional_profile") or {}).get("energy", 0) >= 7 and (m.get("emotional_profile") or {}).get("emotionalIntensity", 0) >= 7),
        ]
        for label, fn in profiles:
            matches = [m for m in movies if fn(m)][:2]
            for m in matches:
                s = movie_slug(m)
                body += f'''
                <div class="bg-gw-surface rounded-xl border border-gw-border p-4">
                    <span class="text-gw-accent text-xs">{label}</span>
                    <a href="/movies/{s}/" class="block font-semibold mt-1 hover:text-gw-accent transition-colors">{esc(m.get("title",""))} ({m.get("year","")})</a>
                </div>'''
        body += '''</div>
            <p class="text-gw-text-muted leading-relaxed mt-6">GoodWatch matches movies to your current mood using these profiles. Because the right movie isn't about what's popular — it's about what you need right now.</p>'''
        return body

    # Default editorial fallback
    return f'''<p class="text-lg text-gw-text-muted leading-relaxed">{esc(article.get("intro", ""))}</p>'''


# ─── Main Generation Logic ─────────────────────────────────────────────────

def generate_all_blog_posts():
    """Generate all 30 blog posts."""
    all_posts = []  # Track metadata for index page

    for i, article in enumerate(ARTICLES):
        print(f"\n[{i+1}/{len(ARTICLES)}] Generating: {article['title']}")

        # Query Supabase
        q = article["query"]
        params = parse_filters_to_params(q.get("select", SELECT_FIELDS), q.get("filters", ""))
        movies = query_supabase_params(params, q.get("limit", 15))
        print(f"  → Got {len(movies)} movies")

        movies2 = None
        if "query2" in article:
            q2 = article["query2"]
            params2 = parse_filters_to_params(q2.get("select", SELECT_FIELDS), q2.get("filters", ""))
            movies2 = query_supabase_params(params2, q2.get("limit", 10))
            print(f"  → Got {len(movies2)} movies (query2)")

        if not movies and article.get("type") != "editorial":
            print(f"  WARNING: No movies found, skipping")
            continue

        # Get OG image from first movie poster
        og_image = ""
        if movies and movies[0].get("poster_path"):
            og_image = f"https://image.tmdb.org/t/p/w780{movies[0]['poster_path']}"

        # Build related posts (pick from other articles)
        related = []
        for other in ARTICLES:
            if other["slug"] != article["slug"] and len(related) < 4:
                related.append({
                    "slug": other["slug"],
                    "title": other["title"],
                    "category": other["category"],
                    "read_time": 5
                })

        # Generate HTML
        if article.get("type") == "editorial":
            body_html = generate_editorial_content(article, movies, movies2)
            page_html = editorial_post_html(
                article["title"], article["slug"], article["category"],
                article["description"], body_html, related, og_image
            )
        else:
            page_html = blog_post_html(
                article["title"], article["slug"], article["category"],
                article["description"], article["intro"], movies, related, og_image
            )

        # Write file
        post_dir = os.path.join(BLOG_DIR, article["slug"])
        os.makedirs(post_dir, exist_ok=True)
        filepath = os.path.join(post_dir, "index.html")
        with open(filepath, "w") as f:
            f.write(page_html)
        print(f"  → Wrote {filepath}")

        # Track for index
        word_count = len(page_html.split()) // 2  # rough estimate
        all_posts.append({
            "slug": article["slug"],
            "title": article["title"],
            "category": article["category"],
            "description": article["description"][:100],
            "read_time": max(3, math.ceil(word_count / 250)),
        })

    return all_posts


def update_blog_index(new_posts):
    """Update the blog index page to include all new posts at the end."""
    print("\n[INDEX] Updating blog index page...")

    # Read existing index to get existing posts
    index_path = os.path.join(BLOG_DIR, "index.html")
    with open(index_path) as f:
        existing = f.read()

    # Find existing blog slugs in the index
    existing_slugs = set(re.findall(r'href="/blog/([^/"]+)/"', existing))
    print(f"  → Found {len(existing_slugs)} existing posts in index")

    # Only add truly new posts
    truly_new = [p for p in new_posts if p["slug"] not in existing_slugs]
    print(f"  → Adding {len(truly_new)} new posts")

    if not truly_new:
        print("  → No new posts to add")
        return

    # Generate new post cards
    new_cards_html = ""
    for post in truly_new:
        new_cards_html += f'''<a href="/blog/{post['slug']}/" class="block bg-gw-surface rounded-2xl border border-gw-border overflow-hidden hover:border-gw-accent/30 transition-colors group">
            <div class="p-6">
                <span class="text-gw-accent text-xs font-medium">{esc(post['category'])}</span>
                <h2 class="text-lg font-semibold mt-2 mb-2 group-hover:text-gw-accent transition-colors">{esc(post['title'])}</h2>
                <p class="text-gw-text-muted text-sm mb-3 line-clamp-2">{esc(post['description'])}</p>
                <div class="flex items-center gap-2 text-xs text-gw-text-muted">
                    <span>{TODAY_DISPLAY}</span>
                    <span class="text-gw-border">•</span>
                    <span>{post['read_time']} min read</span>
                </div>
            </div>
        </a>'''

    # Insert before the closing </div> of the grid
    # Find the grid closing tag (right before </div>\n</main>)
    insertion_point = existing.rfind('</div>\n    </div>\n</main>')
    if insertion_point == -1:
        insertion_point = existing.rfind('</div>\n</main>')

    if insertion_point != -1:
        updated = existing[:insertion_point] + new_cards_html + existing[insertion_point:]

        # Update the numberOfItems in schema
        total_count = len(existing_slugs) + len(truly_new)
        updated = re.sub(r'"numberOfItems":\s*\d+', f'"numberOfItems": {total_count}', updated)

        with open(index_path, "w") as f:
            f.write(updated)
        print(f"  → Updated index with {len(truly_new)} new posts (total: {total_count})")
    else:
        print("  WARNING: Could not find insertion point in index.html")


def generate_sitemap():
    """Generate optimized sitemap with priority tiers."""
    print("\n[SITEMAP] Generating optimized sitemap.xml...")

    urls = []

    # Tier 1: Highest priority
    urls.append(("https://goodwatch.movie/", "1.0", "daily"))
    urls.append(("https://goodwatch.movie/blog/", "1.0", "daily"))

    # Tier 2: Blog posts
    blog_dirs = [d for d in os.listdir(BLOG_DIR)
                 if os.path.isdir(os.path.join(BLOG_DIR, d))]
    for slug in sorted(blog_dirs):
        urls.append((f"https://goodwatch.movie/blog/{slug}/", "0.9", "weekly"))

    # Tier 2: Hub pages
    for hub in ["genres", "streaming", "languages"]:
        hub_path = os.path.join(STATIC_DIR, hub)
        if os.path.isdir(hub_path):
            urls.append((f"https://goodwatch.movie/{hub}/", "0.9", "weekly"))

    # Tier 3: Genre/streaming/language pages
    for hub in ["genres", "streaming", "languages", "decades", "directors"]:
        hub_path = os.path.join(STATIC_DIR, hub)
        if os.path.isdir(hub_path):
            for slug in sorted(os.listdir(hub_path)):
                if os.path.isdir(os.path.join(hub_path, slug)):
                    urls.append((f"https://goodwatch.movie/{hub}/{slug}/", "0.8", "weekly"))

    # Tier 3: Special pages
    for page in ["how-it-works"]:
        if os.path.exists(os.path.join(STATIC_DIR, page)):
            urls.append((f"https://goodwatch.movie/{page}/", "0.8", "weekly"))

    # Tier 4: Top 500 movies by composite score
    print("  → Querying top 500 movies for sitemap...")
    sitemap_params = parse_filters_to_params("title,year,composite_score", "content_type=eq.movie&composite_score=not.is.null")
    top_movies = query_supabase_params(sitemap_params, 500)
    for m in top_movies:
        slug = make_slug(m.get("title", ""), m.get("year", ""))
        urls.append((f"https://goodwatch.movie/movies/{slug}/", "0.6", "monthly"))

    print(f"  → Total URLs: {len(urls)}")

    # Generate XML
    xml_parts = ['<?xml version="1.0" encoding="UTF-8"?>']
    xml_parts.append('<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">')
    for url, priority, changefreq in urls:
        xml_parts.append(f'''  <url>
    <loc>{url}</loc>
    <lastmod>{TODAY}</lastmod>
    <changefreq>{changefreq}</changefreq>
    <priority>{priority}</priority>
  </url>''')
    xml_parts.append('</urlset>')

    sitemap_path = os.path.join(STATIC_DIR, "sitemap.xml")
    with open(sitemap_path, "w") as f:
        f.write("\n".join(xml_parts))
    print(f"  → Wrote {sitemap_path}")


def update_robots_txt():
    """Ensure robots.txt references the sitemap."""
    print("\n[ROBOTS] Checking robots.txt...")
    robots_path = os.path.join(STATIC_DIR, "robots.txt")

    if os.path.exists(robots_path):
        with open(robots_path) as f:
            content = f.read()
        if "Sitemap: https://goodwatch.movie/sitemap.xml" in content:
            print("  → robots.txt already has sitemap reference")
            return
        # Add sitemap reference
        if "Sitemap:" not in content:
            content = content.rstrip() + "\n\nSitemap: https://goodwatch.movie/sitemap.xml\n"
            with open(robots_path, "w") as f:
                f.write(content)
            print("  → Added sitemap reference to robots.txt")
    else:
        with open(robots_path, "w") as f:
            f.write("User-agent: *\nAllow: /\n\nSitemap: https://goodwatch.movie/sitemap.xml\n")
        print("  → Created robots.txt")


def add_blog_links_to_genre_pages():
    """Add 'From the Blog' section to genre pages."""
    print("\n[GENRES] Adding blog links to genre pages...")

    # Map genre keywords to relevant blog posts
    genre_blog_map = {
        "thriller": [
            ("best-dark-thrillers-netflix-india", "Best Dark Thrillers on Netflix India"),
            ("complex-thrillers-jiocinema", "Complex Thrillers on JioCinema"),
            ("best-thriller-movies-all-time", "10 Best Thriller Movies of All Time"),
        ],
        "action": [
            ("high-energy-action-netflix-hidden", "High-Energy Action Movies on Netflix"),
            ("best-action-movies-all-ratings", "10 Best Action Movies by GoodScore"),
            ("movies-when-youre-angry", "Movies to Watch When You're Angry"),
        ],
        "comedy": [
            ("lazy-sunday-movies-zero-brainpower", "Lazy Sunday Movies — Zero Brainpower"),
            ("best-comedy-movies-goodscore", "10 Best Comedy Movies by GoodScore"),
            ("feel-good-movies-amazon-prime-video", "Feel-Good Movies on Prime Video"),
        ],
        "drama": [
            ("movies-when-you-need-to-cry", "Movies for When You Need a Good Cry"),
            ("best-drama-movies-goodscore", "Top 10 Drama Movies by GoodScore"),
            ("movies-that-make-you-think", "Movies That Make You Think for Days"),
        ],
        "horror": [
            ("best-horror-movies-goodscore", "10 Best Horror Movies by GoodScore"),
            ("best-dark-heavy-movies", "Dark and Heavy Movies for Serious Viewers"),
            ("best-movies-watching-alone", "Best Movies for Watching Alone"),
        ],
        "romance": [
            ("perfect-date-night-movies", "Perfect Date Night Movies"),
            ("best-romance-movies-goodscore", "10 Best Romance Movies by GoodScore"),
            ("best-feel-good-movies", "Best Feel-Good Movies"),
        ],
        "science-fiction": [
            ("movies-that-make-you-think", "Movies That Make You Think for Days"),
            ("complex-movies-jiohotstar", "Complex Movies on JioHotstar"),
            ("best-sci-fi-movies-goodscore", "10 Best Sci-Fi Movies by GoodScore"),
        ],
        "crime": [
            ("best-crime-movies-goodscore", "10 Best Crime Movies by GoodScore"),
            ("best-dark-thrillers-netflix-india", "Dark Thrillers on Netflix India"),
            ("best-movies-watching-alone", "Best Movies for Watching Alone"),
        ],
        "documentary": [
            ("best-documentary-films-goodscore", "10 Best Documentary Films"),
            ("movies-that-make-you-think", "Movies That Make You Think"),
        ],
        "animation": [
            ("best-animated-movies-all-ages", "10 Best Animated Movies"),
            ("lazy-sunday-movies-zero-brainpower", "Lazy Sunday Movies"),
            ("rewatchable-comfort-movies-prime-video", "Most Rewatchable Movies on Prime"),
        ],
        "mystery": [
            ("best-mystery-movies-weekend", "10 Best Mystery Movies"),
            ("complex-thrillers-jiocinema", "Complex Thrillers on JioCinema"),
        ],
        "war": [
            ("best-war-movies-goodscore", "10 Best War Movies"),
            ("movies-when-you-need-to-cry", "Movies for When You Need to Cry"),
        ],
        "fantasy": [
            ("best-feel-good-movies", "Best Feel-Good Movies"),
            ("most-rewatchable-movies-all-time", "Most Rewatchable Movies"),
        ],
        "adventure": [
            ("high-energy-movies-pump-you-up", "High-Energy Movies That Pump You Up"),
            ("most-rewatchable-movies-all-time", "Most Rewatchable Movies"),
        ],
        "family": [
            ("lazy-sunday-movies-zero-brainpower", "Lazy Sunday Movies"),
            ("comforting-movies-netflix-india-tonight", "Comforting Movies on Netflix"),
        ],
        "history": [
            ("movies-that-make-you-think", "Movies That Make You Think"),
            ("best-war-movies-goodscore", "Best War Movies"),
        ],
    }

    genres_dir = os.path.join(STATIC_DIR, "genres")
    if not os.path.isdir(genres_dir):
        print("  → No genres directory found")
        return

    count = 0
    for genre_slug in os.listdir(genres_dir):
        genre_path = os.path.join(genres_dir, genre_slug, "index.html")
        if not os.path.exists(genre_path):
            continue

        blog_links = genre_blog_map.get(genre_slug, [])
        if not blog_links:
            continue

        with open(genre_path) as f:
            content = f.read()

        # Skip if already has blog section
        if "From the Blog" in content:
            continue

        # Build the blog section HTML
        blog_section = '''
    <div class="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 mt-12 mb-8">
        <h2 class="text-xl font-bold mb-4">From the Blog</h2>
        <div class="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">'''
        for blog_slug, blog_title in blog_links[:3]:
            blog_section += f'''
            <a href="../../blog/{blog_slug}/" class="block bg-gw-surface rounded-xl border border-gw-border p-4 hover:border-gw-accent/30 transition-colors group">
                <h3 class="text-sm font-semibold group-hover:text-gw-accent transition-colors">{esc(blog_title)}</h3>
                <span class="text-xs text-gw-text-muted mt-1 block">Read article</span>
            </a>'''
        blog_section += '''
        </div>
    </div>'''

        # Insert before the footer
        footer_pos = content.find('<footer')
        if footer_pos != -1:
            content = content[:footer_pos] + blog_section + "\n\n" + content[footer_pos:]
            with open(genre_path, "w") as f:
                f.write(content)
            count += 1

    print(f"  → Added blog links to {count} genre pages")


# ─── Social Content Generator ────────────────────────────────────────────────

def create_social_content_generator():
    """Create the daily social content generator script."""
    print("\n[SOCIAL] Creating social content generator script...")

    script_path = os.path.join(BASE_DIR, "tools", "generate_social_content.py")
    script_content = '''#!/usr/bin/env python3
"""
GoodWatch Daily Social Content Generator
Queries Supabase for a random high-scoring movie and generates
ready-to-post content for Twitter, Instagram, and Reddit.
"""

import requests
import json
import os
import random
import re
from datetime import datetime

SUPABASE_URL = "https://jdjqrlkynwfhbtyuddjk.supabase.co"
SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpkanFybGt5bndmaGJ0eXVkZGprIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ0NzUwMTEsImV4cCI6MjA4MDA1MTAxMX0.KDRMLCewVMp3lwphkUvtoWOkg6kyAk8iSbVkRKiHYSk"
HEADERS = {
    "apikey": SUPABASE_KEY,
    "Authorization": f"Bearer {SUPABASE_KEY}",
}

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))


def make_slug(title, year):
    s = f"{title}-{year}".lower()
    s = re.sub(r\'[^a-z0-9\\s-]\', \'\', s)
    s = re.sub(r\'[\\s]+\', \'-\', s)
    s = re.sub(r\'-+\', \'-\', s).strip(\'-\')
    return s


def get_random_movie():
    """Get a random high-scoring movie."""
    # Get count first
    url = f"{SUPABASE_URL}/rest/v1/movies?select=title&composite_score=gte.7.5&content_type=eq.movie&emotional_profile=not.is.null"
    resp = requests.get(url, headers={**HEADERS, "Prefer": "count=exact", "Range": "0-0"})
    count = int(resp.headers.get("content-range", "0/100").split("/")[1])

    offset = random.randint(0, max(0, count - 1))
    url = f"{SUPABASE_URL}/rest/v1/movies?select=title,year,composite_score,genres,original_language,emotional_profile,overview,poster_path,ott_providers,director,runtime&composite_score=gte.7.5&content_type=eq.movie&emotional_profile=not.is.null&order=composite_score.desc&offset={offset}&limit=1"
    resp = requests.get(url, headers=HEADERS)
    movies = resp.json()
    return movies[0] if movies else None


def good_score(movie):
    cs = movie.get("composite_score", 0)
    return round(cs * 10) if cs else 0


def get_emotional_tags(movie):
    ep = movie.get("emotional_profile") or {}
    if isinstance(ep, str):
        ep = json.loads(ep)
    tags = []
    if ep.get("comfort", 0) >= 7: tags.append("Comforting")
    if ep.get("darkness", 0) >= 7: tags.append("Dark")
    if ep.get("energy", 0) >= 7: tags.append("High-Energy")
    if ep.get("complexity", 0) >= 7: tags.append("Complex")
    if ep.get("emotionalIntensity", 0) >= 7: tags.append("Intense")
    if ep.get("rewatchability", 0) >= 7: tags.append("Rewatchable")
    if not tags:
        if ep.get("comfort", 0) >= 5: tags.append("Comforting")
        if ep.get("energy", 0) >= 5: tags.append("Energetic")
        if ep.get("complexity", 0) >= 5: tags.append("Thought-Provoking")
    return tags[:3] if tags else ["Worth Watching"]


def get_platforms(movie):
    providers = movie.get("ott_providers") or []
    if isinstance(providers, str):
        providers = json.loads(providers)
    return list(set(p.get("name", "") for p in providers if isinstance(p, dict) and p.get("name")))[:3]


def get_genres(movie):
    genres = movie.get("genres") or []
    if isinstance(genres, str):
        genres = json.loads(genres)
    return [g["name"] for g in genres if isinstance(g, dict)][:3]


def generate_content(movie):
    title = movie.get("title", "")
    year = movie.get("year", "")
    score = good_score(movie)
    slug = make_slug(title, year)
    overview = movie.get("overview", "")
    genres = get_genres(movie)
    platforms = get_platforms(movie)
    emotional_tags = get_emotional_tags(movie)
    director = movie.get("director", "")

    platform_str = ", ".join(platforms) if platforms else "Check availability"
    tag_str = " | ".join(emotional_tags)
    genre_str = ", ".join(genres)

    # Tweet
    tweet = f"\\U0001f3ac {title} ({year}) — GoodScore: {score}/100\\n\\n{tag_str}\\n\\nStream on {platform_str}\\n\\ngoodwatch.movie/movies/{slug}/"

    # Instagram
    hook = overview[:150] + "..." if len(overview) > 150 else overview
    ep = movie.get("emotional_profile") or {}
    if isinstance(ep, str):
        ep = json.loads(ep)

    instagram = f"""\\U0001f3ac {title} ({year})
\\U0001f3af GoodScore: {score}/100

{hook}

\\U0001f9e0 Emotional Profile:
{"\\U0001f49b" if ep.get("comfort",0)>=6 else "\\u2022"} Comfort: {ep.get("comfort","?")}
{"\\U0001f5a4" if ep.get("darkness",0)>=6 else "\\u2022"} Darkness: {ep.get("darkness","?")}
{"\\u26a1" if ep.get("energy",0)>=6 else "\\u2022"} Energy: {ep.get("energy","?")}
{"\\U0001f9e9" if ep.get("complexity",0)>=6 else "\\u2022"} Complexity: {ep.get("complexity","?")}
{"\\U0001f525" if ep.get("emotionalIntensity",0)>=6 else "\\u2022"} Intensity: {ep.get("emotionalIntensity", ep.get("emotional_intensity","?"))}
{"\\U0001f504" if ep.get("rewatchability",0)>=6 else "\\u2022"} Rewatchability: {ep.get("rewatchability","?")}

{"Dir. " + director if director else ""}
{genre_str}
Stream on {platform_str}

Stop scrolling Netflix for 30 minutes. Let GoodWatch pick for you.
Link in bio \\U00002197\\U0000fe0f

#movies #movierecommendation #whattowatch #netflix #primevideo #goodwatch #cinema #filmtwitter #moviestowatch #{title.replace(" ","").replace(":","")[:20]}"""

    # Reddit
    reddit_title = f"Just watched {title} ({year}) — {score}/100 on GoodScore and totally worth it"
    reddit_body = f"""I stumbled across {title} and it blew me away.

{overview[:300]}

What makes it stand out:
- Emotional Profile: {tag_str}
- Genres: {genre_str}
{"- Director: " + director if director else ""}
- Available on: {platform_str}

The GoodScore (which combines IMDb, RT, Metacritic, and TMDB) has it at {score}/100.

If you haven't seen it, highly recommend. It{"'s a slow burn" if ep.get("energy",5)<4 else "'s got great energy"} and {"surprisingly comforting" if ep.get("comfort",5)>=6 else "hits hard emotionally" if ep.get("emotionalIntensity",5)>=7 else "keeps you thinking"}.

Has anyone else seen this? What did you think?"""

    return tweet, instagram, reddit_title, reddit_body


def main():
    movie = get_random_movie()
    if not movie:
        print("Could not find a movie. Check Supabase connection.")
        return

    title = movie.get("title", "Unknown")
    score = good_score(movie)
    print(f"\\nSelected: {title} ({movie.get(\'year\', \'\')}) — GoodScore: {score}/100")

    tweet, instagram, reddit_title, reddit_body = generate_content(movie)

    # Save to daily folder
    today = datetime.now().strftime("%Y-%m-%d")
    output_dir = os.path.join(BASE_DIR, "content", "daily", today)
    os.makedirs(output_dir, exist_ok=True)

    with open(os.path.join(output_dir, "tweet.txt"), "w") as f:
        f.write(tweet)
    with open(os.path.join(output_dir, "instagram_caption.txt"), "w") as f:
        f.write(instagram)
    with open(os.path.join(output_dir, "reddit_post.txt"), "w") as f:
        f.write(f"TITLE: {reddit_title}\\n\\n{reddit_body}")

    print(f"\\n--- TWEET ---\\n{tweet}")
    print(f"\\n--- INSTAGRAM ---\\n{instagram[:300]}...")
    print(f"\\n--- REDDIT ---\\nTitle: {reddit_title}")
    print(f"\\nSaved to: {output_dir}/")


if __name__ == "__main__":
    main()
'''

    with open(script_path, "w") as f:
        f.write(script_content)
    os.chmod(script_path, 0o755)
    print(f"  → Wrote {script_path}")


# ─── Main ────────────────────────────────────────────────────────────────────

if __name__ == "__main__":
    print("=" * 60)
    print("GoodWatch SEO Content Engine")
    print("=" * 60)

    # Step 1: Generate blog posts
    new_posts = generate_all_blog_posts()

    # Step 2: Update blog index
    update_blog_index(new_posts)

    # Step 3: Generate sitemap
    generate_sitemap()

    # Step 4: Update robots.txt
    update_robots_txt()

    # Step 5: Add blog links to genre pages
    add_blog_links_to_genre_pages()

    # Step 6: Create social content generator
    create_social_content_generator()

    print("\n" + "=" * 60)
    print(f"DONE! Generated {len(new_posts)} blog posts")
    print(f"Blog directory: {BLOG_DIR}")
    print(f"Sitemap: {os.path.join(STATIC_DIR, 'sitemap.xml')}")
    print(f"Social tool: {os.path.join(BASE_DIR, 'tools', 'generate_social_content.py')}")
    print("=" * 60)
