#!/bin/sh
set -eu

: "${DOMAINS:?Set DOMAINS in .env}"
: "${PRIMARY_DOMAIN:?Set PRIMARY_DOMAIN in .env}"

export NGINX_SERVER_NAMES="${DOMAINS}"
export PRIMARY_DOMAIN
export API_STREAM_UPSTREAM="${API_STREAM_UPSTREAM:-82.38.66.139:8080}"
export API_FINLAND_UPSTREAM="${API_FINLAND_UPSTREAM:-82.38.66.139:8080}"
export HTTPS_PORT="${HTTPS_PORT:-8443}"

if [ "${HTTPS_PORT}" = "443" ]; then
  export HTTPS_PORT_SUFFIX=""
else
  export HTTPS_PORT_SUFFIX=":${HTTPS_PORT}"
fi

envsubst '${NGINX_SERVER_NAMES} ${PRIMARY_DOMAIN} ${API_STREAM_UPSTREAM} ${API_FINLAND_UPSTREAM} ${HTTPS_PORT} ${HTTPS_PORT_SUFFIX}' \
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
