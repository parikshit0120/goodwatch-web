# Dashboard Quick Start (Fully Automated)

## ✅ What's Done

- Dashboard deployed: https://3665a7e3.goodwatch-founder-dashboard.pages.dev/ops-f8d3a2c9-internal/
- Reads from your iOS app Supabase (real metrics)
- GitHub Actions auto-deploys on push
- Password: `goodwatch2026`

## 🚀 One Command Setup

Run this to create the dashboard tables:

```bash
cd "/Users/parikshitjhajharia/Desktop/Personal/GoodWatch CodeBase/goodwatch-web/founder-dashboard"

npx supabase db push --db-url "postgresql://postgres.jdjqrlkynwfhbtyuddjk:GdW@tch2024!@aws-0-ap-south-1.pooler.supabase.com:6543/postgres" --include-all < supabase-setup.sql
```

If that doesn't work, alternative (copy-paste):

```bash
# Install Supabase CLI
brew install supabase/tap/supabase

# Login and link
supabase login
supabase link --project-ref jdjqrlkynwfhbtyuddjk

# Create tables
supabase db push
```

## What This Does

Creates 3 tables in your Supabase:
1. `dashboard_tasks` - Task management
2. `dashboard_ship_logs` - Daily ship tracking
3. `dashboard_context_notes` - Knowledge base for AI

All with RLS enabled (only you can access).

## After Setup

1. Visit: https://3665a7e3.goodwatch-founder-dashboard.pages.dev/ops-f8d3a2c9-internal/
2. Login with password: `goodwatch2026`
3. Metrics will show your real iOS app data
4. Add tasks, log ships, take notes

## Auto-Deploy

Push to `goodwatch-web` repo and GitHub Actions will auto-deploy the dashboard.

Set these secrets in GitHub repo settings:
- `CLOUDFLARE_API_TOKEN` - Get from Cloudflare dashboard
- `CLOUDFLARE_ACCOUNT_ID` - Already hardcoded: `07139d7fc2114b7107abfb77d4ab2ec1`

## That's It

Dashboard is live and connected. No manual syncing needed. Ever.
