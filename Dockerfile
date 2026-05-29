FROM node:22-alpine AS builder

WORKDIR /app

RUN corepack enable

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./

RUN pnpm install --frozen-lockfile

COPY index.html vite.config.ts tsconfig.json tsconfig.node.json postcss.config.mjs ./
COPY src ./src

RUN pnpm build

FROM nginx:1.27-alpine

RUN rm -f /etc/nginx/conf.d/default.conf

COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx/default_https.conf /etc/nginx/default_https.conf
COPY nginx/nginx.conf.template /etc/nginx/templates/nginx.conf.template

EXPOSE 80 443
