import { useState, useEffect } from "react";
import { Switch, Route, useLocation, Link } from "wouter";
import { queryClient, getQueryFn } from "./lib/queryClient";
import { QueryClientProvider, useQuery } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
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
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { LayoutDashboard, Building2, Users } from "lucide-react";
import Dashboard from "@/pages/admin/Dashboard";
import Sites from "@/pages/admin/Sites";
import UsersPage from "@/pages/admin/Users";
import NotFound from "@/pages/not-found";
import Landing from "@/pages/Landing";
import SignUp from "@/pages/SignUp";
import Onboarding from "@/pages/Onboarding";
import TenantLogin from "@/pages/tenant-admin/Login";
import TenantDashboard from "@/pages/tenant-admin/Dashboard";
import TenantSettings from "@/pages/tenant-admin/Settings";
import TenantUsers from "@/pages/tenant-admin/TenantUsers";
import TenantAdminLayout from "@/components/TenantAdminLayout";
import type { Site, User } from "@shared/schema";

type SanitizedUser = Omit<User, "password">;

interface TenantAuthResponse {
  user: SanitizedUser;
  site: Site;
}

const navItems = [
  { title: "Dashboard", url: "/", icon: LayoutDashboard },
  { title: "Sites", url: "/sites", icon: Building2 },
  { title: "Users", url: "/users", icon: Users },
];

function AppSidebar() {
  const [location] = useLocation();

  return (
    <Sidebar>
      <SidebarHeader className="border-b px-4 py-3">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-md bg-blue-600 text-white font-bold text-sm">
            LB
          </div>
          <div>
            <h2 className="text-sm font-semibold">LocalBlue.ai</h2>
            <p className="text-xs text-muted-foreground">Platform Admin</p>
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
                    <Link href={item.url} data-testid={`link-nav-${item.title.toLowerCase()}`}>
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
    </Sidebar>
  );
}

function PlatformAdminRouter() {
  return (
    <Switch>
      <Route path="/" component={Dashboard} />
      <Route path="/sites" component={Sites} />
      <Route path="/users" component={UsersPage} />
      <Route component={NotFound} />
    </Switch>
  );
}

function PlatformAdmin() {
  const style = {
    "--sidebar-width": "16rem",
    "--sidebar-width-icon": "3rem",
  };

  return (
    <SidebarProvider style={style as React.CSSProperties}>
      <div className="flex h-screen w-full">
        <AppSidebar />
        <div className="flex flex-col flex-1 min-w-0">
          <header className="flex items-center gap-2 border-b px-4 py-3">
            <SidebarTrigger data-testid="button-sidebar-toggle" />
            <h1 className="text-lg font-semibold">Admin</h1>
          </header>
          <main className="flex-1 overflow-auto p-6">
            <PlatformAdminRouter />
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}

function TenantAdminApp() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);

  const { data: authData, isLoading, refetch } = useQuery<TenantAuthResponse | null>({
    queryKey: ["/api/tenant/auth/me"],
    queryFn: getQueryFn({ on401: "returnNull" }),
  });

  useEffect(() => {
    if (!isLoading) {
      setIsAuthenticated(authData !== null);
    }
  }, [authData, isLoading]);

  const handleLoginSuccess = () => {
    refetch();
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
  };

  if (isLoading || isAuthenticated === null) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-muted-foreground" data-testid="text-loading">Loading...</div>
      </div>
    );
  }

  if (!isAuthenticated || !authData) {
    return <TenantLogin onLoginSuccess={handleLoginSuccess} />;
  }

  return (
    <TenantAdminLayout site={authData.site} user={authData.user} onLogout={handleLogout}>
      <Switch>
        <Route path="/">
          <TenantDashboard site={authData.site} />
        </Route>
        <Route path="/settings">
          <TenantSettings site={authData.site} />
        </Route>
        <Route path="/users">
          <TenantUsers />
        </Route>
        <Route component={NotFound} />
      </Switch>
    </TenantAdminLayout>
  );
}

type DomainType = "admin" | "tenant" | "main";

function detectDomainType(): DomainType {
  const hostname = window.location.hostname;
  
  if (hostname.startsWith("admin.")) {
    return "admin";
  }
  
  if (hostname === "localhost" || 
      hostname.endsWith(".localblue.ai") === false ||
      hostname === "localblue.ai" ||
      hostname === "www.localblue.ai") {
    return "main";
  }
  
  return "tenant";
}

function MainSiteApp() {
  return (
    <Switch>
      <Route path="/landing" component={Landing} />
      <Route path="/signup" component={SignUp} />
      <Route path="/onboarding" component={Onboarding} />
      <Route path="/">
        <Landing />
      </Route>
      <Route path="/sites" component={Sites} />
      <Route path="/users" component={UsersPage} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  const domainType = detectDomainType();

  const renderContent = () => {
    switch (domainType) {
      case "admin":
        return <TenantAdminApp />;
      case "tenant":
        return <TenantAdminApp />;
      case "main":
      default:
        return <MainSiteApp />;
    }
  };

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        {renderContent()}
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
