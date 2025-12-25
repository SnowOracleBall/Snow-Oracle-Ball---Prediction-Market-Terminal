import WebSocket from "ws";
import type { Market, Platform, Category } from "@shared/schema";

const POLYMARKET_GAMMA_API = "https://gamma-api.polymarket.com";
const POLYMARKET_LIVE_WS_URL = "wss://ws-live-data.polymarket.com";

interface PolymarketEvent {
  id: string;
  slug: string;
  title: string;
  description: string;
  markets: PolymarketMarketData[];
  active: boolean;
  closed: boolean;
  volume?: number;
  liquidity?: number;
}

interface PolymarketMarketData {
  id: string;
  question: string;
  conditionId: string;
  slug: string;
  outcomes: string[];
  outcomePrices: string[];
  volume: string;
  active: boolean;
  closed: boolean;
  endDate?: string;
  clobTokenIds?: string[];
}

interface RTDSMessage {
  topic: string;
  type: string;
  payload: any;
}

interface TradePayload {
  market_slug: string;
  outcome: string;
  price: number;
  size: number;
  side: string;
  timestamp: number;
}

const marketCache = new Map<string, Market>();
const assetToMarketMap = new Map<string, string>();
const slugToMarketId = new Map<string, string>();
let wsConnection: WebSocket | null = null;
let reconnectAttempts = 0;
const MAX_RECONNECT_ATTEMPTS = 5;
const RECONNECT_DELAY = 5000;

function mapCategory(title: string, description: string = ""): Category {
  const text = `${title} ${description}`.toLowerCase();
  
  if (text.includes("bitcoin") || text.includes("crypto") || text.includes("ethereum") || 
      text.includes("btc") || text.includes("eth") || text.includes("solana")) {
    return "crypto";
  }
  if (text.includes("president") || text.includes("election") || text.includes("congress") ||
      text.includes("trump") || text.includes("biden") || text.includes("political")) {
    return "politics";
  }
  if (text.includes("super bowl") || text.includes("nfl") || text.includes("nba") ||
      text.includes("championship") || text.includes("world cup") || text.includes("olympic")) {
    return "sports";
  }
  if (text.includes("inflation") || text.includes("fed") || text.includes("interest rate") ||
      text.includes("gdp") || text.includes("economy") || text.includes("recession")) {
    return "economy";
  }
  if (text.includes("ai") || text.includes("openai") || text.includes("tesla") ||
      text.includes("apple") || text.includes("google") || text.includes("tech")) {
    return "tech";
  }
  return "trending";
}

async function fetchAllPolymarketEvents(): Promise<Market[]> {
  const markets: Market[] = [];
  
  try {
    const response = await fetch(`${POLYMARKET_GAMMA_API}/events?limit=100&active=true&closed=false`);
    if (!response.ok) {
      throw new Error(`Gamma API error: ${response.status}`);
    }
    
    const events: PolymarketEvent[] = await response.json();
    
    for (const event of events) {
      if (!event.active || event.closed) continue;
      
      for (const market of event.markets || []) {
        if (!market.active || market.closed) continue;
        
        try {
          const outcomes = market.outcomes || [];
          const prices = market.outcomePrices || [];
          
          const yesPrice = parseFloat(prices[0]) || 0.5;
          const noPrice = parseFloat(prices[1]) || (1 - yesPrice);
          const volume = parseFloat(market.volume) || 0;
          
          const marketData: Market = {
            id: `pm-${market.id}`,
            title: market.question || event.title || "Untitled",
            description: event.description || "",
            platform: "polymarket" as Platform,
            category: mapCategory(market.question || event.title, event.description),
            yesPrice: Math.max(0.01, Math.min(0.99, yesPrice)),
            noPrice: Math.max(0.01, Math.min(0.99, noPrice)),
            volume: Math.round(volume),
            resolutionDate: market.endDate || "",
          };
          
          markets.push(marketData);
          marketCache.set(marketData.id, marketData);
          
          if (market.slug) {
            slugToMarketId.set(market.slug, marketData.id);
          }
          
          if (market.clobTokenIds) {
            for (const tokenId of market.clobTokenIds) {
              assetToMarketMap.set(tokenId, marketData.id);
            }
          }
        } catch (e) {
          console.error("Error parsing market:", e);
        }
      }
    }
    
    console.log(`[Polymarket] Fetched ${markets.length} markets from ${events.length} events`);
  } catch (error) {
    console.error("[Polymarket] Failed to fetch events:", error);
  }
  
  return markets;
}

