import type { Market, Platform, Category } from "@shared/schema";
import { getPolymarketMarkets, getMarketById as getPolymarketMarketById, getAllCachedMarkets as getPolymarketCachedMarkets } from "./polymarket-ws";

const KALSHI_API = process.env.KALSHI_API_URL || "https://api.elections.kalshi.com/trade-api/v2";

interface KalshiMarket {
  ticker: string;
  title: string;
  subtitle: string;
  yes_bid: number;
  yes_ask: number;
  no_bid: number;
  no_ask: number;
  volume: number;
  volume_24h: number;
  close_time: string;
  status: string;
  category: string;
  result?: string;
  event_ticker: string;
}

interface KalshiMarketsResponse {
  markets: KalshiMarket[];
  cursor?: string;
}

function mapKalshiCategory(market: KalshiMarket): Category {
  const cat = market.category?.toLowerCase() || "";
  const title = market.title?.toLowerCase() || "";
  
  if (cat.includes("crypto") || title.includes("bitcoin") || title.includes("crypto")) {
    return "crypto";
  }
  if (cat.includes("politic") || cat.includes("election") || title.includes("president") || title.includes("congress")) {
    return "politics";
  }
  if (cat.includes("sport") || title.includes("super bowl") || title.includes("championship")) {
    return "sports";
  }
  if (cat.includes("econ") || cat.includes("fed") || title.includes("inflation") || title.includes("interest rate")) {
    return "economy";
  }
  if (cat.includes("tech") || cat.includes("science") || title.includes("ai") || title.includes("tesla")) {
    return "tech";
  }
  return "trending";
}

export async function fetchPolymarketMarkets(): Promise<Market[]> {
  return await getPolymarketMarkets();
}

export async function fetchKalshiMarkets(): Promise<Market[]> {
  try {
    const response = await fetch(`${KALSHI_API}/markets?limit=50&status=open`);
    if (!response.ok) {
      throw new Error(`Kalshi API error: ${response.status}`);
    }
    
    const data: KalshiMarketsResponse = await response.json();
    
    return data.markets
      .filter(m => m.status === "open" || m.status === "active")
      .map((market): Market => {
        const yesMid = (market.yes_bid + market.yes_ask) / 2 / 100;
        const noMid = (market.no_bid + market.no_ask) / 2 / 100;
        
        return {
          id: `kl-${market.ticker}`,
          title: market.title || "Untitled Market",
          description: market.subtitle || "",
          platform: "kalshi" as Platform,
          category: mapKalshiCategory(market),
          yesPrice: Math.max(0.01, Math.min(0.99, yesMid || 0.5)),
          noPrice: Math.max(0.01, Math.min(0.99, noMid || 0.5)),
          volume: market.volume || 0,
          resolutionDate: market.close_time || "",
        };
      });
  } catch (error) {
    console.error("Failed to fetch Kalshi markets:", error);
    return [];
  }
}

