# GoodWatch Newsletter System Setup Guide

This document explains how to set up and run the weekly newsletter system.

## Overview

The newsletter system sends a weekly digest of quality new releases across OTT platforms to subscribers. It consists of:

1. **Database tables** for tracking releases and sends
2. **Edge Functions** for generating digests and sending emails
3. **Unsubscribe page** for compliance
4. **Sync script modifications** to detect new releases

---

## Step 1: Run Database Migration

Apply the migration to create necessary tables:

```bash
cd /path/to/goodwatch-web
supabase db push
```

Or run the SQL directly in Supabase Dashboard > SQL Editor:
- File: `supabase/migrations/20250131_create_newsletter_tables.sql`

This creates:
- `platform_availability_snapshots` - For detecting new releases
- `ott_releases` - Tracks when movies become available
- `newsletter_sends` - Logs each newsletter send
- Updates to `newsletter_subscribers` - Adds unsubscribe functionality

---

## Step 2: Set Up Resend

1. Go to [resend.com](https://resend.com) and create an account
2. Verify your domain `goodwatch.movie`:
   - Go to Domains > Add Domain
   - Add the DNS records they provide (SPF, DKIM, DMARC)
   - Wait for verification (usually 5-15 minutes)
3. Create an API key:
   - Go to API Keys > Create API Key
   - Name it "GoodWatch Newsletter"
   - Copy the key (you won't see it again)

---

## Step 3: Configure Environment Variables

### In Supabase Dashboard:

Go to Project Settings > Edge Functions > Add New Secret:

| Name | Value |
|------|-------|
| `RESEND_API_KEY` | Your Resend API key (starts with `re_`) |
| `NEWSLETTER_SECRET` | A random secret string for auth (generate with `openssl rand -hex 32`) |

### Locally (for trigger script):

```bash
export NEWSLETTER_SECRET="your-secret-here"
```

---

## Step 4: Deploy Edge Functions

```bash
cd /path/to/goodwatch-web

# Deploy the digest generator
supabase functions deploy generate-weekly-digest

# Deploy the newsletter sender
supabase functions deploy send-weekly-newsletter
```

---

## Step 5: Deploy Unsubscribe Page

The unsubscribe page is already in `static-site/unsubscribe.html`. Deploy it with your next site deployment:

```bash
npx wrangler pages deploy static-site --project-name=goodwatch-web
```

---

## Step 6: Modify TMDB Sync Script

Your existing sync script needs to be modified to detect new releases. Add this logic:

### Before TMDB sync runs:

```python
# Pseudocode - adapt to your actual sync implementation

def snapshot_current_availability():
    """Take a snapshot of current platform availability before sync"""

    # Get all movies with their platform availability
    movies = supabase.table('movies').select('id, platforms').execute()

    today = datetime.now().date().isoformat()

    # Insert snapshot records
    snapshots = []
    for movie in movies.data:
        for platform in ['netflix', 'prime', 'jiohotstar', 'sonyliv', 'zee5', 'jiocinema', 'appletv']:
            is_available = platform in (movie.get('platforms') or [])
            snapshots.append({
                'movie_id': movie['id'],
                'platform': platform,
                'snapshot_date': today,
                'is_available': is_available
            })

    # Batch insert
    supabase.table('platform_availability_snapshots').insert(snapshots).execute()
```

### After TMDB sync completes:

```python
def detect_new_releases():
    """Compare new availability vs snapshot to detect releases"""

    today = datetime.now().date().isoformat()

    # Get today's snapshot
    snapshots = supabase.table('platform_availability_snapshots') \
        .select('movie_id, platform, is_available') \
        .eq('snapshot_date', today) \
        .execute()

    # Build lookup: (movie_id, platform) -> was_available
    snapshot_lookup = {
        (s['movie_id'], s['platform']): s['is_available']
        for s in snapshots.data
    }

    # Get current availability after sync
    movies = supabase.table('movies').select('id, platforms').execute()

    # Find new releases
    new_releases = []
    for movie in movies.data:
        for platform in (movie.get('platforms') or []):
            was_available = snapshot_lookup.get((movie['id'], platform), False)
            if not was_available:
                # This is a new release!
                new_releases.append({
                    'movie_id': movie['id'],
                    'platform': platform,
                    'release_date': today
                })

    # Insert new releases (upsert to handle duplicates)
    if new_releases:
        supabase.table('ott_releases').upsert(
            new_releases,
            on_conflict='movie_id,platform'
        ).execute()

        print(f"Detected {len(new_releases)} new releases")

    # Cleanup old snapshots
    supabase.rpc('cleanup_old_snapshots').execute()
```

### Integration point:

```python
def run_sync():
    # 1. Snapshot before sync
    snapshot_current_availability()

    # 2. Run your existing TMDB sync
    sync_with_tmdb()

    # 3. Detect new releases
    detect_new_releases()
```

---

## Step 7: Manual Newsletter Trigger

Run the trigger script every Sunday:

```bash
export NEWSLETTER_SECRET="your-secret-here"
./scripts/trigger-newsletter.sh
```

### Expected output:

```
======================================
GoodWatch Weekly Newsletter Trigger
======================================

Sending to: https://zaoihuwiovhakapdbhbi.supabase.co/functions/v1/send-weekly-newsletter
Time: Sun Jan 31 10:00:00 IST 2025

HTTP Status: 200

Response:
{
  "success": true,
  "status": "success",
  "subscriber_count": 150,
  "successful_sends": 150,
  "failed_sends": 0,
  "subject": "This week on Netflix, Prime Video & more: 12 quality drops"
}

Newsletter triggered successfully!
```

---

## Automatic Triggering (Enabled)

The newsletter is automatically triggered every Sunday at 10 AM IST (4:30 AM UTC) using Supabase pg_cron.

### How it works:

1. **pg_cron extension** runs a scheduled job every Sunday at 4:30 AM UTC
2. The job calls `trigger_weekly_newsletter()` function
3. This function uses **pg_net** to make an HTTP POST to the Edge Function
4. The Edge Function generates the digest and sends emails via Resend

### Cron Schedule:
```
30 4 * * 0 = 4:30 AM UTC every Sunday = 10:00 AM IST
```

### Verify cron job is scheduled:

In Supabase Dashboard > SQL Editor, run:
```sql
SELECT * FROM cron.job WHERE jobname = 'weekly-newsletter';
```

### Manual trigger (if needed):

You can still trigger manually using the script:
```bash
export NEWSLETTER_SECRET="ceef6f8db70c34e3e4193cc1f2be395cac11bf5ec95b8537c4a03ccde3d6ec90"
./scripts/trigger-newsletter.sh
```

### Alternative: GitHub Actions (Backup)

If pg_cron fails, you can use GitHub Actions as backup:

Create `.github/workflows/newsletter.yml`:

```yaml
name: Weekly Newsletter

on:
  schedule:
    - cron: '30 4 * * 0'  # Every Sunday 4:30 AM UTC (10 AM IST)
  workflow_dispatch:  # Allow manual trigger

jobs:
  send-newsletter:
    runs-on: ubuntu-latest
    steps:
      - name: Trigger Newsletter
        run: |
          curl -X POST \
            -H "x-newsletter-secret: ${{ secrets.NEWSLETTER_SECRET }}" \
            https://zaoihuwiovhakapdbhbi.supabase.co/functions/v1/send-weekly-newsletter
```

Add `NEWSLETTER_SECRET` to repository secrets.

---

## Testing

### Test digest generation:

```bash
curl https://zaoihuwiovhakapdbhbi.supabase.co/functions/v1/generate-weekly-digest
```

### Test newsletter (dry run):

First, add yourself as a subscriber if not already:

```sql
INSERT INTO newsletter_subscribers (email) VALUES ('your-email@example.com');
```

Then trigger the newsletter with a small test.

### Test unsubscribe:

1. Get a subscriber's unsubscribe token:
```sql
SELECT email, unsubscribe_token FROM newsletter_subscribers LIMIT 1;
```

2. Visit: `https://goodwatch.movie/unsubscribe.html?token=<token>`

---

## Monitoring

### Check send history:

```sql
SELECT
    sent_at,
    subscriber_count,
    successful_sends,
    failed_sends,
    status
FROM newsletter_sends
ORDER BY sent_at DESC
LIMIT 10;
```

### Check new releases detected:

```sql
SELECT
    r.release_date,
    r.platform,
    m.title,
    m.rating
FROM ott_releases r
JOIN movies m ON r.movie_id = m.id
WHERE r.release_date > NOW() - INTERVAL '7 days'
ORDER BY r.release_date DESC, m.rating DESC;
```

### Active subscriber count:

```sql
SELECT COUNT(*) FROM newsletter_subscribers WHERE unsubscribed_at IS NULL;
```

---

## Troubleshooting

### "No quality releases this week"
- Check if sync is detecting releases: `SELECT COUNT(*) FROM ott_releases WHERE release_date > NOW() - INTERVAL '7 days'`
- Verify movies meet quality gates (rating >= 6.5, votes >= 500, has mood tags)

### "Failed to send" errors
- Check Resend dashboard for delivery issues
- Verify API key is correct
- Check domain verification in Resend

### Emails going to spam
- Ensure all DNS records are set (SPF, DKIM, DMARC)
- Use a proper "from" domain that matches your verified domain
- Keep unsubscribe link visible in footer

---

## File Structure

```
goodwatch-web/
├── supabase/
│   ├── migrations/
│   │   └── 20250131_create_newsletter_tables.sql
│   └── functions/
│       ├── generate-weekly-digest/
│       │   └── index.ts
│       └── send-weekly-newsletter/
│           └── index.ts
├── static-site/
│   └── unsubscribe.html
├── scripts/
│   └── trigger-newsletter.sh
└── NEWSLETTER_SETUP.md (this file)
```
