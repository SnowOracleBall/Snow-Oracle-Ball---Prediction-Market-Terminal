import { useMemo } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Link } from "wouter";
import { Eye, Trash2, ExternalLink, TrendingUp, TrendingDown } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { TableSkeleton } from "@/components/loading-skeleton";
import { queryClient, apiRequest } from "@/lib/queryClient";
import type { Market, WatchlistItem } from "@shared/schema";

function formatVolume(volume: number): string {
  if (volume >= 1000000) {
    return `$${(volume / 1000000).toFixed(1)}M`;
  }
  if (volume >= 1000) {
    return `$${(volume / 1000).toFixed(1)}K`;
  }
  return `$${volume}`;
}

export default function Watchlist() {
  const { data: markets = [] } = useQuery<Market[]>({
    queryKey: ["/api/markets"],
  });

  const { data: watchlist = [], isLoading } = useQuery<WatchlistItem[]>({
    queryKey: ["/api/watchlist"],
  });

  const removeFromWatchlistMutation = useMutation({
    mutationFn: async (marketId: string) => {
      return apiRequest("DELETE", `/api/watchlist/${marketId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/watchlist"] });
    },
  });

  const watchedMarkets = useMemo(() => {
    const marketMap = new Map(markets.map((m) => [m.id, m]));
    return watchlist
      .map((w) => ({
        watchlistItem: w,
        market: marketMap.get(w.marketId),
      }))
      .filter((item): item is { watchlistItem: WatchlistItem; market: Market } => 
        item.market !== undefined
      );
  }, [markets, watchlist]);

  return (
    <div className="flex flex-col gap-4 sm:gap-6 p-4 sm:p-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight flex items-center gap-3" data-testid="text-page-title">
          <Eye className="h-6 w-6 text-primary" />
          Watchlist
        </h1>
        <p className="text-sm text-muted-foreground">
          Monitor your selected markets
        </p>
      </div>

      {isLoading ? (
        <TableSkeleton rows={5} />
      ) : watchedMarkets.length === 0 ? (
        <Card className="glass">
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <div className="rounded-full bg-muted p-4 mb-4">
              <Eye className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-medium">No markets in watchlist</h3>
            <p className="text-sm text-muted-foreground mt-1 mb-4">
              Add markets from the Explore page to start tracking
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
              {watchedMarkets.length} {watchedMarkets.length === 1 ? "market" : "markets"} tracked
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-border">
              {watchedMarkets.map(({ watchlistItem, market }) => {
                const yesProbability = Math.round(market.yesPrice * 100);
                const isHighProbability = yesProbability >= 50;

                return (
                  <div
                    key={watchlistItem.id}
                    className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 p-3 sm:p-4 hover-elevate"
                    data-testid={`watchlist-item-${market.id}`}
                  >
                    <div className="flex-1 min-w-0">
                      <Link href={`/market/${market.id}`}>
                        <h3 className="font-medium text-sm truncate hover:text-primary transition-colors cursor-pointer">
                          {market.title}
                        </h3>
                      </Link>
                      <div className="flex items-center gap-2 mt-1 flex-wrap">
                        <Badge
                          variant="outline"
                          className={`text-xs ${
                            market.platform === "polymarket"
                              ? "border-cyan-500/30 text-foreground dark:text-foreground"
                              : "border-violet-500/30 text-violet-600 dark:text-violet-400"
                          }`}
                        >
                          {market.platform === "polymarket" ? "PM" : "KL"}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          Vol: {formatVolume(market.volume)}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between sm:justify-end gap-4">
                      <div className="flex items-center gap-2">
                        {isHighProbability ? (
                          <TrendingUp className="h-4 w-4 text-foreground" />
                        ) : (
                          <TrendingDown className="h-4 w-4 text-foreground" />
                        )}
                        <div>
                          <div className="font-mono text-sm font-medium">
                            {yesProbability}%
                          </div>
                          <div className="text-xs text-muted-foreground">Yes</div>
                        </div>
                      </div>

                      <div className="flex items-center gap-1">
                        <Link href={`/market/${market.id}`}>
                          <Button
                            variant="ghost"
                            size="icon"
                            data-testid={`button-view-${market.id}`}
                          >
                            <ExternalLink className="h-4 w-4" />
                          </Button>
                        </Link>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => removeFromWatchlistMutation.mutate(market.id)}
                          className="text-muted-foreground hover:text-destructive"
                          data-testid={`button-remove-${market.id}`}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
