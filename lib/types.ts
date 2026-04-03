// ─────────────────────────────────────────────────────────────────────────────
// Shared TypeScript types for omni-tldr
// ─────────────────────────────────────────────────────────────────────────────

export interface DiscordMessage {
  id: string;
  content: string;
  author: {
    id: string;
    username: string;
    bot: boolean;
  };
  timestamp: string;
  channelId: string;
  channelName: string;
  attachments: DiscordAttachment[];
  embeds: DiscordEmbed[];
}

export interface DiscordAttachment {
  id: string;
  filename: string;
  url: string;
  contentType?: string;
}

export interface DiscordEmbed {
  title?: string;
  description?: string;
  url?: string;
  color?: number;
  fields?: { name: string; value: string; inline?: boolean }[];
}

export interface DiscordChannel {
  id: string;
  name: string;
  type: number; // 0 = text, 2 = voice, etc.
  topic?: string;
}

// ─────────────────────────────────────────────────────────────────────────────

export interface InvestmentSignal {
  ticker?: string;
  sentiment: "bullish" | "bearish" | "neutral";
  confidence: "high" | "medium" | "low";
  description: string;
  source: string; // channel name
  mentions: number;
}

export interface DailySummary {
  id: string; // ISO date string: YYYY-MM-DD
  generatedAt: string; // ISO datetime
  channels: string[]; // channel names scraped
  messageCount: number;
  signals: InvestmentSignal[];
  keyThemes: string[];
  watchlist: string[]; // tickers to watch
  riskFlags: string[];
  fullSummary: string; // LLM narrative summary
  rawPrompt?: string; // optional: LLM prompt used
}

export interface SummaryEntry {
  date: string;
  id: string;
  snippet: string; // first ~200 chars of fullSummary
  signalCount: number;
  watchlistCount: number;
}
