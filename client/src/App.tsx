import { useState, useEffect } from "react";
import { Switch, Route, useLocation, Link } from "wouter";
import { queryClient, getQueryFn } from "./lib/queryClient";
import { QueryClientProvider, useQuery } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ErrorBoundary } from "@/components/ErrorBoundary";
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
import { LayoutDashboard, Building2, Users, ArrowRight } from "lucide-react";
import Dashboard from "@/pages/admin/Dashboard";
import Sites from "@/pages/admin/Sites";
import SiteDetail from "@/pages/admin/SiteDetail";
import UsersPage from "@/pages/admin/Users";
import NotFound from "@/pages/not-found";
import Landing from "@/pages/Landing";
import SignUp from "@/pages/SignUp";
import Onboarding from "@/pages/Onboarding";
import TenantLogin from "@/pages/tenant-admin/Login";
import TenantDashboard from "@/pages/tenant-admin/Dashboard";
import TenantSettings from "@/pages/tenant-admin/Settings";
import TenantUsers from "@/pages/tenant-admin/TenantUsers";
import TenantPages from "@/pages/tenant-admin/Pages";
import TenantPageEditor from "@/pages/tenant-admin/PageEditor";
import TenantLeads from "@/pages/tenant-admin/Leads";
import TenantAdminLayout from "@/components/TenantAdminLayout";
import PublicSite from "@/pages/PublicSite";
import PreviewSite from "@/pages/PreviewSite";
import Demo from "@/pages/Demo";
import TenantImpersonate from "@/pages/TenantImpersonate";
import type { Site, User } from "@shared/schema";

type SanitizedUser = Omit<User, "password">;

interface TenantAuthResponse {
  user: SanitizedUser;
  site: Site;
}

const navItems = [
  { title: "Dashboard", url: "/admin", icon: LayoutDashboard },
  { title: "Sites", url: "/admin/sites", icon: Building2 },
  { title: "Users", url: "/admin/users", icon: Users },
];

function AppSidebar() {
  const [location] = useLocation();

  return (
    <Sidebar className="border-r-0">
      <SidebarHeader className="p-4 pb-6">
        <div className="flex items-center gap-3">
          <img src="/logo.png" alt="LocalBlue" className="h-11 w-11 rounded-lg" />
          <div>
            <h2 className="text-sm font-bold">LocalBlue</h2>
            <p className="text-xs text-muted-foreground">Platform Admin</p>
          </div>
        </div>
      </SidebarHeader>
      <SidebarContent className="px-2">
        <SidebarGroup>
          <SidebarGroupLabel className="text-xs font-medium text-muted-foreground px-3 mb-1">Menu</SidebarGroupLabel>
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
      <Route path="/admin" component={Dashboard} />
      <Route path="/admin/sites/:siteId" component={SiteDetail} />
      <Route path="/admin/sites" component={Sites} />
      <Route path="/admin/users" component={UsersPage} />
      <Route component={NotFound} />
    </Switch>
  );
}

function PlatformAdmin() {
  const style = {
    "--sidebar-width": "17rem",
    "--sidebar-width-icon": "3.5rem",
  };

  return (
    <SidebarProvider style={style as React.CSSProperties}>
      <div className="flex h-screen w-full">
        <AppSidebar />
        <div className="flex flex-col flex-1 min-w-0 bg-muted/30">
          <header className="flex items-center gap-4 bg-background border-b px-6 py-4">
            <SidebarTrigger data-testid="button-sidebar-toggle" />
            <h1 className="text-lg font-semibold">Platform Admin</h1>
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
        <div className="flex flex-col items-center gap-4" data-testid="loading-tenant-admin">
          <div className="relative h-12 w-12">
            <div className="absolute inset-0 rounded-full border-4 border-primary/20"></div>
            <div className="absolute inset-0 rounded-full border-4 border-primary border-t-transparent animate-spin"></div>
          </div>
          <p className="text-muted-foreground text-sm animate-pulse">Loading admin panel...</p>
        </div>
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
        <Route path="/pages/:slug">
          <TenantPageEditor />
        </Route>
        <Route path="/pages">
          <TenantPages />
        </Route>
        <Route path="/settings">
          <TenantSettings site={authData.site} />
        </Route>
        <Route path="/users">
          <TenantUsers />
        </Route>
        <Route path="/leads">
          <TenantLeads />
        </Route>
        <Route component={NotFound} />
      </Switch>
    </TenantAdminLayout>
  );
}

