import { useQuery, useMutation } from "@tanstack/react-query";
import { useParams, Link } from "wouter";
import {
  ArrowLeft,
  Eye,
  Plus,
  Briefcase,
  ExternalLink,
  Calendar,
  BarChart3,
  TrendingUp,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { PriceChart } from "@/components/price-chart";
import { queryClient, apiRequest } from "@/lib/queryClient";
import type { Market, WatchlistItem, Position } from "@shared/schema";

function formatVolume(volume: number): string {
  if (volume >= 1000000) {
    return `$${(volume / 1000000).toFixed(2)}M`;
  }
  if (volume >= 1000) {
    return `$${(volume / 1000).toFixed(1)}K`;
  }
  return `$${volume}`;
}

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

export default function MarketDetail() {
  const { id } = useParams<{ id: string }>();

  const { data: markets = [], isLoading: marketsLoading } = useQuery<Market[]>({
    queryKey: ["/api/markets"],
  });

  const { data: watchlist = [] } = useQuery<WatchlistItem[]>({
    queryKey: ["/api/watchlist"],
  });

  const { data: positions = [] } = useQuery<Position[]>({
    queryKey: ["/api/positions"],
  });

  const market = markets.find((m) => m.id === id);
  const isInWatchlist = watchlist.some((w) => w.marketId === id);
  const hasPosition = positions.some((p) => p.marketId === id);

  const addToWatchlistMutation = useMutation({
    mutationFn: async (marketId: string) => {
      return apiRequest("POST", "/api/watchlist", { marketId });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/watchlist"] });
    },
  });

  const removeFromWatchlistMutation = useMutation({
    mutationFn: async (marketId: string) => {
      return apiRequest("DELETE", `/api/watchlist/${marketId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/watchlist"] });
    },
  });

  const addPositionMutation = useMutation({
    mutationFn: async (data: { marketId: string; direction: "yes" | "no" }) => {
      return apiRequest("POST", "/api/positions", {
        ...data,
        entryPrice: data.direction === "yes" ? market?.yesPrice : market?.noPrice,
        shares: 100,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/positions"] });
    },
  });

  const handleToggleWatchlist = () => {
    if (isInWatchlist) {
      removeFromWatchlistMutation.mutate(id!);
    } else {
      addToWatchlistMutation.mutate(id!);
    }
  };

  if (marketsLoading) {
    return (
      <div className="flex flex-col gap-6 p-6">
        <Skeleton className="h-8 w-32" />
        <Skeleton className="h-12 w-3/4" />
        <div className="grid gap-4 sm:grid-cols-3">
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
        </div>
      </div>
    );
  }

  if (!market) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 p-6 py-16">
        <div className="rounded-full bg-muted p-4">
          <TrendingUp className="h-8 w-8 text-muted-foreground" />
        </div>
        <h2 className="text-lg font-medium">Market not found</h2>
        <p className="text-sm text-muted-foreground">
          The market you're looking for doesn't exist
        </p>
        <Link href="/">
          <Button data-testid="button-back-home">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Explore
          </Button>
        </Link>
      </div>
    );
  }

  const yesProbability = Math.round(market.yesPrice * 100);
  const noProbability = Math.round(market.noPrice * 100);

  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="flex items-center gap-2">
        <Link href="/">
          <Button variant="ghost" size="icon" data-testid="button-back">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <Badge
          variant="outline"
          className={`${
            market.platform === "polymarket"
              ? "border-cyan-500/30 text-foreground dark:text-foreground"
              : "border-violet-500/30 text-violet-600 dark:text-violet-400"
          }`}
        >
          {market.platform === "polymarket" ? "Polymarket" : "Kalshi"}
        </Badge>
        <Badge variant="secondary" className="capitalize">
          {market.category}
        </Badge>
      </div>

      <div>
        <h1 className="text-2xl font-semibold tracking-tight" data-testid="text-market-title">
          {market.title}
        </h1>
        <p className="text-muted-foreground mt-2" data-testid="text-market-description">
          {market.description}
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Card className="glass glow-cyan">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Yes Probability
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-mono font-bold text-foreground" data-testid="text-yes-probability">
              {yesProbability}%
            </div>
            <div className="mt-3 h-3 w-full rounded-full bg-muted overflow-hidden">
              <div
                className="h-full rounded-full bg-gradient-to-r from-cyan-500 to-cyan-400"
                style={{ width: `${yesProbability}%` }}
              />
            </div>
          </CardContent>
        </Card>

        <Card className="glass">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <TrendingUp className="h-4 w-4 rotate-180" />
              No Probability
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-mono font-bold text-foreground" data-testid="text-no-probability">
              {noProbability}%
            </div>
            <div className="mt-3 h-3 w-full rounded-full bg-muted overflow-hidden">
              <div
                className="h-full rounded-full bg-gradient-to-r from-slate-500 to-slate-400"
                style={{ width: `${noProbability}%` }}
              />
            </div>
          </CardContent>
        </Card>

        <Card className="glass">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              Volume
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-mono font-bold" data-testid="text-volume">
              {formatVolume(market.volume)}
            </div>
            <div className="mt-2 text-sm text-muted-foreground">
              Total traded volume
            </div>
          </CardContent>
        </Card>
      </div>

      <PriceChart market={market} />

      <Card className="glass">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            Resolution Date
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-lg font-medium" data-testid="text-resolution-date">
            {formatDate(market.resolutionDate)}
          </div>
        </CardContent>
      </Card>

      <Separator />

      <div className="flex flex-wrap gap-3">
        <Button
          variant={isInWatchlist ? "secondary" : "outline"}
          className="gap-2"
          onClick={handleToggleWatchlist}
          disabled={addToWatchlistMutation.isPending || removeFromWatchlistMutation.isPending}
          data-testid="button-toggle-watchlist"
        >
          {isInWatchlist ? (
            <>
              <Eye className="h-4 w-4" />
              Watching
            </>
          ) : (
            <>
              <Plus className="h-4 w-4" />
              Add to Watchlist
            </>
          )}
        </Button>

        {!hasPosition && (
          <>
            <Button
              variant="default"
              className="gap-2 bg-cyan-600 hover:bg-cyan-700"
              onClick={() => addPositionMutation.mutate({ marketId: id!, direction: "yes" })}
              disabled={addPositionMutation.isPending}
              data-testid="button-add-yes-position"
            >
              <Briefcase className="h-4 w-4" />
              Simulate YES
            </Button>
            <Button
              variant="secondary"
              className="gap-2"
              onClick={() => addPositionMutation.mutate({ marketId: id!, direction: "no" })}
              disabled={addPositionMutation.isPending}
              data-testid="button-add-no-position"
            >
              <Briefcase className="h-4 w-4" />
              Simulate NO
            </Button>
          </>
        )}

        {hasPosition && (
          <Badge variant="outline" className="h-9 px-3 text-sm">
            Position Added
          </Badge>
        )}

        <Button variant="ghost" className="gap-2 ml-auto" data-testid="button-external-link">
          <ExternalLink className="h-4 w-4" />
          View on {market.platform === "polymarket" ? "Polymarket" : "Kalshi"}
        </Button>
      </div>
    </div>
  );
}
