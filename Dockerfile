FROM node:22-alpine AS builder

WORKDIR /app

RUN corepack enable

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./

RUN pnpm install --frozen-lockfile

COPY index.html vite.config.ts tsconfig.json tsconfig.node.json postcss.config.mjs ./
COPY src ./src

RUN pnpm build

FROM nginx:1.27-alpine

RUN apk add --no-cache openssl gettext \
  && rm -f /etc/nginx/conf.d/default.conf

COPY --from=builder /app/dist /var/www/html
RUN mkdir -p /var/www/static
COPY bfoto_ru_4762.jpg /var/www/static/bfoto_ru_4762.jpg
COPY nginx/nginx.conf.template /etc/nginx/nginx.conf.template
COPY nginx/docker-entrypoint.sh /docker-entrypoint-custom.sh
RUN chmod +x /docker-entrypoint-custom.sh

EXPOSE 80 8443

ENTRYPOINT ["/docker-entrypoint-custom.sh"]
CMD ["nginx", "-g", "daemon off;"]
