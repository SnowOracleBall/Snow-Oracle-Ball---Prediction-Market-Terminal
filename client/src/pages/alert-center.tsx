import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { 
  Bell, 
  Plus, 
  Trash2, 
  TrendingUp, 
  Activity, 
  Clock, 
  GitCompare,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Pause
} from "lucide-react";
import type { Alert, AlertType, AlertNotification, Market } from "@shared/schema";

const alertTypeLabels: Record<AlertType, { label: string; icon: typeof TrendingUp; color: string }> = {
  price_threshold: { label: "Price Threshold", icon: TrendingUp, color: "#60a5fa" },
  volume_spike: { label: "Volume Spike", icon: Activity, color: "#22c55e" },
  resolution_approaching: { label: "Resolution Timer", icon: Clock, color: "#eab308" },
  spread_opportunity: { label: "Spread Alert", icon: GitCompare, color: "#a855f7" },
};

const statusIcons: Record<string, { icon: typeof CheckCircle2; color: string }> = {
  active: { icon: CheckCircle2, color: "#22c55e" },
  triggered: { icon: AlertTriangle, color: "#eab308" },
  expired: { icon: XCircle, color: "#6b7280" },
  disabled: { icon: Pause, color: "#6b7280" },
};

function AlertCard({ alert, onDelete, onToggle }: { 
  alert: Alert; 
  onDelete: (id: string) => void;
  onToggle: (id: string, enabled: boolean) => void;
}) {
  const typeInfo = alertTypeLabels[alert.alertType];
  const statusInfo = statusIcons[alert.status];
  const Icon = typeInfo.icon;
  const StatusIcon = statusInfo.icon;
  
  let conditionDisplay = "";
  try {
    const condition = JSON.parse(alert.condition || "{}");
    if (alert.alertType === "price_threshold" && condition.priceType && condition.direction && condition.threshold != null) {
      conditionDisplay = `${String(condition.priceType).toUpperCase()} price ${condition.direction} ${(Number(condition.threshold) * 100).toFixed(0)}%`;
    } else if (alert.alertType === "volume_spike" && condition.percentIncrease != null && condition.timeWindowHours != null) {
      conditionDisplay = `${condition.percentIncrease}% increase in ${condition.timeWindowHours}h`;
    } else if (alert.alertType === "resolution_approaching" && condition.daysBeforeResolution != null) {
      conditionDisplay = `${condition.daysBeforeResolution} days before resolution`;
    } else if (alert.alertType === "spread_opportunity" && condition.minSpreadPercent != null) {
      conditionDisplay = `Spread > ${condition.minSpreadPercent}%`;
    } else {
      conditionDisplay = "Custom condition";
    }
  } catch {
    conditionDisplay = "Invalid condition";
  }

  return (
    <Card 
      className="bg-white/10 backdrop-blur-xl border-white/20"
      data-testid={`alert-card-${alert.id}`}
    >
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2">
            <div 
              className="p-2 rounded-md" 
              style={{ backgroundColor: `${typeInfo.color}20` }}
            >
              <Icon className="h-4 w-4" style={{ color: typeInfo.color }} />
            </div>
            <div>
              <CardTitle className="text-sm font-medium" style={{ color: '#ffffff' }}>
                {typeInfo.label}
              </CardTitle>
              <CardDescription className="text-xs" style={{ color: 'rgba(255,255,255,0.5)' }}>
                {conditionDisplay}
              </CardDescription>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge 
              variant="outline" 
              className="flex items-center gap-1"
              style={{ borderColor: statusInfo.color, color: statusInfo.color }}
            >
              <StatusIcon className="h-3 w-3" />
              {alert.status}
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between">
          <div className="text-xs" style={{ color: 'rgba(255,255,255,0.4)' }}>
            Created {new Date(alert.createdAt).toLocaleDateString()}
          </div>
          <div className="flex items-center gap-2">
            <Switch
              checked={alert.status === "active"}
              onCheckedChange={(checked) => onToggle(alert.id, checked)}
              data-testid={`switch-alert-${alert.id}`}
            />
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onDelete(alert.id)}
              data-testid={`button-delete-alert-${alert.id}`}
            >
              <Trash2 className="h-4 w-4 text-destructive" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function CreateAlertDialog({ markets }: { markets: Market[] }) {
  const [open, setOpen] = useState(false);
  const [alertType, setAlertType] = useState<AlertType>("price_threshold");
  const [marketId, setMarketId] = useState<string>("");
  const [direction, setDirection] = useState<"above" | "below">("above");
  const [threshold, setThreshold] = useState("50");
  const [priceType, setPriceType] = useState<"yes" | "no">("yes");
  const [percentIncrease, setPercentIncrease] = useState("20");
  const [timeWindow, setTimeWindow] = useState("24");
  const [daysBeforeResolution, setDaysBeforeResolution] = useState("7");
  const [minSpreadPercent, setMinSpreadPercent] = useState("5");

  const createMutation = useMutation({
    mutationFn: async (data: { alertType: AlertType; condition: string; marketId?: string; message?: string }) => {
      return apiRequest("POST", "/api/alerts", {
        ...data,
        status: "active",
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/alerts"] });
      setOpen(false);
    },
  });

  const handleCreate = () => {
    let condition: object;
    let message: string;

    switch (alertType) {
      case "price_threshold":
        condition = { type: "price_threshold", direction, threshold: parseFloat(threshold) / 100, priceType };
        message = `Alert when ${priceType.toUpperCase()} price goes ${direction} ${threshold}%`;
        break;
      case "volume_spike":
        condition = { type: "volume_spike", percentIncrease: parseFloat(percentIncrease), timeWindowHours: parseFloat(timeWindow) };
        message = `Alert on ${percentIncrease}% volume spike in ${timeWindow}h`;
        break;
      case "resolution_approaching":
        condition = { type: "resolution_approaching", daysBeforeResolution: parseInt(daysBeforeResolution) };
        message = `Alert ${daysBeforeResolution} days before resolution`;
        break;
      case "spread_opportunity":
        condition = { type: "spread_opportunity", minSpreadPercent: parseFloat(minSpreadPercent) };
        message = `Alert when spread exceeds ${minSpreadPercent}%`;
        break;
    }

    createMutation.mutate({
      alertType,
      condition: JSON.stringify(condition),
      marketId: marketId || undefined,
      message,
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button data-testid="button-create-alert">
          <Plus className="h-4 w-4 mr-2" />
          Create Alert
        </Button>
      </DialogTrigger>
      <DialogContent className="bg-card/95 backdrop-blur-xl border-white/20">
        <DialogHeader>
          <DialogTitle style={{ color: '#ffffff' }}>Create New Alert</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label style={{ color: 'rgba(255,255,255,0.8)' }}>Alert Type</Label>
            <Select value={alertType} onValueChange={(v) => setAlertType(v as AlertType)}>
              <SelectTrigger data-testid="select-alert-type">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="price_threshold">Price Threshold</SelectItem>
                <SelectItem value="volume_spike">Volume Spike</SelectItem>
                <SelectItem value="resolution_approaching">Resolution Approaching</SelectItem>
                <SelectItem value="spread_opportunity">Spread Opportunity</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {(alertType === "price_threshold" || alertType === "volume_spike" || alertType === "resolution_approaching") && (
            <div className="space-y-2">
              <Label style={{ color: 'rgba(255,255,255,0.8)' }}>Market (Optional)</Label>
              <Select value={marketId || "any"} onValueChange={(v) => setMarketId(v === "any" ? "" : v)}>
                <SelectTrigger data-testid="select-market">
                  <SelectValue placeholder="Select a market..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="any">Any market</SelectItem>
                  {markets.slice(0, 20).map((m) => (
                    <SelectItem key={m.id} value={m.id}>
                      {m.title.slice(0, 50)}...
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {alertType === "price_threshold" && (
            <>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label style={{ color: 'rgba(255,255,255,0.8)' }}>Price Type</Label>
                  <Select value={priceType} onValueChange={(v) => setPriceType(v as "yes" | "no")}>
                    <SelectTrigger data-testid="select-price-type">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="yes">YES Price</SelectItem>
                      <SelectItem value="no">NO Price</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label style={{ color: 'rgba(255,255,255,0.8)' }}>Direction</Label>
                  <Select value={direction} onValueChange={(v) => setDirection(v as "above" | "below")}>
                    <SelectTrigger data-testid="select-direction">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="above">Goes Above</SelectItem>
                      <SelectItem value="below">Goes Below</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label style={{ color: 'rgba(255,255,255,0.8)' }}>Threshold (%)</Label>
                <Input
                  type="number"
                  value={threshold}
                  onChange={(e) => setThreshold(e.target.value)}
                  min="1"
                  max="99"
                  data-testid="input-threshold"
                />
              </div>
            </>
          )}

          {alertType === "volume_spike" && (
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label style={{ color: 'rgba(255,255,255,0.8)' }}>% Increase</Label>
                <Input
                  type="number"
                  value={percentIncrease}
                  onChange={(e) => setPercentIncrease(e.target.value)}
                  min="10"
                  data-testid="input-percent-increase"
                />
              </div>
              <div className="space-y-2">
                <Label style={{ color: 'rgba(255,255,255,0.8)' }}>Time Window (hours)</Label>
                <Input
                  type="number"
                  value={timeWindow}
                  onChange={(e) => setTimeWindow(e.target.value)}
                  min="1"
                  data-testid="input-time-window"
                />
              </div>
            </div>
          )}

          {alertType === "resolution_approaching" && (
            <div className="space-y-2">
              <Label style={{ color: 'rgba(255,255,255,0.8)' }}>Days Before Resolution</Label>
              <Input
                type="number"
                value={daysBeforeResolution}
                onChange={(e) => setDaysBeforeResolution(e.target.value)}
                min="1"
                data-testid="input-days-before"
              />
            </div>
          )}

          {alertType === "spread_opportunity" && (
            <div className="space-y-2">
              <Label style={{ color: 'rgba(255,255,255,0.8)' }}>Minimum Spread (%)</Label>
              <Input
                type="number"
                value={minSpreadPercent}
                onChange={(e) => setMinSpreadPercent(e.target.value)}
                min="1"
                data-testid="input-min-spread"
              />
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button onClick={handleCreate} disabled={createMutation.isPending} data-testid="button-confirm-create">
            {createMutation.isPending ? "Creating..." : "Create Alert"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function AlertCardSkeleton() {
  return (
    <Card className="bg-white/10 backdrop-blur-xl border-white/20">
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            <Skeleton className="h-8 w-8 rounded-md" />
            <div>
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-3 w-32 mt-1" />
            </div>
          </div>
          <Skeleton className="h-6 w-16" />
        </div>
      </CardHeader>
      <CardContent>
        <Skeleton className="h-4 w-full" />
      </CardContent>
    </Card>
  );
}

export default function AlertCenter() {
  const { data: alerts = [], isLoading: alertsLoading } = useQuery<Alert[]>({
    queryKey: ["/api/alerts"],
  });

  const { data: notifications = [] } = useQuery<AlertNotification[]>({
    queryKey: ["/api/notifications"],
  });

  const { data: markets = [] } = useQuery<Market[]>({
    queryKey: ["/api/markets"],
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiRequest("DELETE", `/api/alerts/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/alerts"] });
    },
  });

  const toggleMutation = useMutation({
    mutationFn: async ({ id, enabled }: { id: string; enabled: boolean }) => {
      return apiRequest("PATCH", `/api/alerts/${id}`, {
        status: enabled ? "active" : "disabled",
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/alerts"] });
    },
  });

  const activeAlerts = alerts.filter(a => a.status === "active").length;
  const triggeredAlerts = alerts.filter(a => a.status === "triggered").length;
  const unreadNotifications = notifications.filter(n => !n.isRead).length;

  return (
    <div className="flex flex-col gap-4 sm:gap-6 p-4 sm:p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight flex items-center gap-2" style={{ color: '#ffffff' }} data-testid="text-page-title">
            <Bell className="h-6 w-6 text-primary" />
            Alert Center
          </h1>
          <p className="text-sm" style={{ color: 'rgba(255,255,255,0.6)' }}>
            Set up custom notifications for market movements
          </p>
        </div>
        <CreateAlertDialog markets={markets} />
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-white/10 backdrop-blur-xl border-white/20">
          <CardContent className="p-4">
            <div className="text-xs font-medium" style={{ color: 'rgba(255,255,255,0.6)' }}>Total Alerts</div>
            <div className="text-2xl font-bold font-mono" style={{ color: '#ffffff' }}>{alerts.length}</div>
          </CardContent>
        </Card>
        <Card className="bg-white/10 backdrop-blur-xl border-white/20">
          <CardContent className="p-4">
            <div className="text-xs font-medium" style={{ color: 'rgba(255,255,255,0.6)' }}>Active</div>
            <div className="text-2xl font-bold font-mono" style={{ color: '#22c55e' }}>{activeAlerts}</div>
          </CardContent>
        </Card>
        <Card className="bg-white/10 backdrop-blur-xl border-white/20">
          <CardContent className="p-4">
            <div className="text-xs font-medium" style={{ color: 'rgba(255,255,255,0.6)' }}>Triggered</div>
            <div className="text-2xl font-bold font-mono" style={{ color: '#eab308' }}>{triggeredAlerts}</div>
          </CardContent>
        </Card>
        <Card className="bg-white/10 backdrop-blur-xl border-white/20">
          <CardContent className="p-4">
            <div className="text-xs font-medium" style={{ color: 'rgba(255,255,255,0.6)' }}>Unread</div>
            <div className="text-2xl font-bold font-mono" style={{ color: '#ef4444' }}>{unreadNotifications}</div>
          </CardContent>
        </Card>
      </div>

      <div>
        <h2 className="text-lg font-semibold mb-4" style={{ color: '#ffffff' }}>Your Alerts</h2>
        
        {alertsLoading ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[...Array(3)].map((_, i) => <AlertCardSkeleton key={i} />)}
          </div>
        ) : alerts.length === 0 ? (
          <Card className="bg-white/10 backdrop-blur-xl border-white/20">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <div className="rounded-full p-4 mb-4" style={{ backgroundColor: 'rgba(255,255,255,0.1)' }}>
                <Bell className="h-8 w-8" style={{ color: 'rgba(255,255,255,0.5)' }} />
              </div>
              <h3 className="text-lg font-medium" style={{ color: '#ffffff' }}>No alerts configured</h3>
              <p className="text-sm mt-1 text-center max-w-md" style={{ color: 'rgba(255,255,255,0.5)' }}>
                Create your first alert to get notified about price changes, volume spikes, and more
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {alerts.map((alert) => (
              <AlertCard
                key={alert.id}
                alert={alert}
                onDelete={(id) => deleteMutation.mutate(id)}
                onToggle={(id, enabled) => toggleMutation.mutate({ id, enabled })}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
