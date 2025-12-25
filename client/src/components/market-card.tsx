import { Eye, Plus, ExternalLink, ThumbsUp, ThumbsDown, Check } from "lucide-react";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import type { Market, Prediction } from "@shared/schema";
import { Link } from "wouter";

interface MarketCardProps {
  market: Market;
  isInWatchlist: boolean;
  onToggleWatchlist: (marketId: string) => void;
  userPrediction?: Prediction | null;
  onPredict?: (marketId: string, direction: "yes" | "no") => void;
  isPredicting?: boolean;
}

function formatVolume(volume: number): string {
  if (volume >= 1000000) {
    return `$${(volume / 1000000).toFixed(1)}M`;
  }
  if (volume >= 1000) {
    return `$${(volume / 1000).toFixed(1)}K`;
  }
  return `$${volume}`;
}

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function MarketCard({ market, isInWatchlist, onToggleWatchlist, userPrediction, onPredict, isPredicting }: MarketCardProps) {
  const yesProbability = Math.round(market.yesPrice * 100);
  const noProbability = Math.round(market.noPrice * 100);
  const hasPredicted = !!userPrediction;

  return (
    <Card className="glass group relative overflow-visible transition-all duration-200 hover:border-primary/30">
      <CardHeader className="flex flex-row items-start justify-between gap-2 space-y-0 pb-2">
        <div className="flex-1 min-w-0">
          <Link href={`/market/${market.id}`}>
            <h3 
              className="font-medium text-sm leading-tight line-clamp-2 hover:text-primary transition-colors cursor-pointer"
              data-testid={`market-title-${market.id}`}
            >
              {market.title}
            </h3>
          </Link>
        </div>
        <Badge
          variant="outline"
          className={`shrink-0 text-xs ${
            market.platform === "polymarket"
              ? "border-cyan-500/30 text-foreground dark:text-foreground"
              : "border-violet-500/30 text-violet-600 dark:text-violet-400"
          }`}
          data-testid={`market-platform-${market.id}`}
        >
          {market.platform === "polymarket" ? "PM" : "KL"}
        </Badge>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="flex items-center justify-between gap-4">
          <div className="flex-1 space-y-1">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>Yes</span>
              <span className="font-mono text-foreground" data-testid={`market-yes-${market.id}`}>
                {yesProbability}%
              </span>
            </div>
            <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
              <div
                className="h-full rounded-full bg-gradient-to-r from-cyan-500 to-cyan-400 transition-all"
                style={{ width: `${yesProbability}%` }}
              />
            </div>
          </div>
          <div className="flex-1 space-y-1">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>No</span>
              <span className="font-mono text-foreground" data-testid={`market-no-${market.id}`}>
                {noProbability}%
              </span>
            </div>
            <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
              <div
                className="h-full rounded-full bg-gradient-to-r from-slate-500 to-slate-400 transition-all"
                style={{ width: `${noProbability}%` }}
              />
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>Volume: {formatVolume(market.volume)}</span>
          <span>Resolves: {formatDate(market.resolutionDate)}</span>
        </div>

        {onPredict && (
          <div className="pt-2 border-t border-border/50">
            <div className="text-xs text-muted-foreground mb-2">Your Prediction:</div>
            {hasPredicted ? (
              <div className="flex items-center gap-2">
                <Check className="h-4 w-4 text-green-500" />
                <Badge 
                  variant="outline" 
                  className={userPrediction.direction === "yes" 
                    ? "border-cyan-500/50 text-foreground bg-cyan-500/10" 
                    : "border-slate-500/50 text-muted-foreground bg-slate-500/10"
                  }
                >
                  {userPrediction.direction.toUpperCase()}
                </Badge>
              </div>
            ) : (
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  className="flex-1 gap-1 border-cyan-500/30 text-foreground hover:bg-cyan-500/10"
                  onClick={() => onPredict(market.id, "yes")}
                  disabled={isPredicting}
                  data-testid={`button-predict-yes-${market.id}`}
                >
                  <ThumbsUp className="h-3.5 w-3.5" />
                  Yes
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="flex-1 gap-1 border-slate-500/30 text-muted-foreground hover:bg-slate-500/10"
                  onClick={() => onPredict(market.id, "no")}
                  disabled={isPredicting}
                  data-testid={`button-predict-no-${market.id}`}
                >
                  <ThumbsDown className="h-3.5 w-3.5" />
                  No
                </Button>
              </div>
            )}
          </div>
        )}
      </CardContent>

      <CardFooter className="flex gap-2 pt-0">
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant={isInWatchlist ? "secondary" : "outline"}
              size="sm"
              className="flex-1 gap-2"
              onClick={() => onToggleWatchlist(market.id)}
              data-testid={`button-watchlist-${market.id}`}
            >
              {isInWatchlist ? (
                <>
                  <Eye className="h-3.5 w-3.5" />
                  Watching
                </>
              ) : (
                <>
                  <Plus className="h-3.5 w-3.5" />
                  Watch
                </>
              )}
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            {isInWatchlist ? "Remove from watchlist" : "Add to watchlist"}
          </TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Link href={`/market/${market.id}`}>
              <Button
                variant="ghost"
                size="icon"
                data-testid={`button-details-${market.id}`}
              >
                <ExternalLink className="h-3.5 w-3.5" />
              </Button>
            </Link>
          </TooltipTrigger>
          <TooltipContent>View details</TooltipContent>
        </Tooltip>
      </CardFooter>
    </Card>
  );
}
