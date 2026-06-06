# Mobile Image Converter App

Клиентское SPA для конвертации JPG ↔ PNG прямо в браузере.

## Локальная разработка

```bash
pnpm install
pnpm dev
```

## Production (Docker + nginx)

Шаблон: [`nginx/nginx.conf.template`](nginx/nginx.conf.template) — поддомены подставляются из `.env` при старте контейнера.

`network_mode: host` — nginx слушает **80** (HTTP + ACME) и **8443** (HTTPS/TLS). Порт **443 не используется**.

### `.env`

```bash
cp .env.example .env
```

| Переменная | Описание |
|---|---|
| `DOMAINS` | Поддомены через пробел |
| `PRIMARY_DOMAIN` | Первый домен — путь к сертификату LE |
| `ACME_EMAIL` | Email для Let's Encrypt |
| `API_STREAM_UPSTREAM` | Backend для `/api/stream` (`host:port`) |
| `API_FINLAND_UPSTREAM` | Backend для `/api/finland` (`host:port`) |
| `HTTPS_PORT` | HTTPS-порт с TLS (по умолчанию `8443`) |

Пример:

```env
DOMAINS="pl2.choombavpn.com media.choombavpn.com"
PRIMARY_DOMAIN=pl2.choombavpn.com
ACME_EMAIL=admin@example.com
API_STREAM_UPSTREAM=82.38.66.139:8080
API_FINLAND_UPSTREAM=82.38.66.139:8080
HTTPS_PORT=8443
```

HTTP-редирект ведёт на `https://домен:8443/...`.

**Cloudflare:** укажите origin port **8443** (Origin Rules). Клиенты ходят на `:443` через CF, CF стучится на ваш сервер `:8443`.

Один SAN-сертификат хранится в `/etc/letsencrypt/live/${PRIMARY_DOMAIN}/`.

### Первый запуск

```bash
docker compose up -d --build
```

### Let's Encrypt (один раз)

```bash
chmod +x scripts/init-certs.sh
./scripts/init-certs.sh
```

Cloudflare proxy выключить (серое облако) на всех доменах из `DOMAINS` на время выпуска cert.

### Продление сертификата

```bash
chmod +x scripts/renew-certs.sh
./scripts/renew-certs.sh
```

Или cron на хосте: `0 3 * * * /opt/abcde/scripts/renew-certs.sh`

Backend `/api/stream` и `/media`: **`API_STREAM_UPSTREAM`** и **`API_FINLAND_UPSTREAM`** в `.env`.

Скачивание картинки: **`GET /download/image`** → файл `bfoto_ru_4762.jpg` (в корне репозитория).

### Проверка

```bash
docker compose exec nginx nginx -t
docker compose exec nginx grep listen /etc/nginx/nginx.conf

curl -skI "https://127.0.0.1:8443/download/image" -H "Host: dirpl.choombavpn.com"
openssl s_client -connect 127.0.0.1:8443 -servername dirpl.choombavpn.com </dev/null 2>&1 | head -5
```
