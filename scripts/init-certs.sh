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

echo "Stopping nginx..."
docker compose stop nginx

echo "Removing broken certbot hooks from renewal config (if any)..."
docker compose run --rm --entrypoint sh certbot -c '
  for f in /etc/letsencrypt/renewal/*.conf; do
    [ -f "$f" ] || continue
    sed -i "/^pre_hook/d;/^post_hook/d;/^renew_hook/d" "$f"
  done
'

echo "Checking existing certificate..."
HAS_LE=$(docker compose run --rm --entrypoint sh certbot -c "
  cert='/etc/letsencrypt/live/${PRIMARY_DOMAIN}/fullchain.pem'
  if [ -f \"\$cert\" ] && openssl x509 -in \"\$cert\" -noout -issuer 2>/dev/null | grep -qi 'lets encrypt'; then
    echo LE_YES
  else
    echo LE_NO
  fi
" | grep -E '^LE_(YES|NO)$' | tail -1)

if [ "${HAS_LE}" = "LE_YES" ]; then
  echo "Valid Let's Encrypt certificate found, will expand if needed."
  EXPAND_FLAG="--expand"
else
  echo "Removing self-signed or broken certificate for ${PRIMARY_DOMAIN}..."
  docker compose run --rm --entrypoint sh certbot -c "
    rm -rf /etc/letsencrypt/live/${PRIMARY_DOMAIN}
    rm -rf /etc/letsencrypt/archive/${PRIMARY_DOMAIN}
    rm -f /etc/letsencrypt/renewal/${PRIMARY_DOMAIN}.conf
  "
  EXPAND_FLAG=""
fi

echo "Requesting Let's Encrypt certificate for: ${DOMAINS}"
# shellcheck disable=SC2086
docker compose run --rm --entrypoint certbot certbot certonly --standalone \
  --cert-name "${PRIMARY_DOMAIN}" \
  ${EXPAND_FLAG} \
  --disable-hook-validation \
  $(for d in ${DOMAINS}; do printf '%s ' "-d ${d}"; done) \
  --email "${ACME_EMAIL}" \
  --agree-tos \
  --no-eff-email

echo "Starting nginx..."
docker compose up -d --no-build nginx

echo "Verify:"
docker compose run --rm --entrypoint sh certbot -c \
  "openssl x509 -in /etc/letsencrypt/live/${PRIMARY_DOMAIN}/fullchain.pem -noout -issuer -ext subjectAltName"

echo "Done."
