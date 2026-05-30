# Mobile Image Converter App

Клиентское SPA для конвертации JPG ↔ PNG прямо в браузере.

## Локальная разработка

```bash
pnpm install
pnpm dev
```

## Production (Docker + nginx)

Шаблон: [`nginx/nginx.conf.template`](nginx/nginx.conf.template) — поддомены подставляются из `.env` при старте контейнера.

`network_mode: host` — nginx слушает 80/443 на хосте.

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

Пример:

```env
DOMAINS="pl2.choombavpn.com media.choombavpn.com"
PRIMARY_DOMAIN=pl2.choombavpn.com
ACME_EMAIL=admin@example.com
API_STREAM_UPSTREAM=82.38.66.139:8080
```

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

Backend `/api/stream`: **`API_STREAM_UPSTREAM`** в `.env` (по умолчанию `82.38.66.139:8080`).

### Проверка

```bash
docker compose exec nginx nginx -t
curl -sI "https://pl2.choombavpn.com/"
curl -sI "https://dirpl.choombavpn.com/"
```
