globalThis.process ??= {}; globalThis.process.env ??= {};
import { c as createClient } from './wrapper_CRWxChbs.mjs';

const supabaseUrl = "https://jdjqrlkynwfhbtyuddjk.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpkanFybGt5bndmaGJ0eXVkZGprIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ0NzUwMTEsImV4cCI6MjA4MDA1MTAxMX0.KDRMLCewVMp3lwphkUvtoWOkg6kyAk8iSbVkRKiHYSk";
const supabase = createClient(supabaseUrl, supabaseKey);
function getPosterUrl(path, size = "w500") {
  if (!path) return "/placeholder-poster.jpg";
  return `https://image.tmdb.org/t/p/${size}${path}`;
}
function getBackdropUrl(path, size = "w1280") {
  if (!path) return "/placeholder-backdrop.jpg";
  return `https://image.tmdb.org/t/p/${size}${path}`;
}
function formatRuntime(minutes) {
  if (!minutes) return "";
  const hrs = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return hrs > 0 ? `${hrs}h ${mins}m` : `${mins}m`;
}
function slugify(text) {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}
async function getMovieByTmdbId(tmdbId) {
  const { data, error } = await supabase.from("movies").select("*").eq("tmdb_id", tmdbId).single();
  if (error) {
    console.error("Error fetching movie:", error);
    return null;
  }
  return data;
}
async function getTrendingMovies(limit = 20) {
  const { data, error } = await supabase.from("movies").select("*").not("poster_path", "is", null).gte("vote_count", 100).order("popularity", { ascending: false }).limit(limit);
  if (error) {
    console.error("Error fetching trending:", error);
    return [];
  }
  return data || [];
}
const MOOD_TO_GENRE_IDS = {
  "Feel-Good": [35, 10751, 16],
  // Comedy, Family, Animation
  "Thrilling": [53, 28, 80],
  // Thriller, Action, Crime
  "Romantic": [10749, 18],
  // Romance, Drama
  "Mind-Bending": [878, 9648, 53],
  // Science Fiction, Mystery, Thriller
  "Nostalgic": [18, 10751, 35],
  // Drama, Family, Comedy
  "Dark": [27, 53, 80],
  // Horror, Thriller, Crime
  "Inspirational": [18, 99],
  // Drama, Documentary
  "Relaxing": [35, 10751, 16],
  // Comedy, Family, Animation
  "Adventurous": [12, 28, 14],
  // Adventure, Action, Fantasy
  "Emotional": [18, 10749],
  // Drama, Romance
  "Funny": [35],
  // Comedy
  "Intense": [53, 28, 27],
  // Thriller, Action, Horror
  "Mysterious": [9648, 53, 80],
  // Mystery, Thriller, Crime
  "Uplifting": [35, 18, 10751],
  // Comedy, Drama, Family
  "Thought-Provoking": [18, 878, 99]
  // Drama, Science Fiction, Documentary
};
async function getMoviesByMood(mood, limit = 30) {
  let { data, error } = await supabase.from("movies").select("*").not("poster_path", "is", null).contains("mood_tags", [mood]).order("popularity", { ascending: false }).limit(limit);
  if (!data?.length) {
    const normalizedMood = mood.split("-").map(
      (word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
    ).join("-");
    const genreIds = MOOD_TO_GENRE_IDS[normalizedMood] || MOOD_TO_GENRE_IDS[mood] || [18];
    const result = await supabase.from("movies").select("*").not("poster_path", "is", null).filter("genres", "cs", `[{"id":${genreIds[0]}}]`).gte("vote_count", 100).gte("vote_average", 6.5).order("vote_average", { ascending: false }).limit(limit);
    data = result.data;
    error = result.error;
  }
  if (error) {
    console.error("Error fetching by mood:", error);
    return [];
  }
  return data || [];
}
const GENRE_NAME_TO_ID = {
  "Action": 28,
  "Adventure": 12,
  "Animation": 16,
  "Comedy": 35,
  "Crime": 80,
  "Documentary": 99,
  "Drama": 18,
  "Family": 10751,
  "Fantasy": 14,
  "History": 36,
  "Horror": 27,
  "Music": 10402,
  "Mystery": 9648,
  "Romance": 10749,
  "Science Fiction": 878,
  "TV Movie": 10770,
  "Thriller": 53,
  "War": 10752,
  "Western": 37
};
async function getMoviesByGenre(genre, limit = 30) {
  const genreId = GENRE_NAME_TO_ID[genre];
  if (!genreId) {
    console.error("Unknown genre:", genre);
    return [];
  }
  const { data, error } = await supabase.from("movies").select("*").not("poster_path", "is", null).filter("genres", "cs", `[{"id":${genreId}}]`).order("popularity", { ascending: false }).limit(limit);
  if (error) {
    console.error("Error fetching by genre:", error);
    return [];
  }
  return data || [];
}
async function searchMovies(query, limit = 20) {
  const { data, error } = await supabase.from("movies").select("*").not("poster_path", "is", null).ilike("title", `%${query}%`).order("popularity", { ascending: false }).limit(limit);
  if (error) {
    console.error("Error searching:", error);
    return [];
  }
  return data || [];
}
async function getAllMoviesForSitemap() {
  const { data, error } = await supabase.from("movies").select("tmdb_id, title, last_updated").not("poster_path", "is", null).order("popularity", { ascending: false }).limit(5e3);
  if (error) {
    console.error("Error fetching for sitemap:", error);
    return [];
  }
  return data || [];
}
async function getMoviesByDecade(decade, limit = 30) {
  const { data, error } = await supabase.from("movies").select("*").not("poster_path", "is", null).eq("decade", decade).gte("vote_count", 50).order("vote_average", { ascending: false }).limit(limit);
  if (error) {
    console.error("Error fetching by decade:", error);
    return [];
  }
  return data || [];
}
async function getMoviesByMoodAndGenre(mood, genre, limit = 30) {
  const genreId = GENRE_NAME_TO_ID[genre];
  if (!genreId) {
    console.error("Unknown genre:", genre);
    return [];
  }
  const { data, error } = await supabase.from("movies").select("*").not("poster_path", "is", null).filter("genres", "cs", `[{"id":${genreId}}]`).gte("vote_count", 50).order("popularity", { ascending: false }).limit(limit);
  if (error) {
    console.error("Error fetching by mood+genre:", error);
    return [];
  }
  return data || [];
}
async function getTopRatedMovies(limit = 30) {
  const { data, error } = await supabase.from("movies").select("*").not("poster_path", "is", null).gte("vote_count", 500).gte("vote_average", 7.5).order("vote_average", { ascending: false }).limit(limit);
  if (error) {
    console.error("Error fetching top rated:", error);
    return [];
  }
  return data || [];
}
async function getHiddenGems(limit = 30) {
  const { data, error } = await supabase.from("movies").select("*").not("poster_path", "is", null).gte("vote_average", 7).gte("vote_count", 100).lte("vote_count", 1e3).order("vote_average", { ascending: false }).limit(limit);
  if (error) {
    console.error("Error fetching hidden gems:", error);
    return [];
  }
  return data || [];
}
const MOODS = [
  "Feel-Good",
  "Thrilling",
  "Romantic",
  "Mind-Bending",
  "Nostalgic",
  "Dark",
  "Inspirational",
  "Relaxing",
  "Adventurous",
  "Emotional",
  "Funny",
  "Intense",
  "Mysterious",
  "Uplifting",
  "Thought-Provoking"
];
const GENRES = [
  "Action",
  "Adventure",
  "Animation",
  "Comedy",
  "Crime",
  "Documentary",
  "Drama",
  "Family",
  "Fantasy",
  "History",
  "Horror",
  "Music",
  "Mystery",
  "Romance",
  "Science Fiction",
  "Thriller",
  "War",
  "Western"
];
const DECADES = ["1970s", "1980s", "1990s", "2000s", "2010s", "2020s"];
const OCCASIONS = [
  { slug: "date-night", name: "Date Night", mood: "Romantic", description: "Perfect movies for a romantic evening with your partner" },
  { slug: "rainy-day", name: "Rainy Day", mood: "Relaxing", description: "Cozy movies to watch when it's raining outside" },
  { slug: "breakup", name: "After a Breakup", mood: "Emotional", description: "Movies to help you process emotions after a breakup" },
  { slug: "feeling-down", name: "When Feeling Down", mood: "Feel-Good", description: "Uplifting movies to boost your mood" },
  { slug: "cant-sleep", name: "When You Can't Sleep", mood: "Relaxing", description: "Calming movies for late night viewing" },
  { slug: "family-night", name: "Family Movie Night", mood: "Feel-Good", description: "Movies the whole family can enjoy together" },
  { slug: "alone-time", name: "Solo Movie Night", mood: "Thought-Provoking", description: "Great movies to watch when you have the house to yourself" },
  { slug: "need-motivation", name: "When You Need Motivation", mood: "Inspirational", description: "Movies that will inspire you to take action" },
  { slug: "friends-over", name: "Movie Night with Friends", mood: "Funny", description: "Crowd-pleasers perfect for watching with friends" },
  { slug: "lazy-sunday", name: "Lazy Sunday", mood: "Relaxing", description: "Easy-watching movies for a relaxed weekend" },
  { slug: "need-a-cry", name: "When You Need a Good Cry", mood: "Emotional", description: "Movies that will make you feel all the emotions" },
  { slug: "celebrating", name: "When Celebrating", mood: "Uplifting", description: "Feel-good movies for celebratory moments" }
];
function generateItemListSchema(title, movies, siteUrl) {
  return {
    "@context": "https://schema.org",
    "@type": "ItemList",
    "name": title,
    "numberOfItems": movies.length,
    "itemListElement": movies.slice(0, 10).map((movie, index) => ({
      "@type": "ListItem",
      "position": index + 1,
      "item": {
        "@type": "Movie",
        "name": movie.title,
        "image": getPosterUrl(movie.poster_path, "w300"),
        "url": `${siteUrl}/movie/${movie.tmdb_id}`,
        "aggregateRating": movie.vote_average ? {
          "@type": "AggregateRating",
          "ratingValue": movie.vote_average,
          "bestRating": 10,
          "ratingCount": movie.vote_count
        } : void 0
      }
    }))
  };
}
function generateBreadcrumbSchema(items, siteUrl) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": items.map((item, index) => ({
      "@type": "ListItem",
      "position": index + 1,
      "name": item.name,
      "item": item.url.startsWith("http") ? item.url : `${siteUrl}${item.url}`
    }))
  };
}
function getRelatedMoods(currentMood) {
  const moodRelations = {
    "Feel-Good": ["Uplifting", "Funny", "Inspirational"],
    "Thrilling": ["Intense", "Mysterious", "Adventurous"],
    "Romantic": ["Emotional", "Feel-Good", "Nostalgic"],
    "Mind-Bending": ["Thought-Provoking", "Mysterious", "Dark"],
    "Nostalgic": ["Emotional", "Feel-Good", "Romantic"],
    "Dark": ["Intense", "Mysterious", "Thought-Provoking"],
    "Inspirational": ["Uplifting", "Feel-Good", "Emotional"],
    "Relaxing": ["Feel-Good", "Nostalgic", "Funny"],
    "Adventurous": ["Thrilling", "Intense", "Uplifting"],
    "Emotional": ["Romantic", "Nostalgic", "Inspirational"],
    "Funny": ["Feel-Good", "Relaxing", "Uplifting"],
    "Intense": ["Thrilling", "Dark", "Adventurous"],
    "Mysterious": ["Thrilling", "Dark", "Mind-Bending"],
    "Uplifting": ["Feel-Good", "Inspirational", "Funny"],
    "Thought-Provoking": ["Mind-Bending", "Dark", "Emotional"]
  };
  return moodRelations[currentMood] || [];
}
function getRelatedGenres(currentGenre) {
  const genreRelations = {
    "Action": ["Adventure", "Thriller", "Science Fiction"],
    "Adventure": ["Action", "Fantasy", "Family"],
    "Animation": ["Family", "Comedy", "Fantasy"],
    "Comedy": ["Romance", "Family", "Animation"],
    "Crime": ["Thriller", "Drama", "Mystery"],
    "Documentary": ["History", "Drama"],
    "Drama": ["Romance", "Crime", "History"],
    "Family": ["Animation", "Comedy", "Adventure"],
    "Fantasy": ["Adventure", "Science Fiction", "Animation"],
    "History": ["Drama", "War", "Documentary"],
    "Horror": ["Thriller", "Mystery", "Science Fiction"],
    "Music": ["Drama", "Romance", "Documentary"],
    "Mystery": ["Thriller", "Crime", "Horror"],
    "Romance": ["Comedy", "Drama", "Music"],
    "Science Fiction": ["Action", "Fantasy", "Thriller"],
    "Thriller": ["Crime", "Mystery", "Action"],
    "War": ["History", "Drama", "Action"],
    "Western": ["Action", "Adventure", "Drama"]
  };
  return genreRelations[currentGenre] || [];
}

export { DECADES as D, GENRES as G, MOODS as M, OCCASIONS as O, generateItemListSchema as a, generateBreadcrumbSchema as b, getRelatedMoods as c, getRelatedGenres as d, slugify as e, getPosterUrl as f, getMoviesByMoodAndGenre as g, getTopRatedMovies as h, getHiddenGems as i, getMoviesByDecade as j, getMoviesByGenre as k, getMovieByTmdbId as l, getBackdropUrl as m, formatRuntime as n, getMoviesByMood as o, searchMovies as p, getTrendingMovies as q, getAllMoviesForSitemap as r, supabase as s };
