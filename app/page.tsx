// ─────────────────────────────────────────────────────────────────────────────
// Main Dashboard — Today's investment summary
// ─────────────────────────────────────────────────────────────────────────────

import { DailySummary } from "@/lib/types";

async function getSummaryData(): Promise<DailySummary | null> {
  try {
    // In production, fetch from our own API
    const baseUrl =
      process.env.VERCEL_URL
        ? `https://${process.env.VERCEL_URL}`
        : "http://localhost:3000";

    const res = await fetch(`${baseUrl}/api/summaries?latest=true`, {
      next: { revalidate: 300 }, // Revalidate every 5 minutes
    });

    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    timeZoneName: "short",
  });
}

export default async function DashboardPage() {
  const summary = await getSummaryData();

  if (!summary) {
    return (
      <div>
        <div className="page-header">
          <h1 className="page-title">Investment Intelligence</h1>
          <p className="page-subtitle">
            Daily AI-powered signals from Discord investment communities
          </p>
        </div>
        <div className="empty-state">
          <div className="empty-state-icon">📡</div>
          <h2 className="empty-state-title">No summaries yet</h2>
          <p className="empty-state-desc">
            The first summary will be generated at 6AM PST.<br />
            You can trigger it manually via the cron endpoint.
          </p>
        </div>
      </div>
    );
  }

  const bullishCount = summary.signals.filter(
    (s) => s.sentiment === "bullish"
  ).length;
  const bearishCount = summary.signals.filter(
    (s) => s.sentiment === "bearish"
  ).length;

  return (
    <div>
      {/* Header */}
      <div className="page-header">
        <h1 className="page-title">Investment Intelligence</h1>
        <p className="page-subtitle">
          Daily AI-powered signals from Discord investment communities
        </p>
      </div>

      {/* Meta bar */}
      <div className="meta-info">
        <div className="meta-item">
          <span className="meta-dot" />
          <span>Live</span>
        </div>
        <div className="meta-item">
          📅 {formatDate(summary.generatedAt)}
        </div>
        <div className="meta-item">
          🕐 Generated at {formatTime(summary.generatedAt)}
        </div>
        <div className="meta-item">
          💬 {summary.messageCount} messages analyzed
        </div>
        <div className="meta-item">
          📡 {summary.channels.length} channels
        </div>
      </div>

      {/* Stats */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-label">Total Signals</div>
          <div className="stat-value blue">{summary.signals.length}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Bullish</div>
          <div className="stat-value green">{bullishCount}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Bearish</div>
          <div className="stat-value red">{bearishCount}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Watchlist</div>
          <div className="stat-value">{summary.watchlist.length}</div>
        </div>
      </div>

      {/* Summary narrative */}
      <div className="card">
        <div className="card-header">
          <span className="card-title">📝 Daily Summary</span>
        </div>
        <div className="summary-text">
          {summary.fullSummary.split("\n").map((para, i) =>
            para.trim() ? <p key={i}>{para}</p> : null
          )}
        </div>
      </div>

      {/* Key themes */}
      {summary.keyThemes.length > 0 && (
        <div className="section">
          <div className="section-header">
            <span className="section-icon">🔮</span>
            <h2 className="section-title">Key Themes</h2>
            <span className="section-count">{summary.keyThemes.length}</span>
          </div>
          <div className="theme-list">
            {summary.keyThemes.map((theme, i) => (
              <span key={i} className="theme-tag">{theme}</span>
            ))}
          </div>
        </div>
      )}

      {/* Signals */}
      {summary.signals.length > 0 && (
        <div className="section">
          <div className="section-header">
            <span className="section-icon">⚡</span>
            <h2 className="section-title">Investment Signals</h2>
            <span className="section-count">{summary.signals.length} detected</span>
          </div>
          <div className="signals-grid">
            {summary.signals.map((signal, i) => (
              <div
                key={i}
                className={`signal-card ${signal.sentiment}`}
              >
                <div className="signal-header">
                  <span className="signal-ticker">
                    {signal.ticker ?? "MISC"}
                  </span>
                  <div className="signal-badges">
                    <span className={`badge ${signal.sentiment}`}>
                      {signal.sentiment}
                    </span>
                    <span className={`badge ${signal.confidence}`}>
                      {signal.confidence}
                    </span>
                  </div>
                </div>
                <p className="signal-description">{signal.description}</p>
                <div className="signal-meta">
                  <span>#{signal.source}</span>
                  <span>{signal.mentions}× mentioned</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Watchlist */}
      {summary.watchlist.length > 0 && (
        <div className="section">
          <div className="section-header">
            <span className="section-icon">👁</span>
            <h2 className="section-title">Watchlist</h2>
            <span className="section-count">{summary.watchlist.length} tickers</span>
          </div>
          <div className="ticker-list">
            {summary.watchlist.map((ticker, i) => (
              <a
                key={i}
                href={`https://finance.yahoo.com/quote/${ticker}`}
                target="_blank"
                rel="noopener noreferrer"
                className="ticker-chip"
              >
                {ticker}
              </a>
            ))}
          </div>
        </div>
      )}

      {/* Risk flags */}
      {summary.riskFlags.length > 0 && (
        <div className="section">
          <div className="section-header">
            <span className="section-icon">⚠️</span>
            <h2 className="section-title">Risk Flags</h2>
            <span className="section-count">{summary.riskFlags.length}</span>
          </div>
          <div className="risk-list">
            {summary.riskFlags.map((flag, i) => (
              <div key={i} className="risk-item">
                <span className="risk-icon">▲</span>
                <span>{flag}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
