import { useMemo } from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useState } from "react";
import type { Market } from "@shared/schema";

interface PriceChartProps {
  market: Market;
}

type TimeRange = "1D" | "7D" | "30D" | "ALL";

function generateHistoricalData(market: Market, range: TimeRange) {
  const now = new Date();
  const data: { time: string; yes: number; no: number; date: Date }[] = [];
  
  let points: number;
  let intervalMs: number;
  
  switch (range) {
    case "1D":
      points = 24;
      intervalMs = 60 * 60 * 1000;
      break;
    case "7D":
      points = 7 * 24;
      intervalMs = 60 * 60 * 1000;
      break;
    case "30D":
      points = 30;
      intervalMs = 24 * 60 * 60 * 1000;
      break;
    case "ALL":
      points = 90;
      intervalMs = 24 * 60 * 60 * 1000;
      break;
  }

  const currentYes = market.yesPrice * 100;
  const volatility = 5 + Math.random() * 10;
  
  let yesPrice = currentYes + (Math.random() - 0.5) * volatility * 2;
  
  for (let i = points; i >= 0; i--) {
    const date = new Date(now.getTime() - i * intervalMs);
    
    const trend = (currentYes - yesPrice) / (i + 1) * 0.3;
    const noise = (Math.random() - 0.5) * volatility * 0.5;
    yesPrice = Math.max(1, Math.min(99, yesPrice + trend + noise));
    
    if (i === 0) {
      yesPrice = currentYes;
    }
    
    data.push({
      time: range === "1D" 
        ? date.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })
        : date.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
      yes: Math.round(yesPrice * 10) / 10,
      no: Math.round((100 - yesPrice) * 10) / 10,
      date,
    });
  }
  
  return data;
}

export function PriceChart({ market }: PriceChartProps) {
  const [timeRange, setTimeRange] = useState<TimeRange>("7D");
  
  const data = useMemo(() => {
    return generateHistoricalData(market, timeRange);
  }, [market.id, market.yesPrice, timeRange]);
  
  const priceChange = data.length > 1 
    ? data[data.length - 1].yes - data[0].yes 
    : 0;
  const priceChangePercent = data.length > 1 && data[0].yes > 0
    ? ((data[data.length - 1].yes - data[0].yes) / data[0].yes) * 100
    : 0;

  return (
    <Card className="glass">
      <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          Price History
        </CardTitle>
        <Tabs value={timeRange} onValueChange={(v) => setTimeRange(v as TimeRange)}>
          <TabsList className="h-8">
            <TabsTrigger value="1D" className="text-xs px-2" data-testid="button-timerange-1d">1D</TabsTrigger>
            <TabsTrigger value="7D" className="text-xs px-2" data-testid="button-timerange-7d">7D</TabsTrigger>
            <TabsTrigger value="30D" className="text-xs px-2" data-testid="button-timerange-30d">30D</TabsTrigger>
            <TabsTrigger value="ALL" className="text-xs px-2" data-testid="button-timerange-all">ALL</TabsTrigger>
          </TabsList>
        </Tabs>
      </CardHeader>
      <CardContent>
        <div className="flex items-baseline gap-2 mb-4">
          <span className="text-2xl font-mono font-bold text-foreground">
            {Math.round(market.yesPrice * 100)}%
          </span>
          <span className={`text-sm font-mono ${priceChange >= 0 ? "text-green-500" : "text-red-500"}`}>
            {priceChange >= 0 ? "+" : ""}{priceChange.toFixed(1)}%
            <span className="text-muted-foreground ml-1">
              ({priceChangePercent >= 0 ? "+" : ""}{priceChangePercent.toFixed(1)}%)
            </span>
          </span>
        </div>
        
        <div className="h-[200px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
              <defs>
                <linearGradient id="yesGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#06b6d4" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
              <XAxis 
                dataKey="time" 
                stroke="hsl(var(--muted-foreground))" 
                fontSize={10}
                tickLine={false}
                axisLine={false}
                interval="preserveStartEnd"
              />
              <YAxis 
                stroke="hsl(var(--muted-foreground))" 
                fontSize={10}
                tickLine={false}
                axisLine={false}
                domain={[0, 100]}
                tickFormatter={(v) => `${v}%`}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "hsl(var(--card))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "8px",
                  fontSize: "12px",
                }}
                labelStyle={{ color: "hsl(var(--foreground))" }}
                formatter={(value: number) => [`${value}%`, "Yes Price"]}
              />
              <Area
                type="monotone"
                dataKey="yes"
                stroke="#06b6d4"
                strokeWidth={2}
                fill="url(#yesGradient)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
