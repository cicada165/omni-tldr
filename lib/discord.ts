// ─────────────────────────────────────────────────────────────────────────────
// Discord REST API client
// Uses official Discord API — no scraping, no user account needed.
// Bot must be in the server with "Read Message History" + "View Channels".
// ─────────────────────────────────────────────────────────────────────────────

import { DiscordChannel, DiscordMessage } from "./types";

const DISCORD_API = "https://discord.com/api/v10";
const SERVER_ID = process.env.DISCORD_SERVER_ID ?? "1419986599340675155";
const BOT_TOKEN = process.env.DISCORD_BOT_TOKEN ?? "";
const MESSAGES_LIMIT = parseInt(
  process.env.DISCORD_MESSAGES_LIMIT ?? "100",
  10
);

function headers() {
  return {
    Authorization: `Bot ${BOT_TOKEN}`,
    "Content-Type": "application/json",
    "User-Agent": "omni-tldr/1.0 (+https://github.com/qu4ntum/omni-tldr)",
  };
}

/** Fetch all text channels from the configured server */
export async function fetchServerChannels(): Promise<DiscordChannel[]> {
  const res = await fetch(`${DISCORD_API}/guilds/${SERVER_ID}/channels`, {
    headers: headers(),
    next: { revalidate: 0 },
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Discord API error fetching channels: ${res.status} ${err}`);
  }

  const data = await res.json();

  // Filter to text channels only (type 0)
  return (data as DiscordChannel[]).filter((ch) => ch.type === 0);
}

/** Fetch recent messages from a specific channel */
export async function fetchChannelMessages(
  channelId: string,
  channelName: string,
  limit: number = MESSAGES_LIMIT
): Promise<DiscordMessage[]> {
  const url = `${DISCORD_API}/channels/${channelId}/messages?limit=${Math.min(limit, 100)}`;
  const res = await fetch(url, {
    headers: headers(),
    next: { revalidate: 0 },
  });

  if (!res.ok) {
    const err = await res.text();
    console.error(
      `Discord API error fetching messages from ${channelId}: ${res.status} ${err}`
    );
    return [];
  }

  const raw = await res.json();

  return (raw as Record<string, unknown>[]).map((msg) => ({
    id: msg.id as string,
    content: (msg.content as string) ?? "",
    author: {
      id: (msg.author as Record<string, unknown>)?.id as string,
      username: (msg.author as Record<string, unknown>)?.username as string,
      bot: Boolean((msg.author as Record<string, unknown>)?.bot),
    },
    timestamp: msg.timestamp as string,
    channelId,
    channelName,
    attachments: (msg.attachments as DiscordAttachment[]) ?? [],
    embeds: (msg.embeds as DiscordEmbed[]) ?? [],
  }));
}

/** Fetch messages from all configured channels.
 *  Channel IDs come from DISCORD_CHANNEL_IDS env var (comma-separated).
 *  If not set, fetches ALL text channels in the server.
 */
export async function fetchAllConfiguredMessages(): Promise<{
  messages: DiscordMessage[];
  channelNames: string[];
}> {
  const configuredIds = process.env.DISCORD_CHANNEL_IDS;

  let channels: DiscordChannel[];

  if (configuredIds) {
    // Use specifically configured channels
    const ids = configuredIds.split(",").map((id) => id.trim());
    channels = ids.map((id) => ({ id, name: id, type: 0 }));
  } else {
    // Fetch all text channels from the server
    channels = await fetchServerChannels();
    console.log(
      `No channel IDs configured, fetching all ${channels.length} text channels from server ${SERVER_ID}`
    );
  }

  const allMessages: DiscordMessage[] = [];
  const channelNames: string[] = [];

  for (const channel of channels) {
    const msgs = await fetchChannelMessages(channel.id, channel.name);
    if (msgs.length > 0) {
      allMessages.push(...msgs);
      channelNames.push(channel.name);
    }
  }

  // Sort by timestamp ascending
  allMessages.sort(
    (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
  );

  return { messages: allMessages, channelNames };
}

// Re-export for convenience
type DiscordAttachment = {
  id: string;
  filename: string;
  url: string;
  contentType?: string;
};
type DiscordEmbed = {
  title?: string;
  description?: string;
  url?: string;
  color?: number;
  fields?: { name: string; value: string; inline?: boolean }[];
};
