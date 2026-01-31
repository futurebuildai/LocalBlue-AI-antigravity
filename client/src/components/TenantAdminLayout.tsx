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
import { LayoutDashboard, FileText, Settings, Users, MessageSquare, LogOut } from "lucide-react";
import type { Site, User } from "@shared/schema";

type SanitizedUser = Omit<User, "password">;

interface TenantAdminLayoutProps {
  site: Site;
  user: SanitizedUser;
  onLogout: () => void;
  children: React.ReactNode;
}

const navItems = [
  { title: "Dashboard", url: "/", icon: LayoutDashboard },
  { title: "Pages", url: "/pages", icon: FileText },
  { title: "Settings", url: "/settings", icon: Settings },
  { title: "Users", url: "/users", icon: Users },
  { title: "Leads", url: "/leads", icon: MessageSquare },
];

export default function TenantAdminLayout({ site, user, onLogout, children }: TenantAdminLayoutProps) {
  const [location] = useLocation();
  const { toast } = useToast();

  const logoutMutation = useMutation({
    mutationFn: async () => {
      return apiRequest("POST", "/api/tenant/auth/logout", {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tenant/auth/me"] });
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
    "--sidebar-width": "16rem",
    "--sidebar-width-icon": "3rem",
  };

  return (
    <SidebarProvider style={style as React.CSSProperties}>
      <div className="flex h-screen w-full">
        <Sidebar>
          <SidebarHeader className="border-b px-4 py-3">
            <div className="flex items-center gap-2">
              <div 
                className="flex h-8 w-8 items-center justify-center rounded-md text-white font-medium"
                style={{ backgroundColor: site.brandColor }}
              >
                {site.businessName.charAt(0)}
              </div>
              <div>
                <h2 className="text-sm font-semibold" data-testid="text-sidebar-business-name">
                  {site.businessName}
                </h2>
                <p className="text-xs text-muted-foreground">Admin Panel</p>
              </div>
            </div>
          </SidebarHeader>
          <SidebarContent>
            <SidebarGroup>
              <SidebarGroupLabel>Navigation</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {navItems.map((item) => (
                    <SidebarMenuItem key={item.title}>
                      <SidebarMenuButton asChild isActive={location === item.url}>
                        <Link 
                          href={item.url} 
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
          </SidebarContent>
          <SidebarFooter className="border-t p-4">
            <div className="space-y-3">
              <div className="text-sm">
                <p className="text-muted-foreground">Logged in as</p>
                <p className="font-medium truncate" data-testid="text-sidebar-user-email">
                  {user.email}
                </p>
              </div>
              <Button 
                variant="outline" 
                className="w-full" 
                onClick={handleLogout}
                disabled={logoutMutation.isPending}
                data-testid="button-logout"
              >
                <LogOut className="h-4 w-4 mr-2" />
                {logoutMutation.isPending ? "Logging out..." : "Logout"}
              </Button>
            </div>
          </SidebarFooter>
        </Sidebar>
        <div className="flex flex-col flex-1 min-w-0">
          <header 
            className="flex items-center gap-2 border-b px-4 py-3"
            style={{ borderColor: `${site.brandColor}20` }}
          >
            <SidebarTrigger data-testid="button-tenant-sidebar-toggle" />
            <h1 className="text-lg font-semibold" data-testid="text-header-business-name">
              {site.businessName}
            </h1>
          </header>
          <main className="flex-1 overflow-auto p-6">
            {children}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
