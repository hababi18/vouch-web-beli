# Vouch & Social Proof Hub — Web

The frontend: a Telegram/Instagram-style feed of customer proof (photos,
videos, reactions). React + Vite + TypeScript + Tailwind. Talks to a
separately-deployed API — see the
[vouch-api repo](https://github.com/<your-username>/vouch-api) for that.

## Local development

```bash
npm install
npm run dev   # http://localhost:5173
```

This automatically uses `.env.development` (committed, not secret), which
points the app at `http://localhost:4000` — so also run the
[API](https://github.com/<your-username>/vouch-api) locally on that port.
See its README for setup.

Open http://localhost:5173. The admin panel opens with **Ctrl+Shift+A** or
by triple-clicking the footer copyright text, then log in with the
`ADMIN_PASSWORD` you set in the API's `.env`.

`src/config/hubConfig.ts` (channel name, bio, Telegram handle, avatar) is a
static frontend file — it rarely changes, so it isn't wired up to the API.
Ask if you want that editable from the admin panel too.

## Production build

```bash
npm ci
npm run build   # -> dist/
```

Deliberately **no** `VITE_API_URL` is set for this build — see
`.env.example` for why. The built app calls relative paths like
`/api/vouches`, which only works once Nginx is routing those to the API on
the same domain (see below).

## Deploying to a VPS

This site is meant to be served by Nginx, which also reverse-proxies to the
API running alongside it (see the
[vouch-api repo](https://github.com/<your-username>/vouch-api) for deploying
that half first — do that before this part).

```bash
# One-time VPS setup
sudo apt-get update && sudo apt-get install -y nginx

# Deploy
git clone <your-web-repo-url> vouch-web && cd vouch-web
npm ci
npm run build

sudo mkdir -p /var/www/vouch-web
sudo cp -r dist/* /var/www/vouch-web/

sudo cp deploy/nginx.conf.example /etc/nginx/sites-available/vouch
sudo nano /etc/nginx/sites-available/vouch   # set server_name to your domain
sudo ln -s /etc/nginx/sites-available/vouch /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx
```

Optional but recommended — HTTPS via Let's Encrypt:

```bash
sudo apt-get install -y certbot python3-certbot-nginx
sudo certbot --nginx -d your-domain.com
```

**Redeploying after a code change:**

```bash
git pull
npm ci
npm run build
sudo cp -r dist/* /var/www/vouch-web/
```

## Scripts

- `npm run dev` — Vite dev server
- `npm run build` — type-check + production build
- `npm run preview` — preview the production build locally
