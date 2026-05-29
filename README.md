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

## Production deployment (Docker + Caddy)

Стек: multi-stage Docker-образ (Node → Caddy) с автоматическим HTTPS через Let's Encrypt.

### Требования

- VPS с Docker и Docker Compose v2
- Домен с DNS A/AAAA-записью на IP сервера
- Открытые порты **80** и **443**

### Шаги деплоя

1. Скопируйте переменные окружения:

```bash
cp .env.example .env
```

2. Отредактируйте `.env`:

```env
DOMAIN=converter.example.com
ACME_EMAIL=admin@example.com
STREAM_UPSTREAM=host.docker.internal:88
```

3. Соберите и запустите:

```bash
docker compose up -d --build
```

4. Проверьте статус:

```bash
docker compose ps
docker compose logs -f web
```

Caddy автоматически получит TLS-сертификат и перенаправит HTTP → HTTPS.

### Маршрутизация

| Путь | Куда |
|------|------|
| `/` и остальные | Статический SPA (`/srv`) |
| `/api/stream` | Reverse proxy на `STREAM_UPSTREAM` (по умолчанию `172.17.0.1:88` — IP хоста из Docker-сети) |

Если stream-сервис в другом Docker-контейнере, укажите его hostname, например `STREAM_UPSTREAM=stream:88`.

Проверка upstream из контейнera:

```bash
# Узнать IP шлюза (если 172.17.0.1 не подходит)
docker compose exec web ip route | awk '/default/ {print $3}'

# Проверить доступность stream-сервиса
docker compose exec web wget -S -O- "http://172.17.0.1:88/api/stream"
```

### Полезные команды

```bash
# Пересборка после изменений
docker compose up -d --build

# Остановка
docker compose down

# Остановка с удалением сертификатов (осторожно!)
docker compose down -v
```

### Troubleshooting

| Проблема | Решение |
|----------|---------|
| Сертификат не выдаётся | Проверьте DNS, порты 80/443 и логи `docker compose logs web` |
| 502 Bad Gateway | Route работает, но upstream на :88 недоступен |
| HTML главной на `/api/stream` | Старый Caddyfile в контейнере — пересоберите образ |
| Изменения не видны | `docker compose up -d --build` |

## Стек

- React 18 + Vite 6 + Tailwind CSS 4
- Caddy 2 (static file server, gzip/zstd, security headers)
- Docker Compose
