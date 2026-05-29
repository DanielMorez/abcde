# Mobile Image Converter App

Клиентское SPA для конвертации JPG ↔ PNG прямо в браузере. Оригинальный дизайн: [Figma](https://www.figma.com/design/rV2pkuUIOXJx6xWh7zxX05/Mobile-Image-Converter-App).

## Локальная разработка

```bash
pnpm install
pnpm dev
```

Приложение будет доступно на `http://localhost:5173`.

Проверка production-сборки без Docker:

```bash
pnpm build
pnpm preview
```

## Production deployment (Docker + nginx + TLS)

Стек: multi-stage Docker-образ (Node → nginx) с **Let's Encrypt** (certbot).

Общие HTTP-настройки: [`nginx/default_https.conf`](nginx/default_https.conf). Основной конфиг: [`nginx/nginx.conf.template`](nginx/nginx.conf.template) (envsubst → `/etc/nginx/nginx.conf`).

### Требования

- VPS с Docker и Docker Compose v2
- DNS A/AAAA домена на IP сервера
- Открытые порты **80** и **443**
- xhttp backend на хосте, слушает **`0.0.0.0:8081`**

### Первый деплой с TLS

1. Скопируйте переменные окружения:

```bash
cp .env.example .env
```

2. Отредактируйте `.env`:

```env
DOMAIN=media.choombavpn.com
ACME_EMAIL=admin@example.com
```

3. Инициализация сертификата и запуск:

```bash
chmod +x scripts/init-certs.sh
./scripts/init-certs.sh
docker compose up -d
```

Скрипт создаёт временный сертификат (чтобы nginx стартовал), запрашивает Let's Encrypt через webroot и перезагружает nginx.

4. Проверка:

```bash
docker compose exec nginx nginx -t
curl -sI "https://media.choombavpn.com/"
```

### Маршрутизация

| Путь | Куда |
|------|------|
| HTTP `/_` (не домен) | `404` |
| HTTP домена | `301` → HTTPS |
| HTTPS `/_` (не домен) | `ssl_reject_handshake` |
| `/api/stream` | `proxy_pass` → `host.docker.internal:8081` |
| `/` и остальное | SPA: `try_files` → `index.html` |

### Проверка

```bash
docker compose exec nginx wget -S -O- "http://host.docker.internal:8081/api/stream"
curl -sI "https://media.choombavpn.com/api/stream" | head -10
```

### Cloudflare

Если домен за Cloudflare — режим **Full (strict)** после выпуска LE-сертификата. Для `/api/stream` — **Cache: Bypass**.

### Полезные команды

```bash
docker compose up -d --build
docker compose exec nginx nginx -s reload
docker compose logs -f certbot
docker compose down
```

### Troubleshooting

| Проблема | Решение |
|----------|---------|
| nginx не стартует (нет cert) | `./scripts/init-certs.sh` |
| 502 на `/api/stream` | Backend на :8081 не запущен или слушает только `127.0.0.1` |
| ACME fail | DNS, порты 80/443, логи `docker compose logs certbot` |

## Стек

- React 18 + Vite 6 + Tailwind CSS 4
- nginx 1.27 + certbot
- Docker Compose
