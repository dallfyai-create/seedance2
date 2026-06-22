# Seedance Studio — Self-Hosted Package

This folder contains everything needed to run Seedance Studio (Shot Builder + Image Analyzer)
on your own hosting, with your own Anthropic API key kept safely on the server.

## What's in here

- `index.html` — the full app (Shot Builder tab + Image Analyzer tab)
- `server.js` — a small Express server that serves `index.html` and proxies image-analysis
  requests to Anthropic, so your API key never reaches the browser
- `package.json` — dependencies
- `.env.example` — template for your API key

## Why you need the server

The Image Analyzer tab calls Claude's API to read your uploaded image and write a prompt.
That call requires an API key. A key can never be placed in `index.html` directly — anyone
who views the page source would be able to steal it and use it on your account. The server
in this folder holds the key instead, and the page talks to *your* server, which talks to
Anthropic on your behalf.

The Shot Builder tab (the first tab) does **not** need the server or any API key — it works
entirely in the browser and you can open `index.html` directly for that tab alone if you want.

## 1. Get an Anthropic API key

Sign up / log in at https://console.anthropic.com and create a key under
**Settings → API Keys**. Copy it — you'll need it in step 3.

## 2. Install dependencies

Make sure you have Node.js 18 or newer installed (check with `node -v`), then in this folder:

```bash
npm install
```

## 3. Add your API key

```bash
cp .env.example .env
```

Open `.env` in a text editor and replace the placeholder with your real key:

```
ANTHROPIC_API_KEY=sk-ant-xxxxxxxxxxxxxxxxxxxxx
```

## 4. Run it locally to test

```bash
npm start
```

You should see:

```
Seedance Studio server running at http://localhost:3000
```

Open that URL in your browser. Try the Image Analyzer tab — upload an image, write an
intent, click Analyze. If it works locally, you're ready to deploy.

If something's wrong, visit `http://localhost:3000/api/health` — it will tell you whether
the server sees your API key (`"hasApiKey": true/false`).

---

## Deploying to your own hosting

### Option A — A VPS / your own server (DigitalOcean, Linode, a shared Node host, etc.)

1. Upload this entire folder to your server (via `git push`, `scp`, FTP, or your host's file manager)
2. SSH in, `cd` into the folder, run `npm install`
3. Create the `.env` file on the server itself (step 3 above) — never upload your local `.env`
4. Run `npm start`, or better, keep it alive with a process manager:
   ```bash
   npm install -g pm2
   pm2 start server.js --name seedance-studio
   pm2 save
   ```
5. Point your domain/subdomain at this Node process. If your host uses nginx as a reverse
   proxy in front of Node apps (common on shared hosting and most VPS setups), add a server
   block that proxies to `http://localhost:3000` — your hosting provider's docs will show
   the exact nginx config they expect.

### Option B — Render.com (free tier available, simplest for most people)

1. Push this folder to a GitHub repo
2. On Render: **New → Web Service**, connect the repo
3. Build command: `npm install`
4. Start command: `npm start`
5. Add an environment variable in Render's dashboard: `ANTHROPIC_API_KEY` = your key
6. Deploy — Render gives you a URL automatically

### Option C — Railway.app

1. Push this folder to a GitHub repo
2. On Railway: **New Project → Deploy from GitHub repo**
3. Railway auto-detects Node and runs `npm install` + `npm start`
4. In the project's **Variables** tab, add `ANTHROPIC_API_KEY` = your key
5. Deploy — Railway gives you a URL automatically

---

## Important notes

- **Never** put your API key directly in `index.html` or any file the browser downloads.
  It must only ever live in `.env` (locally) or your host's environment-variable settings
  (in production).
- **Never commit `.env`** to git — `.gitignore` is already set up to exclude it.
- This proxy has no rate limiting or auth of its own. If this page is public, anyone who
  finds it can use your Anthropic credits by calling the Image Analyzer tab repeatedly.
  For a public-facing deployment, consider adding a simple shared password check or rate
  limit inside `server.js` before forwarding to Anthropic.
- The model used is `claude-sonnet-4-6`. If you want a different model, change the default
  in `server.js` (`model: model || 'claude-sonnet-4-6'`).
