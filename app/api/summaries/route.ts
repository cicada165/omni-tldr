// ─────────────────────────────────────────────────────────────────────────────
// GET /api/summaries — list summaries index
// GET /api/summaries?date=YYYY-MM-DD — get specific summary
// GET /api/summaries?latest=true — get most recent summary
// ─────────────────────────────────────────────────────────────────────────────

import { NextRequest, NextResponse } from "next/server";
import { getSummary, getLatestSummary, listSummaries } from "@/lib/db";

export const revalidate = 60; // cache for 1 minute

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const date = searchParams.get("date");
  const latest = searchParams.get("latest") === "true";
  const list = searchParams.get("list") === "true";

  try {
    if (date) {
      // Validate date format
      if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
        return NextResponse.json(
          { error: "Invalid date format. Use YYYY-MM-DD." },
          { status: 400 }
        );
      }
      const summary = await getSummary(date);
      if (!summary) {
        return NextResponse.json(
          { error: `No summary found for ${date}` },
          { status: 404 }
        );
      }
      return NextResponse.json(summary);
    }

    if (latest) {
      const summary = await getLatestSummary();
      if (!summary) {
        return NextResponse.json(
          { error: "No summaries available yet" },
          { status: 404 }
        );
      }
      return NextResponse.json(summary);
    }

    if (list) {
      const limitStr = searchParams.get("limit") ?? "30";
      const limit = Math.min(parseInt(limitStr, 10), 90);
      const summaries = await listSummaries(limit);
      return NextResponse.json({ summaries });
    }

    // Default: return latest summary
    const summary = await getLatestSummary();
    if (!summary) {
      return NextResponse.json(
        { error: "No summaries available yet" },
        { status: 404 }
      );
    }
    return NextResponse.json(summary);
  } catch (err) {
    console.error("[omni-tldr] Summaries API error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
