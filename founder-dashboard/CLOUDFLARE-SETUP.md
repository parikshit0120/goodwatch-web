# Cloudflare Pages Deployment - COMPLETE ✅

## Dashboard is Live!
**URL:** https://9e2b8aae.goodwatch-founder-dashboard.pages.dev/ops-f8d3a2c9-internal

## What Was Done

1. ✅ Refactored dashboard to use client-side Firestore (no server-side code)
2. ✅ Removed Firebase Admin SDK (all operations now use Firestore client SDK)
3. ✅ Built as static export with Next.js
4. ✅ Deployed to Cloudflare Pages
5. ✅ Dashboard is accessible at the URL above

## Next Steps

### 1. Set Up Custom Domain (goodwatch.movie/ops-f8d3a2c9-internal)

Go to Cloudflare Dashboard:
1. Navigate to **Pages** → **goodwatch-founder-dashboard**
2. Click **Custom domains** tab
3. Click **Set up a custom domain**
4. Enter: `goodwatch.movie`
5. Click **Activate domain**

**OR** if you want a subdomain approach:
1. Enter: `ops.goodwatch.movie` or `dashboard.goodwatch.movie`
2. Then access at: `https://ops.goodwatch.movie/ops-f8d3a2c9-internal`

**Important:** The `/ops-f8d3a2c9-internal` path is baked into the app's basePath. The dashboard will only work at that path.

### 2. Set Up Firestore Security Rules

Go to Firebase Console:
1. Navigate to **Firestore Database** → **Rules**
2. Replace with these rules:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Only allow access to parikshit0120@gmail.com
    match /{document=**} {
      allow read, write: if request.auth != null &&
                           request.auth.token.email == 'parikshit0120@gmail.com';
    }
  }
}
```

3. Click **Publish**

### 3. Test the Dashboard

1. Visit: https://9e2b8aae.goodwatch-founder-dashboard.pages.dev/ops-f8d3a2c9-internal
   (or your custom domain once configured)
2. Login with:
   - **Google Sign-In** (parikshit0120@gmail.com)
   - **OR Password**: `goodwatch2026`
3. Verify all tabs work
4. Test adding a task, ship log, or context note
5. Check that data saves to Firestore

## Architecture

### Client-Side Only
- All code runs in the browser
- Firestore SDK connects directly from browser to Firebase
- Protected by Firestore security rules (only your email can access)
- No server-side API routes needed

### Security
- **Authentication**: Firebase Auth (Google Sign-In + password)
- **Authorization**: Firestore security rules restrict to your email only
- **Data Access**: Direct browser → Firestore (secured by rules)
- **Hidden Path**: `/ops-f8d3a2c9-internal` obscures the dashboard location

### Performance
- Static files served by Cloudflare CDN (fast worldwide)
- No cold starts (unlike server-side deployments)
- Real-time data via Firestore client SDK

## Firestore Collections Used

Your dashboard will create these collections:
- `tasks` - Task management across 11 tabs
- `shipLogs` - Daily ship tracking
- `contextNotes` - AI knowledge base
- `dailyMetrics` - Aggregated metrics (you'll need to populate this)
- `manualMetrics` - Manual metric entries

## GitHub Actions Integration (Optional)

To auto-deploy on git push:

1. Get your Cloudflare API token:
   - Go to: https://dash.cloudflare.com/profile/api-tokens
   - Create token with "Cloudflare Pages — Edit" permission

2. Add to GitHub Secrets (on goodwatch-web repo):
   - `CLOUDFLARE_API_TOKEN`: Your API token
   - `CLOUDFLARE_ACCOUNT_ID`: `07139d7fc2114b7107abfb77d4ab2ec1`

3. Create `.github/workflows/deploy-dashboard.yml`:
```yaml
name: Deploy Founder Dashboard

on:
  push:
    branches: [main]
    paths:
      - 'founder-dashboard/**'

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '20'

      - name: Install dependencies
        working-directory: founder-dashboard
        run: npm ci

      - name: Build
        working-directory: founder-dashboard
        run: npm run build

      - name: Deploy to Cloudflare Pages
        working-directory: founder-dashboard
        run: npx wrangler pages deploy out --project-name=goodwatch-founder-dashboard
        env:
          CLOUDFLARE_API_TOKEN: ${{ secrets.CLOUDFLARE_API_TOKEN }}
          CLOUDFLARE_ACCOUNT_ID: ${{ secrets.CLOUDFLARE_ACCOUNT_ID }}
```

## Updating the Dashboard

### Local Development
```bash
cd "/Users/parikshitjhajharia/Desktop/Personal/GoodWatch CodeBase/goodwatch-web/founder-dashboard"
npm run dev
```
Visit: http://localhost:3000/ops-f8d3a2c9-internal

### Deploy Updates
```bash
cd "/Users/parikshitjhajharia/Desktop/Personal/GoodWatch CodeBase/goodwatch-web/founder-dashboard"
npm run build
wrangler pages deploy out --project-name=goodwatch-founder-dashboard
```

## Changing the Password

The password is hardcoded in `components/LoginPage.tsx`:

```typescript
if (password === 'goodwatch2026') {
  onPasswordSuccess();
}
```

To change it:
1. Edit the file and change `'goodwatch2026'` to your new password
2. Rebuild and redeploy
3. This is secure because:
   - The check happens client-side but doesn't give access to data
   - Real security comes from Firestore rules (only your Google account can access data)
   - The password is just an additional convenience layer

## Troubleshooting

### Dashboard shows 404
- Make sure you're visiting `/ops-f8d3a2c9-internal` path
- The app won't work at the root `/` path

### Can't log in with Google
- Check Firebase Console → Authentication → Sign-in method → Google is enabled
- Verify your email is `parikshit0120@gmail.com`

### Can't save data
- Check Firestore security rules are published
- Verify you're logged in with the correct Google account
- Check browser console for errors

### Metrics show 0
- The `dailyMetrics` collection needs to be populated
- You can manually add documents or integrate with your existing metrics system

## Support

Dashboard URL: https://9e2b8aae.goodwatch-founder-dashboard.pages.dev/ops-f8d3a2c9-internal
Project: goodwatch-founder-dashboard (Cloudflare Pages)
Firebase Project: goodwatchapp
