import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAccount } from "wagmi";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { apiRequest } from "@/lib/queryClient";
import {
  Brain,
  Sparkles,
  TrendingUp,
  TrendingDown,
  Minus,
  AlertTriangle,
  Shield,
  Target,
  Lightbulb,
  RefreshCw,
  Zap,
} from "lucide-react";
import type { Market } from "@shared/schema";

interface MarketInsight {
  marketId: string;
  summary: string;
  sentiment: "bullish" | "bearish" | "neutral";
  keyFactors: string[];
  riskLevel: "low" | "medium" | "high";
  recommendation: string;
}

interface PortfolioInsight {
  overallHealth: string;
  diversificationScore: number;
  topOpportunities: string[];
  riskWarnings: string[];
  actionItems: string[];
}

const sentimentIcons = {
  bullish: TrendingUp,
  bearish: TrendingDown,
  neutral: Minus,
};

const sentimentColors = {
  bullish: "text-green-500",
  bearish: "text-red-500",
  neutral: "text-muted-foreground",
};

const riskColors = {
  low: "border-green-500/50 text-green-500",
  medium: "border-yellow-500/50 text-yellow-500",
  high: "border-red-500/50 text-red-500",
};

export default function AIInsights() {
  const { address } = useAccount();
  const [selectedMarketId, setSelectedMarketId] = useState<string>("");

  const { data: markets = [], isLoading: marketsLoading } = useQuery<Market[]>({
    queryKey: ["/api/markets"],
  });

  const { data: quickTip, isLoading: tipLoading } = useQuery<{ tip: string }>({
    queryKey: ["/api/insights/tip"],
  });

  const marketInsightMutation = useMutation({
    mutationFn: async (marketId: string) => {
      const response = await fetch(`/api/insights/market/${marketId}`);
      if (!response.ok) throw new Error("Failed to fetch insight");
      return response.json() as Promise<MarketInsight>;
    },
  });

  const portfolioInsightMutation = useMutation({
    mutationFn: async () => {
      return apiRequest("POST", "/api/insights/portfolio", {
        walletAddress: address || null,
      }).then((res) => res.json()) as Promise<PortfolioInsight>;
    },
  });

  const handleAnalyzeMarket = () => {
    if (selectedMarketId) {
      marketInsightMutation.mutate(selectedMarketId);
    }
  };

  const handleAnalyzePortfolio = () => {
    portfolioInsightMutation.mutate();
  };

  const selectedMarket = markets.find((m) => m.id === selectedMarketId);

  if (marketsLoading) {
    return (
      <div className="flex flex-col gap-6 p-4 sm:p-6">
        <Skeleton className="h-10 w-48" />
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
        <h1 className="text-2xl font-semibold tracking-tight flex items-center gap-2">
          <Brain className="h-6 w-6 text-foreground" />
          AI Insights
        </h1>
        <p className="text-muted-foreground">
          AI-powered analysis for prediction markets
        </p>
      </div>

      <Card className="glass glow-cyan">
        <CardContent className="pt-6">
          <div className="flex items-center gap-3">
            <Lightbulb className="h-5 w-5 text-yellow-500 flex-shrink-0" />
            <p className="text-sm" data-testid="text-quick-tip">
              {tipLoading ? "Loading tip..." : quickTip?.tip || "Stay informed and trade wisely!"}
            </p>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="glass">
          <CardHeader>
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-foreground" />
              Market Analysis
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <Select value={selectedMarketId} onValueChange={setSelectedMarketId}>
                <SelectTrigger className="flex-1" data-testid="select-market-analysis">
                  <SelectValue placeholder="Select a market to analyze" />
                </SelectTrigger>
                <SelectContent>
                  {markets.slice(0, 20).map((market) => (
                    <SelectItem key={market.id} value={market.id}>
                      {market.title.slice(0, 50)}...
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button
                onClick={handleAnalyzeMarket}
                disabled={!selectedMarketId || marketInsightMutation.isPending}
                data-testid="button-analyze-market"
              >
                {marketInsightMutation.isPending ? (
                  <RefreshCw className="h-4 w-4 animate-spin" />
                ) : (
                  <Zap className="h-4 w-4" />
                )}
              </Button>
            </div>

            {marketInsightMutation.data && (
              <div className="space-y-4 mt-4 p-4 rounded-lg bg-muted/30">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    {(() => {
                      const Icon = sentimentIcons[marketInsightMutation.data.sentiment];
                      return (
                        <Icon
                          className={`h-5 w-5 ${sentimentColors[marketInsightMutation.data.sentiment]}`}
                        />
                      );
                    })()}
                    <span className="font-medium capitalize">
                      {marketInsightMutation.data.sentiment}
                    </span>
                  </div>
                  <Badge
                    variant="outline"
                    className={riskColors[marketInsightMutation.data.riskLevel]}
                  >
                    {marketInsightMutation.data.riskLevel} risk
                  </Badge>
                </div>

                <p className="text-sm" data-testid="text-market-summary">
                  {marketInsightMutation.data.summary}
                </p>

                <div>
                  <p className="text-xs text-muted-foreground mb-2">Key Factors</p>
                  <div className="flex flex-wrap gap-2">
                    {marketInsightMutation.data.keyFactors.map((factor, i) => (
                      <Badge key={i} variant="secondary" className="text-xs">
                        {factor}
                      </Badge>
                    ))}
                  </div>
                </div>

                <div className="p-3 rounded-lg bg-cyan-500/10 border border-cyan-500/30">
                  <p className="text-sm flex items-center gap-2">
                    <Target className="h-4 w-4 text-foreground" />
                    {marketInsightMutation.data.recommendation}
                  </p>
                </div>
              </div>
            )}

            {!marketInsightMutation.data && !marketInsightMutation.isPending && (
              <div className="text-center py-8 text-muted-foreground">
                <Sparkles className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p>Select a market and click analyze to get AI insights</p>
              </div>
            )}

            {marketInsightMutation.isPending && (
              <div className="text-center py-8">
                <RefreshCw className="h-8 w-8 mx-auto mb-3 animate-spin text-foreground" />
                <p className="text-muted-foreground">Analyzing market...</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="glass">
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Shield className="h-4 w-4 text-foreground" />
              Portfolio Analysis
            </CardTitle>
            <Button
              size="sm"
              onClick={handleAnalyzePortfolio}
              disabled={portfolioInsightMutation.isPending}
              data-testid="button-analyze-portfolio"
            >
              {portfolioInsightMutation.isPending ? (
                <RefreshCw className="h-4 w-4 animate-spin" />
              ) : (
                <>
                  <Zap className="h-4 w-4 mr-1" />
                  Analyze
                </>
              )}
            </Button>
          </CardHeader>
          <CardContent>
            {portfolioInsightMutation.data && (
              <div className="space-y-4">
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Overall Health</p>
                  <p className="font-medium" data-testid="text-portfolio-health">
                    {portfolioInsightMutation.data.overallHealth}
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <p className="text-xs text-muted-foreground">Diversification Score</p>
                  <div className="flex-1 h-2 rounded-full bg-muted overflow-hidden">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-cyan-500 to-cyan-400"
                      style={{
                        width: `${portfolioInsightMutation.data.diversificationScore * 10}%`,
                      }}
                    />
                  </div>
                  <span className="text-sm font-mono font-bold text-foreground">
                    {portfolioInsightMutation.data.diversificationScore}/10
                  </span>
                </div>

                {portfolioInsightMutation.data.topOpportunities.length > 0 && (
                  <div>
                    <p className="text-xs text-muted-foreground mb-2 flex items-center gap-1">
                      <TrendingUp className="h-3 w-3" />
                      Opportunities
                    </p>
                    <ul className="space-y-1">
                      {portfolioInsightMutation.data.topOpportunities.map((opp, i) => (
                        <li key={i} className="text-sm flex items-start gap-2">
                          <span className="text-green-500">+</span>
                          {opp}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {portfolioInsightMutation.data.riskWarnings.length > 0 && (
                  <div>
                    <p className="text-xs text-muted-foreground mb-2 flex items-center gap-1">
                      <AlertTriangle className="h-3 w-3" />
                      Risk Warnings
                    </p>
                    <ul className="space-y-1">
                      {portfolioInsightMutation.data.riskWarnings.map((warning, i) => (
                        <li key={i} className="text-sm flex items-start gap-2 text-yellow-500">
                          <span>!</span>
                          {warning}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {portfolioInsightMutation.data.actionItems.length > 0 && (
                  <div className="p-3 rounded-lg bg-muted/50">
                    <p className="text-xs text-muted-foreground mb-2">Recommended Actions</p>
                    <ul className="space-y-1">
                      {portfolioInsightMutation.data.actionItems.map((action, i) => (
                        <li key={i} className="text-sm flex items-start gap-2">
                          <Target className="h-3 w-3 text-foreground mt-0.5 flex-shrink-0" />
                          {action}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}

            {!portfolioInsightMutation.data && !portfolioInsightMutation.isPending && (
              <div className="text-center py-8 text-muted-foreground">
                <Shield className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p>Click analyze to get AI insights on your predictions</p>
              </div>
            )}

            {portfolioInsightMutation.isPending && (
              <div className="text-center py-8">
                <RefreshCw className="h-8 w-8 mx-auto mb-3 animate-spin text-foreground" />
                <p className="text-muted-foreground">Analyzing portfolio...</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card className="glass">
        <CardContent className="pt-6">
          <p className="text-xs text-muted-foreground text-center">
            AI insights are generated using GPT-4 and are for informational purposes only.
            Always do your own research before making predictions. Powered by Replit AI Integrations.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
