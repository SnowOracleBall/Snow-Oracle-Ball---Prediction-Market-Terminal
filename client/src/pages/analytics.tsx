import { useQuery } from "@tanstack/react-query";
import { useAccount } from "wagmi";
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { TrendingUp, TrendingDown, Target, Activity, Trophy, Percent } from "lucide-react";
import type { Prediction, Position, Market, Category } from "@shared/schema";

const CATEGORY_COLORS: Record<Category, string> = {
  trending: "#06b6d4",
  politics: "#8b5cf6",
  crypto: "#f59e0b",
  sports: "#10b981",
  economy: "#3b82f6",
  tech: "#ec4899",
};

export default function Analytics() {
  const { address } = useAccount();
  
  const { data: predictions = [], isLoading: predictionsLoading } = useQuery<Prediction[]>({
    queryKey: ["/api/predictions"],
  });
  
  const { data: positions = [], isLoading: positionsLoading } = useQuery<Position[]>({
    queryKey: ["/api/positions"],
  });
  
  const { data: markets = [], isLoading: marketsLoading } = useQuery<Market[]>({
    queryKey: ["/api/markets"],
  });

  const isLoading = predictionsLoading || positionsLoading || marketsLoading;

  const userPredictions = predictions.filter((p) => 
    (address && p.walletAddress === address) || (!address && !p.walletAddress)
  );

  const marketsMap = new Map(markets.map((m) => [m.id, m]));

  const categoryBreakdown = userPredictions.reduce((acc, pred) => {
    const market = marketsMap.get(pred.marketId);
    if (market) {
      acc[market.category] = (acc[market.category] || 0) + 1;
    }
    return acc;
  }, {} as Record<Category, number>);

  const categoryData = Object.entries(categoryBreakdown).map(([category, count]) => ({
    name: category.charAt(0).toUpperCase() + category.slice(1),
    value: count,
    color: CATEGORY_COLORS[category as Category],
  }));

  const directionBreakdown = userPredictions.reduce(
    (acc, pred) => {
      acc[pred.direction] = (acc[pred.direction] || 0) + 1;
      return acc;
    },
    { yes: 0, no: 0 } as Record<string, number>
  );

  const directionData = [
    { name: "Yes", value: directionBreakdown.yes, color: "#06b6d4" },
    { name: "No", value: directionBreakdown.no, color: "#64748b" },
  ];

  const totalPositionValue = positions.reduce((sum, pos) => {
    const market = marketsMap.get(pos.marketId);
    if (market) {
      const currentPrice = pos.direction === "yes" ? market.yesPrice : market.noPrice;
      return sum + currentPrice * pos.shares;
    }
    return sum;
  }, 0);

  const totalCost = positions.reduce((sum, pos) => sum + pos.entryPrice * pos.shares, 0);
  const totalPnL = totalPositionValue - totalCost;
  const pnlPercent = totalCost > 0 ? (totalPnL / totalCost) * 100 : 0;

  const positionsByCategory = positions.reduce((acc, pos) => {
    const market = marketsMap.get(pos.marketId);
    if (market) {
      if (!acc[market.category]) {
        acc[market.category] = { value: 0, pnl: 0 };
      }
      const currentPrice = pos.direction === "yes" ? market.yesPrice : market.noPrice;
      const posValue = currentPrice * pos.shares;
      const posCost = pos.entryPrice * pos.shares;
      acc[market.category].value += posValue;
      acc[market.category].pnl += posValue - posCost;
    }
    return acc;
  }, {} as Record<Category, { value: number; pnl: number }>);

  const positionCategoryData = Object.entries(positionsByCategory).map(([category, data]) => ({
    category: category.charAt(0).toUpperCase() + category.slice(1),
    value: Math.round(data.value * 100) / 100,
    pnl: Math.round(data.pnl * 100) / 100,
    fill: CATEGORY_COLORS[category as Category],
  }));

  if (isLoading) {
    return (
      <div className="flex flex-col gap-6 p-4 sm:p-6">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
        <div className="grid gap-4 lg:grid-cols-2">
          <Skeleton className="h-[300px]" />
          <Skeleton className="h-[300px]" />
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 p-4 sm:p-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Portfolio Analytics</h1>
        <p className="text-muted-foreground">Track your predictions and positions performance</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="glass glow-cyan">
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total P&L
            </CardTitle>
            {totalPnL >= 0 ? (
              <TrendingUp className="h-4 w-4 text-green-500" />
            ) : (
              <TrendingDown className="h-4 w-4 text-red-500" />
            )}
          </CardHeader>
          <CardContent>
            <div
              className={`text-2xl font-mono font-bold ${
                totalPnL >= 0 ? "text-green-500" : "text-red-500"
              }`}
              data-testid="text-total-pnl"
            >
              {totalPnL >= 0 ? "+" : ""}${totalPnL.toFixed(2)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {pnlPercent >= 0 ? "+" : ""}{pnlPercent.toFixed(1)}% return
            </p>
          </CardContent>
        </Card>

        <Card className="glass">
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Portfolio Value
            </CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-mono font-bold" data-testid="text-portfolio-value">
              ${totalPositionValue.toFixed(2)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {positions.length} active positions
            </p>
          </CardContent>
        </Card>

        <Card className="glass">
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Predictions Made
            </CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-mono font-bold" data-testid="text-predictions-count">
              {userPredictions.length}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {directionBreakdown.yes} yes, {directionBreakdown.no} no
            </p>
          </CardContent>
        </Card>

        <Card className="glass">
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Win Rate
            </CardTitle>
            <Percent className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-mono font-bold text-foreground" data-testid="text-win-rate">
              {userPredictions.length > 0 ? "67%" : "N/A"}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Based on resolved markets (simulated)
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="glass">
          <CardHeader>
            <CardTitle className="text-sm font-medium">Predictions by Category</CardTitle>
          </CardHeader>
          <CardContent>
            {categoryData.length > 0 ? (
              <div className="h-[250px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={categoryData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={90}
                      paddingAngle={2}
                      dataKey="value"
                    >
                      {categoryData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "hsl(var(--card))",
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "8px",
                      }}
                    />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-[250px] flex items-center justify-center">
                <p className="text-muted-foreground">No predictions yet</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="glass">
          <CardHeader>
            <CardTitle className="text-sm font-medium">Prediction Direction</CardTitle>
          </CardHeader>
          <CardContent>
            {userPredictions.length > 0 ? (
              <div className="h-[250px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={directionData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={90}
                      paddingAngle={2}
                      dataKey="value"
                    >
                      {directionData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "hsl(var(--card))",
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "8px",
                      }}
                    />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-[250px] flex items-center justify-center">
                <p className="text-muted-foreground">No predictions yet</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card className="glass">
        <CardHeader>
          <CardTitle className="text-sm font-medium">Positions by Category</CardTitle>
        </CardHeader>
        <CardContent>
          {positionCategoryData.length > 0 ? (
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={positionCategoryData} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
                  <XAxis dataKey="category" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                  <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickFormatter={(v) => `$${v}`} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px",
                    }}
                    formatter={(value: number, name: string) => [`$${value.toFixed(2)}`, name === "value" ? "Value" : "P&L"]}
                  />
                  <Bar dataKey="value" name="Value" radius={[4, 4, 0, 0]}>
                    {positionCategoryData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-[300px] flex items-center justify-center">
              <p className="text-muted-foreground">No positions yet</p>
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="glass">
        <CardHeader>
          <CardTitle className="text-sm font-medium">Recent Predictions</CardTitle>
        </CardHeader>
        <CardContent>
          {userPredictions.length > 0 ? (
            <div className="space-y-3">
              {userPredictions.slice(0, 5).map((pred) => {
                const market = marketsMap.get(pred.marketId);
                return (
                  <div
                    key={pred.id}
                    className="flex items-center justify-between gap-4 p-3 rounded-lg bg-muted/30"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">
                        {market?.title || "Unknown Market"}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(pred.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    <Badge
                      variant="outline"
                      className={
                        pred.direction === "yes"
                          ? "border-cyan-500/50 text-foreground"
                          : "border-slate-500/50 text-muted-foreground"
                      }
                    >
                      {pred.direction.toUpperCase()}
                    </Badge>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-muted-foreground text-center py-8">
              Make predictions on markets to see them here
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
