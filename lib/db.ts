// ─────────────────────────────────────────────────────────────────────────────
// Database layer — Upstash Redis (formerly Vercel KV)
// Vercel now routes KV through Upstash; this uses the @upstash/redis SDK.
// Set UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN in your env.
// ─────────────────────────────────────────────────────────────────────────────

import { Redis } from "@upstash/redis";
import { DailySummary, SummaryEntry } from "./types";

const redis = Redis.fromEnv(); // reads UPSTASH_REDIS_REST_URL + UPSTASH_REDIS_REST_TOKEN

const SUMMARY_KEY_PREFIX = "summary:";
const INDEX_KEY = "summaries:index"; // sorted set: score=timestamp, member=date
const MAX_HISTORY = 90;

/** Save a daily summary to Redis */
export async function saveSummary(summary: DailySummary): Promise<void> {
  const key = `${SUMMARY_KEY_PREFIX}${summary.id}`;
  await redis.set(key, JSON.stringify(summary));

  const score = new Date(summary.generatedAt).getTime();
  await redis.zadd(INDEX_KEY, { score, member: summary.id });

  // Prune beyond MAX_HISTORY
  const total = await redis.zcard(INDEX_KEY);
  if (total > MAX_HISTORY) {
    const toRemove = total - MAX_HISTORY;
    const oldest = (await redis.zrange(INDEX_KEY, 0, toRemove - 1)) as string[];
    for (const id of oldest) {
      await redis.del(`${SUMMARY_KEY_PREFIX}${id}`);
    }
    await redis.zremrangebyrank(INDEX_KEY, 0, toRemove - 1);
  }
}

/** Get a specific daily summary by date (YYYY-MM-DD) */
export async function getSummary(date: string): Promise<DailySummary | null> {
  const raw = await redis.get<string>(`${SUMMARY_KEY_PREFIX}${date}`);
  if (!raw) return null;
  try {
    return typeof raw === "string" ? JSON.parse(raw) : raw;
  } catch {
    return null;
  }
}

/** Get the most recent daily summary */
export async function getLatestSummary(): Promise<DailySummary | null> {
  const ids = (await redis.zrange(INDEX_KEY, -1, -1)) as string[];
  if (!ids || ids.length === 0) return null;
  return getSummary(ids[0]);
}

/** Get a list of all available summaries (lightweight index) */
export async function listSummaries(limit: number = 30): Promise<SummaryEntry[]> {
  const ids = (await redis.zrange(INDEX_KEY, -(limit), -1, { rev: true })) as string[];
  if (!ids || ids.length === 0) return [];

  const entries: SummaryEntry[] = [];
  for (const id of ids) {
    const summary = await getSummary(id);
    if (summary) {
      entries.push({
        date: summary.id,
        id: summary.id,
        snippet: summary.fullSummary.slice(0, 200) + "...",
        signalCount: summary.signals.length,
        watchlistCount: summary.watchlist.length,
      });
    }
  }
  return entries;
}

/** Check if a summary already exists for today */
export async function todaySummaryExists(): Promise<boolean> {
  const today = new Date().toISOString().split("T")[0];
  const existing = await getSummary(today);
  return existing !== null;
}
