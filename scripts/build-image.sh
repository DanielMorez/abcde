#!/bin/sh
set -eu

cd "$(dirname "$0")/.."

if [ ! -f nginx/html/index.html ]; then
  echo "nginx/html/ not found. Build frontend first:"
  echo "  chmod +x scripts/build-frontend.sh && ./scripts/build-frontend.sh"
  echo "Or on a machine with Node.js: pnpm install && pnpm build && cp -r dist nginx/html"
  exit 1
fi

docker compose build nginx "$@"
