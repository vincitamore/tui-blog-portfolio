#!/bin/bash
# TUI Blog Portfolio - Server Setup Script
# Run this on a fresh Ubuntu 22.04/24.04 VPS as root

set -e

echo "========================================="
echo "TUI Blog Portfolio - Server Setup"
echo "========================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if running as root
if [ "$EUID" -ne 0 ]; then
  echo -e "${RED}Please run as root${NC}"
  exit 1
fi

# Get domain from user
read -p "Enter your domain (e.g., amore.build): " DOMAIN
read -p "Enter your email for SSL certificates: " EMAIL

echo -e "\n${YELLOW}Step 1: Updating system...${NC}"
apt update && apt upgrade -y

echo -e "\n${YELLOW}Step 2: Installing dependencies...${NC}"
apt install -y curl git ufw fail2ban nginx

echo -e "\n${YELLOW}Step 3: Configuring firewall...${NC}"
ufw allow OpenSSH
ufw allow 'Nginx Full'
ufw --force enable

echo -e "\n${YELLOW}Step 4: Installing Node.js 20...${NC}"
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt install -y nodejs

echo -e "\n${YELLOW}Step 5: Installing pnpm and PM2...${NC}"
npm install -g pnpm pm2

echo -e "\n${YELLOW}Step 6: Cloning repository...${NC}"
mkdir -p /var/www/tui-blog
cd /var/www/tui-blog
git clone https://github.com/vincitamore/tui-blog-portfolio.git .

echo -e "\n${YELLOW}Step 7: Installing project dependencies...${NC}"
pnpm install
pnpm add -D tsx

echo -e "\n${YELLOW}Step 8: Building frontend...${NC}"
pnpm build

echo -e "\n${YELLOW}Step 9: Creating log directory...${NC}"
mkdir -p /var/www/tui-blog/logs

echo -e "\n${YELLOW}Step 10: Configuring Nginx...${NC}"
cat > /etc/nginx/sites-available/$DOMAIN << EOF
server {
    listen 80;
    listen [::]:80;
    server_name $DOMAIN www.$DOMAIN;

    # Frontend (Vite build)
    location / {
        root /var/www/tui-blog/dist;
        index index.html;
        try_files \$uri \$uri/ /index.html;
        
        # Cache static assets
        location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2)$ {
            expires 1y;
            add_header Cache-Control "public, immutable";
        }
    }

    # API proxy
    location /api {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
    }

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;
}
EOF

ln -sf /etc/nginx/sites-available/$DOMAIN /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default
nginx -t && systemctl restart nginx

echo -e "\n${YELLOW}Step 11: Starting API with PM2...${NC}"
cd /var/www/tui-blog
pm2 start ecosystem.config.cjs
pm2 save
pm2 startup systemd -u root --hp /root

echo -e "\n${YELLOW}Step 12: Installing SSL certificate...${NC}"
apt install -y certbot python3-certbot-nginx
certbot --nginx -d $DOMAIN -d www.$DOMAIN --non-interactive --agree-tos -m $EMAIL

echo -e "\n${YELLOW}Step 13: Setting permissions...${NC}"
chown -R www-data:www-data /var/www/tui-blog/dist
chmod 755 /var/www/tui-blog/content
chmod 644 /var/www/tui-blog/content/*.json

echo -e "\n${GREEN}=========================================${NC}"
echo -e "${GREEN}Setup Complete!${NC}"
echo -e "${GREEN}=========================================${NC}"
echo -e "\nYour site should be live at: https://$DOMAIN"
echo -e "\nUseful commands:"
echo -e "  pm2 status        - Check API status"
echo -e "  pm2 logs          - View logs"
echo -e "  pm2 restart all   - Restart API"
echo -e "\nTo update the site later:"
echo -e "  cd /var/www/tui-blog && ./deploy/update.sh"

