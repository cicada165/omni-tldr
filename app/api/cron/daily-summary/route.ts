// ─────────────────────────────────────────────────────────────────────────────
// Cron endpoint: /api/cron/daily-summary
// Called by Vercel Cron daily at 2PM UTC (6AM PST)
// Protected by CRON_SECRET — Vercel sets Authorization header automatically
// ─────────────────────────────────────────────────────────────────────────────

import { NextRequest, NextResponse } from "next/server";
import { fetchAllConfiguredMessages } from "@/lib/discord";
import { generateDailySummary } from "@/lib/llm";
import { saveSummary, todaySummaryExists } from "@/lib/db";

export const maxDuration = 60; // Vercel Pro: 60s, Hobby: 10s

export async function GET(req: NextRequest) {
  // ── Auth check ─────────────────────────────────────────────────────────────
  const authHeader = req.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  if (!cronSecret) {
    return NextResponse.json(
      { error: "CRON_SECRET not configured" },
      { status: 500 }
    );
  }

  if (authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // ── Idempotency check ──────────────────────────────────────────────────────
  const force = req.nextUrl.searchParams.get("force") === "true";
  if (!force && (await todaySummaryExists())) {
    return NextResponse.json({
      status: "skipped",
      message: "Summary already generated for today. Pass ?force=true to regenerate.",
    });
  }

  const today = new Date().toISOString().split("T")[0];

  try {
    console.log(`[omni-discord] Starting daily summary for ${today}`);

    // ── Step 1: Fetch Discord messages ────────────────────────────────────────
    const { messages, channelNames } = await fetchAllConfiguredMessages();
    console.log(
      `[omni-discord] Fetched ${messages.length} messages from ${channelNames.length} channels`
    );

    if (messages.length === 0) {
      console.warn("[omni-discord] No messages found — saving empty summary");
    }

    // ── Step 2: Generate LLM summary ──────────────────────────────────────────
    const summary = await generateDailySummary(messages, channelNames, today);
    console.log(
      `[omni-discord] Summary generated: ${summary.signals.length} signals, ${summary.watchlist.length} watchlist items`
    );

    // ── Step 3: Save to database ───────────────────────────────────────────────
    await saveSummary(summary);
    console.log(`[omni-discord] Summary saved for ${today}`);

    return NextResponse.json({
      status: "success",
      date: today,
      messageCount: summary.messageCount,
      signalCount: summary.signals.length,
      watchlistCount: summary.watchlist.length,
    });
  } catch (err) {
    console.error("[omni-discord] Cron error:", err);
    return NextResponse.json(
      {
        status: "error",
        error: err instanceof Error ? err.message : String(err),
      },
      { status: 500 }
    );
  }
}
