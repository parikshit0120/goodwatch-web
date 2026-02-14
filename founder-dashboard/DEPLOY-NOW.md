# Deploy Founder Dashboard to Digital Ocean

## ✅ Status: Built Successfully
The dashboard has been built and is ready for deployment.

## Quick Deploy Script

Copy and run this script to deploy:

```bash
#!/bin/bash

# 1. Upload files to server
cd "/Users/parikshitjhajharia/Desktop/Personal/GoodWatch CodeBase/goodwatch-web/founder-dashboard"

# Create deployment package
tar -czf /tmp/founder-dashboard.tar.gz \
  --exclude=node_modules \
  --exclude=.git \
  --exclude=.next/cache \
  .next package.json package-lock.json app components lib types public tailwind.config.ts postcss.config.mjs next.config.ts tsconfig.json .env.local

# Upload to server
scp /tmp/founder-dashboard.tar.gz root@134.209.154.249:/tmp/

# SSH and set up
ssh root@134.209.154.249 << 'ENDSSH'

# Create directory
mkdir -p /var/www/founder-dashboard
cd /var/www/founder-dashboard

# Extract files
tar -xzf /tmp/founder-dashboard.tar.gz
rm /tmp/founder-dashboard.tar.gz

# Install Node.js if needed
if ! command -v node &> /dev/null; then
    curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
    apt-get install -y nodejs
fi

# Install dependencies
npm install --production

# Generate password hash for dashboard login
echo ""
echo "========================================="
echo "IMPORTANT: Generate password hash"
echo "========================================="
echo "Run this command to hash your password:"
echo "node -e \"console.log(require('bcryptjs').hashSync('goodwatch2026', 10))\""
echo ""
read -p "Press enter after you've copied the hash..."

# Create .env.local
cat > .env.local << 'EOF'
NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSyBmFWrqHXfhJZS4t-vLj6CxjXQKGJKTJc4
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=goodwatchapp.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=goodwatchapp
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=goodwatchapp.firebasestorage.app
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=1064227633048
NEXT_PUBLIC_FIREBASE_APP_ID=1:1064227633048:web:c3f8e5a2b9d4f6e7a8b9c0
NEXT_PUBLIC_ADMIN_EMAIL=parikshit0120@gmail.com

FIREBASE_ADMIN_PROJECT_ID=goodwatchapp
FIREBASE_ADMIN_CLIENT_EMAIL=firebase-adminsdk-jir0t@goodwatchapp.iam.gserviceaccount.com
FIREBASE_ADMIN_PRIVATE_KEY="REPLACE_WITH_YOUR_FIREBASE_ADMIN_PRIVATE_KEY"

DASHBOARD_PASSWORD_HASH=REPLACE_WITH_BCRYPT_HASH
ADMIN_EMAIL=parikshit0120@gmail.com
EOF

echo ""
echo "EDIT /var/www/founder-dashboard/.env.local and add:"
echo "1. Your Firebase Admin private key"
echo "2. Your password hash"
echo ""
read -p "Press enter after editing .env.local..."

# Create systemd service
cat > /etc/systemd/system/founder-dashboard.service << 'EOFSERVICE'
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
EOFSERVICE

# Start service
systemctl daemon-reload
systemctl enable founder-dashboard
systemctl start founder-dashboard

echo ""
echo "Service status:"
systemctl status founder-dashboard --no-pager

# Install and configure Nginx if not present
if ! command -v nginx &> /dev/null; then
    apt-get update
    apt-get install -y nginx
fi

# Configure Nginx
cat > /etc/nginx/sites-available/founder-dashboard << 'EOFNGINX'
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
EOFNGINX

# Enable site
ln -sf /etc/nginx/sites-available/founder-dashboard /etc/nginx/sites-enabled/
nginx -t && systemctl reload nginx

echo ""
echo "========================================="
echo "✅ DEPLOYMENT COMPLETE!"
echo "========================================="
echo ""
echo "Dashboard should be accessible at:"
echo "http://134.209.154.249/ops-f8d3a2c9-internal"
echo ""
echo "Next steps:"
echo "1. Configure Cloudflare DNS to point goodwatch.movie to 134.209.154.249"
echo "2. Visit https://goodwatch.movie/ops-f8d3a2c9-internal"
echo ""
echo "To check logs:"
echo "journalctl -u founder-dashboard -f"
echo ""

ENDSSH
```

