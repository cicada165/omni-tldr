// ─────────────────────────────────────────────────────────────────────────────
// History page — Browse past daily summaries
// ─────────────────────────────────────────────────────────────────────────────

import type { Metadata } from "next";
import { SummaryEntry } from "@/lib/types";

export const metadata: Metadata = {
  title: "History | omni-discord",
  description: "Browse past investment intelligence summaries.",
};

async function getHistory(): Promise<SummaryEntry[]> {
  try {
    const baseUrl = process.env.VERCEL_URL
      ? `https://${process.env.VERCEL_URL}`
      : "http://localhost:3000";

    const res = await fetch(`${baseUrl}/api/summaries?list=true&limit=30`, {
      next: { revalidate: 300 },
    });

    if (!res.ok) return [];
    const data = await res.json();
    return data.summaries ?? [];
  } catch {
    return [];
  }
}

function formatDisplayDate(dateStr: string): string {
  return new Date(dateStr + "T00:00:00").toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export default async function HistoryPage() {
  const entries = await getHistory();

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Summary History</h1>
        <p className="page-subtitle">
          Browse past daily investment intelligence summaries
        </p>
      </div>

      {entries.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">📚</div>
          <h2 className="empty-state-title">No history yet</h2>
          <p className="empty-state-desc">
            Summaries will appear here after the first cron run.
          </p>
        </div>
      ) : (
        <div className="history-list">
          {entries.map((entry) => (
            <a
              key={entry.id}
              href={`/summary/${entry.date}`}
              className="history-item"
            >
              <span className="history-date">
                {formatDisplayDate(entry.date)}
              </span>
              <span className="history-snippet">{entry.snippet}</span>
              <div className="history-stats">
                <span className="history-stat">⚡ {entry.signalCount} signals</span>
                <span className="history-stat">👁 {entry.watchlistCount} tickers</span>
              </div>
            </a>
          ))}
        </div>
      )}
    </div>
  );
}
