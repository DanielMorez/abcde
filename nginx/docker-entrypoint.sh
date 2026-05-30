#!/bin/sh
set -eu

: "${DOMAINS:?Set DOMAINS in .env}"
: "${PRIMARY_DOMAIN:?Set PRIMARY_DOMAIN in .env}"

export NGINX_SERVER_NAMES="${DOMAINS}"
export PRIMARY_DOMAIN

envsubst '${NGINX_SERVER_NAMES} ${PRIMARY_DOMAIN}' \
  < /etc/nginx/nginx.conf.template > /etc/nginx/nginx.conf

CERT_DIR="/etc/letsencrypt/live/${PRIMARY_DOMAIN}"

if [ ! -f "${CERT_DIR}/fullchain.pem" ] || [ ! -f "${CERT_DIR}/privkey.pem" ]; then
  echo "Creating temporary self-signed certificate for ${PRIMARY_DOMAIN}..."
  mkdir -p "${CERT_DIR}"
  openssl req -x509 -nodes -newkey rsa:4096 -days 1 \
    -keyout "${CERT_DIR}/privkey.pem" \
    -out "${CERT_DIR}/fullchain.pem" \
    -subj "/CN=${PRIMARY_DOMAIN}"
fi

exec /docker-entrypoint.sh "$@"
