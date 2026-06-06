#!/bin/sh
set -eu

: "${DOMAINS:?Set DOMAINS in .env}"
: "${PRIMARY_DOMAIN:?Set PRIMARY_DOMAIN in .env}"

NGINX_SERVER_NAMES="${DOMAINS}"
API_STREAM_UPSTREAM="${API_STREAM_UPSTREAM:-82.38.66.139:8080}"
API_FINLAND_UPSTREAM="${API_FINLAND_UPSTREAM:-82.38.66.139:8080}"
HTTPS_PORT="${HTTPS_PORT:-8443}"

if [ "${HTTPS_PORT}" = "443" ]; then
  HTTPS_PORT_SUFFIX=""
else
  HTTPS_PORT_SUFFIX=":${HTTPS_PORT}"
fi

sed \
  -e "s|\${NGINX_SERVER_NAMES}|${NGINX_SERVER_NAMES}|g" \
  -e "s|\${PRIMARY_DOMAIN}|${PRIMARY_DOMAIN}|g" \
  -e "s|\${API_STREAM_UPSTREAM}|${API_STREAM_UPSTREAM}|g" \
  -e "s|\${API_FINLAND_UPSTREAM}|${API_FINLAND_UPSTREAM}|g" \
  -e "s|\${HTTPS_PORT}|${HTTPS_PORT}|g" \
  -e "s|\${HTTPS_PORT_SUFFIX}|${HTTPS_PORT_SUFFIX}|g" \
  /etc/nginx/nginx.conf.template > /etc/nginx/nginx.conf

exec /docker-entrypoint.sh "$@"
