#!/bin/bash
# =====================================================
# GOODWATCH RECOMMENDATION ENGINE - AUTOMATED SETUP
# Run: chmod +x setup-recommendation-engine.sh && ./setup-recommendation-engine.sh
# =====================================================

set -e

SUPABASE_URL="https://jdjqrlkynwfhbtyuddjk.supabase.co"
SUPABASE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpkanFybGt5bndmaGJ0eXVkZGprIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ0NzUwMTEsImV4cCI6MjA4MDA1MTAxMX0.KDRMLCewVMp3lwphkUvtoWOkg6kyAk8iSbVkRKiHYSk"

echo "🎬 GoodWatch Recommendation Engine Setup"
echo "========================================="
echo ""

# Step 1: Check if tables exist
echo "📊 Checking database tables..."

TABLES_EXIST=$(curl -s "${SUPABASE_URL}/rest/v1/movie_axes?select=movie_id&limit=1" \
  -H "apikey: ${SUPABASE_KEY}" \
  -H "Authorization: Bearer ${SUPABASE_KEY}" \
  -w "%{http_code}" -o /dev/null)

if [ "$TABLES_EXIST" = "200" ]; then
  echo "✅ Tables already exist!"
else
  echo ""
  echo "⚠️  Tables don't exist yet. Opening Supabase SQL Editor..."
  echo ""
  echo "📋 SQL has been copied to your clipboard!"
  echo "   1. The browser will open to Supabase SQL Editor"
  echo "   2. Paste (Cmd+V) and click 'Run'"
  echo "   3. Come back here and press Enter to continue"
  echo ""
  
  # Copy SQL to clipboard
  cat ~/Downloads/recommendation-engine/01-database-schema.sql | pbcopy
  
  # Open Supabase SQL Editor
  open "https://supabase.com/dashboard/project/jdjqrlkynwfhbtyuddjk/sql/new"
  
  read -p "Press Enter after running the SQL in Supabase..."
fi

# Step 2: Check for movies in database
echo ""
echo "🎥 Checking movies in database..."

MOVIE_COUNT=$(curl -s "${SUPABASE_URL}/rest/v1/movies?select=id&limit=1" \
  -H "apikey: ${SUPABASE_KEY}" \
  -H "Prefer: count=exact" \
  -H "Authorization: Bearer ${SUPABASE_KEY}" \
  -I 2>/dev/null | grep -i "content-range" | sed 's/.*\///' | tr -d '\r')

echo "✅ Found ${MOVIE_COUNT:-0} movies in database"

# Step 3: Get sample movie titles for seeding
echo ""
echo "🌱 Fetching movies to seed with axes..."

# Get 20 high-rated movies to seed
MOVIES=$(curl -s "${SUPABASE_URL}/rest/v1/movies?select=id,title&order=vote_average.desc&limit=20" \
  -H "apikey: ${SUPABASE_KEY}" \
  -H "Authorization: Bearer ${SUPABASE_KEY}")

echo "Sample movies found:"
echo "$MOVIES" | python3 -c "import sys,json; [print(f'  - {m[\"title\"]}') for m in json.load(sys.stdin)[:5]]" 2>/dev/null || echo "  (could not parse)"

# Step 4: Check for Gemini API key
echo ""
echo "🔑 Checking Gemini API key..."

if [ -z "$GEMINI_API_KEY" ]; then
  echo ""
  echo "⚠️  GEMINI_API_KEY not set. You have two options:"
  echo ""
  echo "   Option A: Set key and generate AI axes"
  echo "   export GEMINI_API_KEY=your_key_here"
  echo "   npx ts-node src/lib/generate-movie-axes.ts 100 0"
  echo ""
  echo "   Option B: Skip AI generation (recommendations will use embeddings only)"
  echo ""
else
  echo "✅ Gemini API key found"
  echo ""
  read -p "Generate axes for 50 movies now? (y/n) " -n 1 -r
  echo
  if [[ $REPLY =~ ^[Yy]$ ]]; then
    cd ~/Desktop/GOODWATCH/goodwatch-web
    npx ts-node src/lib/generate-movie-axes.ts 50 0
  fi
fi

# Step 5: Update files with correct credentials
echo ""
echo "📝 Updating credentials in source files..."

# Update recommendation-engine.ts
sed -i '' "s|const SUPABASE_URL = '.*'|const SUPABASE_URL = '${SUPABASE_URL}'|" ~/Desktop/GOODWATCH/goodwatch-web/src/lib/recommendation-engine.ts
sed -i '' "s|const SUPABASE_ANON_KEY = '.*'|const SUPABASE_ANON_KEY = '${SUPABASE_KEY}'|" ~/Desktop/GOODWATCH/goodwatch-web/src/lib/recommendation-engine.ts

# Update generate-movie-axes.ts
sed -i '' "s|const SUPABASE_URL = '.*'|const SUPABASE_URL = '${SUPABASE_URL}'|" ~/Desktop/GOODWATCH/goodwatch-web/src/lib/generate-movie-axes.ts
sed -i '' "s|const SUPABASE_KEY = '.*'|const SUPABASE_KEY = '${SUPABASE_KEY}'|" ~/Desktop/GOODWATCH/goodwatch-web/src/lib/generate-movie-axes.ts

echo "✅ Credentials updated"

# Done
echo ""
echo "========================================="
echo "✅ Setup complete!"
echo ""
echo "Next steps:"
echo "  1. Build and deploy: npm run build && wrangler pages deploy dist --project-name=goodwatch-web --commit-dirty=true"
echo "  2. (Optional) Generate more axes: GEMINI_API_KEY=xxx npx ts-node src/lib/generate-movie-axes.ts 100 0"
echo ""
