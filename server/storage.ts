import { 
  type User, 
  type InsertUser, 
  type Market, 
  type WatchlistItem,
  type InsertWatchlistItem,
  type Position,
  type InsertPosition,
  type Alert,
  type InsertAlert,
  type AlertNotification,
  type AlertStatus,
  type Prediction,
  type InsertPrediction,
} from "@shared/schema";
import { randomUUID } from "crypto";
import { fetchAllMarkets, getCachedMarketById, getCachedMarkets } from "./api-clients";

export interface IStorage {
  // Users
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Markets
  getAllMarkets(): Promise<Market[]>;
  getMarketById(id: string): Promise<Market | undefined>;
  
  // Watchlist
  getWatchlist(): Promise<WatchlistItem[]>;
  addToWatchlist(item: InsertWatchlistItem): Promise<WatchlistItem>;
  removeFromWatchlist(marketId: string): Promise<void>;
  isInWatchlist(marketId: string): Promise<boolean>;
  
  // Positions
  getPositions(): Promise<Position[]>;
  addPosition(position: InsertPosition): Promise<Position>;
  getPositionByMarketId(marketId: string): Promise<Position | undefined>;
  
  // Alerts
  getAlerts(): Promise<Alert[]>;
  getAlertById(id: string): Promise<Alert | undefined>;
  createAlert(alert: InsertAlert): Promise<Alert>;
  updateAlertStatus(id: string, status: AlertStatus, triggeredAt?: string): Promise<Alert | undefined>;
  deleteAlert(id: string): Promise<void>;
  
  // Notifications
  getNotifications(): Promise<AlertNotification[]>;
  addNotification(notification: Omit<AlertNotification, "id">): Promise<AlertNotification>;
  markNotificationRead(id: string): Promise<void>;
  clearNotifications(): Promise<void>;
  
  // Predictions
  getPredictions(): Promise<Prediction[]>;
  getPredictionsByMarket(marketId: string): Promise<Prediction[]>;
  getPredictionByUserAndMarket(walletAddress: string | null, marketId: string): Promise<Prediction | undefined>;
  getPredictionByMarketOnly(marketId: string): Promise<Prediction | undefined>;
  createPrediction(prediction: InsertPrediction): Promise<Prediction>;
}


export class MemStorage implements IStorage {
  private users: Map<string, User>;
  private watchlist: Map<string, WatchlistItem>;
  private positions: Map<string, Position>;
  private alerts: Map<string, Alert>;
  private notifications: Map<string, AlertNotification>;
  private predictions: Map<string, Prediction>;

  constructor() {
    this.users = new Map();
    this.watchlist = new Map();
    this.positions = new Map();
    this.alerts = new Map();
    this.notifications = new Map();
    this.predictions = new Map();
  }

