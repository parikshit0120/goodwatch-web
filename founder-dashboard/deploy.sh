#!/bin/bash

echo "====================================="
echo "GoodWatch Founder Dashboard Deployment"
echo "====================================="
echo ""

# Check if logged in to Vercel
echo "Step 1: Checking Vercel authentication..."
if ! vercel whoami &>/dev/null; then
    echo "❌ Not logged in to Vercel"
    echo ""
    echo "Please run: vercel login"
    echo ""
    echo "This will open a browser for you to authenticate."
    echo "After logging in, run this script again."
    exit 1
fi

echo "✓ Logged in to Vercel"
echo ""

# Show current project info
echo "Step 2: Project Info"
echo "Project: goodwatch-founder-dashboard"
echo "Location: $(pwd)"
echo ""

# Deploy
echo "Step 3: Deploying to production..."
echo ""

vercel --prod --yes

if [ $? -eq 0 ]; then
    echo ""
    echo "====================================="
    echo "✅ DEPLOYMENT SUCCESSFUL!"
    echo "====================================="
    echo ""
    echo "Next steps:"
    echo ""
    echo "1. Add environment variables in Vercel Dashboard:"
    echo "   https://vercel.com/dashboard"
    echo ""
    echo "   Required variables:"
    echo "   - FIREBASE_ADMIN_PROJECT_ID"
    echo "   - FIREBASE_ADMIN_CLIENT_EMAIL"
    echo "   - FIREBASE_ADMIN_PRIVATE_KEY"
    echo "   - DASHBOARD_PASSWORD_HASH"
    echo "   - ADMIN_EMAIL"
    echo ""
    echo "2. Generate password hash:"
    echo "   node -e \"console.log(require('bcryptjs').hashSync('your-password', 10))\""
    echo ""
    echo "3. Get Firebase Admin credentials:"
    echo "   Firebase Console → Project Settings → Service Accounts → Generate New Private Key"
    echo ""
    echo "4. Configure domain (optional):"
    echo "   Vercel Dashboard → Project → Settings → Domains"
    echo "   Add: goodwatch.movie"
    echo ""
    echo "5. Access your dashboard at the URL shown above"
    echo "   Path: /ops-f8d3a2c9-internal"
    echo ""
    echo "See DEPLOY.md for full instructions."
    echo ""
else
    echo ""
    echo "❌ Deployment failed"
    echo "Check the logs above for errors"
    exit 1
fi
