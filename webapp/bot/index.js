/* eslint-disable @typescript-eslint/no-require-imports */
const TelegramBot = require('node-telegram-bot-api');

const TELEGRAM_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID;
const BOT_EMAIL = process.env.BOT_EMAIL || 'admin@example.com';
const BOT_PASSWORD = process.env.BOT_PASSWORD || 'admin123';
const API_BASE = process.env.SIGNAL_API_BASE || 'http://localhost:3000';
const POLL_INTERVAL_MS = Number(process.env.SIGNAL_POLL_INTERVAL_MS || 60_000);

if (!TELEGRAM_TOKEN) {
  throw new Error('TELEGRAM_BOT_TOKEN is required');
}

if (!TELEGRAM_CHAT_ID) {
  throw new Error('TELEGRAM_CHAT_ID is required');
}

const bot = new TelegramBot(TELEGRAM_TOKEN, { polling: true });
let sessionCookie = '';
let knownSignals = new Set();

async function login() {
  const response = await fetch(`${API_BASE}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: BOT_EMAIL, password: BOT_PASSWORD }),
  });
  if (!response.ok) {
    let detail = '';
    try {
      const data = await response.json();
      detail = data.error;
    } catch {
      detail = response.statusText;
    }
    throw new Error(`Failed to authenticate bot: ${detail}`);
  }
  const setCookieHeader = response.headers.get('set-cookie');
  if (!setCookieHeader) {
    throw new Error('No session cookie received from the API');
  }
  sessionCookie = setCookieHeader.split(',')[0];
}

async function fetchSignals() {
  if (!sessionCookie) {
    await login();
  }
  const response = await fetch(`${API_BASE}/api/signals`, {
    headers: { Cookie: sessionCookie },
  });
  if (response.status === 401) {
    sessionCookie = '';
    await login();
    return fetchSignals();
  }
  if (!response.ok) {
    let detail = '';
    try {
      const data = await response.json();
      detail = data.error;
    } catch {
      detail = response.statusText;
    }
    throw new Error(`Failed to fetch signals: ${detail}`);
  }
  const data = await response.json();
  return data.signals || [];
}

function formatSignal(signal) {
  return [
    `⚡ <b>${signal.pair}</b> <u>${signal.direction}</u> (${signal.timeframe})`,
    `Price: <b>${signal.price.toFixed(5)}</b>`,
    `RSI: <b>${signal.rsi.toFixed(2)}</b> | MACD Hist: <b>${signal.macdHistogram.toFixed(4)}</b>`,
    `Zone: <b>${signal.supportResistance.toUpperCase()}</b>`,
    `Quality: <b>${signal.qualityScore}%</b>`,
    `Expires: ${new Date(signal.expiresAt).toLocaleTimeString()}`,
  ].join('\n');
}

async function broadcastNewSignals() {
  try {
    const signals = await fetchSignals();
    const newSignals = signals.filter((signal) => !knownSignals.has(signal.id));

    if (knownSignals.size > 200) {
      knownSignals = new Set(signals.map((signal) => signal.id));
    } else {
      newSignals.forEach((signal) => knownSignals.add(signal.id));
    }

    for (const signal of newSignals) {
      await bot.sendMessage(TELEGRAM_CHAT_ID, formatSignal(signal), { parse_mode: 'HTML' });
    }
  } catch (error) {
    console.error('Failed to broadcast signals', error);
  }
}

bot.onText(/\/start/, async (msg) => {
  await bot.sendMessage(
    msg.chat.id,
    'Welcome to the Binary Options Signal bot. Use /signals to get the latest high-confidence entries.',
  );
});

bot.onText(/\/signals/, async (msg) => {
  try {
    const signals = await fetchSignals();
    if (!signals.length) {
      await bot.sendMessage(msg.chat.id, 'No signals available right now.');
      return;
    }
    const formatted = signals
      .slice(0, 5)
      .map((signal) => formatSignal(signal))
      .join('\n\n');
    await bot.sendMessage(msg.chat.id, formatted, { parse_mode: 'HTML' });
  } catch (error) {
    await bot.sendMessage(
      msg.chat.id,
      `Unable to load signals: ${error instanceof Error ? error.message : 'Unknown error'}`,
    );
  }
});

bot.onText(/\/status/, async (msg) => {
  await bot.sendMessage(
    msg.chat.id,
    `Bot online. Polling ${API_BASE} every ${Math.round(POLL_INTERVAL_MS / 1000)} seconds.`,
  );
});

setInterval(() => {
  void broadcastNewSignals();
}, POLL_INTERVAL_MS);

(async () => {
  await login();
  await broadcastNewSignals();
  console.log('Telegram bot ready and polling for signals.');
})();