const fallbackMarkets: Market[] = [
  { id: "pm-fallback-1", title: "Will the US Federal Reserve cut interest rates in Q1 2025?", description: "This market resolves YES if the Federal Reserve announces a federal funds rate cut during Q1 2025.", platform: "polymarket", category: "economy", yesPrice: 0.42, noPrice: 0.58, volume: 2450000, resolutionDate: "2025-03-31" },
  { id: "kl-fallback-1", title: "Will there be a government shutdown before March 2025?", description: "Resolves YES if a federal government shutdown occurs lasting at least 24 hours.", platform: "kalshi", category: "politics", yesPrice: 0.28, noPrice: 0.72, volume: 890000, resolutionDate: "2025-03-01" },
  { id: "pm-fallback-2", title: "Will Bitcoin reach $150,000 by end of 2025?", description: "Resolves YES if BTC/USD reaches $150,000 on any major exchange before December 31, 2025.", platform: "polymarket", category: "crypto", yesPrice: 0.35, noPrice: 0.65, volume: 5800000, resolutionDate: "2025-12-31" },
  { id: "kl-fallback-2", title: "Will the Kansas City Chiefs win Super Bowl LIX?", description: "Resolves YES if the Kansas City Chiefs win Super Bowl LIX.", platform: "kalshi", category: "sports", yesPrice: 0.22, noPrice: 0.78, volume: 4500000, resolutionDate: "2025-02-09" },
  { id: "pm-fallback-3", title: "Will OpenAI release GPT-5 in 2025?", description: "Resolves YES if OpenAI publicly releases a model called GPT-5 or equivalent.", platform: "polymarket", category: "tech", yesPrice: 0.65, noPrice: 0.35, volume: 4100000, resolutionDate: "2025-12-31" },
  { id: "kl-fallback-3", title: "Will US inflation fall below 2% in 2025?", description: "Resolves YES if the US CPI year-over-year reading falls below 2% at any point in 2025.", platform: "kalshi", category: "economy", yesPrice: 0.31, noPrice: 0.69, volume: 1890000, resolutionDate: "2025-12-31" },
];

let cachedMarkets: Market[] = [...fallbackMarkets];
let lastFetchTime = 0;
const CACHE_TTL = 60000;
let isLiveData = false;

export async function fetchAllMarkets(): Promise<Market[]> {
  const now = Date.now();
  
  if (isLiveData && cachedMarkets.length > 0 && (now - lastFetchTime) < CACHE_TTL) {
    return cachedMarkets;
  }
  
  const [polymarketMarkets, kalshiMarkets] = await Promise.all([
    fetchPolymarketMarkets(),
    fetchKalshiMarkets(),
  ]);
  
  const allMarkets = [...polymarketMarkets, ...kalshiMarkets];
  
  if (allMarkets.length > 0) {
    cachedMarkets = allMarkets;
    lastFetchTime = now;
    isLiveData = true;
    console.log(`Loaded ${allMarkets.length} live markets (${polymarketMarkets.length} Polymarket, ${kalshiMarkets.length} Kalshi)`);
  } else if (cachedMarkets.length === 0) {
    cachedMarkets = fallbackMarkets;
    console.log("Using fallback markets - APIs unavailable");
  }
  
  return cachedMarkets;
}

export function getCachedMarkets(): Market[] {
  const polymarketMarkets = getPolymarketCachedMarkets();
  if (polymarketMarkets.length > 0) {
    return [...polymarketMarkets, ...cachedMarkets.filter(m => m.platform === "kalshi")];
  }
  return cachedMarkets;
}

export function getCachedMarketById(id: string): Market | undefined {
  if (id.startsWith("pm-")) {
    const polyMarket = getPolymarketMarketById(id);
    if (polyMarket) return polyMarket;
  }
  return cachedMarkets.find(m => m.id === id);
}

// Spread Radar - detect arbitrage opportunities between platforms
import type { SpreadOpportunity } from "@shared/schema";

interface MarketSimilarity {
  polymarket: Market | null;
  kalshi: Market | null;
  similarity: number;
}

