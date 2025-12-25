import { useState, useMemo } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import {
  Bell,
  BellOff,
  Plus,
  Trash2,
  TrendingUp,
  TrendingDown,
  Clock,
  Activity,
  AlertTriangle,
  Check,
} from "lucide-react";
import type { Alert, Market, AlertType, AlertStatus } from "@shared/schema";

const alertTypeLabels: Record<AlertType, string> = {
  price_threshold: "Price Alert",
  volume_spike: "Volume Spike",
  resolution_approaching: "Resolution Soon",
  spread_opportunity: "Spread Alert",
};

const alertTypeIcons: Record<AlertType, typeof TrendingUp> = {
  price_threshold: TrendingUp,
  volume_spike: Activity,
  resolution_approaching: Clock,
  spread_opportunity: AlertTriangle,
};

const statusColors: Record<AlertStatus, string> = {
  active: "border-green-500/50 text-green-500",
  triggered: "border-cyan-500/50 text-foreground",
  expired: "border-slate-500/50 text-muted-foreground",
  disabled: "border-slate-500/50 text-muted-foreground",
};

export default function Alerts() {
  const { toast } = useToast();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [newAlert, setNewAlert] = useState({
    alertType: "price_threshold" as AlertType,
    marketId: "",
    threshold: 50,
    direction: "above" as "above" | "below",
    daysBeforeResolution: 7,
    minSpreadPercent: 5,
  });

  const { data: alerts = [], isLoading: alertsLoading } = useQuery<Alert[]>({
    queryKey: ["/api/alerts"],
  });

  const { data: markets = [], isLoading: marketsLoading } = useQuery<Market[]>({
    queryKey: ["/api/markets"],
  });

  const createAlertMutation = useMutation({
    mutationFn: async (alertData: any) => {
      return apiRequest("POST", "/api/alerts", alertData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/alerts"] });
      setDialogOpen(false);
      toast({
        title: "Alert created",
        description: "You'll be notified when conditions are met.",
      });
    },
    onError: () => {
      toast({
        title: "Failed to create alert",
        variant: "destructive",
      });
    },
  });

  const deleteAlertMutation = useMutation({
    mutationFn: async (alertId: string) => {
      return apiRequest("DELETE", `/api/alerts/${alertId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/alerts"] });
      toast({
        title: "Alert deleted",
      });
    },
  });

  const marketsMap = useMemo(() => new Map(markets.map((m) => [m.id, m])), [markets]);

  const handleCreateAlert = () => {
    let condition: any;
    
    switch (newAlert.alertType) {
      case "price_threshold":
        condition = {
          type: "price_threshold",
          direction: newAlert.direction,
          threshold: newAlert.threshold / 100,
          priceType: "yes",
        };
        break;
      case "resolution_approaching":
        condition = {
          type: "resolution_approaching",
          daysBeforeResolution: newAlert.daysBeforeResolution,
        };
        break;
      case "spread_opportunity":
        condition = {
          type: "spread_opportunity",
          minSpreadPercent: newAlert.minSpreadPercent,
        };
        break;
      default:
        condition = { type: newAlert.alertType };
    }

    createAlertMutation.mutate({
      marketId: newAlert.alertType === "spread_opportunity" ? null : newAlert.marketId || null,
      alertType: newAlert.alertType,
      condition: JSON.stringify(condition),
      status: "active",
      createdAt: new Date().toISOString(),
      message: null,
    });
  };

  const activeAlerts = alerts.filter((a) => a.status === "active");
  const triggeredAlerts = alerts.filter((a) => a.status === "triggered");
  const otherAlerts = alerts.filter((a) => a.status !== "active" && a.status !== "triggered");

  const isLoading = alertsLoading || marketsLoading;

  if (isLoading) {
    return (
      <div className="flex flex-col gap-6 p-4 sm:p-6">
        <Skeleton className="h-10 w-48" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[...Array(3)].map((_, i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 p-4 sm:p-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight flex items-center gap-2">
            <Bell className="h-6 w-6 text-foreground" />
            Smart Alerts
          </h1>
          <p className="text-muted-foreground">Get notified when market conditions change</p>
        </div>
        
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2" data-testid="button-create-alert">
              <Plus className="h-4 w-4" />
              Create Alert
            </Button>
          </DialogTrigger>
          <DialogContent className="glass">
            <DialogHeader>
              <DialogTitle>Create New Alert</DialogTitle>
            </DialogHeader>
            
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Alert Type</Label>
                <Select
                  value={newAlert.alertType}
                  onValueChange={(v) => setNewAlert({ ...newAlert, alertType: v as AlertType })}
                >
                  <SelectTrigger data-testid="select-alert-type">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="price_threshold">Price Threshold</SelectItem>
                    <SelectItem value="resolution_approaching">Resolution Approaching</SelectItem>
                    <SelectItem value="spread_opportunity">Spread Opportunity</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {newAlert.alertType !== "spread_opportunity" && (
                <div className="space-y-2">
                  <Label>Market</Label>
                  <Select
                    value={newAlert.marketId}
                    onValueChange={(v) => setNewAlert({ ...newAlert, marketId: v })}
                  >
                    <SelectTrigger data-testid="select-market">
                      <SelectValue placeholder="Select a market" />
                    </SelectTrigger>
                    <SelectContent>
                      {markets.slice(0, 20).map((market) => (
                        <SelectItem key={market.id} value={market.id}>
                          {market.title.slice(0, 50)}...
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {newAlert.alertType === "price_threshold" && (
                <>
                  <div className="space-y-2">
                    <Label>Condition</Label>
                    <Select
                      value={newAlert.direction}
                      onValueChange={(v) => setNewAlert({ ...newAlert, direction: v as "above" | "below" })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="above">Price goes above</SelectItem>
                        <SelectItem value="below">Price goes below</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Threshold (%)</Label>
                    <Input
                      type="number"
                      min={1}
                      max={99}
                      value={newAlert.threshold}
                      onChange={(e) => setNewAlert({ ...newAlert, threshold: Number(e.target.value) })}
                      data-testid="input-threshold"
                    />
                  </div>
                </>
              )}

              {newAlert.alertType === "resolution_approaching" && (
                <div className="space-y-2">
                  <Label>Days before resolution</Label>
                  <Input
                    type="number"
                    min={1}
                    max={30}
                    value={newAlert.daysBeforeResolution}
                    onChange={(e) => setNewAlert({ ...newAlert, daysBeforeResolution: Number(e.target.value) })}
                    data-testid="input-days"
                  />
                </div>
              )}

              {newAlert.alertType === "spread_opportunity" && (
                <div className="space-y-2">
                  <Label>Minimum spread (%)</Label>
                  <Input
                    type="number"
                    min={1}
                    max={50}
                    value={newAlert.minSpreadPercent}
                    onChange={(e) => setNewAlert({ ...newAlert, minSpreadPercent: Number(e.target.value) })}
                    data-testid="input-spread"
                  />
                </div>
              )}

              <Button
                className="w-full"
                onClick={handleCreateAlert}
                disabled={createAlertMutation.isPending}
                data-testid="button-submit-alert"
              >
                {createAlertMutation.isPending ? "Creating..." : "Create Alert"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Card className="glass">
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Active</CardTitle>
            <Bell className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-mono font-bold text-green-500" data-testid="text-active-count">
              {activeAlerts.length}
            </div>
          </CardContent>
        </Card>

        <Card className="glass glow-cyan">
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Triggered</CardTitle>
            <Check className="h-4 w-4 text-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-mono font-bold text-foreground" data-testid="text-triggered-count">
              {triggeredAlerts.length}
            </div>
          </CardContent>
        </Card>

        <Card className="glass">
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-mono font-bold" data-testid="text-total-count">
              {alerts.length}
            </div>
          </CardContent>
        </Card>
      </div>

      {triggeredAlerts.length > 0 && (
        <Card className="glass glow-cyan">
          <CardHeader>
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Check className="h-4 w-4 text-foreground" />
              Recently Triggered
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {triggeredAlerts.map((alert) => {
                const market = alert.marketId ? marketsMap.get(alert.marketId) : null;
                const Icon = alertTypeIcons[alert.alertType];
                
                return (
                  <div
                    key={alert.id}
                    className="flex items-center justify-between gap-4 p-3 rounded-lg bg-cyan-500/10 border border-cyan-500/30"
                  >
                    <div className="flex items-center gap-3">
                      <Icon className="h-5 w-5 text-foreground" />
                      <div>
                        <p className="font-medium text-sm">
                          {alert.message || alertTypeLabels[alert.alertType]}
                        </p>
                        {market && (
                          <p className="text-xs text-muted-foreground truncate max-w-[200px]">
                            {market.title}
                          </p>
                        )}
                      </div>
                    </div>
                    <Badge variant="outline" className={statusColors.triggered}>
                      Triggered
                    </Badge>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      <Card className="glass">
        <CardHeader>
          <CardTitle className="text-sm font-medium">Active Alerts</CardTitle>
        </CardHeader>
        <CardContent>
          {activeAlerts.length > 0 ? (
            <div className="space-y-3">
              {activeAlerts.map((alert) => {
                const market = alert.marketId ? marketsMap.get(alert.marketId) : null;
                const Icon = alertTypeIcons[alert.alertType];
                let conditionText = "";
                
                try {
                  const condition = JSON.parse(alert.condition);
                  if (condition.type === "price_threshold") {
                    conditionText = `${condition.direction === "above" ? ">" : "<"} ${Math.round(condition.threshold * 100)}%`;
                  } else if (condition.type === "resolution_approaching") {
                    conditionText = `${condition.daysBeforeResolution} days before`;
                  } else if (condition.type === "spread_opportunity") {
                    conditionText = `> ${condition.minSpreadPercent}% spread`;
                  }
                } catch {}
                
                return (
                  <div
                    key={alert.id}
                    className="flex items-center justify-between gap-4 p-3 rounded-lg bg-muted/30 hover-elevate"
                    data-testid={`row-alert-${alert.id}`}
                  >
                    <div className="flex items-center gap-3">
                      <Icon className="h-5 w-5 text-green-500" />
                      <div>
                        <p className="font-medium text-sm">
                          {alertTypeLabels[alert.alertType]}
                        </p>
                        {market && (
                          <p className="text-xs text-muted-foreground truncate max-w-[200px]">
                            {market.title}
                          </p>
                        )}
                        {conditionText && (
                          <p className="text-xs font-mono text-foreground">{conditionText}</p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className={statusColors.active}>
                        Active
                      </Badge>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => deleteAlertMutation.mutate(alert.id)}
                        disabled={deleteAlertMutation.isPending}
                        data-testid={`button-delete-alert-${alert.id}`}
                      >
                        <Trash2 className="h-4 w-4 text-muted-foreground" />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-8">
              <BellOff className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
              <p className="text-muted-foreground">No active alerts</p>
              <p className="text-xs text-muted-foreground mt-1">
                Create an alert to get notified about market changes
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {otherAlerts.length > 0 && (
        <Card className="glass">
          <CardHeader>
            <CardTitle className="text-sm font-medium text-muted-foreground">History</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {otherAlerts.slice(0, 10).map((alert) => {
                const Icon = alertTypeIcons[alert.alertType];
                
                return (
                  <div
                    key={alert.id}
                    className="flex items-center justify-between gap-4 p-2 rounded-lg opacity-60"
                  >
                    <div className="flex items-center gap-3">
                      <Icon className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">{alertTypeLabels[alert.alertType]}</span>
                    </div>
                    <Badge variant="outline" className={statusColors[alert.status]}>
                      {alert.status}
                    </Badge>
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
