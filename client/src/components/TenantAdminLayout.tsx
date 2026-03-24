import { useMutation } from "@tanstack/react-query";
import { Link, useLocation } from "wouter";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import {
  SidebarProvider,
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarHeader,
  SidebarFooter,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { LayoutDashboard, FileText, Settings, Users, MessageSquare, LogOut, ExternalLink, Globe, BarChart3, Tag, Star, Inbox, Bot } from "lucide-react";
import { usePreview } from "@/contexts/PreviewContext";
import type { Site, User } from "@shared/schema";

type SanitizedUser = Omit<User, "password">;

interface TenantAdminLayoutProps {
  site: Site;
  user: SanitizedUser;
  onLogout: () => void;
  children: React.ReactNode;
  basePath?: string;
}

const navItems = [
  { title: "Dashboard", url: "/", icon: LayoutDashboard },
  { title: "RFQ Inbox", url: "/rfqs", icon: Inbox },
  { title: "Pages", url: "/pages", icon: FileText },
  { title: "Leads", url: "/leads", icon: MessageSquare },
  { title: "Analytics", url: "/analytics", icon: BarChart3 },
  { title: "AI Agents", url: "/agents", icon: Bot },
  { title: "Service Pricing", url: "/service-pricing", icon: Tag },
  { title: "Testimonials", url: "/testimonials", icon: Star },
  { title: "Users", url: "/users", icon: Users },
  { title: "Settings", url: "/settings", icon: Settings },
];

export default function TenantAdminLayout({ site, user, onLogout, children, basePath = "" }: TenantAdminLayoutProps) {
  const [location] = useLocation();
  const { toast } = useToast();
  const { isPreview, subdomain, getApiPath } = usePreview();

  const getNavUrl = (url: string) => {
    if (!basePath) return url;
    if (url === "/") return basePath;
    return `${basePath}${url}`;
  };

  const isActive = (url: string) => {
    const fullUrl = getNavUrl(url);
    if (url === "/") {
      return location === basePath || location === basePath + "/";
    }
    return location.startsWith(fullUrl);
  };

  const logoutMutation = useMutation({
    mutationFn: async () => {
      return apiRequest("POST", getApiPath("/api/tenant/auth/logout"), {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [getApiPath("/api/tenant/auth/me")] });
      toast({ title: "Logged out successfully" });
      onLogout();
    },
    onError: (error: Error) => {
      toast({ title: "Logout failed", description: error.message, variant: "destructive" });
    },
  });

  const handleLogout = () => {
    logoutMutation.mutate();
  };

  const style = {
    "--sidebar-width": "15rem",
    "--sidebar-width-icon": "3.5rem",
  };

  return (
    <SidebarProvider style={style as React.CSSProperties}>
      <div className="flex h-screen w-full">
        <Sidebar className="border-r-0">
          <SidebarHeader className="p-4 pb-6">
            <div className="flex items-center gap-3">
              <div
                className="flex h-11 w-11 items-center justify-center rounded-xl text-white font-bold text-lg shadow-lg"
                style={{
                  backgroundColor: site.brandColor,
                  boxShadow: `0 4px 14px ${site.brandColor}40`
                }}
              >
                {site.businessName.charAt(0)}
              </div>
              <div className="flex-1 min-w-0">
                <h2 className="text-sm font-bold truncate" data-testid="text-sidebar-business-name">
                  {site.businessName}
                </h2>
                <div className="flex items-center gap-2 mt-0.5">
                  <Badge variant="secondary" className="text-xs font-normal">
                    Admin
                  </Badge>
                  {site.isPublished && (
                    <Badge className="text-xs font-normal bg-emerald-500/10 text-emerald-600 border-0">
                      Live
                    </Badge>
                  )}
                </div>
              </div>
            </div>
          </SidebarHeader>

          <SidebarContent className="px-2">
            <SidebarGroup>
              <SidebarGroupLabel className="text-xs font-medium text-muted-foreground px-3 mb-1">
                Menu
              </SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {navItems.map((item) => (
                    <SidebarMenuItem key={item.title}>
                      <SidebarMenuButton
                        asChild
                        isActive={isActive(item.url)}
                      >
                        <Link
                          href={getNavUrl(item.url)}
                          data-testid={`link-tenant-nav-${item.title.toLowerCase()}`}
                        >
                          <item.icon className="h-4 w-4" />
                          <span>{item.title}</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>

            <SidebarGroup className="mt-6">
              <SidebarGroupLabel className="text-xs font-medium text-muted-foreground px-3 mb-1">
                Quick Links
              </SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  <SidebarMenuItem>
                    <SidebarMenuButton asChild>
                      <a
                        href={isPreview ? `/preview/${subdomain}` : (site.customDomain ? `https://${site.customDomain}` : `https://${site.subdomain}.localblue`)}
                        target="_blank"
                        rel="noopener noreferrer"
                        data-testid="link-view-site"
                      >
                        <Globe className="h-4 w-4" />
                        <span>View Live Site</span>
                        <ExternalLink className="h-3 w-3 ml-auto opacity-50" />
                      </a>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </SidebarContent>

          <SidebarFooter className="p-4 mt-auto">
            <div className="rounded-xl bg-muted/50 p-4 space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg gradient-primary flex items-center justify-center text-white font-medium text-sm">
                  {(user.email || 'A').charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate" data-testid="text-sidebar-user-email">
                    {user.email}
                  </p>
                  <p className="text-xs text-muted-foreground">Administrator</p>
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                className="w-full"
                onClick={handleLogout}
                disabled={logoutMutation.isPending}
                data-testid="button-logout"
              >
                <LogOut className="h-4 w-4 mr-2" />
                {logoutMutation.isPending ? "Signing out..." : "Sign Out"}
              </Button>
            </div>
          </SidebarFooter>
        </Sidebar>

        <div className="flex flex-col flex-1 min-w-0 bg-muted/30">
          <header className="flex items-center gap-2 sm:gap-4 px-3 sm:px-6 py-3 sm:py-4 bg-background border-b">
            <SidebarTrigger className="h-10 w-10 min-h-[44px] min-w-[44px]" data-testid="button-tenant-sidebar-toggle" />
            <div className="flex-1 min-w-0">
              <h1 className="text-base sm:text-lg font-semibold truncate" data-testid="text-header-business-name">
                {navItems.find(item => isActive(item.url))?.title || 'Dashboard'}
              </h1>
            </div>
          </header>
          <main className="flex-1 overflow-auto p-3 sm:p-6">
            {children}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
