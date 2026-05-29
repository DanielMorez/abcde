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

Стек: multi-stage Docker-образ (Node → Caddy) с **automatic HTTPS** (Let's Encrypt, HTTP → HTTPS redirect).

Caddy включает HTTPS автоматически для `{$DOMAIN}` в Caddyfile — отдельный `default_server` / ssl-блок как в nginx не нужен.

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

### Маршрутизация (handle)

| Путь | Куда |
|------|------|
| `/api/stream*` | `reverse_proxy` на `127.0.0.1:8080` (VLESS xhttp) |
| `/` и остальные | SPA: `try_files` → `index.html`, `file_server` в `/srv` |

### Проверка после деплоя

```bash
docker compose build --no-cache && docker compose up -d
docker compose exec web caddy validate --config /etc/caddy/Caddyfile

# HTTP → HTTPS redirect
curl -sI -H "Host: $DOMAIN" http://127.0.0.1/

# /api/stream — backend или 502, но не HTML SPA
curl -s -H "Host: $DOMAIN" http://127.0.0.1/api/stream | head -3

# главная — HTML приложения
curl -s "https://$DOMAIN/" | grep -o '<title>.*</title>'
```

Проверка xhttp backend (должен слушать `127.0.0.1:8080` или `0.0.0.0:8080`):

```bash
curl -v http://127.0.0.1:8080/api/stream
```

Проверка upstream из Docker-контейнera (если backend на хосте — `127.0.0.1` внутри контейнera не подойдёт, используйте `network_mode: host`):

```bash
docker compose exec web wget -S -O- "http://127.0.0.1:8080/api/stream"
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
| 502 Bad Gateway | `handle /api/stream*` работает, но backend на `:8080` недоступен |
| HTML главной на `/api/stream` | Старый образ — `docker compose up -d --build` |
| Connection refused на :8080 | xhttp-сервис не запущен или слушает только другой интерфейс |
| Изменения не видны | `docker compose up -d --build` |

## Стек

- React 18 + Vite 6 + Tailwind CSS 4
- Caddy 2 (static file server, gzip/zstd, security headers)
- Docker Compose
