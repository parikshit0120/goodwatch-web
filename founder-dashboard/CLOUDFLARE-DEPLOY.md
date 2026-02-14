# Cloudflare Deployment Guide

## Problem
Next.js with server-side API routes and Firebase Admin doesn't work natively on Cloudflare Pages. Cloudflare Workers have different runtime constraints.

## Solution: Deploy to Digital Ocean with Nginx

Since you already have a Digital Ocean server at 134.209.154.249 and want to use ONLY Cloudflare (for the domain), we'll:

1. Deploy the Next.js app to your Digital Ocean server
2. Use Cloudflare DNS to point goodwatch.movie to your server
3. Cloudflare will act as the CDN/proxy layer

## Steps

### 1. Build the app locally
```bash
cd "/Users/parikshitjhajharia/Desktop/Personal/GoodWatch CodeBase/goodwatch-web/founder-dashboard"
npm run build
```

### 2. Upload to Digital Ocean
```bash
# Create directory on server
ssh root@134.209.154.249 "mkdir -p /var/www/founder-dashboard"

# Upload files (excluding node_modules and .next)
rsync -avz --exclude node_modules --exclude .next --exclude .open-next \
  . root@134.209.154.249:/var/www/founder-dashboard/

# Upload .next build output separately
rsync -avz .next root@134.209.154.249:/var/www/founder-dashboard/
```

### 3. Install on server
```bash
ssh root@134.209.154.249

cd /var/www/founder-dashboard

# Install Node.js if not already installed
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt-get install -y nodejs

# Install dependencies
npm install --production

# Create .env.local with your credentials
cat > .env.local << 'EOF'
NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSyBmFWrqHXfhJZS4t-vLj6CxjXQKGJKTJc4
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=goodwatchapp.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=goodwatchapp
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=goodwatchapp.firebasestorage.app
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=1064227633048
NEXT_PUBLIC_FIREBASE_APP_ID=1:1064227633048:web:c3f8e5a2b9d4f6e7a8b9c0
NEXT_PUBLIC_ADMIN_EMAIL=parikshit0120@gmail.com

FIREBASE_ADMIN_PROJECT_ID=goodwatchapp
FIREBASE_ADMIN_CLIENT_EMAIL=<your-firebase-admin-email>
FIREBASE_ADMIN_PRIVATE_KEY="<your-firebase-admin-private-key>"

DASHBOARD_PASSWORD_HASH=<bcrypt-hash-of-password>
ADMIN_EMAIL=parikshit0120@gmail.com
EOF
```

### 4. Create systemd service
```bash
cat > /etc/systemd/system/founder-dashboard.service << 'EOF'
[Unit]
Description=GoodWatch Founder Dashboard
After=network.target

[Service]
Type=simple
User=root
WorkingDirectory=/var/www/founder-dashboard
Environment="NODE_ENV=production"
Environment="PORT=3001"
EnvironmentFile=/var/www/founder-dashboard/.env.local
ExecStart=/usr/bin/npm start
Restart=always

[Install]
WantedBy=multi-user.target
EOF

# Start service
systemctl daemon-reload
systemctl enable founder-dashboard
systemctl start founder-dashboard
systemctl status founder-dashboard
```

### 5. Configure Nginx
```bash
cat > /etc/nginx/sites-available/founder-dashboard << 'EOF'
server {
    listen 80;
    server_name goodwatch.movie;

    location /ops-f8d3a2c9-internal {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
EOF

# Enable site
ln -s /etc/nginx/sites-available/founder-dashboard /etc/nginx/sites-enabled/
nginx -t
systemctl reload nginx
```

### 6. Configure Cloudflare DNS
1. Go to Cloudflare Dashboard → goodwatch.movie → DNS
2. Add/Update A record:
   - Type: A
   - Name: @ (or goodwatch.movie)
   - Content: 134.209.154.249
   - Proxy status: Proxied (orange cloud)
   - TTL: Auto

3. Cloudflare will now:
   - Provide free SSL/TLS
   - Act as CDN
   - Provide DDoS protection
   - Cache static assets

### 7. Enable HTTPS (Cloudflare Automatic)
Cloudflare provides automatic HTTPS when proxied. For end-to-end encryption:
```bash
# Install certbot for Let's Encrypt
apt-get install certbot python3-certbot-nginx

# Get certificate
certbot --nginx -d goodwatch.movie

# Nginx will be auto-configured for HTTPS
```

### 8. Test
Visit: https://goodwatch.movie/ops-f8d3a2c9-internal

### 9. Updates
To deploy updates:
```bash
# On your Mac
cd "/Users/parikshitjhajharia/Desktop/Personal/GoodWatch CodeBase/goodwatch-web/founder-dashboard"
npm run build
rsync -avz --exclude node_modules .next root@134.209.154.249:/var/www/founder-dashboard/

# On server
ssh root@134.209.154.249
systemctl restart founder-dashboard
```

## Why This Works
- ✅ Uses ONLY Cloudflare (for DNS and CDN)
- ✅ No third-party platforms (Vercel, Railway, etc.)
- ✅ Full Next.js SSR support
- ✅ Firebase Admin works correctly
- ✅ Your existing Digital Ocean server
- ✅ Cloudflare provides free SSL, CDN, DDoS protection

## Alternative: Cloudflare Workers (More Complex)
If you want the app TO RUN on Cloudflare infrastructure, you'd need to:
1. Rewrite the entire app to use Cloudflare Workers
2. Replace Firebase Admin with Firestore REST API (Workers compatible)
3. Use Cloudflare KV for sessions
4. This would take significant refactoring

The Digital Ocean approach is simpler and uses Cloudflare for what it's best at: DNS + CDN + Security.
