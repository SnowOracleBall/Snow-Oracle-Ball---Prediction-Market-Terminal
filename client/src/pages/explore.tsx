import { useState, useMemo } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAccount } from "wagmi";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MarketCard } from "@/components/market-card";
import { MarketGridSkeleton } from "@/components/loading-skeleton";
import { MarketInsightStrip } from "@/components/market-insight-strip";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { Market, WatchlistItem, Category, Platform, Prediction } from "@shared/schema";
import { TrendingUp, Vote, Bitcoin, Trophy, DollarSign, Cpu } from "lucide-react";

const categories: { value: Category; label: string; icon: typeof TrendingUp }[] = [
  { value: "trending", label: "Trending", icon: TrendingUp },
  { value: "politics", label: "Politics", icon: Vote },
  { value: "crypto", label: "Crypto", icon: Bitcoin },
  { value: "sports", label: "Sports", icon: Trophy },
  { value: "economy", label: "Economy", icon: DollarSign },
  { value: "tech", label: "Tech", icon: Cpu },
];

type SortOption = "volume" | "spread" | "resolution";

interface ExploreProps {
  searchQuery: string;
  platformFilter: Platform | "all";
}

export default function Explore({ searchQuery, platformFilter }: ExploreProps) {
  const [category, setCategory] = useState<Category>("trending");
  const [sortBy, setSortBy] = useState<SortOption>("volume");
  const { address } = useAccount();
  const { toast } = useToast();

  const { data: markets = [], isLoading: marketsLoading } = useQuery<Market[]>({
    queryKey: ["/api/markets"],
  });

  const { data: watchlist = [] } = useQuery<WatchlistItem[]>({
    queryKey: ["/api/watchlist"],
  });

  const { data: predictions = [] } = useQuery<Prediction[]>({
    queryKey: ["/api/predictions"],
  });

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

  const predictMutation = useMutation({
    mutationFn: async ({ marketId, direction }: { marketId: string; direction: "yes" | "no" }) => {
      return apiRequest("POST", "/api/predictions", { 
        marketId, 
        direction,
        walletAddress: address || null,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/predictions"] });
      toast({
        title: "Prediction saved!",
        description: "Your prediction has been recorded.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Prediction failed",
        description: error?.message || "Could not save your prediction.",
        variant: "destructive",
      });
    },
  });

  const watchlistMarketIds = useMemo(
    () => new Set(watchlist.map((w) => w.marketId)),
    [watchlist]
  );

  const userPredictionsByMarket = useMemo(() => {
    const map = new Map<string, Prediction>();
    predictions.forEach((p) => {
      // Only show predictions that belong to the current user
      if (address && p.walletAddress === address) {
        map.set(p.marketId, p);
      } else if (!address && !p.walletAddress) {
        // For anonymous users, show anonymous predictions
        map.set(p.marketId, p);
      }
    });
    return map;
  }, [predictions, address]);

  const filteredAndSortedMarkets = useMemo(() => {
    let result = markets;

    // Filter by category
    if (category !== "trending") {
      result = result.filter((m) => m.category === category);
    }

    // Filter by platform
    if (platformFilter !== "all") {
      result = result.filter((m) => m.platform === platformFilter);
    }

    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter((m) =>
        m.title.toLowerCase().includes(query) ||
        m.description.toLowerCase().includes(query)
      );
    }

    // Sort
    result = [...result].sort((a, b) => {
      switch (sortBy) {
        case "volume":
          return b.volume - a.volume;
        case "spread":
          const spreadA = Math.abs(a.yesPrice - a.noPrice);
          const spreadB = Math.abs(b.yesPrice - b.noPrice);
          return spreadB - spreadA;
        case "resolution":
          return new Date(a.resolutionDate).getTime() - new Date(b.resolutionDate).getTime();
        default:
          return 0;
      }
    });

    return result;
  }, [markets, category, platformFilter, searchQuery, sortBy]);

  const handleToggleWatchlist = (marketId: string) => {
    if (watchlistMarketIds.has(marketId)) {
      removeFromWatchlistMutation.mutate(marketId);
    } else {
      addToWatchlistMutation.mutate(marketId);
    }
  };

  const handlePredict = (marketId: string, direction: "yes" | "no") => {
    predictMutation.mutate({ marketId, direction });
  };

  return (
    <div className="flex flex-col gap-4 sm:gap-6 p-4 sm:p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight" data-testid="text-page-title">
            Explore Markets
          </h1>
          <p className="text-sm text-muted-foreground">
            Browse prediction markets across platforms
          </p>
        </div>

        <Select value={sortBy} onValueChange={(v) => setSortBy(v as SortOption)}>
          <SelectTrigger className="w-[180px]" data-testid="select-sort">
            <SelectValue placeholder="Sort by" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="volume">Highest Volume</SelectItem>
            <SelectItem value="spread">Largest Spread</SelectItem>
            <SelectItem value="resolution">Soonest Resolution</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Tabs value={category} onValueChange={(v) => setCategory(v as Category)}>
        <TabsList className="flex flex-wrap h-auto gap-1 bg-muted/50 p-1 overflow-x-auto">
          {categories.map((cat) => (
            <TabsTrigger
              key={cat.value}
              value={cat.value}
              className="gap-1 sm:gap-2 text-xs sm:text-sm data-[state=active]:bg-background shrink-0"
              data-testid={`tab-${cat.value}`}
            >
              <cat.icon className="h-3 w-3 sm:h-4 sm:w-4" />
              <span className="hidden xs:inline sm:inline">{cat.label}</span>
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      <MarketInsightStrip />

      {marketsLoading ? (
        <MarketGridSkeleton count={6} />
      ) : filteredAndSortedMarkets.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="rounded-full bg-muted p-4 mb-4">
            <TrendingUp className="h-8 w-8 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-medium">No markets found</h3>
          <p className="text-sm text-muted-foreground mt-1">
            Try adjusting your filters or search query
          </p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filteredAndSortedMarkets.map((market) => (
            <MarketCard
              key={market.id}
              market={market}
              isInWatchlist={watchlistMarketIds.has(market.id)}
              onToggleWatchlist={handleToggleWatchlist}
              userPrediction={userPredictionsByMarket.get(market.id)}
              onPredict={handlePredict}
              isPredicting={predictMutation.isPending}
            />
          ))}
        </div>
      )}
    </div>
  );
}
