#!/usr/bin/env bash
set -euo pipefail

APP_DIR="/opt/nexisai-wordpress"
DOMAIN="nexisai.blog"
WP_ADMIN_USER="nexisai"
WP_ADMIN_EMAIL="admin@nexisai.blog"
WP_TITLE="NexisAI Blog"

wp() {
  docker compose exec -T wordpress wp "$@" --allow-root
}

cd "$APP_DIR"

echo "==> Ensuring Docker is running..."
systemctl enable --now docker

if [[ ! -f .env ]]; then
  MYSQL_ROOT_PASSWORD="$(openssl rand -base64 24 | tr -d '/+=' | head -c 24)"
  MYSQL_PASSWORD="$(openssl rand -base64 24 | tr -d '/+=' | head -c 24)"
  WP_ADMIN_PASSWORD="$(openssl rand -base64 18 | tr -d '/+=' | head -c 18)"
  cat > .env <<EOF
MYSQL_ROOT_PASSWORD=${MYSQL_ROOT_PASSWORD}
MYSQL_PASSWORD=${MYSQL_PASSWORD}
WP_ADMIN_PASSWORD=${WP_ADMIN_PASSWORD}
EOF
  chmod 600 .env
else
  # shellcheck disable=SC1091
  source .env
fi

echo "==> Starting WordPress stack (Caddy + SSL)..."
docker compose pull
docker compose up -d

echo "==> Waiting for services..."
for i in $(seq 1 40); do
  if docker compose exec -T db mariadb-admin ping -h localhost --silent 2>/dev/null; then
    if curl -fsS http://127.0.0.1/ >/dev/null 2>&1; then
      break
    fi
  fi
  sleep 3
done

echo "==> Installing WP-CLI..."
docker compose exec -T wordpress bash -lc '
  if ! command -v wp >/dev/null 2>&1; then
    curl -fsSL https://raw.githubusercontent.com/wp-cli/builds/gh-pages/phar/wp-cli.phar -o /usr/local/bin/wp
    chmod +x /usr/local/bin/wp
  fi
'

echo "==> Installing WordPress..."
# shellcheck disable=SC1091
source .env

if ! wp core is-installed 2>/dev/null; then
  wp core install \
    --url="https://${DOMAIN}" \
    --title="${WP_TITLE}" \
    --admin_user="${WP_ADMIN_USER}" \
    --admin_password="${WP_ADMIN_PASSWORD}" \
    --admin_email="${WP_ADMIN_EMAIL}" \
    --skip-email
fi

wp option update blog_public 1
wp rewrite structure '/%postname%/'
wp rewrite flush --hard
wp option update timezone_string 'Europe/Istanbul'
wp option update blogdescription 'NexisAI kampanya içerikleri'
wp option update home "https://${DOMAIN}"
wp option update siteurl "https://${DOMAIN}"

echo "==> SEO: sitemap.xml + robots.txt"
wp rewrite flush --hard

if ! grep -q '^WORDPRESS_APP_PASSWORD=' .env 2>/dev/null; then
  APP_PASSWORD="$(wp user application-password create "${WP_ADMIN_USER}" "NexisAI API" --porcelain)"
  {
    echo "WORDPRESS_SITE_URL=https://${DOMAIN}"
    echo "WORDPRESS_USERNAME=${WP_ADMIN_USER}"
    echo "WORDPRESS_APP_PASSWORD=${APP_PASSWORD}"
  } >> .env
else
  # shellcheck disable=SC1091
  source .env
  APP_PASSWORD="${WORDPRESS_APP_PASSWORD:-}"
fi

echo ""
echo "============================================"
echo " WordPress: https://${DOMAIN}"
echo " Admin: https://${DOMAIN}/wp-admin"
echo " Kullanici: ${WP_ADMIN_USER}"
echo " Sifre: ${WP_ADMIN_PASSWORD}"
echo ""
echo " Vercel env:"
echo " WORDPRESS_SITE_URL=https://${DOMAIN}"
echo " WORDPRESS_USERNAME=${WP_ADMIN_USER}"
echo " WORDPRESS_APP_PASSWORD=${APP_PASSWORD}"
echo "============================================"
