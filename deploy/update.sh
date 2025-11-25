#!/bin/bash
# TUI Blog Portfolio - Update Script
# Run this to pull latest changes and redeploy

set -e

echo "========================================="
echo "TUI Blog Portfolio - Updating..."
echo "========================================="

cd /var/www/tui-blog

echo "Pulling latest changes..."
git pull origin main

echo "Installing dependencies..."
pnpm install

echo "Building frontend..."
pnpm build

echo "Reloading API..."
pm2 reload all

echo "Setting permissions..."
chown -R www-data:www-data /var/www/tui-blog/dist

echo "========================================="
echo "Update complete!"
echo "========================================="

