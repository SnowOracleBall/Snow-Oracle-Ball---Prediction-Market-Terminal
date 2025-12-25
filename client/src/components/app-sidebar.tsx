import { Link, useLocation } from "wouter";
import { Compass, Eye, TrendingUp, User, Gift, Star, GitCompare, Bell, BarChart3, Trophy, Brain } from "lucide-react";
import logoUrl from "@assets/1766578858703_1766579155531.png";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarFooter,
} from "@/components/ui/sidebar";

const navItems = [
  { title: "Explore", href: "/", icon: Compass },
  { title: "Spread Radar", href: "/spreads", icon: GitCompare },
  { title: "Smart Alerts", href: "/alerts", icon: Bell },
  { title: "AI Insights", href: "/ai-insights", icon: Brain },
  { title: "Analytics", href: "/analytics", icon: BarChart3 },
  { title: "Leaderboard", href: "/leaderboard", icon: Trophy },
  { title: "Watchlist", href: "/watchlist", icon: Eye },
  { title: "Positions", href: "/positions", icon: TrendingUp },
  { title: "Account", href: "/account", icon: User },
];

export function AppSidebar() {
  const [location] = useLocation();

  return (
    <Sidebar>
      <SidebarHeader className="p-4">
        <Link href="/" className="flex items-center gap-3">
          <img src={logoUrl} alt="Snow Oracle Ball" className="h-9 w-9 rounded-full object-cover" />
          <div className="flex flex-col">
            <span className="text-sm font-semibold tracking-tight text-foreground flex items-center gap-1">
              Snow Oracle
              <Star className="h-3 w-3 text-accent fill-accent" />
            </span>
            <span className="text-xs text-muted-foreground">
              Winter Edition
            </span>
          </div>
        </Link>
      </SidebarHeader>
      
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map((item) => {
                const isActive = location === item.href || 
                  (item.href === "/" && location === "") ||
                  (item.href !== "/" && location.startsWith(item.href));
                
                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton
                      asChild
                      isActive={isActive}
                      className="gap-3"
                    >
                      <Link href={item.href} data-testid={`nav-${item.title.toLowerCase()}`}>
                        <item.icon className="h-4 w-4" />
                        <span>{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="p-4">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Gift className="h-3 w-3 text-primary" />
          <span>Happy Holidays!</span>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
