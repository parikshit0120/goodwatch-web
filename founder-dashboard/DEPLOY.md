# Deployment Instructions

## Prerequisites

1. Vercel account (connect with GitHub)
2. Firebase project credentials
3. Cloudflare domain access (goodwatch.movie)

## Step 1: Install Vercel CLI

```bash
npm i -g vercel
```

## Step 2: Login to Vercel

```bash
vercel login
```

## Step 3: Deploy

```bash
cd /Users/parikshitjhajharia/Desktop/Personal/GoodWatch\ CodeBase/goodwatch-web/founder-dashboard
vercel --prod
```

## Step 4: Configure Environment Variables in Vercel

Go to Vercel Dashboard → Project Settings → Environment Variables

Add these variables:

### Firebase Client (Already in .env.local)
```
NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSyBmFWrqHXfhJZS4t-vLj6CxjXQKGJKTJc4
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=goodwatchapp.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=goodwatchapp
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=goodwatchapp.firebasestorage.app
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=1064227633048
NEXT_PUBLIC_FIREBASE_APP_ID=1:1064227633048:web:c3f8e5a2b9d4f6e7a8b9c0
NEXT_PUBLIC_ADMIN_EMAIL=parikshit0120@gmail.com
```

### Firebase Admin (Get from Firebase Console)
1. Go to: https://console.firebase.google.com/project/goodwatchapp/settings/serviceaccounts/adminsdk
2. Click "Generate New Private Key"
3. Download the JSON file
4. Extract values:

```
FIREBASE_ADMIN_PROJECT_ID=goodwatchapp
FIREBASE_ADMIN_CLIENT_EMAIL=<from JSON file>
FIREBASE_ADMIN_PRIVATE_KEY=<from JSON file - wrap in quotes>
```

### Dashboard Access
```
ADMIN_EMAIL=parikshit0120@gmail.com
DASHBOARD_PASSWORD_HASH=<generate below>
```

To generate password hash:
```bash
node -e "console.log(require('bcryptjs').hashSync('your-secure-password', 10))"
```

## Step 5: Configure Custom Domain

### Option A: Via Vercel (Recommended)

1. Go to Vercel Dashboard → Project → Settings → Domains
2. Add domain: `goodwatch.movie`
3. Add custom path prefix in vercel.json (already done)
4. Vercel will provide DNS records

### Option B: Via Cloudflare (Current Setup)

1. In Cloudflare DNS for goodwatch.movie:
   - Add CNAME: `@` → `cname.vercel-dns.com`
   - Or add A record pointing to Vercel IP

2. In Vercel Dashboard:
   - Add domain: `goodwatch.movie`
   - Verify ownership

The dashboard will be accessible at:
- https://goodwatch.movie/ops-f8d3a2c9-internal

## Step 6: Set Up Firestore Security Rules

1. Go to Firebase Console → Firestore → Rules
2. Add these rules:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if request.auth != null &&
                           request.auth.token.email == 'parikshit0120@gmail.com';
    }
  }
}
```

3. Publish rules

## Step 7: Initialize Collections

Create these Firestore collections manually (or they'll be created on first use):

- `tasks` - Task management
- `shipLogs` - Daily ship tracking
- `contextNotes` - AI knowledge base
- `dailyMetrics` - Aggregated metrics
- `manualMetrics` - Manual entries

## Step 8: Test the Dashboard

1. Visit: https://goodwatch.movie/ops-f8d3a2c9-internal
2. Login with password: `goodwatch2026` (or your custom password)
3. OR login with Google: parikshit0120@gmail.com

## Step 9: Verify Features

✅ Login works (password + Google)
✅ Top metrics display (will be 0 until data is added)
✅ Constraint banner shows
✅ 11 tabs work (Product, Growth, Marketing, Tech, Monetization, Partnerships, Bugs, Analytics, Experiments, Content, Context)
✅ Can add tasks
✅ Can log ships
✅ Can add context notes
✅ AI chat responds (mock responses for now)

## Troubleshooting

### Build fails with "Service account" error
- Firebase Admin credentials not set in Vercel
- Build will succeed with warnings but features won't work until credentials are added

### "Unauthorized" error
- Check ADMIN_EMAIL matches your login email
- Verify DASHBOARD_PASSWORD_HASH is correct
- Check Firebase auth is enabled

### 404 on root path
- Should redirect to `/ops-f8d3a2c9-internal` automatically
- If not, check vercel.json rewrites

### Metrics show 0
- Expected until you add data to `dailyMetrics` collection
- Or integrate with GA4 API (optional step)

## Optional: GA4 Integration

To pull live metrics from Google Analytics 4:

1. Create a service account in Google Cloud Console
2. Enable GA4 Data API
3. Add service account email to GA4 property (Read & Analyze permission)
4. Get property ID from GA4 settings
5. Add to Vercel env:

```
GA4_PROPERTY_ID=<your-property-id>
GA4_SERVICE_ACCOUNT_EMAIL=<service-account-email>
GA4_PRIVATE_KEY=<service-account-private-key>
```

6. Implement GA4 fetching in `/api/metrics/current/route.ts`

## Security Checklist

- ✅ No public routes (all require auth)
- ✅ Firestore rules restrict to your email only
- ✅ Password is hashed (bcrypt)
- ✅ Hidden URL path
- ✅ Google Sign-In restricted to your email
- ✅ robots.txt has noindex

## Support

If issues occur:
1. Check Vercel deployment logs
2. Check browser console for errors
3. Verify all env variables are set
4. Test Firebase connection in Firestore console

Dashboard URL: https://goodwatch.movie/ops-f8d3a2c9-internal
Contact: parikshit0120@gmail.com
