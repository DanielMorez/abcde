# Mobile Image Converter App

Клиентское SPA для конвертации JPG ↔ PNG прямо в браузере.

## Локальная разработка

```bash
pnpm install
pnpm dev
```

## Production (Docker + nginx)

Один конфиг: [`nginx/nginx.conf`](nginx/nginx.conf) — без template и `conf.d`.

`network_mode: host` — nginx видит `127.0.0.1:8080` на хосте.

Домен и пути к сертификатам прописаны в `nginx.conf` (`media.choombavpn.com`).

### Первый запуск

```bash
docker compose up -d --build
```

При первом запуске `cert-init` создаёт временный self-signed сертификат, чтобы nginx не падал.

### Let's Encrypt (один раз)

```bash
cp .env.example .env   # укажите ACME_EMAIL
chmod +x scripts/init-certs.sh
./scripts/init-certs.sh
```

Backend xhttp: **`127.0.0.1:8080`** на хосте.

### Проверка

```bash
docker compose exec nginx nginx -t
curl -sI "https://media.choombavpn.com/"
```
