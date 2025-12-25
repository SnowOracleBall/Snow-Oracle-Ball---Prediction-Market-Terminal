import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { Trophy, Medal, Award, TrendingUp, Target, Flame } from "lucide-react";
import type { Prediction, Market } from "@shared/schema";

interface LeaderboardEntry {
  rank: number;
  address: string;
  displayName: string;
  predictions: number;
  accuracy: number;
  streak: number;
  score: number;
}

function shortenAddress(address: string): string {
  if (address.length < 10) return address;
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

interface LeaderboardEntryWithMock extends LeaderboardEntry {
  isMock: boolean;
}

function generateLeaderboardData(predictions: Prediction[]): LeaderboardEntryWithMock[] {
  const predictionsByWallet = predictions.reduce((acc, pred) => {
    const wallet = pred.walletAddress || "anonymous";
    if (!acc[wallet]) {
      acc[wallet] = [];
    }
    acc[wallet].push(pred);
    return acc;
  }, {} as Record<string, Prediction[]>);

  const entries = Object.entries(predictionsByWallet)
    .map(([address, preds]) => {
      const seed = address.split('').reduce((a, c) => a + c.charCodeAt(0), 0);
      const accuracy = 50 + (seed % 40);
      const streak = seed % 10;
      const score = Math.round(preds.length * accuracy * (1 + streak * 0.1));
      
      return {
        address,
        displayName: address === "anonymous" ? "Anonymous Oracle" : shortenAddress(address),
        predictions: preds.length,
        accuracy: Math.round(accuracy * 10) / 10,
        streak,
        score,
        rank: 0,
        isMock: false,
      };
    })
    .sort((a, b) => b.score - a.score)
    .map((entry, index) => ({ ...entry, rank: index + 1 }));

  const demoEntries: LeaderboardEntryWithMock[] = [
    { rank: 0, address: "0xabc123", displayName: "CryptoOracle.eth", predictions: 156, accuracy: 78.5, streak: 12, score: 18420, isMock: true },
    { rank: 0, address: "0xdef456", displayName: "PredictionKing", predictions: 98, accuracy: 82.3, streak: 8, score: 14580, isMock: true },
    { rank: 0, address: "0x789ghi", displayName: "MarketWizard", predictions: 234, accuracy: 71.2, streak: 5, score: 13200, isMock: true },
    { rank: 0, address: "0xjkl012", displayName: "OracleSeeker", predictions: 67, accuracy: 85.1, streak: 15, score: 12890, isMock: true },
    { rank: 0, address: "0xmno345", displayName: "TrendHunter", predictions: 189, accuracy: 68.9, streak: 3, score: 11450, isMock: true },
    { rank: 0, address: "0xpqr678", displayName: "ForecastPro", predictions: 145, accuracy: 72.4, streak: 7, score: 10890, isMock: true },
    { rank: 0, address: "0xstu901", displayName: "DataDriven", predictions: 112, accuracy: 74.8, streak: 4, score: 9650, isMock: true },
    { rank: 0, address: "0xvwx234", displayName: "AlphaHunter", predictions: 78, accuracy: 79.3, streak: 9, score: 8920, isMock: true },
    { rank: 0, address: "0xyza567", displayName: "StatsMaster", predictions: 201, accuracy: 65.7, streak: 2, score: 8150, isMock: true },
    { rank: 0, address: "0xbcd890", displayName: "PolyTrader", predictions: 56, accuracy: 81.2, streak: 6, score: 7680, isMock: true },
  ];

  const allEntries = [...entries, ...demoEntries]
    .sort((a, b) => b.score - a.score)
    .slice(0, 20)
    .map((entry, index) => ({ ...entry, rank: index + 1 }));

  return allEntries;
}

function getRankIcon(rank: number) {
  switch (rank) {
    case 1:
      return <Trophy className="h-5 w-5 text-yellow-500" />;
    case 2:
      return <Medal className="h-5 w-5 text-muted-foreground" />;
    case 3:
      return <Award className="h-5 w-5 text-amber-600" />;
    default:
      return <span className="text-muted-foreground font-mono text-sm w-5 text-center">{rank}</span>;
  }
}

function getRankBadge(rank: number) {
  if (rank === 1) return "bg-gradient-to-r from-yellow-500/20 to-amber-500/20 border-yellow-500/50";
  if (rank === 2) return "bg-gradient-to-r from-slate-400/20 to-slate-500/20 border-slate-400/50";
  if (rank === 3) return "bg-gradient-to-r from-amber-600/20 to-orange-600/20 border-amber-600/50";
  return "";
}

export default function Leaderboard() {
  const { data: predictions = [], isLoading: predictionsLoading } = useQuery<Prediction[]>({
    queryKey: ["/api/predictions"],
  });

  const leaderboardData = generateLeaderboardData(predictions);

  if (predictionsLoading) {
    return (
      <div className="flex flex-col gap-6 p-4 sm:p-6">
        <Skeleton className="h-10 w-48" />
        <div className="space-y-3">
          {[...Array(10)].map((_, i) => (
            <Skeleton key={i} className="h-16" />
          ))}
        </div>
      </div>
    );
  }

  const topThree = leaderboardData.slice(0, 3);
  const rest = leaderboardData.slice(3);

  return (
    <div className="flex flex-col gap-6 p-4 sm:p-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight flex items-center gap-2">
          <Trophy className="h-6 w-6 text-yellow-500" />
          Leaderboard
        </h1>
        <p className="text-muted-foreground">Top prediction oracles ranked by accuracy and consistency</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        {topThree.map((entry) => (
          <Card
            key={entry.address}
            className={`glass relative overflow-visible ${
              entry.rank === 1 ? "glow-cyan sm:order-2 sm:-mt-4" : ""
            } ${entry.rank === 2 ? "sm:order-1" : ""} ${entry.rank === 3 ? "sm:order-3" : ""}`}
          >
            <CardContent className="pt-6 text-center">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                <div
                  className={`flex items-center justify-center w-8 h-8 rounded-full border-2 bg-background ${
                    entry.rank === 1
                      ? "border-yellow-500"
                      : entry.rank === 2
                      ? "border-slate-400"
                      : "border-amber-600"
                  }`}
                >
                  {getRankIcon(entry.rank)}
                </div>
              </div>
              
              <Avatar className="mx-auto h-16 w-16 mb-3">
                <AvatarFallback className="text-lg font-bold bg-primary/10">
                  {entry.displayName.slice(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              
              <h3 className="font-semibold text-lg" data-testid={`text-name-${entry.rank}`}>
                {entry.displayName}
              </h3>
              {entry.isMock && (
                <span className="text-xs text-muted-foreground">(Demo)</span>
              )}
              
              <div className="text-2xl font-mono font-bold text-foreground mt-2">
                {entry.score.toLocaleString()}
              </div>
              <p className="text-xs text-muted-foreground">points</p>
              
              <div className="flex justify-center gap-4 mt-4 text-sm">
                <div className="text-center">
                  <div className="font-mono font-bold">{entry.accuracy}%</div>
                  <div className="text-xs text-muted-foreground">accuracy</div>
                </div>
                <div className="text-center">
                  <div className="font-mono font-bold">{entry.predictions}</div>
                  <div className="text-xs text-muted-foreground">predictions</div>
                </div>
              </div>
              
              {entry.streak > 0 && (
                <Badge variant="outline" className="mt-3 gap-1 border-orange-500/50 text-orange-500">
                  <Flame className="h-3 w-3" />
                  {entry.streak} streak
                </Badge>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="glass">
        <CardHeader>
          <CardTitle className="text-sm font-medium">All Oracles</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {rest.map((entry) => (
              <div
                key={entry.address}
                className={`flex items-center gap-4 p-3 rounded-lg ${getRankBadge(entry.rank)} bg-muted/30 hover-elevate`}
                data-testid={`row-leaderboard-${entry.rank}`}
              >
                <div className="flex items-center justify-center w-8">
                  {getRankIcon(entry.rank)}
                </div>
                
                <Avatar className="h-10 w-10">
                  <AvatarFallback className="text-sm font-bold bg-primary/10">
                    {entry.displayName.slice(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">
                    {entry.displayName}
                    {entry.isMock && <span className="text-xs text-muted-foreground ml-1">(Demo)</span>}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {entry.predictions} predictions
                  </p>
                </div>
                
                <div className="flex items-center gap-4 text-right">
                  <div className="hidden sm:block">
                    <div className="text-sm font-mono flex items-center gap-1">
                      <Target className="h-3 w-3 text-muted-foreground" />
                      {entry.accuracy}%
                    </div>
                  </div>
                  
                  {entry.streak > 0 && (
                    <Badge variant="outline" className="hidden md:flex gap-1 border-orange-500/50 text-orange-500">
                      <Flame className="h-3 w-3" />
                      {entry.streak}
                    </Badge>
                  )}
                  
                  <div className="text-right min-w-[80px]">
                    <div className="font-mono font-bold text-foreground">
                      {entry.score.toLocaleString()}
                    </div>
                    <div className="text-xs text-muted-foreground">pts</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card className="glass">
        <CardContent className="pt-6">
          <div className="text-center">
            <h3 className="font-semibold mb-2">How Scoring Works</h3>
            <div className="grid gap-4 sm:grid-cols-3 text-sm text-muted-foreground">
              <div className="flex flex-col items-center gap-2">
                <Target className="h-6 w-6 text-foreground" />
                <span>Accuracy matters most</span>
              </div>
              <div className="flex flex-col items-center gap-2">
                <TrendingUp className="h-6 w-6 text-green-500" />
                <span>More predictions = more points</span>
              </div>
              <div className="flex flex-col items-center gap-2">
                <Flame className="h-6 w-6 text-orange-500" />
                <span>Streaks boost your score</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
