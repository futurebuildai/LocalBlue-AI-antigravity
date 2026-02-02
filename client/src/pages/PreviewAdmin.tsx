import { useQuery } from "@tanstack/react-query";
import { useParams, Link, Switch, Route } from "wouter";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Eye } from "lucide-react";
import TenantAdminLayout from "@/components/TenantAdminLayout";
import TenantDashboard from "./tenant-admin/Dashboard";
import TenantPages from "./tenant-admin/Pages";
import TenantPageEditor from "./tenant-admin/PageEditor";
import TenantSettings from "./tenant-admin/Settings";
import TenantLeads from "./tenant-admin/Leads";
import TenantUsers from "./tenant-admin/TenantUsers";
import type { Site } from "@shared/schema";

export default function PreviewAdmin() {
  const { subdomain } = useParams<{ subdomain: string }>();

  const { data: site, isLoading, error } = useQuery<Site>({
    queryKey: ["/api/preview", subdomain],
    queryFn: async () => {
      const response = await fetch(`/api/preview/${subdomain}`);
      if (!response.ok) {
        throw new Error("Site not found");
      }
      return response.json();
    },
    enabled: !!subdomain,
  });

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4" data-testid="loading-preview-admin">
          <div className="relative h-12 w-12">
            <div className="absolute inset-0 rounded-full border-4 border-primary/20"></div>
            <div className="absolute inset-0 rounded-full border-4 border-primary border-t-transparent animate-spin"></div>
          </div>
          <p className="text-muted-foreground text-sm animate-pulse">Loading admin preview...</p>
        </div>
      </div>
    );
  }

  if (error || !site) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background px-4">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4" data-testid="text-error-title">Site Not Found</h1>
          <p className="text-muted-foreground mb-6">
            The site you're looking for doesn't exist or hasn't been configured yet.
          </p>
          <Link href="/">
            <Button data-testid="button-back-home">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Home
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  const previewUser = {
    id: "preview-user",
    email: "preview@localblue.co",
    firstName: "Preview",
    lastName: "User",
    profileImageUrl: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const handleLogout = () => {
    window.location.href = "/";
  };

  return (
    <div className="min-h-screen flex flex-col">
      <div className="bg-amber-500 text-white py-2 px-4 flex items-center justify-between sticky top-0 z-[60]">
        <div className="flex items-center gap-3">
          <Eye className="h-4 w-4" />
          <span className="text-sm font-medium">Admin Preview Mode</span>
          <Badge variant="secondary" className="text-xs bg-white/20 text-white">
            {site.isPublished ? "Published" : "Draft"}
          </Badge>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm opacity-80">{site.businessName}</span>
          <Link href={`/preview/${subdomain}`}>
            <Button size="sm" variant="secondary" data-testid="button-view-site">
              <Eye className="h-3 w-3 mr-1" />
              View Site
            </Button>
          </Link>
          <Link href="/">
            <Button size="sm" variant="secondary" data-testid="button-back-dashboard">
              <ArrowLeft className="h-3 w-3 mr-1" />
              Back
            </Button>
          </Link>
        </div>
      </div>
      <div className="flex-1">
        <TenantAdminLayout site={site} user={previewUser} onLogout={handleLogout} basePath={`/preview/${subdomain}/admin`}>
          <Switch>
            <Route path="/preview/:subdomain/admin/pages/:slug">
              <TenantPageEditor />
            </Route>
            <Route path="/preview/:subdomain/admin/pages">
              <TenantPages />
            </Route>
            <Route path="/preview/:subdomain/admin/leads">
              <TenantLeads />
            </Route>
            <Route path="/preview/:subdomain/admin/users">
              <TenantUsers />
            </Route>
            <Route path="/preview/:subdomain/admin/settings">
              <TenantSettings site={site} />
            </Route>
            <Route path="/preview/:subdomain/admin">
              <TenantDashboard site={site} />
            </Route>
          </Switch>
        </TenantAdminLayout>
      </div>
    </div>
  );
}
