# GoodWatch Web

SEO-optimized movie discovery website built with Astro + Tailwind + Supabase.

## Features

- **Mood-based discovery** - `/mood/[mood]` pages (15 moods)
- **Genre browsing** - `/genre/[genre]` pages (18 genres)
- **Movie details** - `/movie/[tmdb_id]` with rich Schema.org markup
- **Search** - Full-text search with Supabase
- **SEO optimized** - Sitemap, meta tags, structured data
- **Cloudflare Pages** ready

## Tech Stack

- **Astro** - Static + SSR hybrid
- **Tailwind CSS** - Styling
- **Supabase** - Movie database
- **Cloudflare Pages** - Hosting

## Local Development

```bash
npm install
npm run dev
```

## Deploy to Cloudflare Pages

### Option 1: Connect GitHub (Recommended)

1. Push this repo to GitHub
2. Go to Cloudflare Dashboard → Pages → Create project
3. Connect your GitHub repo
4. Build settings:
   - Framework preset: Astro
   - Build command: `npm run build`
   - Build output: `dist`
5. Deploy!

### Option 2: Direct Upload

```bash
npm run build
npx wrangler pages deploy dist
```

## Environment Variables

The Supabase credentials are already in the code for now. For production:

```
PUBLIC_SUPABASE_URL=https://tlzpswurafpphujrihvq.supabase.co
PUBLIC_SUPABASE_ANON_KEY=eyJhbGci...
```

## SEO Pages Generated

- `/` - Homepage with mood selector
- `/moods` - All moods index
- `/mood/[mood]` - 15 mood-specific pages
- `/genres` - All genres index  
- `/genre/[genre]` - 18 genre-specific pages
- `/movie/[id]` - Individual movie pages (thousands)
- `/search` - Search results
- `/lists` - Curated collections
- `/app` - App download CTA
- `/sitemap.xml` - Dynamic sitemap

## Schema.org Markup

Each movie page includes:
- Movie schema (title, description, rating, cast, director)
- BreadcrumbList schema
- Organization schema (site-wide)
- SearchAction schema (site-wide)

## File Structure

```
src/
├── layouts/
│   └── Layout.astro       # Base layout with SEO
├── lib/
│   └── supabase.ts        # Supabase client + queries
├── pages/
│   ├── index.astro        # Homepage
│   ├── moods.astro        # Moods index
│   ├── genres.astro       # Genres index
│   ├── search.astro       # Search page
│   ├── lists.astro        # Curated lists
│   ├── app.astro          # App download
│   ├── 404.astro          # 404 page
│   ├── sitemap.xml.ts     # Dynamic sitemap
│   ├── mood/
│   │   └── [mood].astro   # Mood pages
│   ├── genre/
│   │   └── [genre].astro  # Genre pages
│   └── movie/
│       └── [id].astro     # Movie detail pages
public/
├── robots.txt
└── (add favicon.png, og-default.jpg)
```