  // Users
  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = randomUUID();
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }

  // Markets - fetch from external APIs
  async getAllMarkets(): Promise<Market[]> {
    return await fetchAllMarkets();
  }

  async getMarketById(id: string): Promise<Market | undefined> {
    const cached = getCachedMarketById(id);
    if (cached) return cached;
    
    await fetchAllMarkets();
    return getCachedMarketById(id);
  }

  // Watchlist
  async getWatchlist(): Promise<WatchlistItem[]> {
    return Array.from(this.watchlist.values());
  }

  async addToWatchlist(item: InsertWatchlistItem): Promise<WatchlistItem> {
    const id = randomUUID();
    const watchlistItem: WatchlistItem = { ...item, id };
    this.watchlist.set(id, watchlistItem);
    return watchlistItem;
  }

  async removeFromWatchlist(marketId: string): Promise<void> {
    const entries = Array.from(this.watchlist.entries());
    for (const [id, item] of entries) {
      if (item.marketId === marketId) {
        this.watchlist.delete(id);
        break;
      }
    }
  }

  async isInWatchlist(marketId: string): Promise<boolean> {
    return Array.from(this.watchlist.values()).some(
      (item) => item.marketId === marketId
    );
  }

  // Positions
  async getPositions(): Promise<Position[]> {
    return Array.from(this.positions.values());
  }

  async addPosition(position: InsertPosition): Promise<Position> {
    const id = randomUUID();
    const newPosition: Position = {
      id,
      marketId: position.marketId,
      direction: position.direction as "yes" | "no",
      entryPrice: position.entryPrice,
      shares: position.shares,
    };
    this.positions.set(id, newPosition);
    return newPosition;
  }

  async getPositionByMarketId(marketId: string): Promise<Position | undefined> {
    return Array.from(this.positions.values()).find(
      (p) => p.marketId === marketId
    );
  }

  // Alerts
  async getAlerts(): Promise<Alert[]> {
    return Array.from(this.alerts.values());
  }

  async getAlertById(id: string): Promise<Alert | undefined> {
    return this.alerts.get(id);
  }

  async createAlert(insertAlert: InsertAlert): Promise<Alert> {
    const id = randomUUID();
    const alert: Alert = {
      id,
      marketId: insertAlert.marketId || null,
      alertType: insertAlert.alertType as Alert["alertType"],
      condition: insertAlert.condition,
      status: insertAlert.status as Alert["status"],
      createdAt: insertAlert.createdAt,
      triggeredAt: null,
      message: insertAlert.message || null,
    };
    this.alerts.set(id, alert);
    return alert;
  }

  async updateAlertStatus(id: string, status: AlertStatus, triggeredAt?: string): Promise<Alert | undefined> {
    const alert = this.alerts.get(id);
    if (!alert) return undefined;
    
    const updated: Alert = {
      ...alert,
      status,
      triggeredAt: triggeredAt || alert.triggeredAt,
    };
    this.alerts.set(id, updated);
    return updated;
  }

  async deleteAlert(id: string): Promise<void> {
    this.alerts.delete(id);
  }

  // Notifications
  async getNotifications(): Promise<AlertNotification[]> {
    return Array.from(this.notifications.values()).sort(
      (a, b) => new Date(b.triggeredAt).getTime() - new Date(a.triggeredAt).getTime()
    );
  }

  async addNotification(notification: Omit<AlertNotification, "id">): Promise<AlertNotification> {
    const id = randomUUID();
    const newNotification: AlertNotification = { ...notification, id };
    this.notifications.set(id, newNotification);
    return newNotification;
  }

  async markNotificationRead(id: string): Promise<void> {
    const notification = this.notifications.get(id);
    if (notification) {
      this.notifications.set(id, { ...notification, isRead: true });
    }
  }

  async clearNotifications(): Promise<void> {
    this.notifications.clear();
  }

  // Predictions
  async getPredictions(): Promise<Prediction[]> {
    return Array.from(this.predictions.values()).sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }

  async getPredictionsByMarket(marketId: string): Promise<Prediction[]> {
    return Array.from(this.predictions.values()).filter(
      (p) => p.marketId === marketId
    );
  }

  async getPredictionByUserAndMarket(walletAddress: string | null, marketId: string): Promise<Prediction | undefined> {
    if (!walletAddress) return undefined;
    return Array.from(this.predictions.values()).find(
      (p) => p.walletAddress === walletAddress && p.marketId === marketId
    );
  }

  async getPredictionByMarketOnly(marketId: string): Promise<Prediction | undefined> {
    return Array.from(this.predictions.values()).find(
      (p) => p.marketId === marketId
    );
  }

  async createPrediction(insertPrediction: InsertPrediction): Promise<Prediction> {
    const id = crypto.randomUUID();
    const prediction: Prediction = {
      id,
      marketId: insertPrediction.marketId,
      direction: insertPrediction.direction as "yes" | "no",
      walletAddress: insertPrediction.walletAddress || null,
      createdAt: insertPrediction.createdAt,
    };
    this.predictions.set(id, prediction);
    return prediction;
  }
}

export const storage = new MemStorage();
