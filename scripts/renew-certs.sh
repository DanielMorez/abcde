#!/bin/sh
set -eu

cd "$(dirname "$0")/.."

echo "Stopping nginx..."
docker compose stop nginx

echo "Renewing certificates..."
docker compose run --rm --entrypoint certbot certbot renew --standalone --disable-hook-validation

echo "Starting nginx..."
docker compose up -d --no-build nginx

echo "Done."
