# Deployment Options (No Vercel)

Since you don't want to use Vercel, here are your deployment options:

## Option 1: Deploy to Railway (Easiest - Recommended)

Railway is similar to Vercel but simpler. Free tier available.

### Steps:

1. **Sign up at Railway:**
   - Go to: https://railway.app
   - Sign up with GitHub

2. **Install Railway CLI:**
```bash
npm i -g @railway/cli
```

3. **Login:**
```bash
railway login
```

4. **Deploy:**
```bash
cd "/Users/parikshitjhajharia/Desktop/Personal/GoodWatch CodeBase/goodwatch-web/founder-dashboard"
railway init
railway up
```

5. **Add environment variables:**
```bash
# Add variables via CLI or web dashboard
railway variables set FIREBASE_ADMIN_PROJECT_ID=goodwatchapp
railway variables set FIREBASE_ADMIN_CLIENT_EMAIL=<from-firebase>
railway variables set FIREBASE_ADMIN_PRIVATE_KEY="<from-firebase>"
railway variables set DASHBOARD_PASSWORD_HASH=<generate-with-bcrypt>
railway variables set ADMIN_EMAIL=parikshit0120@gmail.com

# Also add all NEXT_PUBLIC_FIREBASE_* variables
```

6. **Get deployment URL:**
```bash
railway domain
```

7. **Configure custom domain (optional):**
   - Railway Dashboard → Project → Settings → Domains
   - Add goodwatch.movie or subdomain

---

## Option 2: Run on Your Own Server (Digital Ocean droplet)

You already have a Digital Ocean server at 134.209.154.249.

### Steps:

1. **Upload code to server:**
```bash
cd "/Users/parikshitjhajharia/Desktop/Personal/GoodWatch CodeBase/goodwatch-web/founder-dashboard"
rsync -avz --exclude node_modules --exclude .next . root@134.209.154.249:/var/www/founder-dashboard/
```

2. **SSH into server:**
```bash
ssh root@134.209.154.249
```

3. **Install dependencies and build:**
```bash
cd /var/www/founder-dashboard
npm install
npm run build
```

4. **Create systemd service:**
```bash
sudo nano /etc/systemd/system/founder-dashboard.service
```

Paste:
```ini
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
```

5. **Create .env.local on server:**
```bash
nano /var/www/founder-dashboard/.env.local
```

Add all environment variables (see .env.local template).

6. **Start service:**
```bash
sudo systemctl daemon-reload
sudo systemctl enable founder-dashboard
sudo systemctl start founder-dashboard
sudo systemctl status founder-dashboard
```

7. **Configure Nginx reverse proxy:**
```bash
sudo nano /etc/nginx/sites-available/founder-dashboard
```

Paste:
```nginx
server {
    listen 80;
    server_name goodwatch.movie;

    location /ops-f8d3a2c9-internal {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

8. **Enable site:**
```bash
sudo ln -s /etc/nginx/sites-available/founder-dashboard /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

9. **Access at:**
   - http://goodwatch.movie/ops-f8d3a2c9-internal

---

## Option 3: Netlify (Alternative to Railway)

Similar to Railway but optimized for static sites. Works with Next.js.

### Steps:

1. **Sign up:** https://netlify.com
2. **Install CLI:**
```bash
npm i -g netlify-cli
```

3. **Login:**
```bash
netlify login
```

4. **Deploy:**
```bash
cd "/Users/parikshitjhajharia/Desktop/Personal/GoodWatch CodeBase/goodwatch-web/founder-dashboard"
netlify init
netlify deploy --prod
```

5. **Add environment variables in Netlify Dashboard**

6. **Configure custom domain**

---

## Option 4: Docker + Any Cloud Provider

Package as Docker container, deploy anywhere.

### Steps:

1. **Create Dockerfile:**
```bash
cd "/Users/parikshitjhajharia/Desktop/Personal/GoodWatch CodeBase/goodwatch-web/founder-dashboard"
cat > Dockerfile << 'EOF'
FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .
RUN npm run build

EXPOSE 3000

CMD ["npm", "start"]
EOF
```

2. **Build image:**
```bash
docker build -t goodwatch-dashboard .
```

3. **Run locally to test:**
```bash
docker run -p 3000:3000 --env-file .env.local goodwatch-dashboard
```

4. **Push to Docker Hub or deploy to any cloud**

---

## Recommended: Railway (Option 1)

**Why Railway:**
- ✅ Free tier (500 hours/month)
- ✅ Easiest to use (simpler than Vercel)
- ✅ Automatic HTTPS
- ✅ Custom domains supported
- ✅ Environment variables via CLI or dashboard
- ✅ Auto-deploy from Git (optional)
- ✅ Built-in logs and monitoring
- ✅ No credit card required for free tier

**Deployment time:** ~5 minutes

**Cost:** Free for your use case (or $5/month if you exceed free tier)

---

## Quick Start with Railway:

```bash
# Install
npm i -g @railway/cli

# Login (opens browser)
railway login

# Deploy
cd "/Users/parikshitjhajharia/Desktop/Personal/GoodWatch CodeBase/goodwatch-web/founder-dashboard"
railway init
railway up

# Add env variables (one by one or via dashboard)
railway variables set FIREBASE_ADMIN_PROJECT_ID=goodwatchapp
# ... add all other variables

# Get URL
railway domain

# Open dashboard
railway open
```

Done! Your dashboard will be live at the Railway-provided URL (e.g., `your-project.up.railway.app/ops-f8d3a2c9-internal`).

---

## Next Steps After Deployment:

1. ✅ Add Firebase Admin credentials
2. ✅ Generate and set password hash
3. ✅ Set Firestore security rules
4. ✅ Test login and features
5. ✅ (Optional) Configure custom domain

See DEPLOY.md for detailed post-deployment steps.
