import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Building2, Users, Globe, Palette } from "lucide-react";
import type { Site, TenantUser } from "@shared/schema";

type SanitizedUser = Omit<TenantUser, "password">;

export default function Dashboard() {
  const { data: sites = [], isLoading: sitesLoading } = useQuery<Site[]>({
    queryKey: ["/api/admin/sites"],
  });

  const { data: users = [], isLoading: usersLoading } = useQuery<SanitizedUser[]>({
    queryKey: ["/api/admin/users"],
  });

  const publishedSites = sites.filter((s) => s.isPublished).length;
  const draftSites = sites.filter((s) => !s.isPublished).length;

  if (sitesLoading || usersLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-muted-foreground">Loading dashboard...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight" data-testid="text-dashboard-title">
          Dashboard
        </h1>
        <p className="text-muted-foreground">
          Overview of your multi-tenant platform
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Sites</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-total-sites">{sites.length}</div>
            <p className="text-xs text-muted-foreground">
              {publishedSites} published, {draftSites} drafts
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-total-users">{users.length}</div>
            <p className="text-xs text-muted-foreground">
              Across all tenants
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Published</CardTitle>
            <Globe className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-published-sites">{publishedSites}</div>
            <p className="text-xs text-muted-foreground">
              Live sites
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Custom Domains</CardTitle>
            <Palette className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-custom-domains">
              {sites.filter((s) => s.customDomain).length}
            </div>
            <p className="text-xs text-muted-foreground">
              Sites with custom domains
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Recent Sites</CardTitle>
            <CardDescription>Your tenant sites</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {sites.slice(0, 5).map((site) => (
                <div
                  key={site.id}
                  className="flex items-center justify-between gap-4"
                  data-testid={`row-site-${site.id}`}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="h-8 w-8 rounded-md flex items-center justify-center text-white text-sm font-medium"
                      style={{ backgroundColor: site.brandColor }}
                    >
                      {site.businessName.charAt(0)}
                    </div>
                    <div>
                      <p className="text-sm font-medium">{site.businessName}</p>
                      <p className="text-xs text-muted-foreground">
                        {site.subdomain}.yourplatform.com
                      </p>
                    </div>
                  </div>
                  <Badge variant={site.isPublished ? "default" : "secondary"}>
                    {site.isPublished ? "Published" : "Draft"}
                  </Badge>
                </div>
              ))}
              {sites.length === 0 && (
                <p className="text-sm text-muted-foreground">No sites yet</p>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent Users</CardTitle>
            <CardDescription>Users across all tenants</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {users.slice(0, 5).map((user) => {
                const userSite = sites.find((s) => s.id === user.siteId);
                return (
                  <div
                    key={user.id}
                    className="flex items-center justify-between gap-4"
                    data-testid={`row-user-${user.id}`}
                  >
                    <div>
                      <p className="text-sm font-medium">{user.email}</p>
                      <p className="text-xs text-muted-foreground">
                        {userSite?.businessName || "No site"}
                      </p>
                    </div>
                  </div>
                );
              })}
              {users.length === 0 && (
                <p className="text-sm text-muted-foreground">No users yet</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
