import { User, Wallet, Shield, Moon, Sun, ExternalLink } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { useTheme } from "@/components/theme-provider";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { useAccount } from "wagmi";

export default function Account() {
  const { theme, toggleTheme } = useTheme();
  const { address, isConnected } = useAccount();

  return (
    <div className="flex flex-col gap-4 sm:gap-6 p-4 sm:p-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight flex items-center gap-3" data-testid="text-page-title">
          <User className="h-6 w-6 text-primary" />
          Account
        </h1>
        <p className="text-sm text-muted-foreground">
          Manage your preferences and wallet connection
        </p>
      </div>

      <Card className="glass">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Wallet className="h-4 w-4" />
            Wallet Connection
          </CardTitle>
          <CardDescription>
            Connect your wallet to interact with prediction markets
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div
                className={`h-3 w-3 rounded-full ${
                  isConnected ? "bg-green-500" : "bg-muted-foreground"
                }`}
              />
              <span className="text-sm" data-testid="text-wallet-status">
                {isConnected ? "Wallet Connected" : "No wallet connected"}
              </span>
            </div>
            <ConnectButton />
          </div>
          {isConnected && address && (
            <div className="mt-4 p-3 rounded-md bg-muted/50">
              <div className="text-xs text-muted-foreground">Your Address</div>
              <div className="font-mono text-sm mt-1" data-testid="text-wallet-address">
                {address.slice(0, 6)}...{address.slice(-4)}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="glass">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            {theme === "dark" ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
            Appearance
          </CardTitle>
          <CardDescription>
            Customize how Snow Oracle Ball looks
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label htmlFor="dark-mode">Dark Mode</Label>
              <p className="text-xs text-muted-foreground">
                Toggle between light and dark themes
              </p>
            </div>
            <Switch
              id="dark-mode"
              checked={theme === "dark"}
              onCheckedChange={toggleTheme}
              data-testid="switch-dark-mode"
            />
          </div>
        </CardContent>
      </Card>

      <Card className="glass">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Shield className="h-4 w-4" />
            Disclaimer
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-sm text-muted-foreground">
          <p>
            Snow Oracle Ball is a <strong className="text-foreground">non-custodial</strong> prediction market terminal that aggregates markets from Polymarket and Kalshi.
          </p>
          <Separator />
          <ul className="space-y-2">
            <li className="flex items-start gap-2">
              <span className="text-primary mt-0.5">-</span>
              <span>This app does NOT custody funds</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary mt-0.5">-</span>
              <span>This app does NOT issue markets</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary mt-0.5">-</span>
              <span>This app ONLY displays and orchestrates interactions with existing prediction markets</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary mt-0.5">-</span>
              <span>This is a demonstration with mock data</span>
            </li>
          </ul>
          <Separator />
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" size="sm" className="gap-2">
              <ExternalLink className="h-3.5 w-3.5" />
              Polymarket
            </Button>
            <Button variant="outline" size="sm" className="gap-2">
              <ExternalLink className="h-3.5 w-3.5" />
              Kalshi
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
