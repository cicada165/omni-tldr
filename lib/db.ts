// ─────────────────────────────────────────────────────────────────────────────
// Database layer — Upstash Redis
// ─────────────────────────────────────────────────────────────────────────────

import { Redis } from "@upstash/redis";
import { DailySummary, SummaryEntry } from "./types";

// Create redis client lazily to avoid connection errors if env vars are missing during build
let redisInstance: Redis | null = null;

function getRedis() {
  if (!process.env.UPSTASH_REDIS_REST_URL || !process.env.UPSTASH_REDIS_REST_TOKEN) {
    console.warn("Upstash Redis environment variables are missing.");
    return null;
  }
  if (!redisInstance) {
    redisInstance = Redis.fromEnv();
  }
  return redisInstance;
}

const SUMMARY_KEY_PREFIX = "summary:";
const INDEX_KEY = "summaries:index";
const MAX_HISTORY = 90;

/** Save a daily summary to Redis */
export async function saveSummary(summary: DailySummary): Promise<void> {
  const redis = getRedis();
  if (!redis) return;

  const key = `${SUMMARY_KEY_PREFIX}${summary.id}`;
  await redis.set(key, JSON.stringify(summary));

  const score = new Date(summary.generatedAt).getTime();
  await redis.zadd(INDEX_KEY, { score, member: summary.id });

  // Prune beyond MAX_HISTORY
  const total = await redis.zcard(INDEX_KEY);
  if (total > MAX_HISTORY) {
    const toRemove = total - MAX_HISTORY;
    await redis.zremrangebyrank(INDEX_KEY, 0, toRemove - 1);
  }
}

/** Get a specific daily summary by date (YYYY-MM-DD) */
export async function getSummary(date: string): Promise<DailySummary | null> {
  const redis = getRedis();
  if (!redis) return null;

  try {
    const data = await redis.get<any>(`${SUMMARY_KEY_PREFIX}${date}`);
    if (!data) return null;
    
    // Upstash SDK might return string or object depending on how it was set
    if (typeof data === "string") {
      return JSON.parse(data);
    }
    return data as DailySummary;
  } catch (err) {
    console.error(`Error getting summary for ${date}:`, err);
    return null;
  }
}

/** Get the most recent daily summary */
export async function getLatestSummary(): Promise<DailySummary | null> {
  const redis = getRedis();
  if (!redis) return null;

  try {
    const ids = (await redis.zrange(INDEX_KEY, -1, -1)) as string[];
    if (!ids || ids.length === 0) return null;
    return getSummary(ids[0]);
  } catch (err) {
    console.error("Error getting latest summary:", err);
    return null;
  }
}

/** Get a list of all available summaries (lightweight index) */
export async function listSummaries(limit: number = 30): Promise<SummaryEntry[]> {
  const redis = getRedis();
  if (!redis) return [];

  try {
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
  } catch (err) {
    console.error("Error listing summaries:", err);
    return [];
  }
}

/** Check if a summary already exists for today */
export async function todaySummaryExists(): Promise<boolean> {
  const today = new Date().toISOString().split("T")[0];
  const existing = await getSummary(today);
  return existing !== null;
}
