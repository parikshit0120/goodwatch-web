# GoodWatch Founder Dashboard

Private, real-time operational dashboard for founder use only.

## Features

- 🔒 **Private Access**: Password + Google Auth, whitelist only
- 📊 **Live Metrics**: DAU, New Users, Retention, Shares, Revenue
- 🎯 **Constraint Detection**: Auto-detects Growth/Retention/Monetization bottlenecks
- ✅ **Task Management**: 11 tabs (Product, Growth, Marketing, Tech, Monetization, Partnerships, Bugs, Analytics, Experiments, Content, Context)
- 📦 **Ship Log**: Daily shipping confirmation
- 🤖 **AI Assistant**: Context-aware suggestions based on your notes
- 🔥 **Priority Ranking**: Impact × Urgency formula

## Setup

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Environment Variables

Copy `.env.local` and fill in the values:

```bash
# Firebase (already configured for goodwatchapp project)
NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSyBmFWrqHXfhJZS4t-vLj6CxjXQKGJKTJc4
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=goodwatchapp.firebaseapp.com
# ... etc

# Dashboard Access
ADMIN_EMAIL=parikshit0120@gmail.com
DASHBOARD_PASSWORD_HASH= # Generate with: node -e "console.log(require('bcryptjs').hashSync('your-password', 10))"

# Firebase Admin (get from Firebase Console > Project Settings > Service Accounts)
FIREBASE_ADMIN_PROJECT_ID=goodwatchapp
FIREBASE_ADMIN_CLIENT_EMAIL=
FIREBASE_ADMIN_PRIVATE_KEY=

# Optional: GA4 integration
GA4_PROPERTY_ID=
GA4_SERVICE_ACCOUNT_EMAIL=
GA4_PRIVATE_KEY=
```

### 3. Generate Password Hash

```bash
node -e "console.log(require('bcryptjs').hashSync('your-secure-password', 10))"
```

Copy the output to `DASHBOARD_PASSWORD_HASH` in `.env.local`.

### 4. Run Development Server

```bash
npm run dev
```

Visit: http://localhost:3000/ops-f8d3a2c9-internal

### 5. Deploy to Vercel

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel --prod

# Configure custom domain in Vercel dashboard:
# goodwatch.movie/ops-f8d3a2c9-internal
```

## Firestore Collections

The dashboard uses these Firestore collections:

- `tasks`: Task management across all tabs
- `shipLogs`: Daily ship tracking
- `contextNotes`: Knowledge base for AI
- `dailyMetrics`: Aggregated daily metrics
- `manualMetrics`: Manual revenue/metric entries

## Firebase Security Rules

Add these rules to Firestore:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Only authenticated users (founder only)
    match /{document=**} {
      allow read, write: if request.auth != null && request.auth.token.email == 'parikshit0120@gmail.com';
    }
  }
}
```

## Default Password

Default password (change in production): `goodwatch2026`

## Hidden URL

Dashboard is accessible at: `/ops-f8d3a2c9-internal`

Root `/` redirects here automatically.

## Architecture

- **Frontend**: Next.js 15 (App Router), React 19, TypeScript, Tailwind CSS
- **Backend**: Firebase (Auth + Firestore)
- **Deployment**: Vercel
- **Analytics**: Firebase Analytics + Google Analytics 4 (optional)

## Constraint Detection Logic

```
if (retention trend < -5% over 14 days) → Retention
else if (new users flat over 14 days) → Growth
else if (revenue flat over 14 days) → Monetization
else → Product Velocity
```

## Task Priority Formula

```
Urgency Score:
- Overdue = 5
- Due Today = 4
- Due Tomorrow = 3
- Due in 3 Days = 2
- Else = 1

Priority Score = Impact × Urgency
```

Top 3 tasks shown per tab.

## AI Chat

The AI assistant:
- Reads all context notes from the Context tab
- Analyzes current metrics and constraints
- Reviews active tasks for the current tab
- Provides proactive suggestions when switching tabs
- Answers questions about strategy, priorities, and metrics

Add detailed context notes in the Context tab to improve AI suggestions.

## Security

- No public routes
- Unauthorized users get 404
- Password reset sends link to `hello@goodwatch.movie`
- Google login restricted to `parikshit0120@gmail.com`
- All data in Firestore requires authentication

## Support

For issues or questions, contact: parikshit0120@gmail.com