type DomainType = "tenantAdmin" | "tenantPublic" | "main";

function detectDomainType(): DomainType {
  const hostname = window.location.hostname;
  
  // Check if this is an admin subdomain (admin.acme.localblue or admin.acme.localhost)
  if (hostname.startsWith("admin.")) {
    return "tenantAdmin";
  }
  
  // Main site: localhost without subdomain, or the main domain
  if (hostname === "localhost" || 
      hostname === "localblue" ||
      hostname === "www.localblue") {
    return "main";
  }
  
  // Replit dev domains are the main site (e.g., xxxxx.replit.dev, xxxxx-00-xxxxx.replit.dev)
  if (hostname.endsWith(".replit.dev") || hostname.endsWith(".repl.co") || hostname.endsWith(".picard.replit.dev")) {
    // Count the parts - Replit dev URLs have a specific pattern
    // For the main app, treat any direct replit.dev URL as main
    // Subdomains would be like: tenant.xxxxx.replit.dev
    const parts = hostname.split(".");
    // If the hostname matches the pattern of a Replit dev URL (not a subdomain of it), treat as main
    // Replit URLs typically: [random]-00-[username].replit.dev or [repname].[username].repl.co
    // We check if there are tenant-like subdomains (starts with known tenant patterns)
    const firstPart = parts[0];
    // If the first part looks like a tenant subdomain (not a Replit-generated ID)
    // Tenant subdomains would be like: acme, smithplumbing, etc.
    // Replit IDs are alphanumeric with hyphens and specific patterns
    if (parts.length <= 3 || firstPart.includes("-00-") || /^[a-f0-9-]{20,}$/.test(firstPart)) {
      return "main";
    }
    return "tenantPublic";
  }
  
  // Check if this is a subdomain of localblue or localhost (tenant public site)
  const parts = hostname.split(".");
  if (parts.length >= 2) {
    const tld = parts.slice(-1)[0];
    // Subdomain patterns like: acme.localblue, acme.localhost
    if (tld === "localhost" || hostname.endsWith(".localblue")) {
      return "tenantPublic";
    }
  }
  
  // Custom domain (like smithplumbing.com) - treat as tenant public
  return "tenantPublic";
}

function TenantPublicApp() {
  const { data: site, isLoading, error } = useQuery<Site>({
    queryKey: ["/api/site"],
  });

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4" data-testid="loading-public-site">
          <div className="relative h-12 w-12">
            <div className="absolute inset-0 rounded-full border-4 border-primary/20"></div>
            <div className="absolute inset-0 rounded-full border-4 border-primary border-t-transparent animate-spin"></div>
          </div>
          <p className="text-muted-foreground text-sm animate-pulse">Loading site...</p>
        </div>
      </div>
    );
  }

  if (error || !site) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 px-4">
        <div className="text-center max-w-md" data-testid="error-site-not-found">
          <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-muted flex items-center justify-center">
            <Building2 className="h-10 w-10 text-muted-foreground" />
          </div>
          <h1 className="text-2xl font-bold mb-3" data-testid="text-error-title">Site Not Found</h1>
          <p className="text-muted-foreground mb-6">
            The site you're looking for doesn't exist or hasn't been configured yet.
          </p>
          <a 
            href="https://localblue" 
            className="inline-flex items-center gap-2 text-foreground hover:text-muted-foreground transition-colors"
            data-testid="link-localblue"
          >
            Visit LocalBlue
            <ArrowRight className="h-4 w-4" />
          </a>
        </div>
      </div>
    );
  }

  return <PublicSite site={site} />;
}

function MainSiteApp() {
  return (
    <Switch>
      <Route path="/landing" component={Landing} />
      <Route path="/demo" component={Demo} />
      <Route path="/signup" component={SignUp} />
      <Route path="/onboarding" component={Onboarding} />
      <Route path="/preview/:subdomain" component={PreviewSite} />
      <Route path="/tenant/:subdomain/impersonate" component={TenantImpersonate} />
      <Route path="/admin/:rest*" component={PlatformAdmin} />
      <Route path="/admin" component={PlatformAdmin} />
      <Route path="/">
        <Landing />
      </Route>
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  const domainType = detectDomainType();

  const renderContent = () => {
    switch (domainType) {
      case "tenantAdmin":
        return <TenantAdminApp />;
      case "tenantPublic":
        return <TenantPublicApp />;
      case "main":
      default:
        return <MainSiteApp />;
    }
  };

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <ErrorBoundary>
          {renderContent()}
        </ErrorBoundary>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
