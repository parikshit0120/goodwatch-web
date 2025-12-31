# GoodWatch Web

**Stop scrolling. Start watching.**

GoodWatch is a movie recommendation platform that helps you find your next favorite movie in seconds. Rate 5 movies, get personalized recommendations - no account required.

## Features

- **30-Second Taste Quiz** - Rate 5 movies to build your taste profile
- **Personalized Recommendations** - Get movie suggestions based on your preferences
- **Streaming Availability** - See where movies are available to watch
- **Browse by Genre** - Explore movies by genre, trending, or top-rated
- **Search** - Find any movie instantly
- **No Account Required** - Start immediately, all data stays in-memory
- **Free & Ad-Free** - Clean, fast experience

## Tech Stack

- **Framework**: [Astro](https://astro.build) 5.x
- **UI Components**: [Preact](https://preactjs.com) for interactive islands
- **Styling**: [Tailwind CSS](https://tailwindcss.com) v4
- **State Management**: [Nanostores](https://github.com/nanostores/nanostores)
- **Data Sources**: [TMDB API](https://www.themoviedb.org/documentation/api), [Supabase](https://supabase.com)

## Getting Started

### Prerequisites

- Node.js 18+
- npm or pnpm

### Installation

1. Clone the repository:
```bash
git clone https://github.com/goodwatch/goodwatch-web.git
cd goodwatch-web
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env
```

Edit `.env` with your API keys:
- `PUBLIC_TMDB_API_KEY` - Get from [TMDB](https://www.themoviedb.org/settings/api)
- `PUBLIC_SUPABASE_URL` - Your Supabase project URL
- `PUBLIC_SUPABASE_ANON_KEY` - Your Supabase anonymous key

4. Start the development server:
```bash
npm run dev
```

Visit `http://localhost:4321` to see the app.

## Project Structure

```
src/
├── components/          # Reusable UI components
│   ├── Header.astro
│   ├── Footer.astro
│   ├── MovieCard.astro
│   ├── MovieRow.astro
│   ├── TasteQuiz.tsx    # Interactive quiz (Preact)
│   ├── Recommendations.tsx
│   └── SearchBar.tsx
├── layouts/
│   └── Layout.astro     # Base page layout
├── lib/
│   ├── tmdb.ts          # TMDB API client
│   ├── supabase.ts      # Supabase client
│   └── recommendations.ts
├── pages/
│   ├── index.astro      # Homepage
│   ├── taste.astro      # Taste quiz
│   ├── recommendations.astro
│   ├── pick.astro       # Single recommendation
│   ├── search.astro
│   ├── browse/
│   │   ├── index.astro
│   │   └── genre/[id].astro
│   └── movie/[id].astro # Movie details
├── stores/
│   ├── taste.ts         # Taste profile state
│   └── preferences.ts   # User preferences
├── styles/
│   └── global.css
└── types/
    └── movie.ts         # TypeScript types
```

## Available Commands

| Command | Action |
|---------|--------|
| `npm run dev` | Start development server at `localhost:4321` |
| `npm run build` | Build for production to `./dist/` |
| `npm run preview` | Preview production build locally |

## API Integration

### TMDB
- Movie metadata, images, credits
- Trending, popular, top-rated lists
- Search functionality
- Watch provider availability (powered by JustWatch data)

### Supabase
- User data storage (optional)
- Custom curated lists (future)

## Design Principles

1. **User-First** - No signup required, start immediately
2. **Quality over Quantity** - One recommendation at a time
3. **Transparent** - No black-box algorithms
4. **Fast** - Optimized for performance
5. **Accessible** - Keyboard navigation, proper contrast

## Contributing

Contributions are welcome! Please read our contributing guidelines before submitting a PR.

## License

MIT License - see LICENSE file for details.

## Data Attribution

This product uses the TMDB API but is not endorsed or certified by TMDB.

---

Built with love for movie lovers everywhere.
