import { Search, Moon, Sun } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { useTheme } from "@/components/theme-provider";
import { BackgroundMusic } from "@/components/background-music";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import type { Platform } from "@shared/schema";

interface TopBarProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  platformFilter: Platform | "all";
  onPlatformChange: (platform: Platform | "all") => void;
}

export function TopBar({
  searchQuery,
  onSearchChange,
  platformFilter,
  onPlatformChange,
}: TopBarProps) {
  const { theme, toggleTheme } = useTheme();

  return (
    <header className="sticky top-0 z-50 flex h-14 items-center justify-between gap-2 sm:gap-4 border-b border-border/50 bg-card/70 backdrop-blur-md px-2 sm:px-4">
      <div className="flex items-center gap-2 sm:gap-4 flex-1 min-w-0">
        <SidebarTrigger data-testid="button-sidebar-toggle" className="shrink-0" />
        
        <div className="relative flex-1 max-w-md min-w-0">
          <Search className="absolute left-2 sm:left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-8 sm:pl-9 bg-muted/50 text-sm"
            data-testid="input-search"
          />
        </div>
      </div>

      <div className="flex items-center gap-1 sm:gap-3 shrink-0">
        <div className="hidden md:flex items-center gap-1 rounded-md bg-muted/50 p-1">
          <Button
            variant={platformFilter === "all" ? "secondary" : "ghost"}
            size="sm"
            onClick={() => onPlatformChange("all")}
            className="text-xs"
            data-testid="filter-all"
          >
            All
          </Button>
          <Button
            variant={platformFilter === "polymarket" ? "secondary" : "ghost"}
            size="sm"
            onClick={() => onPlatformChange("polymarket")}
            className="text-xs"
            data-testid="filter-polymarket"
          >
            PM
          </Button>
          <Button
            variant={platformFilter === "kalshi" ? "secondary" : "ghost"}
            size="sm"
            onClick={() => onPlatformChange("kalshi")}
            className="text-xs"
            data-testid="filter-kalshi"
          >
            KL
          </Button>
        </div>

        <div className="hidden sm:block">
          <BackgroundMusic />
        </div>

        <Button
          variant="ghost"
          size="icon"
          onClick={toggleTheme}
          data-testid="button-theme-toggle"
        >
          {theme === "dark" ? (
            <Sun className="h-4 w-4" />
          ) : (
            <Moon className="h-4 w-4" />
          )}
        </Button>

        <div className="hidden sm:block">
          <ConnectButton 
            showBalance={false}
            chainStatus="icon"
            accountStatus="address"
          />
        </div>
        <div className="sm:hidden">
          <ConnectButton.Custom>
            {({ account, chain, openConnectModal, openAccountModal, mounted }) => {
              const connected = mounted && account && chain;
              return (
                <Button
                  size="sm"
                  variant={connected ? "outline" : "default"}
                  onClick={connected ? openAccountModal : openConnectModal}
                  className="text-xs px-2"
                >
                  {connected ? (
                    <span className="flex items-center gap-1">
                      <span className="h-2 w-2 rounded-full bg-green-500" />
                      {account.displayName?.slice(0, 6)}
                    </span>
                  ) : (
                    "Connect"
                  )}
                </Button>
              );
            }}
          </ConnectButton.Custom>
        </div>
      </div>
    </header>
  );
}
