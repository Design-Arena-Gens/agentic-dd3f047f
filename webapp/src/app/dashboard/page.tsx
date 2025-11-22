'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

interface Signal {
  id: string;
  pair: string;
  direction: 'CALL' | 'PUT';
  timeframe: string;
  generatedAt: string;
  expiresAt: string;
  price: number;
  rsi: number;
  macdHistogram: number;
  supportResistance: 'support' | 'resistance';
  qualityScore: number;
}

interface Trend {
  pair: string;
  trend: 'bullish' | 'bearish' | 'neutral';
  lastUpdated: string;
}

export default function DashboardPage() {
  const router = useRouter();
  const [pairs, setPairs] = useState<string[]>([]);
  const [signals, setSignals] = useState<Signal[]>([]);
  const [trends, setTrends] = useState<Trend[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchPairs = useCallback(async () => {
    const response = await fetch('/api/pairs');
    if (!response.ok) throw new Error('Unable to load pairs');
    const data = await response.json();
    setPairs(data.pairs);
  }, []);

  const fetchSignals = useCallback(async () => {
    const response = await fetch('/api/signals');
    if (!response.ok) throw new Error('Unable to load signals');
    const data = await response.json();
    setSignals(data.signals);
  }, []);

  const fetchTrends = useCallback(async () => {
    const response = await fetch('/api/trends');
    if (!response.ok) throw new Error('Unable to load trends');
    const data = await response.json();
    setTrends(data.trends);
  }, []);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      await Promise.all([fetchPairs(), fetchSignals(), fetchTrends()]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load dashboard');
    } finally {
      setLoading(false);
    }
  }, [fetchPairs, fetchSignals, fetchTrends]);

  useEffect(() => {
    void fetchAll();
  }, [fetchAll]);

  async function handleRefresh() {
    setIsRefreshing(true);
    setError('');
    try {
      await Promise.all([fetchSignals(), fetchTrends()]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to refresh data');
    } finally {
      setIsRefreshing(false);
    }
  }

  async function handleLogout() {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/login');
  }

  const nextEntryTime = useMemo(() => {
    if (!signals.length) return null;
    const upcoming = signals
      .map((signal) => new Date(signal.expiresAt))
      .filter((date) => date.getTime() > Date.now())
      .sort((a, b) => a.getTime() - b.getTime())[0];
    return upcoming ?? null;
  }, [signals]);

  const bestSignals = useMemo(() => signals.slice(0, 10), [signals]);

  return (
    <>
      <header className="topbar">
        <div className="topbar-logo">
          <span className="status-dot highlight" />
          Signal Nexus
        </div>
        <div className="topbar-actions">
          <Link href="/admin" className="btn">
            Admin Panel
          </Link>
          <button className="btn" onClick={handleRefresh} disabled={isRefreshing}>
            {isRefreshing ? 'Refreshing…' : 'Refresh'}
          </button>
          <button className="btn" onClick={handleLogout}>
            Logout
          </button>
        </div>
      </header>

      <main className="main-content">
        {error && <div className="error-banner">{error}</div>}

        {loading ? (
          <div className="loading-state">Loading market intelligence…</div>
        ) : (
          <>
            <section className="grid grid-columns-3">
              <div className="card">
                <div className="card-header">
                  <h2 className="card-title">Pairs Covered</h2>
                </div>
                <div className="pill-list">
                  {pairs.map((pair) => (
                    <span className="pill" key={pair}>
                      {pair}
                    </span>
                  ))}
                </div>
              </div>
              <div className="card">
                <div className="card-header">
                  <h2 className="card-title">Next Entry Window</h2>
                  <span className="status-pill">
                    <span className="status-dot" />
                    5m timeframe
                  </span>
                </div>
                {nextEntryTime ? (
                  <div>
                    <div className="highlight" style={{ fontSize: 26, fontWeight: 600 }}>
                      {nextEntryTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                    <p className="muted">
                      Signals align for the next contract close at {nextEntryTime.toUTCString()}
                    </p>
                  </div>
                ) : (
                  <div className="muted">Awaiting signal confirmation…</div>
                )}
              </div>
              <div className="card">
                <div className="card-header">
                  <h2 className="card-title">Active Signals</h2>
                  <span className="status-pill">
                    <span className="status-dot" />
                    Last updated {new Date().toLocaleTimeString()}
                  </span>
                </div>
                <div className="signal-meta">
                  <span className="highlight">{signals.length}</span>
                  <span>Signals generated in the last scan</span>
                </div>
              </div>
            </section>

            <section className="card">
              <div className="card-header">
                <h2 className="card-title">Last 20 Signals</h2>
              </div>
              {!signals.length ? (
                <div className="empty-state">No signals available yet. Check back shortly.</div>
              ) : (
                <table className="table">
                  <thead>
                    <tr>
                      <th>Pair</th>
                      <th>Direction</th>
                      <th>Price</th>
                      <th>RSI</th>
                      <th>MACD Hist</th>
                      <th>Zone</th>
                      <th>Generated</th>
                      <th>TTL</th>
                      <th>Quality</th>
                    </tr>
                  </thead>
                  <tbody>
                    {signals.map((signal) => (
                      <tr key={signal.id}>
                        <td>{signal.pair}</td>
                        <td>
                          <span className={`tag tag-${signal.direction.toLowerCase()}`}>
                            {signal.direction}
                          </span>
                        </td>
                        <td>{signal.price.toFixed(5)}</td>
                        <td>{signal.rsi.toFixed(2)}</td>
                        <td>{signal.macdHistogram.toFixed(4)}</td>
                        <td>{signal.supportResistance}</td>
                        <td>{new Date(signal.generatedAt).toLocaleTimeString()}</td>
                        <td>{new Date(signal.expiresAt).toLocaleTimeString()}</td>
                        <td style={{ width: 150 }}>
                          <div className="quality-bar">
                            <div
                              className="quality-bar-fill"
                              style={{
                                width: `${signal.qualityScore}%`,
                                background:
                                  signal.qualityScore > 80
                                    ? 'linear-gradient(90deg, #22c55e, #16a34a)'
                                    : signal.qualityScore > 65
                                    ? 'linear-gradient(90deg, #facc15, #f97316)'
                                    : 'linear-gradient(90deg, #f97316, #ef4444)',
                              }}
                            />
                          </div>
                          <span className="muted">{signal.qualityScore}%</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </section>

            <section className="card">
              <div className="card-header">
                <h2 className="card-title">Current Trend Map</h2>
              </div>
              <div className="trend-grid">
                {trends.map((trend) => (
                  <div className="trend-card" key={trend.pair}>
                    <div className="trend-title">{trend.pair}</div>
                    <span className={`tag tag-${trend.trend}`}>{trend.trend.toUpperCase()}</span>
                    <p className="muted" style={{ marginTop: 8 }}>
                      Updated {new Date(trend.lastUpdated).toLocaleTimeString()}
                    </p>
                  </div>
                ))}
              </div>
            </section>

            <section className="card">
              <div className="card-header">
                <h2 className="card-title">High-Confidence Watchlist</h2>
                <span className="status-pill">
                  <span className="status-dot" />
                  Top momentum picks
                </span>
              </div>
              {!bestSignals.length ? (
                <div className="empty-state">Awaiting high confidence confirmations.</div>
              ) : (
                <div className="grid grid-columns-2">
                  {bestSignals.map((signal) => (
                    <div className="trend-card" key={signal.id}>
                      <div className="trend-title">
                        {signal.pair}
                        <span
                          className={`tag tag-${signal.direction.toLowerCase()}`}
                          style={{ marginLeft: 12 }}
                        >
                          {signal.direction}
                        </span>
                      </div>
                      <p className="muted">
                        RSI {signal.rsi.toFixed(1)} | MACD {signal.macdHistogram.toFixed(4)}
                      </p>
                      <p className="muted">Zone: {signal.supportResistance}</p>
                      <div className="quality-bar" style={{ marginTop: 12 }}>
                        <div
                          className="quality-bar-fill"
                          style={{
                            width: `${signal.qualityScore}%`,
                            background: 'linear-gradient(90deg, #22d3ee, #2563eb)',
                          }}
                        />
                      </div>
                      <p className="muted" style={{ marginTop: 8 }}>
                        Generated {new Date(signal.generatedAt).toLocaleTimeString()}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </section>
          </>
        )}
      </main>
    </>
  );
}
