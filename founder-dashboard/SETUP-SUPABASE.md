# Dashboard Setup - Supabase Edition

## ✅ What Changed

The dashboard now reads **directly from your iOS app's Supabase** instead of Firestore.

**Data Flow:**
```
iOS App → Supabase (app_events, user_interactions, user_profiles)
              ↓
         Dashboard reads in real-time
              ↓
         Shows actual metrics
```

## 🚀 Setup (3 steps, 2 minutes)

### Step 1: Create Dashboard Tables

Go to: https://jdjqrlkynwfhbtyuddjk.supabase.co/project/jdjqrlkynwfhbtyuddjk/sql/new

Copy and paste the entire contents of `supabase-setup.sql` and click "Run".

This creates 3 tables:
- `dashboard_tasks` - Your task management
- `dashboard_ship_logs` - Daily ship tracking
- `dashboard_context_notes` - AI knowledge base

### Step 2: Enable Google Sign-In (Optional)

If you want to use Google login instead of password:

1. Go to: https://jdjqrlkynwfhbtyuddjk.supabase.co/project/jdjqrlkynwfhbtyuddjk/auth/providers
2. Enable "Google" provider
3. Add your Google OAuth credentials (same ones from Firebase)

### Step 3: Test the Dashboard

Visit: **https://3665a7e3.goodwatch-founder-dashboard.pages.dev/ops-f8d3a2c9-internal/**

Login with password: `goodwatch2026`

## 📊 What Works Now

### Real Metrics (from iOS app data)
- **DAU** - Calculated from today's `app_events`
- **New Users** - Count of `user_profiles` created today
- **7D Retention** - Active users ratio over 7 days
- **Shares per User** - From `user_interactions` where type='share'
- **Revenue** - $0 (placeholder until you add payments)

### Task Management
- Add tasks across 11 categories (Product, Growth, Marketing, etc.)
- Auto-prioritized by Impact × Urgency
- Saves to `dashboard_tasks` table
- Persists forever

### Ship Logs
- Track what you shipped each day
- Link to metrics it impacted
- Saved to `dashboard_ship_logs`

### Context Notes
- Document decisions, insights, pivots
- AI chat reads from this
- Saved to `dashboard_context_notes`

### AI Chat
- Keyword-based responses (not real AI yet)
- Context-aware suggestions per tab
- Helps prioritize tasks

## 🔒 Security

All dashboard data is protected by RLS (Row Level Security):
- Only authenticated users can access
- You can further restrict to your email only in Supabase

Your iOS app data (`app_events`, `user_profiles`, etc.) remains untouched.

## 🔄 How Data Syncs

**Metrics:** Calculated in real-time every time you load the dashboard
- No cron jobs
- No sync scripts
- No delays
- Always fresh

**Tasks/Logs/Notes:** Saved directly to Supabase
- Instant save
- Persists forever
- Accessible from any device

## 📱 Future: Add More Data Sources

When you launch Android or web app:
```
iOS App ──┐
          ├──→ Supabase ──→ Dashboard
Android ──┤
          └──→ (same tables)
Web App ──┘
```

Everything flows to one place. Dashboard automatically shows combined metrics.

## 🛠️ Customization

### Change Targets

Edit `/Users/parikshitjhajharia/Desktop/Personal/GoodWatch CodeBase/goodwatch-web/founder-dashboard/lib/metrics.ts`:

```typescript
const targets = {
  dau: 100,        // Change from 50
  newUsers: 50,    // Change from 25
  retention7d: 40, // Change from 30
  // ...
};
```

### Add New Metrics

1. Query Supabase in `lib/metrics.ts`
2. Add to `DashboardMetrics` type
3. Display in `MetricsHeader.tsx`
4. Rebuild and deploy

### Add Real AI

Replace `lib/aiResponses.ts` with actual Claude API calls:
```typescript
const response = await fetch('https://api.anthropic.com/v1/messages', {
  // ... Claude API
});
```

## 🚨 Troubleshooting

### Metrics show 0
- Check if your iOS app has logged events in last 7 days
- Run this in Supabase SQL:
  ```sql
  SELECT COUNT(*) FROM app_events WHERE created_at >= NOW() - INTERVAL '7 days';
  ```
- If 0, your app needs more users

### Can't add tasks
- Check browser console for errors
- Verify `dashboard_tasks` table exists
- Check RLS policies are enabled

### Login doesn't work
- Password is hardcoded: `goodwatch2026`
- Change in `components/LoginPage.tsx` line 42

## 📈 Next Steps

1. Use the dashboard daily
2. Add tasks as you think of them
3. Log ships to track velocity
4. Monitor constraint banner
5. Let metrics guide decisions

The dashboard is now a **living system** connected to your real app data.
