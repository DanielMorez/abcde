#!/bin/sh
set -eu

cd "$(dirname "$0")/.."

if [ -f .env ]; then
  set -a
  # shellcheck disable=SC1091
  . ./.env
  set +a
fi

: "${DOMAIN:?Set DOMAIN in .env}"
: "${ACME_EMAIL:?Set ACME_EMAIL in .env}"

echo "Creating dummy certificate for ${DOMAIN} (if missing)..."
docker compose run --rm --entrypoint sh certbot -c "
  if [ ! -f /etc/letsencrypt/live/${DOMAIN}/fullchain.pem ]; then
    mkdir -p /etc/letsencrypt/live/${DOMAIN}
    openssl req -x509 -nodes -newkey rsa:4096 -days 1 \
      -keyout /etc/letsencrypt/live/${DOMAIN}/privkey.pem \
      -out /etc/letsencrypt/live/${DOMAIN}/fullchain.pem \
      -subj '/CN=${DOMAIN}'
  fi
"

echo "Starting nginx..."
docker compose up -d nginx

echo "Stopping nginx for standalone ACME..."
docker compose stop nginx

echo "Requesting Let's Encrypt certificate..."
docker compose run --rm certbot certonly --standalone \
  -d "${DOMAIN}" \
  --email "${ACME_EMAIL}" \
  --agree-tos \
  --no-eff-email

echo "Starting nginx..."
docker compose up -d nginx

echo "Done."
