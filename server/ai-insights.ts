import OpenAI from "openai";
import type { Market } from "@shared/schema";

const openai = new OpenAI({
  apiKey: process.env.AI_INTEGRATIONS_OPENAI_API_KEY,
  baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL,
});

export interface MarketInsight {
  marketId: string;
  summary: string;
  sentiment: "bullish" | "bearish" | "neutral";
  keyFactors: string[];
  riskLevel: "low" | "medium" | "high";
  recommendation: string;
}

export interface PortfolioInsight {
  overallHealth: string;
  diversificationScore: number;
  topOpportunities: string[];
  riskWarnings: string[];
  actionItems: string[];
}

export async function generateMarketInsight(market: Market): Promise<MarketInsight> {
  const prompt = `Analyze this prediction market and provide insights:
Title: ${market.title}
Description: ${market.description}
Current Yes Price: ${Math.round(market.yesPrice * 100)}%
Current No Price: ${Math.round(market.noPrice * 100)}%
Volume: $${market.volume.toLocaleString()}
Category: ${market.category}
Resolution Date: ${market.resolutionDate}

Provide a JSON response with:
- summary: 1-2 sentence analysis
- sentiment: "bullish", "bearish", or "neutral"
- keyFactors: array of 2-3 key factors affecting this market
- riskLevel: "low", "medium", or "high"
- recommendation: brief actionable insight`;

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: "You are a prediction market analyst. Provide concise, data-driven insights. Always respond with valid JSON.",
        },
        { role: "user", content: prompt },
      ],
      response_format: { type: "json_object" },
      max_tokens: 500,
    });

    const content = response.choices[0]?.message?.content || "{}";
    const parsed = JSON.parse(content);
    
    return {
      marketId: market.id,
      summary: parsed.summary || "Analysis unavailable",
      sentiment: parsed.sentiment || "neutral",
      keyFactors: parsed.keyFactors || [],
      riskLevel: parsed.riskLevel || "medium",
      recommendation: parsed.recommendation || "Monitor market closely",
    };
  } catch (error) {
    console.error("Error generating market insight:", error);
    return {
      marketId: market.id,
      summary: "Unable to generate analysis at this time",
      sentiment: "neutral",
      keyFactors: ["Data analysis pending"],
      riskLevel: "medium",
      recommendation: "Check back later for insights",
    };
  }
}

export async function generatePortfolioInsight(
  markets: Market[],
  predictions: { marketId: string; direction: "yes" | "no" }[]
): Promise<PortfolioInsight> {
  const predictedMarkets = predictions
    .map((p) => {
      const market = markets.find((m) => m.id === p.marketId);
      if (!market) return null;
      return {
        title: market.title,
        direction: p.direction,
        currentPrice: p.direction === "yes" ? market.yesPrice : market.noPrice,
        category: market.category,
      };
    })
    .filter(Boolean);

  const prompt = `Analyze this prediction portfolio and provide insights:
Predictions: ${JSON.stringify(predictedMarkets, null, 2)}

Provide a JSON response with:
- overallHealth: brief assessment of portfolio health
- diversificationScore: 1-10 rating
- topOpportunities: array of 2-3 opportunities
- riskWarnings: array of 1-2 risk warnings
- actionItems: array of 2-3 recommended actions`;

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: "You are a portfolio analyst specializing in prediction markets. Provide actionable insights. Always respond with valid JSON.",
        },
        { role: "user", content: prompt },
      ],
      response_format: { type: "json_object" },
      max_tokens: 600,
    });

    const content = response.choices[0]?.message?.content || "{}";
    const parsed = JSON.parse(content);
    
    return {
      overallHealth: parsed.overallHealth || "Portfolio analysis unavailable",
      diversificationScore: parsed.diversificationScore || 5,
      topOpportunities: parsed.topOpportunities || [],
      riskWarnings: parsed.riskWarnings || [],
      actionItems: parsed.actionItems || [],
    };
  } catch (error) {
    console.error("Error generating portfolio insight:", error);
    return {
      overallHealth: "Unable to analyze portfolio at this time",
      diversificationScore: 5,
      topOpportunities: ["Check back later for opportunities"],
      riskWarnings: ["Analysis pending"],
      actionItems: ["Review your predictions manually"],
    };
  }
}

export async function generateQuickTip(markets: Market[]): Promise<string> {
  const topMarkets = markets
    .sort((a, b) => b.volume - a.volume)
    .slice(0, 5)
    .map((m) => `${m.title} (${Math.round(m.yesPrice * 100)}% yes)`);

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: "You are a helpful prediction market assistant. Provide a single, concise tip (max 100 characters).",
        },
        {
          role: "user",
          content: `Top markets today: ${topMarkets.join(", ")}. Give one quick trading tip.`,
        },
      ],
      max_tokens: 50,
    });

    return response.choices[0]?.message?.content || "Stay informed and trade wisely!";
  } catch (error) {
    return "Watch high-volume markets for liquidity";
  }
}
