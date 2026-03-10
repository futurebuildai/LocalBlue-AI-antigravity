import { useState, useEffect } from "react";
import { Switch, Route, useLocation, Link } from "wouter";
import { queryClient, getQueryFn } from "./lib/queryClient";
import { QueryClientProvider, useQuery } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { BetaBanner } from "@/components/BetaBanner";
import { FeedbackWidget } from "@/components/FeedbackWidget";
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
import { LayoutDashboard, Building2, Users, ArrowRight, DollarSign, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import Dashboard from "@/pages/admin/Dashboard";
import AdminLogin from "@/pages/admin/Login";
import Sites from "@/pages/admin/Sites";
import SiteDetail from "@/pages/admin/SiteDetail";
import UsersPage from "@/pages/admin/Users";
import Revenue from "@/pages/admin/Revenue";
import NotFound from "@/pages/not-found";
import Landing from "@/pages/Landing";
import SignUp from "@/pages/SignUp";
import Login from "@/pages/Login";
import Onboarding from "@/pages/Onboarding";
import TenantLogin from "@/pages/tenant-admin/Login";
import TenantDashboard from "@/pages/tenant-admin/Dashboard";
import TenantSettings from "@/pages/tenant-admin/Settings";
import TenantUsers from "@/pages/tenant-admin/TenantUsers";
import TenantPages from "@/pages/tenant-admin/Pages";
import TenantPageEditor from "@/pages/tenant-admin/PageEditor";
import TenantLeads from "@/pages/tenant-admin/LeadsCRM";
import TenantRFQInbox from "@/pages/tenant-admin/RFQInbox";
import TenantAnalytics from "@/pages/tenant-admin/Analytics";
import TenantServicePricing from "@/pages/tenant-admin/ServicePricing";
import TenantTestimonials from "@/pages/tenant-admin/Testimonials";
import TenantAdminLayout from "@/components/TenantAdminLayout";
import PublicSite from "@/pages/PublicSite";
import PreviewSite from "@/pages/PreviewSite";
import PreviewAdmin from "@/pages/PreviewAdmin";
import Demo from "@/pages/Demo";
import Feedback from "@/pages/Feedback";
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
  { title: "Revenue", url: "/admin/revenue", icon: DollarSign },
];

