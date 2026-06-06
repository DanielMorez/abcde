#!/bin/sh
set -eu

cd "$(dirname "$0")/.."

pnpm install --frozen-lockfile
pnpm build

rm -rf nginx/html
cp -r dist nginx/html

echo "Frontend copied to nginx/html/"
