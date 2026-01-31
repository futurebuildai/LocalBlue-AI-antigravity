import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Settings, Globe, Palette } from "lucide-react";
import type { Site, User } from "@shared/schema";

type SanitizedUser = Omit<User, "password">;

interface TenantDashboardProps {
  site: Site;
}

export default function Dashboard({ site }: TenantDashboardProps) {
  const { data: users = [], isLoading: usersLoading } = useQuery<SanitizedUser[]>({
    queryKey: ["/api/tenant/users"],
  });

  if (usersLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-muted-foreground">Loading dashboard...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight" data-testid="text-tenant-dashboard-title">
          Dashboard
        </h1>
        <p className="text-muted-foreground">
          Welcome to {site.businessName} admin panel
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-tenant-total-users">{users.length}</div>
            <p className="text-xs text-muted-foreground">
              Users in your site
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Site Status</CardTitle>
            <Globe className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-tenant-site-status">
              {site.isPublished ? "Published" : "Draft"}
            </div>
            <p className="text-xs text-muted-foreground">
              {site.subdomain}.yourplatform.com
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Brand Color</CardTitle>
            <Palette className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <div 
                className="h-6 w-6 rounded-md border"
                style={{ backgroundColor: site.brandColor }}
              />
              <span className="text-sm font-medium" data-testid="text-tenant-brand-color">{site.brandColor}</span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Your theme color
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Services</CardTitle>
            <Settings className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-tenant-services-count">
              {Array.isArray(site.services) ? site.services.length : 0}
            </div>
            <p className="text-xs text-muted-foreground">
              Active services
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Site Information</CardTitle>
            <CardDescription>Your site details</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Business Name</span>
              <span className="font-medium" data-testid="text-tenant-business-name">{site.businessName}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Subdomain</span>
              <span className="font-medium">{site.subdomain}</span>
            </div>
            {site.customDomain && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Custom Domain</span>
                <span className="font-medium">{site.customDomain}</span>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent Users</CardTitle>
            <CardDescription>Users in your site</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {users.slice(0, 5).map((user) => (
                <div
                  key={user.id}
                  className="flex items-center justify-between gap-4"
                  data-testid={`row-tenant-user-${user.id}`}
                >
                  <div>
                    <p className="text-sm font-medium">{user.email}</p>
                  </div>
                </div>
              ))}
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