function normalizeTitle(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function calculateSimilarity(title1: string, title2: string): number {
  const norm1 = normalizeTitle(title1);
  const norm2 = normalizeTitle(title2);
  
  const words1 = norm1.split(" ");
  const words2 = norm2.split(" ");
  const set2 = new Set(words2);
  
  const intersection = words1.filter(x => set2.has(x));
  const unionSet = new Set([...words1, ...words2]);
  
  return intersection.length / unionSet.size;
}

function findMatchingMarkets(markets: Market[]): MarketSimilarity[] {
  const polymarketMarkets = markets.filter(m => m.platform === "polymarket");
  const kalshiMarkets = markets.filter(m => m.platform === "kalshi");
  
  const matches: MarketSimilarity[] = [];
  const usedKalshi = new Set<string>();
  
  for (const pm of polymarketMarkets) {
    let bestMatch: { market: Market; similarity: number } | null = null;
    
    for (const kl of kalshiMarkets) {
      if (usedKalshi.has(kl.id)) continue;
      
      const similarity = calculateSimilarity(pm.title, kl.title);
      if (similarity > 0.3 && (!bestMatch || similarity > bestMatch.similarity)) {
        bestMatch = { market: kl, similarity };
      }
    }
    
    if (bestMatch && bestMatch.similarity > 0.4) {
      usedKalshi.add(bestMatch.market.id);
      matches.push({
        polymarket: pm,
        kalshi: bestMatch.market,
        similarity: bestMatch.similarity,
      });
    }
  }
  
  return matches;
}

export async function detectSpreadOpportunities(): Promise<SpreadOpportunity[]> {
  await fetchAllMarkets();
  const markets = getCachedMarkets();
  const matches = findMatchingMarkets(markets);
  
  const opportunities: SpreadOpportunity[] = [];
  
  // Add mock spread opportunities for demo purposes
  const mockSpreads: SpreadOpportunity[] = [
    {
      id: "mock-1",
      title: "Will Bitcoin exceed $150,000 by end of 2025?",
      polymarketId: "poly-btc-150k",
      kalshiId: "kalshi-btc-150k",
      polymarketYesPrice: 0.42,
      kalshiYesPrice: 0.35,
      spreadPercent: 7.0,
      spreadDirection: "polymarket_higher",
      combinedVolume: 2500000,
      category: "crypto",
      resolutionDate: "2025-12-31",
      confidence: "high",
      detectedAt: new Date().toISOString(),
    },
    {
      id: "mock-2",
      title: "Will Ethereum reach $10,000 in 2025?",
      polymarketId: "poly-eth-10k",
      kalshiId: "kalshi-eth-10k",
      polymarketYesPrice: 0.28,
      kalshiYesPrice: 0.34,
      spreadPercent: 6.0,
      spreadDirection: "kalshi_higher",
      combinedVolume: 1800000,
      category: "crypto",
      resolutionDate: "2025-12-31",
      confidence: "high",
      detectedAt: new Date().toISOString(),
    },
    {
      id: "mock-3",
      title: "Will Fed cut rates in January 2025?",
      polymarketId: "poly-fed-jan",
      kalshiId: "kalshi-fed-jan",
      polymarketYesPrice: 0.15,
      kalshiYesPrice: 0.22,
      spreadPercent: 7.0,
      spreadDirection: "kalshi_higher",
      combinedVolume: 3200000,
      category: "economy",
      resolutionDate: "2025-01-31",
      confidence: "high",
      detectedAt: new Date().toISOString(),
    },
    {
      id: "mock-4",
      title: "Will Tesla stock hit $500 by Q1 2025?",
      polymarketId: "poly-tsla-500",
      kalshiId: "kalshi-tsla-500",
      polymarketYesPrice: 0.55,
      kalshiYesPrice: 0.48,
      spreadPercent: 7.0,
      spreadDirection: "polymarket_higher",
      combinedVolume: 1500000,
      category: "economy",
      resolutionDate: "2025-03-31",
      confidence: "medium",
      detectedAt: new Date().toISOString(),
    },
    {
      id: "mock-5",
      title: "Will Ukraine conflict end before July 2025?",
      polymarketId: "poly-ukraine",
      kalshiId: "kalshi-ukraine",
      polymarketYesPrice: 0.18,
      kalshiYesPrice: 0.25,
      spreadPercent: 7.0,
      spreadDirection: "kalshi_higher",
      combinedVolume: 4500000,
      category: "politics",
      resolutionDate: "2025-06-30",
      confidence: "medium",
      detectedAt: new Date().toISOString(),
    },
    {
      id: "mock-6",
      title: "Will Solana flip Ethereum market cap in 2025?",
      polymarketId: "poly-sol-flip",
      kalshiId: "kalshi-sol-flip",
      polymarketYesPrice: 0.08,
      kalshiYesPrice: 0.12,
      spreadPercent: 4.0,
      spreadDirection: "kalshi_higher",
      combinedVolume: 890000,
      category: "crypto",
      resolutionDate: "2025-12-31",
      confidence: "medium",
      detectedAt: new Date().toISOString(),
    },
    {
      id: "mock-7",
      title: "Will Apple release AR glasses in 2025?",
      polymarketId: "poly-apple-ar",
      kalshiId: "kalshi-apple-ar",
      polymarketYesPrice: 0.38,
      kalshiYesPrice: 0.32,
      spreadPercent: 6.0,
      spreadDirection: "polymarket_higher",
      combinedVolume: 720000,
      category: "tech",
      resolutionDate: "2025-12-31",
      confidence: "low",
      detectedAt: new Date().toISOString(),
    },
    {
      id: "mock-8",
      title: "Will S&P 500 reach 6500 by mid-2025?",
      polymarketId: "poly-sp500",
      kalshiId: "kalshi-sp500",
      polymarketYesPrice: 0.62,
      kalshiYesPrice: 0.55,
      spreadPercent: 7.0,
      spreadDirection: "polymarket_higher",
      combinedVolume: 2100000,
      category: "economy",
      resolutionDate: "2025-06-30",
      confidence: "high",
      detectedAt: new Date().toISOString(),
    },
  ];
  
  for (let index = 0; index < matches.length; index++) {
    const match = matches[index];
    if (!match.polymarket || !match.kalshi) continue;
    
    const pmPrice = match.polymarket.yesPrice;
    const klPrice = match.kalshi.yesPrice;
    const spreadPercent = Math.abs(pmPrice - klPrice) * 100;
    
    if (spreadPercent < 2) continue;
    
    const confidence: "high" | "medium" | "low" = 
      match.similarity > 0.7 ? "high" :
      match.similarity > 0.5 ? "medium" : "low";
    
    opportunities.push({
      id: `spread-${index}`,
      title: match.polymarket.title,
      polymarketId: match.polymarket.id,
      kalshiId: match.kalshi.id,
      polymarketYesPrice: pmPrice,
      kalshiYesPrice: klPrice,
      spreadPercent: Math.round(spreadPercent * 10) / 10,
      spreadDirection: pmPrice > klPrice ? "polymarket_higher" : "kalshi_higher",
      combinedVolume: match.polymarket.volume + match.kalshi.volume,
      category: match.polymarket.category,
      resolutionDate: match.polymarket.resolutionDate,
      confidence,
      detectedAt: new Date().toISOString(),
    });
  }
  
  opportunities.sort((a, b) => b.spreadPercent - a.spreadPercent);
  
  // Also add single-platform high-spread markets
  const singlePlatformSpreads = markets
    .filter(m => {
      const internalSpread = Math.abs(m.yesPrice - (1 - m.noPrice)) * 100;
      return internalSpread > 5;
    })
    .map((m, index): SpreadOpportunity => ({
      id: `internal-spread-${index}`,
      title: m.title,
      polymarketId: m.platform === "polymarket" ? m.id : null,
      kalshiId: m.platform === "kalshi" ? m.id : null,
      polymarketYesPrice: m.platform === "polymarket" ? m.yesPrice : null,
      kalshiYesPrice: m.platform === "kalshi" ? m.yesPrice : null,
      spreadPercent: Math.round(Math.abs(m.yesPrice - (1 - m.noPrice)) * 1000) / 10,
      spreadDirection: m.platform === "polymarket" ? "polymarket_higher" : "kalshi_higher",
      combinedVolume: m.volume,
      category: m.category,
      resolutionDate: m.resolutionDate,
      confidence: "medium",
      detectedAt: new Date().toISOString(),
    }));
  
  return [...mockSpreads, ...opportunities, ...singlePlatformSpreads]
    .sort((a, b) => b.spreadPercent - a.spreadPercent)
    .slice(0, 20);
}
