#!/usr/bin/env python3
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
    s = re.sub(r'[^a-z0-9\s-]', '', s)
    s = re.sub(r'[\s]+', '-', s)
    s = re.sub(r'-+', '-', s).strip('-')
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
    tweet = f"\U0001f3ac {title} ({year}) — GoodScore: {score}/100\n\n{tag_str}\n\nStream on {platform_str}\n\ngoodwatch.movie/movies/{slug}/"

    # Instagram
    hook = overview[:150] + "..." if len(overview) > 150 else overview
    ep = movie.get("emotional_profile") or {}
    if isinstance(ep, str):
        ep = json.loads(ep)

    instagram = f"""\U0001f3ac {title} ({year})
\U0001f3af GoodScore: {score}/100

{hook}

\U0001f9e0 Emotional Profile:
{"\U0001f49b" if ep.get("comfort",0)>=6 else "\u2022"} Comfort: {ep.get("comfort","?")}
{"\U0001f5a4" if ep.get("darkness",0)>=6 else "\u2022"} Darkness: {ep.get("darkness","?")}
{"\u26a1" if ep.get("energy",0)>=6 else "\u2022"} Energy: {ep.get("energy","?")}
{"\U0001f9e9" if ep.get("complexity",0)>=6 else "\u2022"} Complexity: {ep.get("complexity","?")}
{"\U0001f525" if ep.get("emotionalIntensity",0)>=6 else "\u2022"} Intensity: {ep.get("emotionalIntensity", ep.get("emotional_intensity","?"))}
{"\U0001f504" if ep.get("rewatchability",0)>=6 else "\u2022"} Rewatchability: {ep.get("rewatchability","?")}

{"Dir. " + director if director else ""}
{genre_str}
Stream on {platform_str}

Stop scrolling Netflix for 30 minutes. Let GoodWatch pick for you.
Link in bio \U00002197\U0000fe0f

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
    print(f"\nSelected: {title} ({movie.get('year', '')}) — GoodScore: {score}/100")

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
        f.write(f"TITLE: {reddit_title}\n\n{reddit_body}")

    print(f"\n--- TWEET ---\n{tweet}")
    print(f"\n--- INSTAGRAM ---\n{instagram[:300]}...")
    print(f"\n--- REDDIT ---\nTitle: {reddit_title}")
    print(f"\nSaved to: {output_dir}/")


if __name__ == "__main__":
    main()
