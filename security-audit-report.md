# Production Server Security Audit

**Server:** 178.156.160.155 (ubuntu-2gb-ash-1)  
**Date:** November 26, 2025

---

## ✅ What's Good

| Item | Status |
|------|--------|
| **UFW Firewall** | Active - only ports 22, 80, 443 open |
| **Fail2ban** | Running with sshd jail |
| **SSL/TLS** | Let's Encrypt cert valid until Feb 2026 |
| **Auto-renewal** | certbot.timer active |
| **Unattended upgrades** | Active |
| **Security headers** | X-Frame-Options, X-Content-Type-Options, X-XSS-Protection, Referrer-Policy |
| **HTTP→HTTPS redirect** | Configured |
| **Nginx config** | Syntax valid |

---

## ⚠️ Recommendations

### 1. CRITICAL: Disable Password Authentication for SSH

Currently using defaults (password auth enabled). Run:

```bash
# Edit SSH config
sudo nano /etc/ssh/sshd_config

# Add/uncomment these lines:
PasswordAuthentication no
PermitRootLogin prohibit-password
PubkeyAuthentication yes

# Restart SSH
sudo systemctl restart sshd
```

### 2. HIGH: Create Non-Root User

Running everything as root is risky. Create a deploy user:

```bash
# Create user
adduser deploy

# Add to sudo group
usermod -aG sudo deploy

# Copy your SSH key
mkdir -p /home/deploy/.ssh
cp ~/.ssh/authorized_keys /home/deploy/.ssh/
chown -R deploy:deploy /home/deploy/.ssh
chmod 700 /home/deploy/.ssh
chmod 600 /home/deploy/.ssh/authorized_keys

# Change ownership of app directory
chown -R deploy:deploy /var/www/tui-blog
```

Then update PM2 to run as `deploy` user.

### 3. MEDIUM: Add HSTS Header

Add to nginx config inside the `server` block with SSL:

```nginx
add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
```

Then reload nginx:

```bash
sudo nginx -t && sudo systemctl reload nginx
```

### 4. MEDIUM: Disable X11 Forwarding

Not needed for a web server:

```bash
# In /etc/ssh/sshd_config, change:
X11Forwarding no

# Restart SSH
sudo systemctl restart sshd
```

### 5. LOW: Increase Open Files Limit

Current limit is 1024 (default). For production:

```bash
# Edit limits
sudo nano /etc/security/limits.conf

# Add:
* soft nofile 65535
* hard nofile 65535

# Also edit systemd config for PM2
sudo nano /etc/systemd/system/pm2-root.service

# Add under [Service]:
LimitNOFILE=65535

# Reload
sudo systemctl daemon-reload
sudo systemctl restart pm2-root
```

### 6. LOW: Set Up PM2 Startup Properly

Ensure PM2 survives reboots:

```bash
pm2 startup systemd
# Follow the command it outputs
pm2 save
```

---

## Quick Fix Commands (Copy-Paste Ready)

```bash
# 1. Harden SSH (do this carefully - test key auth first!)
cat >> /etc/ssh/sshd_config << 'EOF'

# Security hardening
PasswordAuthentication no
PermitRootLogin prohibit-password
X11Forwarding no
EOF
systemctl restart sshd

# 2. Add HSTS to nginx
sed -i '/add_header Referrer-Policy/a \    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;' /etc/nginx/sites-available/amore.build
nginx -t && systemctl reload nginx

# 3. Save PM2 config
pm2 save
pm2 startup
```

---

## Summary

The server is reasonably secure for a personal site. The critical item is **disabling password authentication for SSH** - everything else is nice-to-have hardening.

⚠️ **Before disabling password auth**: Make sure your SSH key works! Test in a separate terminal before closing your current session.

