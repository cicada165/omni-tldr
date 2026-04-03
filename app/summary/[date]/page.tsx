// ─────────────────────────────────────────────────────────────────────────────
// Individual summary page — /summary/[date]
// ─────────────────────────────────────────────────────────────────────────────

import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getSummary } from "@/lib/db";

interface Props {
  params: Promise<{ date: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { date } = await params;
  return {
    title: `${date} | omni-tldr`,
    description: `Investment intelligence summary for ${date}.`,
  };
}

export default async function SummaryPage({ params }: Props) {
  const { date } = await params;

  // Validate date format
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) notFound();

  const summary = await getSummary(date);
  if (!summary) notFound();

  const bullishCount = summary.signals.filter((s) => s.sentiment === "bullish").length;
  const bearishCount = summary.signals.filter((s) => s.sentiment === "bearish").length;

  function formatDate(iso: string) {
    return new Date(iso).toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  }

  return (
    <div>
      <div className="page-header">
        <a href="/history" style={{ fontSize: "0.85rem", color: "var(--text-muted)", display: "block", marginBottom: "8px" }}>
          ← Back to History
        </a>
        <h1 className="page-title">{formatDate(summary.id)}</h1>
        <p className="page-subtitle">
          {summary.messageCount} messages · {summary.channels.length} channels · {summary.signals.length} signals
        </p>
      </div>

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

      <div className="card">
        <div className="card-header">
          <span className="card-title">📝 Summary</span>
        </div>
        <div className="summary-text">
          {summary.fullSummary.split("\n").map((para, i) =>
            para.trim() ? <p key={i}>{para}</p> : null
          )}
        </div>
      </div>

      {summary.keyThemes.length > 0 && (
        <div className="section">
          <div className="section-header">
            <span className="section-icon">🔮</span>
            <h2 className="section-title">Key Themes</h2>
          </div>
          <div className="theme-list">
            {summary.keyThemes.map((theme, i) => (
              <span key={i} className="theme-tag">{theme}</span>
            ))}
          </div>
        </div>
      )}

      {summary.signals.length > 0 && (
        <div className="section">
          <div className="section-header">
            <span className="section-icon">⚡</span>
            <h2 className="section-title">Signals</h2>
            <span className="section-count">{summary.signals.length}</span>
          </div>
          <div className="signals-grid">
            {summary.signals.map((signal, i) => (
              <div key={i} className={`signal-card ${signal.sentiment}`}>
                <div className="signal-header">
                  <span className="signal-ticker">{signal.ticker ?? "MISC"}</span>
                  <div className="signal-badges">
                    <span className={`badge ${signal.sentiment}`}>{signal.sentiment}</span>
                    <span className={`badge ${signal.confidence}`}>{signal.confidence}</span>
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

      {summary.watchlist.length > 0 && (
        <div className="section">
          <div className="section-header">
            <span className="section-icon">👁</span>
            <h2 className="section-title">Watchlist</h2>
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

      {summary.riskFlags.length > 0 && (
        <div className="section">
          <div className="section-header">
            <span className="section-icon">⚠️</span>
            <h2 className="section-title">Risk Flags</h2>
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
