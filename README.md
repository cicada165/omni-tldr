# omni-discord ⌬

> AI-powered daily investment intelligence from Discord communities.

A Next.js application that reads Discord channels via the official bot API, generates structured investment summaries using GPT-4o, and serves them on a hosted dashboard. Runs automatically every day at 6AM PST via Vercel Cron.

---

## Features

- 📡 **Discord Bot ingestion** — reads messages from any configured channels or all channels in a server
- 🤖 **GPT-4o analysis** — structured signal extraction: tickers, sentiment, confidence, risk flags
- 📊 **Live dashboard** — view today's signals, watchlist, and narrative summary
- 📚 **History** — browse up to 90 days of past summaries
- ⏰ **Daily cron** — auto-runs at 6AM PST via Vercel Cron
- 🔌 **Extensible** — add more channels or data sources via env vars

---

## Setup

### 1. Create a Discord Bot

1. Go to [discord.com/developers/applications](https://discord.com/developers/applications)
2. Click **New Application** → name it `omni-discord`
3. Go to **Bot** tab → click **Add Bot**
4. Under **Privileged Gateway Intents**, enable:
   - ✅ **Message Content Intent**
5. Copy the **Token** → this is your `DISCORD_BOT_TOKEN`
6. Go to **OAuth2 → URL Generator**:
   - Scopes: `bot`
   - Bot Permissions: `Read Messages/View Channels` + `Read Message History`
7. Open the generated URL and add the bot to your server

### 2. Get Channel IDs (Optional)

Enable Discord Developer Mode: **Settings → Advanced → Developer Mode**

Right-click any channel → **Copy Channel ID**

If you skip this, the bot will read ALL text channels in the server.

### 3. Environment Variables

Copy `.env.example` to `.env.local` and fill in:

```bash
cp .env.example .env.local
```

| Variable | Required | Description |
|---|---|---|
| `DISCORD_BOT_TOKEN` | ✅ | Your Discord bot token |
| `DISCORD_SERVER_ID` | ✅ | Server ID (default: `1419986599340675155`) |
| `DISCORD_CHANNEL_IDS` | optional | Comma-separated channel IDs (omit = all channels) |
| `OPENAI_API_KEY` | ✅ | OpenAI API key for GPT-4o |
| `KV_REST_API_URL` | ✅ | Vercel KV URL |
| `KV_REST_API_TOKEN` | ✅ | Vercel KV token |
| `CRON_SECRET` | ✅ | Random secret for cron auth |

Generate a cron secret:
```bash
openssl rand -hex 32
```

### 4. Deploy to Vercel

#### Option A: GitHub Integration (recommended)

1. Push this repo to GitHub
2. Go to [vercel.com](https://vercel.com) → **New Project** → import the repo
3. Go to **Storage** → **Create KV Database** → link it to your project
4. Add all environment variables in **Project Settings → Environment Variables**
5. Deploy — the cron will auto-run daily at 6AM PST

#### Option B: Vercel CLI

```bash
npm i -g vercel
vercel login
vercel --prod
```

### 5. Run Locally

```bash
npm install
npm run dev
```

Visit `http://localhost:3000`

### 6. Trigger a Summary Manually

```bash
curl -H "Authorization: Bearer YOUR_CRON_SECRET" \
  https://your-app.vercel.app/api/cron/daily-summary
```

Or force regeneration of today's summary:
```bash
curl -H "Authorization: Bearer YOUR_CRON_SECRET" \
  "https://your-app.vercel.app/api/cron/daily-summary?force=true"
```

---

## Architecture

```
Discord REST API
      │
      ▼
lib/discord.ts    ← fetches messages from configured channels
      │
      ▼
lib/llm.ts        ← GPT-4o generates structured JSON summary
      │
      ▼
lib/db.ts         ← saves to Vercel KV (Redis)
      │
      ▼
app/page.tsx      ← dashboard reads from /api/summaries
```

**Cron schedule** (`vercel.json`): `0 14 * * *` = 2PM UTC = 6AM PST

---

## Extending

### Add more channels
Set comma-separated IDs in `DISCORD_CHANNEL_IDS`:
```
DISCORD_CHANNEL_IDS=111,222,333
```

### Add more servers
Create separate `DISCORD_SERVER_ID_2` env vars and update `lib/discord.ts#fetchAllConfiguredMessages()`.

### Change LLM model
Set `OPENAI_MODEL=gpt-4o-mini` (cheaper) or `OPENAI_MODEL=gpt-4-turbo`.

### Change schedule
Edit `vercel.json`:
```json
{ "path": "/api/cron/daily-summary", "schedule": "0 14 * * *" }
```
Uses standard cron syntax. Vercel free tier allows up to 2 cron jobs.

---

## Disclaimer

⚠️ This tool is for informational purposes only. Content is AI-generated from community discussions and does not constitute financial advice. Always do your own research.
