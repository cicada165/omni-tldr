// ─────────────────────────────────────────────────────────────────────────────
// LLM Summarizer — OpenAI GPT-4o direct (no omni-llm dependency)
// Produces structured investment intelligence from raw Discord messages
// ─────────────────────────────────────────────────────────────────────────────

import OpenAI from "openai";
import { DiscordMessage, DailySummary, InvestmentSignal } from "./types";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const MODEL = process.env.OPENAI_MODEL ?? "gpt-4o-mini";

function buildPrompt(messages: DiscordMessage[], date: string): string {
  // Format messages for the LLM
  const formatted = messages
    .filter((m) => m.content.trim().length > 0 && !m.author.bot)
    .map(
      (m) =>
        `[${m.channelName}] @${m.author.username}: ${m.content}`
    )
    .join("\n");

  return `You are an expert investment analyst monitoring Discord servers for investment signals.
Today's date: ${date}

Below are Discord messages from investment-related channels. Analyze them and produce a structured JSON report.

MESSAGES:
${formatted}

Respond with ONLY valid JSON matching this schema exactly:
{
  "fullSummary": "A 3-5 paragraph narrative summary of the investment discussion, key themes, notable mentions, and overall market sentiment expressed in the community.",
  "keyThemes": ["theme1", "theme2"],
  "signals": [
    {
      "ticker": "AAPL",
      "sentiment": "bullish",
      "confidence": "high",
      "description": "Why this signal exists",
      "source": "channel-name",
      "mentions": 5
    }
  ],
  "watchlist": ["AAPL", "ETH"],
  "riskFlags": ["Excessive hype around X", "Unverified claims about Y"]
}

Rules:
- signals: include any ticker (stocks, crypto, ETFs) mentioned with investment intent
- sentiment: must be "bullish", "bearish", or "neutral"
- confidence: must be "high", "medium", or "low" (based on how much community conviction was shown)
- watchlist: unique list of all tickers worth watching based on discussion volume/sentiment
- riskFlags: anything that looks like pump-and-dump, unverified claims, FOMO pressure, etc.
- If there are no investment discussions, return empty arrays and note it in fullSummary
- Do NOT include markdown, only raw JSON`;
}

export async function generateDailySummary(
  messages: DiscordMessage[],
  channelNames: string[],
  date: string
): Promise<DailySummary> {
  const prompt = buildPrompt(messages, date);

  const nonBotMessages = messages.filter(
    (m) => !m.author.bot && m.content.trim().length > 0
  );

  let parsed: {
    fullSummary: string;
    keyThemes: string[];
    signals: InvestmentSignal[];
    watchlist: string[];
    riskFlags: string[];
  };

  try {
    const response = await openai.chat.completions.create({
      model: MODEL,
      messages: [
        {
          role: "system",
          content:
            "You are a financial intelligence analyst. Always respond with valid JSON only.",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      temperature: 0.3,
      response_format: { type: "json_object" },
    });

    const raw = response.choices[0]?.message?.content ?? "{}";
    parsed = JSON.parse(raw);
  } catch (err) {
    console.error("LLM error:", err);
    parsed = {
      fullSummary: `Error generating summary: ${err}. ${nonBotMessages.length} messages were scraped.`,
      keyThemes: [],
      signals: [],
      watchlist: [],
      riskFlags: ["LLM generation failed — manual review required"],
    };
  }

  const summary: DailySummary = {
    id: date,
    generatedAt: new Date().toISOString(),
    channels: channelNames,
    messageCount: nonBotMessages.length,
    signals: parsed.signals ?? [],
    keyThemes: parsed.keyThemes ?? [],
    watchlist: parsed.watchlist ?? [],
    riskFlags: parsed.riskFlags ?? [],
    fullSummary: parsed.fullSummary ?? "No summary generated.",
  };

  return summary;
}
