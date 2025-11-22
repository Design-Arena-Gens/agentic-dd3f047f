## Binary Options Signal Platform

Full-stack trading intelligence platform delivering binary options signals (5 minute timeframe) with a web dashboard, REST API, and Telegram bot distribution.

### Features
- Server-side signal engine evaluating 10+ forex pairs via Yahoo Finance 1-minute data aggregated to 5-minute candles.
- Indicator stack: RSI(14), MACD(12,26,9), automatic support/resistance pivots with configurable sensitivity.
- REST API and protected dashboard showing last 20 signals, current trend map, upcoming entry window, and high-confidence watchlist.
- Admin console to tune minimum signal quality & indicator sensitivity.
- Telegram bot for push notifications and command-based access (`/signals`, `/status`).
- Built with Next.js App Router (TypeScript), deploy-ready for Vercel.

### Project Layout
```
webapp/
  ├─ src/app/…          # App Router routes, dashboard, admin, auth pages, API handlers
  ├─ src/lib/…          # Data feed, indicators, auth helpers, in-memory store
  ├─ bot/index.js       # Telegram bot runner
  ├─ package.json
  └─ …
```

### Prerequisites
- Node.js 18+
- npm 9+

### Environment Variables
Create a `.env.local` in `webapp/` with:

```
AUTH_SECRET=replace-with-strong-secret

# Telegram bot (optional unless running bot)
TELEGRAM_BOT_TOKEN=123456:ABCDEF
TELEGRAM_CHAT_ID=123456789
BOT_EMAIL=admin@example.com        # optional, defaults shown
BOT_PASSWORD=admin123              # optional, defaults shown
SIGNAL_API_BASE=https://agentic-dd3f047f.vercel.app   # or http://localhost:3000
SIGNAL_POLL_INTERVAL_MS=60000      # optional
```

> Default admin credentials are `admin@example.com / admin123`. Change `AUTH_SECRET` and admin password in production.

### Commands
Run from `webapp/`:

| Command            | Description                                   |
| ------------------ | --------------------------------------------- |
| `npm run dev`      | Start Next.js dev server on `http://localhost:3000` |
| `npm run build`    | Production build (used before deploying)      |
| `npm run start`    | Start production server locally               |
| `npm run lint`     | ESLint over TS/JS sources                     |
| `npm run bot`      | Launch Telegram bot (requires env vars)       |

### Signal Engine Notes
- Data feed: Yahoo Finance 1-minute forex candles (no API key required).
- 5-minute aggregation with RSI/MACD + pivot-based support/resistance tests.
- Signal quality scoring adjusted by admin-set sensitivity & minimum thresholds.
- LRU cache retains most recent computation for 60s to protect the data provider.

### Telegram Bot
1. Create bot token via @BotFather and capture the chat/channel ID.
2. Ensure the bot has access to your channel/group.
3. Configure the env vars above and run `npm run bot`.
4. Commands:
   - `/signals` – last 5 high-confidence signals.
   - `/status` – bot health / polling frequency.
   - `/start` – intro message.

### Deployment (Vercel)
1. Run `npm run build` to confirm a clean build.
2. Deploy with `vercel deploy --prod --yes --token $VERCEL_TOKEN --name agentic-dd3f047f`.
3. Provision environment variables in Vercel dashboard (`AUTH_SECRET`, optional Telegram/bot vars).
4. After deploy, verify with `curl https://agentic-dd3f047f.vercel.app`.

### Known Limitations
- In-memory store resets on cold starts (replace with persistent DB/Redis for production).
- Yahoo Finance rate limits; consider caching layer or paid data feed for scale.
- Authentication is basic JWT + cookie; augment with multi-user persistence before going live.

### License
MIT – customize and extend to suit your trading workflow.
