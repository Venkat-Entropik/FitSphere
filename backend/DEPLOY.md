# Deploying the FitSphere backend (Railway)

The backend is one container: Fastify + SQLite. SQLite is a file, so the container needs a **volume**
that survives restarts, and you must run **one instance only**.

## 1. Create the service

1. Push this repo to GitHub.
2. In Railway: **New Project → Deploy from GitHub repo** → pick the repo.
3. Open the service → **Settings → Source → Root Directory** → set `/backend`.
   Railway finds `backend/Dockerfile` and builds it.
4. **Settings → Networking → Generate Domain**. You get `https://<name>.up.railway.app`.

## 2. Add the volume

Service → **Volumes → New Volume** → mount path `/data`.
The database lives at `/data/fitsphere.db` (the Dockerfile sets this). Without the volume, every deploy
wipes all accounts and data.

## 3. Set variables

Service → **Variables**:

| Variable | Value |
|---|---|
| `JWT_SECRET` | Required. A long random string: `node -e "console.log(require('crypto').randomBytes(48).toString('base64url'))"` |
| `TRUST_PROXY` | `true`. Required on Railway, otherwise every user shares one IP for rate limits and lockouts. |
| `CORS_ORIGINS` | Only if you serve the app on the web: your web origin, e.g. `https://app.example.com`. Native apps ignore CORS. |
| `GEMINI_API_KEY` | Optional. Without it the coach uses built-in rule-based answers. Never put this in the app. |
| `GEMINI_MODEL` | Optional. Default `gemini-3.8-flash`. |

Do not set `PORT`, `HOST` or `DATABASE_PATH`; the platform and Dockerfile handle them.
Railway keeps **replicas at 1** by default. Do not scale it up (rate limits are in memory and SQLite is a single file).

## 4. Check it works

```bash
curl https://<your-domain>/health          # {"status":"ok"}
curl -i https://<your-domain>/profile      # 401, not 404
```

Register an account from the app, redeploy the service, and sign in again. If the account is gone, the
volume is not mounted at `/data`.

## 5. Point the app at it

At build time (EAS build profile `env`, or `.env` for a local build):

```
EXPO_PUBLIC_API_URL=https://<your-domain>
EXPO_PUBLIC_USE_MOCKS=false
```

iOS requires HTTPS, which Railway provides. These values are bundled into the app, so never put secrets here.

## Before real users

- **Back up the volume.** Use Railway's volume backups if your plan has them, or copy `/data/fitsphere.db`
  on a schedule.
- **Account deletion and password reset** do not exist yet. App stores require in-app account deletion.
- **Postgres.** If you need more than one instance, move to Postgres (the SQL is plain ANSI) and a shared
  rate-limit store.
- **Logs.** View them in Railway. They show method, path, status and errors only; request bodies, headers,
  tokens and passwords are never logged.

## Other hosts

The same Dockerfile runs on Fly.io and Render. Mount a persistent disk at `/data`, set the same variables,
and keep a single instance.
