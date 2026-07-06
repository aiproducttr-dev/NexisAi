#!/usr/bin/env bash
set -euo pipefail

APP_DIR="/opt/nexisai-forum-bot"
cd "$APP_DIR"

echo "==> Installing dependencies..."
npm ci --include=dev

echo "==> Restarting forum bot..."
pm2 delete forum-bot 2>/dev/null || true
pm2 start npm --name forum-bot -- run forum-bot:daemon
pm2 save

echo "==> Status:"
pm2 status forum-bot
pm2 logs forum-bot --lines 15 --nostream
