# Deploying TUI Blog Portfolio to Hetzner VPS

This guide walks you through deploying the TUI Blog Portfolio to a Hetzner VPS with nginx, SSL, and PM2 for process management.

## Prerequisites

- Hetzner VPS (Ubuntu 22.04 or 24.04 recommended)
- Domain pointed to your VPS IP (e.g., amore.build → your VPS IP)
- SSH access to your VPS

## Step 1: Initial VPS Setup

SSH into your VPS:
```bash
ssh root@your-vps-ip
```

### Update System & Create Deploy User
```bash
# Update packages
apt update && apt upgrade -y

# Install essential tools
apt install -y curl git ufw fail2ban

# Create a deploy user (optional but recommended)
adduser deploy
usermod -aG sudo deploy

# Set up SSH for deploy user
mkdir -p /home/deploy/.ssh
cp ~/.ssh/authorized_keys /home/deploy/.ssh/
chown -R deploy:deploy /home/deploy/.ssh
chmod 700 /home/deploy/.ssh
chmod 600 /home/deploy/.ssh/authorized_keys
```

### Configure Firewall
```bash
ufw allow OpenSSH
ufw allow 'Nginx Full'
ufw enable
```

## Step 2: Install Node.js & pnpm

```bash
# Install Node.js 20 LTS
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
apt install -y nodejs

# Install pnpm globally
npm install -g pnpm

# Verify installations
node --version  # Should be v20.x
pnpm --version
```

## Step 3: Install & Configure Nginx

```bash
apt install -y nginx

# Create nginx config for your site
nano /etc/nginx/sites-available/amore.build
```

Paste this configuration:
```nginx
server {
    listen 80;
    listen [::]:80;
    server_name amore.build www.amore.build;

    # Frontend (Vite build)
    location / {
        root /var/www/tui-blog/dist;
        index index.html;
        try_files $uri $uri/ /index.html;
    }

    # API proxy
    location /api {
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

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
}
```

Enable the site:
```bash
ln -s /etc/nginx/sites-available/amore.build /etc/nginx/sites-enabled/
rm /etc/nginx/sites-enabled/default  # Remove default site
nginx -t  # Test config
systemctl restart nginx
```

## Step 4: Install PM2 (Process Manager)

```bash
npm install -g pm2
```

## Step 5: Clone & Build the Application

```bash
# Create web directory
mkdir -p /var/www/tui-blog
cd /var/www/tui-blog

# Clone the repository
git clone https://github.com/vincitamore/tui-blog-portfolio.git .

# Install dependencies
pnpm install

# Build the frontend
pnpm build
```

## Step 6: Configure Environment & Start Services

Create environment file:
```bash
nano .env
```

Add:
```env
API_PORT=3001
NODE_ENV=production
```

Create PM2 ecosystem file:
```bash
nano ecosystem.config.cjs
```

Paste:
```javascript
module.exports = {
  apps: [
    {
      name: 'tui-blog-api',
      script: 'server/api.ts',
      interpreter: 'node',
      interpreter_args: '--import tsx',
      cwd: '/var/www/tui-blog',
      env: {
        NODE_ENV: 'production',
        API_PORT: 3001
      },
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '500M'
    }
  ]
};
```

Install tsx for running TypeScript:
```bash
pnpm add -D tsx
```

Start the API with PM2:
```bash
pm2 start ecosystem.config.cjs
pm2 save
pm2 startup  # Follow the instructions to enable on boot
```

## Step 7: Set Up SSL with Let's Encrypt

```bash
# Install Certbot
apt install -y certbot python3-certbot-nginx

# Get SSL certificate
certbot --nginx -d amore.build -d www.amore.build

# Auto-renewal is set up automatically, verify with:
certbot renew --dry-run
```

## Step 8: Set Proper Permissions

```bash
# Set ownership
chown -R www-data:www-data /var/www/tui-blog/dist
chown -R deploy:deploy /var/www/tui-blog/content

# Set permissions for content directory (for admin edits)
chmod 755 /var/www/tui-blog/content
chmod 644 /var/www/tui-blog/content/*.json
```

## Verification

1. Visit https://amore.build - you should see the terminal
2. Type `help` to verify commands work
3. Type `portfolio` to check API is working
4. Login as admin (`sudo admin`) and test editing

## Useful PM2 Commands

```bash
pm2 status          # Check status
pm2 logs            # View logs
pm2 restart all     # Restart all processes
pm2 reload all      # Zero-downtime reload
pm2 stop all        # Stop all processes
pm2 monit           # Monitor in terminal
```

## Updating the Application

```bash
cd /var/www/tui-blog
git pull origin main
pnpm install
pnpm build
pm2 reload all
```

## Troubleshooting

### API not responding
```bash
pm2 logs tui-blog-api --lines 50
```

### Nginx errors
```bash
tail -f /var/log/nginx/error.log
```

### Permission issues with content
```bash
chown deploy:deploy /var/www/tui-blog/content/*.json
chmod 664 /var/www/tui-blog/content/*.json
```

### Check if ports are in use
```bash
netstat -tlnp | grep -E '80|443|3001'
```

---

## Quick Deploy Script

For subsequent deployments, you can use this script:

```bash
#!/bin/bash
cd /var/www/tui-blog
git pull origin main
pnpm install
pnpm build
pm2 reload all
echo "Deployment complete!"
```

Save as `/var/www/tui-blog/deploy.sh` and make executable:
```bash
chmod +x /var/www/tui-blog/deploy.sh
```

