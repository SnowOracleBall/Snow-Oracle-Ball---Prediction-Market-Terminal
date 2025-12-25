import { useState } from "react";
import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { WagmiProvider } from "wagmi";
import { RainbowKitProvider, darkTheme } from "@rainbow-me/rainbowkit";
import { config } from "./lib/wagmi";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { SidebarProvider } from "@/components/ui/sidebar";
import { ThemeProvider } from "@/components/theme-provider";
import { AppSidebar } from "@/components/app-sidebar";
import { Snowfall } from "@/components/snowfall";
import { TopBar } from "@/components/top-bar";
import NotFound from "@/pages/not-found";
import Explore from "@/pages/explore";
import SpreadRadar from "@/pages/spread-radar";
import AlertCenter from "@/pages/alert-center";
import Alerts from "@/pages/alerts";
import Analytics from "@/pages/analytics";
import Leaderboard from "@/pages/leaderboard";
import AIInsights from "@/pages/ai-insights";
import Watchlist from "@/pages/watchlist";
import Positions from "@/pages/positions";
import Account from "@/pages/account";
import MarketDetail from "@/pages/market-detail";
import type { Platform } from "@shared/schema";
import christmasBg from "@assets/3117748_1766496011584.jpg";

function AppContent() {
  const [searchQuery, setSearchQuery] = useState("");
  const [platformFilter, setPlatformFilter] = useState<Platform | "all">("all");

  const sidebarStyle = {
    "--sidebar-width": "14rem",
    "--sidebar-width-icon": "3rem",
  };

  return (
    <SidebarProvider style={sidebarStyle as React.CSSProperties}>
      <div className="flex h-screen w-full">
        <AppSidebar />
        <div className="flex flex-col flex-1 overflow-hidden">
          <TopBar
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            platformFilter={platformFilter}
            onPlatformChange={setPlatformFilter}
          />
          <main className="flex-1 overflow-auto">
            <Switch>
              <Route path="/">
                <Explore searchQuery={searchQuery} platformFilter={platformFilter} />
              </Route>
              <Route path="/spreads" component={SpreadRadar} />
              <Route path="/alerts" component={Alerts} />
              <Route path="/analytics" component={Analytics} />
              <Route path="/leaderboard" component={Leaderboard} />
              <Route path="/ai-insights" component={AIInsights} />
              <Route path="/watchlist" component={Watchlist} />
              <Route path="/positions" component={Positions} />
              <Route path="/account" component={Account} />
              <Route path="/market/:id" component={MarketDetail} />
              <Route component={NotFound} />
            </Switch>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}

function App() {
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider
          theme={darkTheme({
            accentColor: "#60a5fa",
            accentColorForeground: "white",
            borderRadius: "medium",
          })}
        >
          <ThemeProvider>
            <TooltipProvider>
              <div 
                className="fixed inset-0 bg-cover bg-center bg-no-repeat"
                style={{ 
                  backgroundImage: `url(${christmasBg})`,
                  zIndex: -1 
                }}
              />
              <Snowfall />
              <AppContent />
              <Toaster />
            </TooltipProvider>
          </ThemeProvider>
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}

export default App;
