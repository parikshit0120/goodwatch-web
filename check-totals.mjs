const TMDB_KEY = '204363c10c39f75a0320ad4258565f71';

const PROVIDERS = [
  { id: 8, name: 'Netflix' },
  { id: 119, name: 'Amazon Prime Video' },
  { id: 122, name: 'JioHotstar' },
  { id: 237, name: 'SonyLIV' },
  { id: 232, name: 'Zee5' },
  { id: 220, name: 'JioCinema' },
  { id: 350, name: 'Apple TV+' },
];

async function checkProvider(provider) {
  // With current filters (vote_count >= 50, rating >= 5.0)
  const filtered = await fetch(
    `https://api.themoviedb.org/3/discover/movie?api_key=${TMDB_KEY}&watch_region=IN&with_watch_providers=${provider.id}&with_watch_monetization_types=flatrate&vote_count.gte=50&vote_average.gte=5.0&page=1`
  ).then(r => r.json());

  // Without filters (raw total)
  const unfiltered = await fetch(
    `https://api.themoviedb.org/3/discover/movie?api_key=${TMDB_KEY}&watch_region=IN&with_watch_providers=${provider.id}&with_watch_monetization_types=flatrate&page=1`
  ).then(r => r.json());

  console.log(`${provider.name}:`);
  console.log(`  With filters: ${filtered.total_results}`);
  console.log(`  Without filters: ${unfiltered.total_results}`);
  console.log();
}

async function run() {
  console.log('Comparing filtered vs unfiltered totals:\n');
  for (const p of PROVIDERS) {
    await checkProvider(p);
  }
}

run();