## Manual Steps (if script doesn't work)

### 1. SSH into your server
```bash
ssh root@134.209.154.249
```

### 2. Create directory
```bash
mkdir -p /var/www/founder-dashboard
cd /var/www/founder-dashboard
```

### 3. Upload files from your Mac
On your Mac, run:
```bash
cd "/Users/parikshitjhajharia/Desktop/Personal/GoodWatch CodeBase/goodwatch-web/founder-dashboard"

rsync -avz --progress \
  --exclude='node_modules' \
  --exclude='.git' \
  --exclude='.next/cache' \
  .next package.json package-lock.json app components lib types public \
  tailwind.config.ts postcss.config.mjs next.config.ts tsconfig.json \
  root@134.209.154.249:/var/www/founder-dashboard/
```

### 4. On server, install dependencies
```bash
cd /var/www/founder-dashboard
npm install --production
```

### 5. Create .env.local
```bash
nano /var/www/founder-dashboard/.env.local
```

Paste:
```
NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSyBmFWrqHXfhJZS4t-vLj6CxjXQKGJKTJc4
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=goodwatchapp.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=goodwatchapp
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=goodwatchapp.firebasestorage.app
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=1064227633048
NEXT_PUBLIC_FIREBASE_APP_ID=1:1064227633048:web:c3f8e5a2b9d4f6e7a8b9c0
NEXT_PUBLIC_ADMIN_EMAIL=parikshit0120@gmail.com

FIREBASE_ADMIN_PROJECT_ID=goodwatchapp
FIREBASE_ADMIN_CLIENT_EMAIL=firebase-adminsdk-jir0t@goodwatchapp.iam.gserviceaccount.com
FIREBASE_ADMIN_PRIVATE_KEY="<GET_FROM_FIREBASE_CONSOLE>"

DASHBOARD_PASSWORD_HASH=<GET_BY_RUNNING_BCRYPT_COMMAND_BELOW>
ADMIN_EMAIL=parikshit0120@gmail.com
```

Generate password hash:
```bash
node -e "console.log(require('bcryptjs').hashSync('goodwatch2026', 10))"
```

### 6. Create systemd service
```bash
nano /etc/systemd/system/founder-dashboard.service
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

Start service:
```bash
systemctl daemon-reload
systemctl enable founder-dashboard
systemctl start founder-dashboard
systemctl status founder-dashboard
```

### 7. Configure Nginx
```bash
nano /etc/nginx/sites-available/founder-dashboard
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
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

Enable:
```bash
ln -s /etc/nginx/sites-available/founder-dashboard /etc/nginx/sites-enabled/
nginx -t
systemctl reload nginx
```

### 8. Configure Cloudflare DNS
1. Go to Cloudflare Dashboard
2. Select goodwatch.movie domain
3. Go to DNS settings
4. Add A record:
   - Type: A
   - Name: @ (or goodwatch.movie)
   - Content: 134.209.154.249
   - Proxy: Enabled (orange cloud)

### 9. Test
Visit: https://goodwatch.movie/ops-f8d3a2c9-internal

## Troubleshooting

### Check service status
```bash
systemctl status founder-dashboard
journalctl -u founder-dashboard -f
```

### Check if port 3001 is listening
```bash
netstat -tulpn | grep 3001
```

### Test locally on server
```bash
curl http://localhost:3001/ops-f8d3a2c9-internal
```

### Nginx logs
```bash
tail -f /var/log/nginx/error.log
tail -f /var/log/nginx/access.log
```

### Restart everything
```bash
systemctl restart founder-dashboard
systemctl restart nginx
```
