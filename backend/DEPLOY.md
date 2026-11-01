# Deploying the FitSphere backend

The backend is one container: Fastify + SQLite. SQLite is a file, so the container needs a **volume**
that survives restarts, and you must run **one instance only**.

## Option A: Render (blueprint)

Render attaches a persistent disk to a paid web service (the entry plan is about $7 a month, plus about
$0.25 per GB of disk; check their pricing page). `render.yaml` at the repo root sets everything up.

1. Push the repo to GitHub and sign up at render.com (GitHub login is simplest).
2. **New → Blueprint** → pick the `FitSphere` repo → Render reads `render.yaml`.
3. When prompted, leave `GEMINI_API_KEY`, `RESEND_API_KEY` and `MAIL_FROM` blank if you don't have them yet
   (add them later under the service's **Environment** tab). `JWT_SECRET` is generated for you.
4. Click **Apply**. The first build takes a few minutes. Your URL is `https://fitsphere-backend-xxxx.onrender.com`.
5. Check it, as in "Check it works" below. The disk is mounted at `/data`, so data survives redeploys.

A disk means a few seconds of downtime on each deploy, and you can't scale past one instance.

## Option B: Railway

(Railway paused new signups after an incident; if you can't register, use Option A.)

### 1. Create the service

1. Push this repo to GitHub.
2. In Railway: **New Project → Deploy from GitHub repo** → pick the repo.
3. Open the service → **Settings → Source → Root Directory** → set `/backend`.
   Railway finds `backend/Dockerfile` and builds it.
4. **Settings → Networking → Generate Domain**. You get `https://<name>.up.railway.app`.

### 2. Add the volume

Service → **Volumes → New Volume** → mount path `/data`.
The database lives at `/data/fitsphere.db` (the Dockerfile sets this). Without the volume, every deploy
wipes all accounts and data.

### 3. Set variables

Service → **Variables**:

| Variable         | Value                                                                                                                                                                      |
| ---------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `JWT_SECRET`     | Required. A long random string: `node -e "console.log(require('crypto').randomBytes(48).toString('base64url'))"`                                                           |
| `TRUST_PROXY`    | `true`. Required on Railway, otherwise every user shares one IP for rate limits and lockouts.                                                                              |
| `CORS_ORIGINS`   | Only if you serve the app on the web: your web origin, e.g. `https://app.example.com`. Native apps ignore CORS.                                                            |
| `RESEND_API_KEY` | Needed for password reset emails. Create a key at resend.com and verify a sending domain. Without it, no email is sent (reset codes only print to the log in development). |
| `MAIL_FROM`      | The sender, e.g. `FitSphere <no-reply@yourdomain.com>`. Must be on a domain verified in Resend.                                                                            |
| `GEMINI_API_KEY` | Optional. Without it the coach uses built-in rule-based answers. Never put this in the app.                                                                                |
| `GEMINI_MODEL`   | Optional. Default `gemini-3.8-flash`.                                                                                                                                      |

Do not set `PORT`, `HOST` or `DATABASE_PATH`; the platform and Dockerfile handle them.
Railway keeps **replicas at 1** by default. Do not scale it up (rate limits are in memory and SQLite is a single file).

## Check it works (either host)

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
- **Test the reset email** once with your real `RESEND_API_KEY`: use Forgot password in the app and check that the code arrives (and isn't in spam).
- **Postgres.** If you need more than one instance, move to Postgres (the SQL is plain ANSI) and a shared
  rate-limit store.
- **Logs.** View them in Railway. They show method, path, status and errors only; request bodies, headers,
  tokens and passwords are never logged.

## Other hosts

The same Dockerfile runs on Fly.io and Render. Mount a persistent disk at `/data`, set the same variables,
and keep a single instance.
