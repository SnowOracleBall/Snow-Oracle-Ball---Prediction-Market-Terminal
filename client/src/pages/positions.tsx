import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { TrendingUp, TrendingDown, ArrowUpRight, ArrowDownRight } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { TableSkeleton } from "@/components/loading-skeleton";
import type { Market, Position } from "@shared/schema";

function calculatePnL(
  entryPrice: number,
  currentPrice: number,
  shares: number
): { pnl: number; pnlPercent: number } {
  const pnlPerShare = currentPrice - entryPrice;
  const pnl = pnlPerShare * shares;
  const pnlPercent = entryPrice > 0 ? (pnlPerShare / entryPrice) * 100 : 0;
  return { pnl, pnlPercent };
}

export default function Positions() {
  const { data: markets = [] } = useQuery<Market[]>({
    queryKey: ["/api/markets"],
  });

  const { data: positions = [], isLoading } = useQuery<Position[]>({
    queryKey: ["/api/positions"],
  });

  const positionsWithMarkets = useMemo(() => {
    const marketMap = new Map(markets.map((m) => [m.id, m]));
    return positions
      .map((p) => ({
        position: p,
        market: marketMap.get(p.marketId),
      }))
      .filter((item): item is { position: Position; market: Market } =>
        item.market !== undefined
      );
  }, [markets, positions]);

  const totalPnL = useMemo(() => {
    return positionsWithMarkets.reduce((sum, { position, market }) => {
      const currentPrice = position.direction === "yes" ? market.yesPrice : market.noPrice;
      const { pnl } = calculatePnL(
        position.entryPrice,
        currentPrice,
        position.shares
      );
      return sum + pnl;
    }, 0);
  }, [positionsWithMarkets]);

  return (
    <div className="flex flex-col gap-4 sm:gap-6 p-4 sm:p-6">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight flex items-center gap-3" data-testid="text-page-title">
            <TrendingUp className="h-6 w-6 text-primary" />
            Positions
          </h1>
          <p className="text-sm text-muted-foreground">
            Track your simulated portfolio
          </p>
        </div>

        {positionsWithMarkets.length > 0 && (
          <Card className="glass px-4 py-3">
            <div className="text-xs text-muted-foreground">Total P&L</div>
            <div
              className={`text-lg font-mono font-semibold flex items-center gap-1 ${
                totalPnL >= 0 ? "text-green-500" : "text-red-500"
              }`}
              data-testid="text-total-pnl"
            >
              {totalPnL >= 0 ? (
                <ArrowUpRight className="h-4 w-4" />
              ) : (
                <ArrowDownRight className="h-4 w-4" />
              )}
              ${Math.abs(totalPnL).toFixed(2)}
            </div>
          </Card>
        )}
      </div>

      {isLoading ? (
        <TableSkeleton rows={5} />
      ) : positionsWithMarkets.length === 0 ? (
        <Card className="glass">
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <div className="rounded-full bg-muted p-4 mb-4">
              <TrendingUp className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-medium">No positions yet</h3>
            <p className="text-sm text-muted-foreground mt-1 mb-4 max-w-sm">
              This is a simulation view. Add markets to your portfolio from the market detail pages.
            </p>
            <Link href="/">
              <Button data-testid="button-browse-markets">Browse Markets</Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <Card className="glass overflow-hidden">
          <CardHeader className="pb-0">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {positionsWithMarkets.length} {positionsWithMarkets.length === 1 ? "position" : "positions"}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border text-xs text-muted-foreground">
                    <th className="text-left p-4 font-medium">Market</th>
                    <th className="text-center p-4 font-medium">Direction</th>
                    <th className="text-right p-4 font-medium">Entry</th>
                    <th className="text-right p-4 font-medium">Current</th>
                    <th className="text-right p-4 font-medium">Shares</th>
                    <th className="text-right p-4 font-medium">P&L</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {positionsWithMarkets.map(({ position, market }) => {
                    const currentPrice =
                      position.direction === "yes" ? market.yesPrice : market.noPrice;
                    const { pnl, pnlPercent } = calculatePnL(
                      position.entryPrice,
                      currentPrice,
                      position.shares
                    );
                    const isProfit = pnl >= 0;

                    return (
                      <tr
                        key={position.id}
                        className="hover-elevate"
                        data-testid={`position-row-${position.id}`}
                      >
                        <td className="p-4">
                          <Link href={`/market/${market.id}`}>
                            <span className="font-medium text-sm hover:text-primary transition-colors cursor-pointer line-clamp-1">
                              {market.title}
                            </span>
                          </Link>
                          <Badge
                            variant="outline"
                            className={`text-xs mt-1 ${
                              market.platform === "polymarket"
                                ? "border-cyan-500/30 text-foreground dark:text-foreground"
                                : "border-violet-500/30 text-violet-600 dark:text-violet-400"
                            }`}
                          >
                            {market.platform === "polymarket" ? "PM" : "KL"}
                          </Badge>
                        </td>
                        <td className="p-4 text-center">
                          <Badge
                            variant={position.direction === "yes" ? "default" : "secondary"}
                            className={
                              position.direction === "yes"
                                ? "bg-cyan-500/20 text-foreground dark:text-foreground border-cyan-500/30"
                                : "bg-slate-500/20 text-foreground dark:text-muted-foreground border-slate-500/30"
                            }
                          >
                            {position.direction.toUpperCase()}
                          </Badge>
                        </td>
                        <td className="p-4 text-right font-mono text-sm">
                          {Math.round(position.entryPrice * 100)}%
                        </td>
                        <td className="p-4 text-right font-mono text-sm">
                          {Math.round(currentPrice * 100)}%
                        </td>
                        <td className="p-4 text-right font-mono text-sm">
                          {position.shares}
                        </td>
                        <td className="p-4 text-right">
                          <div
                            className={`font-mono text-sm font-medium flex items-center justify-end gap-1 ${
                              isProfit ? "text-green-500" : "text-red-500"
                            }`}
                          >
                            {isProfit ? (
                              <ArrowUpRight className="h-3.5 w-3.5" />
                            ) : (
                              <ArrowDownRight className="h-3.5 w-3.5" />
                            )}
                            ${Math.abs(pnl).toFixed(2)}
                          </div>
                          <div
                            className={`text-xs ${
                              isProfit ? "text-green-500/70" : "text-red-500/70"
                            }`}
                          >
                            {isProfit ? "+" : ""}
                            {pnlPercent.toFixed(1)}%
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="text-xs text-center text-muted-foreground">
        This is a simulation. No real funds are at risk.
      </div>
    </div>
  );
}
