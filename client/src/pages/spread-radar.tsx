import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  GitCompare, 
  TrendingUp, 
  TrendingDown, 
  Activity, 
  Filter,
  RefreshCw,
  AlertTriangle,
  CheckCircle,
  Circle
} from "lucide-react";
import type { SpreadOpportunity, Category } from "@shared/schema";

type ConfidenceFilter = "all" | "high" | "medium" | "low";
type CategoryFilter = Category | "all";

function SpreadCard({ spread }: { spread: SpreadOpportunity }) {
  const isPolymarketHigher = spread.spreadDirection === "polymarket_higher";
  
  return (
    <Card 
      className="bg-white/10 backdrop-blur-xl border-white/20 hover-elevate transition-all"
      data-testid={`spread-card-${spread.id}`}
    >
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-2">
          <CardTitle className="text-sm font-medium leading-tight line-clamp-2" style={{ color: '#ffffff' }}>
            {spread.title}
          </CardTitle>
          <Badge 
            variant={spread.confidence === "high" ? "default" : spread.confidence === "medium" ? "secondary" : "outline"}
            className="shrink-0"
          >
            {spread.confidence === "high" && <CheckCircle className="h-3 w-3 mr-1" />}
            {spread.confidence === "medium" && <Circle className="h-3 w-3 mr-1" />}
            {spread.confidence === "low" && <AlertTriangle className="h-3 w-3 mr-1" />}
            {spread.confidence}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-center">
          <div 
            className="text-3xl font-bold font-mono"
            style={{ 
              color: spread.spreadPercent > 10 ? '#22c55e' : 
                     spread.spreadPercent > 5 ? '#eab308' : '#60a5fa'
            }}
          >
            {spread.spreadPercent.toFixed(1)}%
          </div>
          <span className="text-xs ml-2" style={{ color: 'rgba(255,255,255,0.5)' }}>spread</span>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-md p-2" style={{ backgroundColor: 'rgba(59, 130, 246, 0.2)' }}>
            <div className="text-xs font-medium mb-1" style={{ color: 'rgba(255,255,255,0.6)' }}>Polymarket</div>
            <div className="flex items-center gap-1">
              <span className="text-lg font-mono font-semibold" style={{ color: '#ffffff' }}>
                {spread.polymarketYesPrice !== null ? `${(spread.polymarketYesPrice * 100).toFixed(0)}%` : "—"}
              </span>
              {isPolymarketHigher && spread.polymarketYesPrice !== null && (
                <TrendingUp className="h-4 w-4 text-green-400" />
              )}
            </div>
          </div>
          <div className="rounded-md p-2" style={{ backgroundColor: 'rgba(168, 85, 247, 0.2)' }}>
            <div className="text-xs font-medium mb-1" style={{ color: 'rgba(255,255,255,0.6)' }}>Kalshi</div>
            <div className="flex items-center gap-1">
              <span className="text-lg font-mono font-semibold" style={{ color: '#ffffff' }}>
                {spread.kalshiYesPrice !== null ? `${(spread.kalshiYesPrice * 100).toFixed(0)}%` : "—"}
              </span>
              {!isPolymarketHigher && spread.kalshiYesPrice !== null && (
                <TrendingUp className="h-4 w-4 text-green-400" />
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between text-xs" style={{ color: 'rgba(255,255,255,0.5)' }}>
          <div className="flex items-center gap-1">
            <Activity className="h-3 w-3" />
            <span>${(spread.combinedVolume / 1000000).toFixed(1)}M vol</span>
          </div>
          <Badge variant="outline" className="text-xs">
            {spread.category}
          </Badge>
        </div>

        <div className="flex items-center gap-1 text-xs" style={{ color: 'rgba(255,255,255,0.4)' }}>
          <GitCompare className="h-3 w-3" />
          <span>
            {isPolymarketHigher ? "Polymarket" : "Kalshi"} is {spread.spreadPercent.toFixed(1)}% higher
          </span>
        </div>
      </CardContent>
    </Card>
  );
}

function SpreadCardSkeleton() {
  return (
    <Card className="bg-white/10 backdrop-blur-xl border-white/20">
      <CardHeader className="pb-2">
        <Skeleton className="h-4 w-3/4" />
      </CardHeader>
      <CardContent className="space-y-4">
        <Skeleton className="h-10 w-20 mx-auto" />
        <div className="grid grid-cols-2 gap-3">
          <Skeleton className="h-16" />
          <Skeleton className="h-16" />
        </div>
        <Skeleton className="h-4 w-full" />
      </CardContent>
    </Card>
  );
}

export default function SpreadRadar() {
  const [confidenceFilter, setConfidenceFilter] = useState<ConfidenceFilter>("all");
  const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>("all");
  const [minSpread, setMinSpread] = useState<string>("0");

  const { data: spreads = [], isLoading, refetch, isFetching } = useQuery<SpreadOpportunity[]>({
    queryKey: ["/api/spreads"],
    refetchInterval: 30000,
  });

  const filteredSpreads = spreads.filter(s => {
    if (confidenceFilter !== "all" && s.confidence !== confidenceFilter) return false;
    if (categoryFilter !== "all" && s.category !== categoryFilter) return false;
    if (s.spreadPercent < parseFloat(minSpread)) return false;
    return true;
  });

  const stats = {
    totalOpportunities: spreads.length,
    avgSpread: spreads.length > 0 
      ? spreads.reduce((sum, s) => sum + s.spreadPercent, 0) / spreads.length 
      : 0,
    highConfidence: spreads.filter(s => s.confidence === "high").length,
    maxSpread: spreads.length > 0 ? Math.max(...spreads.map(s => s.spreadPercent)) : 0,
  };

  return (
    <div className="flex flex-col gap-4 sm:gap-6 p-4 sm:p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight flex items-center gap-2" style={{ color: '#ffffff' }} data-testid="text-page-title">
            <GitCompare className="h-6 w-6 text-primary" />
            Spread Radar
          </h1>
          <p className="text-sm" style={{ color: 'rgba(255,255,255,0.6)' }}>
            Cross-platform price discrepancies and arbitrage opportunities
          </p>
        </div>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={() => refetch()}
          disabled={isFetching}
          data-testid="button-refresh-spreads"
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${isFetching ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-white/10 backdrop-blur-xl border-white/20">
          <CardContent className="p-4">
            <div className="text-xs font-medium" style={{ color: 'rgba(255,255,255,0.6)' }}>Total Opportunities</div>
            <div className="text-2xl font-bold font-mono" style={{ color: '#ffffff' }}>{stats.totalOpportunities}</div>
          </CardContent>
        </Card>
        <Card className="bg-white/10 backdrop-blur-xl border-white/20">
          <CardContent className="p-4">
            <div className="text-xs font-medium" style={{ color: 'rgba(255,255,255,0.6)' }}>Avg Spread</div>
            <div className="text-2xl font-bold font-mono" style={{ color: '#60a5fa' }}>{stats.avgSpread.toFixed(1)}%</div>
          </CardContent>
        </Card>
        <Card className="bg-white/10 backdrop-blur-xl border-white/20">
          <CardContent className="p-4">
            <div className="text-xs font-medium" style={{ color: 'rgba(255,255,255,0.6)' }}>High Confidence</div>
            <div className="text-2xl font-bold font-mono" style={{ color: '#22c55e' }}>{stats.highConfidence}</div>
          </CardContent>
        </Card>
        <Card className="bg-white/10 backdrop-blur-xl border-white/20">
          <CardContent className="p-4">
            <div className="text-xs font-medium" style={{ color: 'rgba(255,255,255,0.6)' }}>Max Spread</div>
            <div className="text-2xl font-bold font-mono" style={{ color: '#eab308' }}>{stats.maxSpread.toFixed(1)}%</div>
          </CardContent>
        </Card>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4" style={{ color: 'rgba(255,255,255,0.6)' }} />
          <span className="text-sm font-medium" style={{ color: 'rgba(255,255,255,0.6)' }}>Filters:</span>
        </div>
        
        <Select value={confidenceFilter} onValueChange={(v) => setConfidenceFilter(v as ConfidenceFilter)}>
          <SelectTrigger className="w-[140px]" data-testid="select-confidence">
            <SelectValue placeholder="Confidence" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Confidence</SelectItem>
            <SelectItem value="high">High</SelectItem>
            <SelectItem value="medium">Medium</SelectItem>
            <SelectItem value="low">Low</SelectItem>
          </SelectContent>
        </Select>

        <Select value={categoryFilter} onValueChange={(v) => setCategoryFilter(v as CategoryFilter)}>
          <SelectTrigger className="w-[140px]" data-testid="select-category">
            <SelectValue placeholder="Category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            <SelectItem value="politics">Politics</SelectItem>
            <SelectItem value="crypto">Crypto</SelectItem>
            <SelectItem value="sports">Sports</SelectItem>
            <SelectItem value="economy">Economy</SelectItem>
            <SelectItem value="tech">Tech</SelectItem>
          </SelectContent>
        </Select>

        <Select value={minSpread} onValueChange={setMinSpread}>
          <SelectTrigger className="w-[140px]" data-testid="select-min-spread">
            <SelectValue placeholder="Min Spread" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="0">Any Spread</SelectItem>
            <SelectItem value="3">3%+</SelectItem>
            <SelectItem value="5">5%+</SelectItem>
            <SelectItem value="10">10%+</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, i) => <SpreadCardSkeleton key={i} />)}
        </div>
      ) : filteredSpreads.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="rounded-full p-4 mb-4" style={{ backgroundColor: 'rgba(255,255,255,0.1)' }}>
            <GitCompare className="h-8 w-8" style={{ color: 'rgba(255,255,255,0.5)' }} />
          </div>
          <h3 className="text-lg font-medium" style={{ color: '#ffffff' }}>No spread opportunities found</h3>
          <p className="text-sm mt-1" style={{ color: 'rgba(255,255,255,0.5)' }}>
            Try adjusting your filters or check back later
          </p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filteredSpreads.map((spread) => (
            <SpreadCard key={spread.id} spread={spread} />
          ))}
        </div>
      )}
    </div>
  );
}
