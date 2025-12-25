import { pgTable, text, varchar, integer, real, timestamp, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Platform types
export type Platform = "polymarket" | "kalshi";

// Category types
export type Category = "trending" | "politics" | "crypto" | "sports" | "economy" | "tech";

// Market table
export const markets = pgTable("markets", {
  id: varchar("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  platform: text("platform").notNull().$type<Platform>(),
  category: text("category").notNull().$type<Category>(),
  yesPrice: real("yes_price").notNull(),
  noPrice: real("no_price").notNull(),
  volume: integer("volume").notNull(),
  resolutionDate: text("resolution_date").notNull(),
});

export const insertMarketSchema = createInsertSchema(markets);
export type InsertMarket = z.infer<typeof insertMarketSchema>;
export type Market = typeof markets.$inferSelect;

// Watchlist table
export const watchlistItems = pgTable("watchlist_items", {
  id: varchar("id").primaryKey(),
  marketId: varchar("market_id").notNull(),
  addedAt: text("added_at").notNull(),
});

export const insertWatchlistItemSchema = createInsertSchema(watchlistItems).omit({ id: true });
export type InsertWatchlistItem = z.infer<typeof insertWatchlistItemSchema>;
export type WatchlistItem = typeof watchlistItems.$inferSelect;

// Positions table (simulated)
export const positions = pgTable("positions", {
  id: varchar("id").primaryKey(),
  marketId: varchar("market_id").notNull(),
  direction: text("direction").notNull().$type<"yes" | "no">(),
  entryPrice: real("entry_price").notNull(),
  shares: integer("shares").notNull(),
});

export const insertPositionSchema = createInsertSchema(positions).omit({ id: true });
export type InsertPosition = z.infer<typeof insertPositionSchema>;
export type Position = typeof positions.$inferSelect;

// Users table
export const users = pgTable("users", {
  id: varchar("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

// Spread Opportunity type (cross-platform arbitrage detection)
export type SpreadOpportunity = {
  id: string;
  title: string;
  polymarketId: string | null;
  kalshiId: string | null;
  polymarketYesPrice: number | null;
  kalshiYesPrice: number | null;
  spreadPercent: number;
  spreadDirection: "polymarket_higher" | "kalshi_higher";
  combinedVolume: number;
  category: Category;
  resolutionDate: string;
  confidence: "high" | "medium" | "low";
  detectedAt: string;
};

// Alert types
export type AlertType = "price_threshold" | "volume_spike" | "resolution_approaching" | "spread_opportunity";
export type AlertStatus = "active" | "triggered" | "expired" | "disabled";

export const alerts = pgTable("alerts", {
  id: varchar("id").primaryKey(),
  marketId: varchar("market_id"),
  alertType: text("alert_type").notNull().$type<AlertType>(),
  condition: text("condition").notNull(), // JSON string with alert conditions
  status: text("status").notNull().$type<AlertStatus>(),
  createdAt: text("created_at").notNull(),
  triggeredAt: text("triggered_at"),
  message: text("message"),
});

export const insertAlertSchema = createInsertSchema(alerts).omit({ id: true, triggeredAt: true });
export type InsertAlert = z.infer<typeof insertAlertSchema>;
export type Alert = typeof alerts.$inferSelect;

// Alert condition types
export type PriceThresholdCondition = {
  type: "price_threshold";
  direction: "above" | "below";
  threshold: number;
  priceType: "yes" | "no";
};

export type VolumeSpikeCondition = {
  type: "volume_spike";
  percentIncrease: number;
  timeWindowHours: number;
};

export type ResolutionApproachingCondition = {
  type: "resolution_approaching";
  daysBeforeResolution: number;
};

export type SpreadOpportunityCondition = {
  type: "spread_opportunity";
  minSpreadPercent: number;
  category?: Category;
};

export type AlertCondition = 
  | PriceThresholdCondition 
  | VolumeSpikeCondition 
  | ResolutionApproachingCondition 
  | SpreadOpportunityCondition;

// Triggered alert notification
export type AlertNotification = {
  id: string;
  alertId: string;
  marketId?: string;
  marketTitle?: string;
  alertType: AlertType;
  message: string;
  triggeredAt: string;
  isRead: boolean;
};

// User Predictions table
export const predictions = pgTable("predictions", {
  id: varchar("id").primaryKey(),
  marketId: varchar("market_id").notNull(),
  direction: text("direction").notNull().$type<"yes" | "no">(),
  walletAddress: text("wallet_address"),
  createdAt: text("created_at").notNull(),
});

export const insertPredictionSchema = createInsertSchema(predictions).omit({ id: true });
export type InsertPrediction = z.infer<typeof insertPredictionSchema>;
export type Prediction = typeof predictions.$inferSelect;
