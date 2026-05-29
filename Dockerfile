FROM node:22-alpine AS builder

WORKDIR /app

RUN corepack enable

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./

RUN pnpm install --frozen-lockfile

COPY index.html vite.config.ts tsconfig.json tsconfig.node.json postcss.config.mjs ./
COPY src ./src

RUN pnpm build

FROM caddy:2-alpine

COPY --from=builder /app/dist /srv
COPY Caddyfile /etc/caddy/Caddyfile

EXPOSE 80 443