async function fetchPolymarketMarketsDirect(): Promise<Market[]> {
  const markets: Market[] = [];
  
  try {
    const response = await fetch(`${POLYMARKET_GAMMA_API}/markets?limit=200&active=true&closed=false`);
    if (!response.ok) {
      throw new Error(`Gamma API error: ${response.status}`);
    }
    
    const data = await response.json();
    
    for (const market of data) {
      if (!market.active || market.closed) continue;
      
      try {
        const prices = typeof market.outcomePrices === 'string' 
          ? JSON.parse(market.outcomePrices) 
          : market.outcomePrices || [];
        
        const yesPrice = parseFloat(prices[0]) || 0.5;
        const noPrice = parseFloat(prices[1]) || (1 - yesPrice);
        const volume = market.volumeNum || parseFloat(market.volume) || 0;
        
        const marketData: Market = {
          id: `pm-${market.id}`,
          title: market.question || "Untitled",
          description: market.description || "",
          platform: "polymarket" as Platform,
          category: mapCategory(market.question, market.description),
          yesPrice: Math.max(0.01, Math.min(0.99, yesPrice)),
          noPrice: Math.max(0.01, Math.min(0.99, noPrice)),
          volume: Math.round(volume),
          resolutionDate: market.endDate || "",
        };
        
        markets.push(marketData);
        marketCache.set(marketData.id, marketData);
        
        if (market.slug) {
          slugToMarketId.set(market.slug, marketData.id);
        }
        
        if (market.clobTokenIds) {
          const tokenIds = typeof market.clobTokenIds === 'string' 
            ? JSON.parse(market.clobTokenIds) 
            : market.clobTokenIds;
          for (const tokenId of tokenIds) {
            assetToMarketMap.set(tokenId, marketData.id);
          }
        }
      } catch (e) {
        // Skip malformed markets
      }
    }
    
    console.log(`[Polymarket] Fetched ${markets.length} markets directly, ${slugToMarketId.size} slugs mapped`);
  } catch (error) {
    console.error("[Polymarket] Failed to fetch markets directly:", error);
  }
  
  return markets;
}

function connectWebSocket() {
  if (wsConnection && wsConnection.readyState === WebSocket.OPEN) {
    return;
  }
  
  console.log("[Polymarket RTDS] Connecting to wss://ws-live-data.polymarket.com...");
  
  try {
    wsConnection = new WebSocket(POLYMARKET_LIVE_WS_URL);
    
    wsConnection.on("open", () => {
      console.log("[Polymarket RTDS] Connected to live data stream");
      reconnectAttempts = 0;
      
      const subscription = {
        action: "subscribe",
        subscriptions: [
          {
            topic: "activity",
            type: "trades"
          }
        ]
      };
      wsConnection?.send(JSON.stringify(subscription));
      console.log("[Polymarket RTDS] Subscribed to live trades activity");
    });
    
    wsConnection.on("message", (data: WebSocket.Data) => {
      try {
        const message: RTDSMessage = JSON.parse(data.toString());
        handleRTDSMessage(message);
      } catch (e) {
        // Ignore parse errors
      }
    });
    
    wsConnection.on("close", () => {
      console.log("[Polymarket RTDS] Connection closed");
      scheduleReconnect();
    });
    
    wsConnection.on("error", (error) => {
      console.error("[Polymarket RTDS] Error:", error.message);
    });
    
  } catch (error) {
    console.error("[Polymarket RTDS] Failed to connect:", error);
    scheduleReconnect();
  }
}

function scheduleReconnect() {
  if (reconnectAttempts >= MAX_RECONNECT_ATTEMPTS) {
    console.log("[Polymarket WS] Max reconnect attempts reached, using REST API only");
    return;
  }
  
  reconnectAttempts++;
  const delay = RECONNECT_DELAY * reconnectAttempts;
  console.log(`[Polymarket WS] Reconnecting in ${delay / 1000}s (attempt ${reconnectAttempts})`);
  
  setTimeout(() => {
    connectWebSocket();
  }, delay);
}

function handleRTDSMessage(message: RTDSMessage) {
  if (message.topic === "activity" && message.type === "trades") {
    const payload = message.payload as TradePayload;
    
    if (payload && payload.market_slug && payload.price) {
      const marketId = slugToMarketId.get(payload.market_slug);
      
      if (marketId) {
        const market = marketCache.get(marketId);
        if (market) {
          const newPrice = payload.price;
          if (!isNaN(newPrice) && newPrice > 0 && newPrice < 1) {
            if (payload.outcome === "Yes" || payload.outcome === "yes") {
              market.yesPrice = newPrice;
              market.noPrice = 1 - newPrice;
            } else {
              market.noPrice = newPrice;
              market.yesPrice = 1 - newPrice;
            }
            marketCache.set(marketId, market);
          }
        }
      }
    }
  }
}

let lastFullRefresh = 0;
const FULL_REFRESH_INTERVAL = 30000;

export async function getPolymarketMarkets(): Promise<Market[]> {
  const now = Date.now();
  
  if (marketCache.size === 0 || (now - lastFullRefresh) > FULL_REFRESH_INTERVAL) {
    const [eventsMarkets, directMarkets] = await Promise.all([
      fetchAllPolymarketEvents(),
      fetchPolymarketMarketsDirect(),
    ]);
    
    for (const market of [...eventsMarkets, ...directMarkets]) {
      if (!marketCache.has(market.id)) {
        marketCache.set(market.id, market);
      }
    }
    
    lastFullRefresh = now;
    
    if (marketCache.size > 0 && !wsConnection) {
      connectWebSocket();
    }
  }
  
  return Array.from(marketCache.values());
}

export function getMarketById(id: string): Market | undefined {
  return marketCache.get(id);
}

export function getAllCachedMarkets(): Market[] {
  return Array.from(marketCache.values());
}

export function closeWebSocket() {
  if (wsConnection) {
    wsConnection.close();
    wsConnection = null;
  }
}
