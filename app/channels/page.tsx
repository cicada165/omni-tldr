// ─────────────────────────────────────────────────────────────────────────────
// Channels page — Shows which channels are being monitored
// Also useful for finding channel IDs during setup
// ─────────────────────────────────────────────────────────────────────────────

import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Channels | omni-discord",
  description: "Discord channels being monitored for investment signals.",
};

export default function ChannelsPage() {
  const channelIds = (process.env.DISCORD_CHANNEL_IDS ?? "").split(",").filter(Boolean);
  const serverId = process.env.DISCORD_SERVER_ID ?? "1419986599340675155";

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Monitored Channels</h1>
        <p className="page-subtitle">
          Discord channels currently being scraped for investment signals
        </p>
      </div>

      <div className="card" style={{ marginBottom: "var(--space-6)" }}>
        <div className="card-header">
          <span className="card-title">⚙️ Configuration</span>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-3)" }}>
          <div className="meta-item">
            <span style={{ color: "var(--text-muted)" }}>Server ID:</span>
            <code style={{ fontFamily: "var(--font-mono)", color: "var(--accent-blue)", marginLeft: "8px" }}>
              {serverId}
            </code>
          </div>
          <div className="meta-item">
            <span style={{ color: "var(--text-muted)" }}>Channels:</span>
            <code style={{ fontFamily: "var(--font-mono)", color: "var(--accent-cyan)", marginLeft: "8px" }}>
              {channelIds.length > 0 ? `${channelIds.length} configured` : "All text channels (no filter)"}
            </code>
          </div>
          <div className="meta-item">
            <span style={{ color: "var(--text-muted)" }}>Schedule:</span>
            <code style={{ fontFamily: "var(--font-mono)", color: "var(--accent-green)", marginLeft: "8px" }}>
              Daily at 6:00 AM PST (14:00 UTC)
            </code>
          </div>
        </div>
      </div>

      {channelIds.length > 0 ? (
        <div>
          <div className="section-header">
            <span className="section-icon">📡</span>
            <h2 className="section-title">Active Channel IDs</h2>
            <span className="section-count">{channelIds.length} channels</span>
          </div>
          <div className="channel-grid">
            {channelIds.map((id, i) => (
              <div key={i} className="channel-card">
                <div className="channel-name"># channel-{i + 1}</div>
                <div className="channel-id">{id.trim()}</div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="card">
          <div className="card-header">
            <span className="card-title">ℹ️ No Specific Channels Configured</span>
          </div>
          <p className="summary-text">
            The bot will scrape <strong style={{ color: "var(--text-primary)" }}>all text channels</strong> in
            server <code style={{ fontFamily: "var(--font-mono)", color: "var(--accent-blue)" }}>{serverId}</code>.
            <br /><br />
            To limit to specific channels, set the <code style={{ fontFamily: "var(--font-mono)", color: "var(--accent-yellow)" }}>DISCORD_CHANNEL_IDS</code> environment
            variable to a comma-separated list of channel IDs.
            <br /><br />
            Enable Developer Mode in Discord: <strong style={{ color: "var(--text-secondary)" }}>Settings → Advanced → Developer Mode</strong>,
            then right-click any channel → <strong style={{ color: "var(--text-secondary)" }}>Copy Channel ID</strong>.
          </p>
        </div>
      )}
    </div>
  );
}
