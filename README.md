# Mobile Image Converter App

Клиентское SPA для конвертации JPG ↔ PNG прямо в браузере.

## Локальная разработка

```bash
pnpm install
pnpm dev
```

## Production (Docker + nginx)

Шаблон: [`nginx/nginx.conf.template`](nginx/nginx.conf.template) — поддомены подставляются из `.env` при старте контейнера.

`network_mode: host` — nginx видит `127.0.0.1:8080` на хосте.

### `.env`

```bash
cp .env.example .env
```

| Переменная | Описание |
|---|---|
| `DOMAINS` | Поддомены через пробел |
| `PRIMARY_DOMAIN` | Первый домен — путь к сертификату LE |
| `ACME_EMAIL` | Email для Let's Encrypt |

Пример:

```env
DOMAINS="pl2.choombavpn.com media.choombavpn.com"
PRIMARY_DOMAIN=pl2.choombavpn.com
ACME_EMAIL=admin@example.com
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

Backend xhttp: **`127.0.0.1:8080`** на хосте.

### Проверка

```bash
docker compose exec nginx nginx -t
curl -sI "https://pl2.choombavpn.com/"
curl -sI "https://media.choombavpn.com/"
```
