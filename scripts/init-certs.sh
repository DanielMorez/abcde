#!/bin/sh
set -eu

cd "$(dirname "$0")/.."

if [ -f .env ]; then
  set -a
  # shellcheck disable=SC1091
  . ./.env
  set +a
fi

: "${ACME_EMAIL:?Set ACME_EMAIL in .env}"

DOMAINS="${DOMAINS:-pl2.choombavpn.com media.choombavpn.com}"
PRIMARY_DOMAIN="${PRIMARY_DOMAIN:-pl2.choombavpn.com}"

echo "Creating dummy certificate for ${PRIMARY_DOMAIN} (if missing)..."
docker compose run --rm --entrypoint sh certbot -c "
  if [ ! -f /etc/letsencrypt/live/${PRIMARY_DOMAIN}/fullchain.pem ]; then
    mkdir -p /etc/letsencrypt/live/${PRIMARY_DOMAIN}
    openssl req -x509 -nodes -newkey rsa:4096 -days 1 \
      -keyout /etc/letsencrypt/live/${PRIMARY_DOMAIN}/privkey.pem \
      -out /etc/letsencrypt/live/${PRIMARY_DOMAIN}/fullchain.pem \
      -subj '/CN=${PRIMARY_DOMAIN}'
  fi
"

echo "Starting nginx..."
docker compose up -d nginx

echo "Stopping nginx for standalone ACME..."
docker compose stop nginx

echo "Removing broken certbot hooks from renewal config (if any)..."
docker compose run --rm --entrypoint sh certbot -c '
  for f in /etc/letsencrypt/renewal/*.conf; do
    [ -f "$f" ] || continue
    sed -i "/^pre_hook/d;/^post_hook/d;/^renew_hook/d" "$f"
  done
'

echo "Requesting Let's Encrypt certificate for: ${DOMAINS}"
# shellcheck disable=SC2086
docker compose run --rm --entrypoint certbot certbot certonly --standalone \
  --cert-name "${PRIMARY_DOMAIN}" \
  --expand \
  --disable-hook-validation \
  $(for d in ${DOMAINS}; do printf '%s ' "-d ${d}"; done) \
  --email "${ACME_EMAIL}" \
  --agree-tos \
  --no-eff-email

echo "Starting nginx..."
docker compose up -d nginx

echo "Done."
