import { TrendingUp, Activity, Target, GitCompare } from "lucide-react";
import { Card } from "@/components/ui/card";

interface InsightCardProps {
  icon: React.ReactNode;
  label: string;
  value: string;
  description: string;
  valueColor?: string;
}

function InsightCard({ icon, label, value, description, valueColor = "text-foreground" }: InsightCardProps) {
  return (
    <Card className="flex-1 min-w-[140px] p-3 bg-white/20 backdrop-blur-xl border-white/30 shadow-lg">
      <div className="flex items-start gap-2">
        <div className="mt-0.5" style={{ color: '#93c5fd' }}>
          {icon}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-medium uppercase tracking-wide" style={{ color: 'rgba(255,255,255,0.7)' }}>
            {label}
          </p>
          <p className="text-lg font-semibold leading-tight" style={{ color: '#ffffff' }}>
            {value}
          </p>
          <p className="text-xs mt-0.5 leading-snug" style={{ color: 'rgba(255,255,255,0.5)' }}>
            {description}
          </p>
        </div>
      </div>
    </Card>
  );
}

export function MarketInsightStrip() {
  const insights = [
    {
      icon: <TrendingUp className="h-4 w-4" />,
      label: "Market Bias",
      value: "Neutral",
      description: "Aggregate probability skew across active markets",
      valueColor: "text-foreground",
    },
    {
      icon: <Activity className="h-4 w-4" />,
      label: "Volatility",
      value: "Medium",
      description: "Observed probability movement over time",
      valueColor: "text-accent",
    },
    {
      icon: <Target className="h-4 w-4" />,
      label: "High Conviction",
      value: "3 Events",
      description: "Markets with tight probability clustering",
      valueColor: "text-foreground",
    },
    {
      icon: <GitCompare className="h-4 w-4" />,
      label: "Platform Spread",
      value: "Avg 6.4%",
      description: "Average probability difference between platforms",
      valueColor: "text-primary",
    },
  ];

  return (
    <div 
      className="flex flex-wrap gap-3 mb-4"
      data-testid="market-insight-strip"
    >
      {insights.map((insight) => (
        <InsightCard
          key={insight.label}
          icon={insight.icon}
          label={insight.label}
          value={insight.value}
          description={insight.description}
          valueColor={insight.valueColor}
        />
      ))}
    </div>
  );
}
