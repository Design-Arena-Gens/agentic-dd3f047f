'use client';

import { FormEvent, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

interface Settings {
  minimumSignalQuality: number;
  indicatorSensitivity: number;
}

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

export default function AdminPage() {
  const router = useRouter();
  const [settings, setSettings] = useState<Settings | null>(null);
  const [signals, setSignals] = useState<Signal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    void fetchData();
  }, []);

  async function fetchData() {
    setLoading(true);
    setError('');
    try {
      const [settingsResponse, signalsResponse] = await Promise.all([
        fetch('/api/settings'),
        fetch('/api/signals'),
      ]);

      if (settingsResponse.status === 403) {
        setError('Administrator privileges required.');
        setLoading(false);
        return;
      }

      if (!settingsResponse.ok) throw new Error('Failed to load settings');
      if (!signalsResponse.ok) throw new Error('Failed to load signals');

      const settingsData = await settingsResponse.json();
      const signalsData = await signalsResponse.json();

      setSettings(settingsData.settings);
      setSignals(signalsData.signals);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load admin data');
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!settings) return;
    setSaving(true);
    try {
      const response = await fetch('/api/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      });
      if (!response.ok) {
        const payload = await response.json();
        throw new Error(payload.error ?? 'Unable to save settings');
      }
      const data = await response.json();
      setSettings(data.settings);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to save settings');
    } finally {
      setSaving(false);
    }
  }

  async function handleLogout() {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/login');
  }

  return (
    <>
      <header className="topbar">
        <div className="topbar-logo">
          <span className="status-dot highlight" />
          Admin Controls
        </div>
        <div className="topbar-actions">
          <Link className="btn" href="/dashboard">
            Back to Dashboard
          </Link>
          <button className="btn" onClick={() => void fetchData()}>
            Reload
          </button>
          <button className="btn" onClick={handleLogout}>
            Logout
          </button>
        </div>
      </header>

      <main className="main-content">
        {error && <div className="error-banner">{error}</div>}
        {loading ? (
          <div className="loading-state">Loading admin data…</div>
        ) : !settings ? (
          <div className="empty-state">No settings available.</div>
        ) : (
          <div className="grid grid-columns-2">
            <section className="card">
              <div className="card-header">
                <h2 className="card-title">Signal Quality Controls</h2>
              </div>
              <form className="settings-form" onSubmit={handleSubmit}>
                <div className="settings-input-group">
                  <label htmlFor="quality">Minimum Signal Quality (%)</label>
                  <input
                    id="quality"
                    type="number"
                    className="settings-input"
                    min={0}
                    max={100}
                    value={settings.minimumSignalQuality}
                    onChange={(event) =>
                      setSettings({
                        ...settings,
                        minimumSignalQuality: Number(event.target.value),
                      })
                    }
                  />
                  <span className="muted">
                    Signals below this threshold are filtered from distribution.
                  </span>
                </div>

                <div className="settings-input-group">
                  <label htmlFor="sensitivity">Indicator Sensitivity</label>
                  <input
                    id="sensitivity"
                    type="number"
                    className="settings-input"
                    min={0.2}
                    max={2}
                    step={0.1}
                    value={settings.indicatorSensitivity}
                    onChange={(event) =>
                      setSettings({
                        ...settings,
                        indicatorSensitivity: Number(event.target.value),
                      })
                    }
                  />
                  <span className="muted">
                    Adjusts RSI and MACD impact. Higher values tighten signal filters.
                  </span>
                </div>

                <button className="btn btn-primary" type="submit" disabled={saving}>
                  {saving ? 'Saving…' : 'Save Controls'}
                </button>
              </form>
            </section>

            <section className="card">
              <div className="card-header">
                <h2 className="card-title">Recent Signals Snapshot</h2>
              </div>
              {signals.length === 0 ? (
                <div className="empty-state">No recent signals generated.</div>
              ) : (
                <table className="table">
                  <thead>
                    <tr>
                      <th>Pair</th>
                      <th>Direction</th>
                      <th>Quality</th>
                      <th>Generated</th>
                    </tr>
                  </thead>
                  <tbody>
                    {signals.slice(0, 8).map((signal) => (
                      <tr key={signal.id}>
                        <td>{signal.pair}</td>
                        <td>
                          <span className={`tag tag-${signal.direction.toLowerCase()}`}>
                            {signal.direction}
                          </span>
                        </td>
                        <td>{signal.qualityScore}%</td>
                        <td>{new Date(signal.generatedAt).toLocaleTimeString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </section>
          </div>
        )}
      </main>
    </>
  );
}
