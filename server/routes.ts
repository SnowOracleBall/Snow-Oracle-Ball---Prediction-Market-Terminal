import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertWatchlistItemSchema, insertPositionSchema, insertPredictionSchema } from "@shared/schema";
import { z } from "zod";
import { detectSpreadOpportunities } from "./api-clients";
import { generateMarketInsight, generatePortfolioInsight, generateQuickTip } from "./ai-insights";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  
  // Get all markets
  app.get("/api/markets", async (req, res) => {
    try {
      const markets = await storage.getAllMarkets();
      res.json(markets);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch markets" });
    }
  });

  // Get single market by ID
  app.get("/api/markets/:id", async (req, res) => {
    try {
      const market = await storage.getMarketById(req.params.id);
      if (!market) {
        return res.status(404).json({ error: "Market not found" });
      }
      res.json(market);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch market" });
    }
  });

  // Get watchlist
  app.get("/api/watchlist", async (req, res) => {
    try {
      const watchlist = await storage.getWatchlist();
      res.json(watchlist);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch watchlist" });
    }
  });

  // Add to watchlist
  app.post("/api/watchlist", async (req, res) => {
    try {
      const schema = z.object({
        marketId: z.string(),
      });
      
      const { marketId } = schema.parse(req.body);
      
      // Check if market exists
      const market = await storage.getMarketById(marketId);
      if (!market) {
        return res.status(404).json({ error: "Market not found" });
      }
      
      // Check if already in watchlist
      const alreadyInWatchlist = await storage.isInWatchlist(marketId);
      if (alreadyInWatchlist) {
        return res.status(400).json({ error: "Market already in watchlist" });
      }
      
      const item = await storage.addToWatchlist({
        marketId,
        addedAt: new Date().toISOString(),
      });
      
      res.status(201).json(item);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid request body" });
      }
      res.status(500).json({ error: "Failed to add to watchlist" });
    }
  });

  // Remove from watchlist
  app.delete("/api/watchlist/:marketId", async (req, res) => {
    try {
      await storage.removeFromWatchlist(req.params.marketId);
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: "Failed to remove from watchlist" });
    }
  });

  // Get positions
  app.get("/api/positions", async (req, res) => {
    try {
      const positions = await storage.getPositions();
      res.json(positions);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch positions" });
    }
  });

  // Add position
  app.post("/api/positions", async (req, res) => {
    try {
      const schema = z.object({
        marketId: z.string(),
        direction: z.enum(["yes", "no"]),
        entryPrice: z.number(),
        shares: z.number(),
      });
      
      const data = schema.parse(req.body);
      
      // Check if market exists
      const market = await storage.getMarketById(data.marketId);
      if (!market) {
        return res.status(404).json({ error: "Market not found" });
      }
      
      // Check if position already exists for this market
      const existingPosition = await storage.getPositionByMarketId(data.marketId);
      if (existingPosition) {
        return res.status(400).json({ error: "Position already exists for this market" });
      }
      
      const position = await storage.addPosition(data);
      res.status(201).json(position);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid request body" });
      }
      res.status(500).json({ error: "Failed to add position" });
    }
  });

  // Spread Radar - Get arbitrage opportunities
  app.get("/api/spreads", async (req, res) => {
    try {
      const opportunities = await detectSpreadOpportunities();
      res.json(opportunities);
    } catch (error) {
      res.status(500).json({ error: "Failed to detect spread opportunities" });
    }
  });

  // Alerts - Get all alerts
  app.get("/api/alerts", async (req, res) => {
    try {
      const alerts = await storage.getAlerts();
      res.json(alerts);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch alerts" });
    }
  });

  // Alerts - Create new alert
  app.post("/api/alerts", async (req, res) => {
    try {
      const priceThresholdCondition = z.object({
        type: z.literal("price_threshold"),
        direction: z.enum(["above", "below"]),
        threshold: z.number().min(0.01).max(0.99),
        priceType: z.enum(["yes", "no"]),
      });
      
      const volumeSpikeCondition = z.object({
        type: z.literal("volume_spike"),
        percentIncrease: z.number().min(1),
        timeWindowHours: z.number().min(1),
      });
      
      const resolutionApproachingCondition = z.object({
        type: z.literal("resolution_approaching"),
        daysBeforeResolution: z.number().min(1),
      });
      
      const spreadOpportunityCondition = z.object({
        type: z.literal("spread_opportunity"),
        minSpreadPercent: z.number().min(1),
      });
      
      const conditionSchema = z.union([
        priceThresholdCondition,
        volumeSpikeCondition,
        resolutionApproachingCondition,
        spreadOpportunityCondition,
      ]);
      
      const schema = z.object({
        marketId: z.string().optional(),
        alertType: z.enum(["price_threshold", "volume_spike", "resolution_approaching", "spread_opportunity"]),
        condition: z.string(),
        status: z.enum(["active", "triggered", "expired", "disabled"]),
        message: z.string().optional(),
      });
      
      const data = schema.parse(req.body);
      
      let parsedCondition;
      try {
        parsedCondition = JSON.parse(data.condition);
        conditionSchema.parse(parsedCondition);
      } catch {
        return res.status(400).json({ error: "Invalid condition format" });
      }
      
      if (parsedCondition.type !== data.alertType) {
        return res.status(400).json({ error: "Condition type must match alert type" });
      }
      
      const alert = await storage.createAlert({
        ...data,
        marketId: data.marketId || null,
        message: data.message || null,
        createdAt: new Date().toISOString(),
      });
      
      res.status(201).json(alert);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid request body" });
      }
      res.status(500).json({ error: "Failed to create alert" });
    }
  });

  // Alerts - Update alert status
  app.patch("/api/alerts/:id", async (req, res) => {
    try {
      const schema = z.object({
        status: z.enum(["active", "triggered", "expired", "disabled"]),
      });
      
      const { status } = schema.parse(req.body);
      const triggeredAt = status === "triggered" ? new Date().toISOString() : undefined;
      
      const alert = await storage.updateAlertStatus(req.params.id, status, triggeredAt);
      if (!alert) {
        return res.status(404).json({ error: "Alert not found" });
      }
      
      res.json(alert);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid request body" });
      }
      res.status(500).json({ error: "Failed to update alert" });
    }
  });

  // Alerts - Delete alert
  app.delete("/api/alerts/:id", async (req, res) => {
    try {
      await storage.deleteAlert(req.params.id);
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: "Failed to delete alert" });
    }
  });

  // Notifications - Get all notifications
  app.get("/api/notifications", async (req, res) => {
    try {
      const notifications = await storage.getNotifications();
      res.json(notifications);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch notifications" });
    }
  });

  // Notifications - Mark as read
  app.patch("/api/notifications/:id/read", async (req, res) => {
    try {
      await storage.markNotificationRead(req.params.id);
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: "Failed to mark notification as read" });
    }
  });

  // Notifications - Clear all
  app.delete("/api/notifications", async (req, res) => {
    try {
      await storage.clearNotifications();
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: "Failed to clear notifications" });
    }
  });

  // Predictions - Get all predictions
  app.get("/api/predictions", async (req, res) => {
    try {
      const predictions = await storage.getPredictions();
      res.json(predictions);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch predictions" });
    }
  });

  // Predictions - Get predictions for a specific market
  app.get("/api/predictions/market/:marketId", async (req, res) => {
    try {
      const predictions = await storage.getPredictionsByMarket(req.params.marketId);
      res.json(predictions);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch predictions for market" });
    }
  });

  // Predictions - Create prediction
  app.post("/api/predictions", async (req, res) => {
    try {
      const schema = z.object({
        marketId: z.string().min(1),
        direction: z.enum(["yes", "no"]),
        walletAddress: z.string().nullable().optional(),
      });
      
      const data = schema.parse(req.body);
      const walletAddress = data.walletAddress || null;
      
      // Check if market exists
      const market = await storage.getMarketById(data.marketId);
      if (!market) {
        return res.status(404).json({ error: "Market not found" });
      }
      
      // Check if user already predicted on this market
      if (walletAddress) {
        const existingPrediction = await storage.getPredictionByUserAndMarket(
          walletAddress,
          data.marketId
        );
        if (existingPrediction) {
          return res.status(400).json({ error: "You already made a prediction on this market" });
        }
      } else {
        // For anonymous users, check by market only (prevent spam)
        const existingPrediction = await storage.getPredictionByMarketOnly(data.marketId);
        if (existingPrediction && !existingPrediction.walletAddress) {
          return res.status(400).json({ error: "Anonymous prediction already exists for this market" });
        }
      }
      
      const prediction = await storage.createPrediction({
        marketId: data.marketId,
        direction: data.direction,
        walletAddress,
        createdAt: new Date().toISOString(),
      });
      
      res.status(201).json(prediction);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid request body", details: error.errors });
      }
      console.error("Failed to create prediction:", error);
      res.status(500).json({ error: "Failed to create prediction" });
    }
  });

  // AI Insights - Market Analysis
  app.get("/api/insights/market/:id", async (req, res) => {
    try {
      const market = await storage.getMarketById(req.params.id);
      if (!market) {
        return res.status(404).json({ error: "Market not found" });
      }
      
      const insight = await generateMarketInsight(market);
      res.json(insight);
    } catch (error) {
      console.error("Failed to generate market insight:", error);
      res.status(500).json({ error: "Failed to generate insight" });
    }
  });

  // AI Insights - Portfolio Analysis
  app.post("/api/insights/portfolio", async (req, res) => {
    try {
      const schema = z.object({
        walletAddress: z.string().nullable().optional(),
      });
      
      const { walletAddress } = schema.parse(req.body);
      
      const markets = await storage.getAllMarkets();
      const predictions = await storage.getPredictions();
      
      const userPredictions = predictions
        .filter((p: { marketId: string; walletAddress: string | null; direction: "yes" | "no" }) => 
          (walletAddress && p.walletAddress === walletAddress) || 
          (!walletAddress && !p.walletAddress)
        )
        .map((p: { marketId: string; direction: "yes" | "no" }) => ({ marketId: p.marketId, direction: p.direction }));
      
      if (userPredictions.length === 0) {
        return res.json({
          overallHealth: "No predictions to analyze yet",
          diversificationScore: 0,
          topOpportunities: ["Make your first prediction to get started"],
          riskWarnings: [],
          actionItems: ["Explore trending markets", "Add markets to your watchlist"],
        });
      }
      
      const insight = await generatePortfolioInsight(markets, userPredictions);
      res.json(insight);
    } catch (error) {
      console.error("Failed to generate portfolio insight:", error);
      res.status(500).json({ error: "Failed to generate insight" });
    }
  });

  // AI Insights - Quick Tip
  app.get("/api/insights/tip", async (req, res) => {
    try {
      const markets = await storage.getAllMarkets();
      const tip = await generateQuickTip(markets);
      res.json({ tip });
    } catch (error) {
      console.error("Failed to generate tip:", error);
      res.json({ tip: "Stay informed and trade wisely!" });
    }
  });

  return httpServer;
}