function AppSidebar() {
  const [location] = useLocation();

  return (
    <Sidebar className="border-r-0">
      <SidebarHeader className="p-4 pb-6">
        <div className="flex flex-col gap-1">
          <img src="/logo-wordmark.png" alt="LocalBlue" className="h-8 object-contain object-left" />
          <p className="text-xs text-muted-foreground font-medium">Platform Admin</p>
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

function PlatformAdminGuard({ children }: { children: React.ReactNode }) {
  const { user, isLoading: authLoading, isAuthenticated } = useAuth();

  const { data: adminCheck, isLoading: adminLoading, error: adminError } = useQuery({
    queryKey: ["/api/admin/sites"],
    queryFn: async () => {
      const res = await fetch("/api/admin/sites", { credentials: "include" });
      if (res.status === 401 || res.status === 403) {
        throw new Error(`${res.status}`);
      }
      if (!res.ok) throw new Error(`${res.status}`);
      return true;
    },
    enabled: isAuthenticated,
    retry: false,
    staleTime: 1000 * 60 * 5,
  });

  if (authLoading || (isAuthenticated && adminLoading)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4" data-testid="loading-platform-admin">
          <div className="relative h-12 w-12">
            <div className="absolute inset-0 rounded-full border-4 border-primary/20"></div>
            <div className="absolute inset-0 rounded-full border-4 border-primary border-t-transparent animate-spin"></div>
          </div>
          <p className="text-muted-foreground text-sm animate-pulse">Loading admin panel...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center max-w-md">
          <h1 className="text-2xl font-bold mb-3" data-testid="text-admin-auth-required">Platform Admin Access Required</h1>
          <p className="text-muted-foreground mb-6">
            You must be signed in to access the platform admin panel.
          </p>
          <Link href="/admin/login">
            <Button data-testid="button-admin-login">
              Sign In
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  if (adminError) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center max-w-md">
          <h1 className="text-2xl font-bold mb-3" data-testid="text-admin-access-denied">Access Denied</h1>
          <p className="text-muted-foreground mb-6">
            Your account does not have platform admin privileges.
          </p>
          <a href="/">
            <Button variant="outline" data-testid="button-go-home">
              Go to Home
            </Button>
          </a>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}

function PlatformAdminLayout({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
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
            <h1 className="text-lg font-semibold flex-1">Platform Admin</h1>
            {user && (
              <div className="flex items-center gap-3">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={user.profileImageUrl || undefined} alt={user.firstName || "Admin"} />
                  <AvatarFallback>{(user.firstName?.[0] || "A").toUpperCase()}</AvatarFallback>
                </Avatar>
                <span className="text-sm font-medium" data-testid="text-admin-username">
                  {user.firstName} {user.lastName}
                </span>
                <button onClick={() => { window.location.href = "/api/admin/logout"; fetch("/api/admin/logout", { method: "POST" }).then(() => window.location.href = "/admin/login") }} data-testid="button-admin-logout" className="text-muted-foreground hover:text-foreground transition-colors cursor-pointer">
                  <LogOut className="h-4 w-4" />
                </button>
              </div>
            )}
          </header>
          <main className="flex-1 overflow-auto p-6">
            {children}
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
        <Route path="/rfqs">
          <TenantRFQInbox />
        </Route>
        <Route path="/leads">
          <TenantLeads />
        </Route>
        <Route path="/analytics">
          <TenantAnalytics />
        </Route>
        <Route path="/service-pricing">
          <TenantServicePricing />
        </Route>
        <Route path="/testimonials">
          <TenantTestimonials />
        </Route>
        <Route component={NotFound} />
      </Switch>
    </TenantAdminLayout>
  );
}

type DomainType = "tenantAdmin" | "tenantPublic" | "main";

function detectDomainType(): DomainType {
  const hostname = window.location.hostname;

  // Check if this is an admin subdomain (e.g. admin.smithplumbing.com or admin.acme.localblue.co)
  if (hostname.startsWith("admin.")) {
    return "tenantAdmin";
  }

  // Main site: localhost without subdomain, or the main domain
  const mainDomain = import.meta.env.VITE_MAIN_DOMAIN || "localblue.co";
  const isMainDomain = hostname === "localhost" ||
    hostname === mainDomain ||
    hostname === `www.${mainDomain}` ||
    hostname === "localblue" ||
    hostname === "www.localblue";

  if (isMainDomain) {
    return "main";
  }

  // All other domains (custom domains or subdomains) are treated as tenant public sites
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
    <>
      <Switch>
        <Route path="/landing" component={Landing} />
        <Route path="/demo" component={Demo} />
        <Route path="/signup" component={SignUp} />
        <Route path="/login" component={Login} />
        <Route path="/onboarding" component={Onboarding} />
        <Route path="/feedback/:subdomain" component={Feedback} />
        <Route path="/preview/:subdomain/admin/:rest*" component={PreviewAdmin} />
        <Route path="/preview/:subdomain/admin" component={PreviewAdmin} />
        <Route path="/preview/:subdomain" component={PreviewSite} />
        <Route path="/tenant/:subdomain/impersonate" component={TenantImpersonate} />
        <Route path="/admin/login" component={AdminLogin} />
        <Route path="/admin/sites/:id">
          {() => <PlatformAdminGuard><PlatformAdminLayout><SiteDetail /></PlatformAdminLayout></PlatformAdminGuard>}
        </Route>
        <Route path="/admin/sites">
          {() => <PlatformAdminGuard><PlatformAdminLayout><Sites /></PlatformAdminLayout></PlatformAdminGuard>}
        </Route>
        <Route path="/admin/users">
          {() => <PlatformAdminGuard><PlatformAdminLayout><UsersPage /></PlatformAdminLayout></PlatformAdminGuard>}
        </Route>
        <Route path="/admin/revenue">
          {() => <PlatformAdminGuard><PlatformAdminLayout><Revenue /></PlatformAdminLayout></PlatformAdminGuard>}
        </Route>
        <Route path="/admin">
          {() => <PlatformAdminGuard><PlatformAdminLayout><Dashboard /></PlatformAdminLayout></PlatformAdminGuard>}
        </Route>
        <Route path="/">
          <Landing />
        </Route>
        <Route component={NotFound} />
      </Switch>
      <BetaBanner />
      <FeedbackWidget />
    </>
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
