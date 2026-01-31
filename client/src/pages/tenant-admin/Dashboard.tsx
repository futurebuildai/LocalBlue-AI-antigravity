import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Users, Settings, Globe, Palette, ExternalLink, Copy, Rocket, CheckCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Link } from "wouter";
import PublishButton from "@/components/PublishButton";
import type { Site, User } from "@shared/schema";

type SanitizedUser = Omit<User, "password">;

interface TenantDashboardProps {
  site: Site;
}

export default function Dashboard({ site }: TenantDashboardProps) {
  const { toast } = useToast();
  const { data: users = [], isLoading: usersLoading } = useQuery<SanitizedUser[]>({
    queryKey: ["/api/tenant/users"],
  });

  const publicUrl = site.customDomain 
    ? `https://${site.customDomain}`
    : `https://${site.subdomain}.localblue.ai`;

  const copyUrl = () => {
    navigator.clipboard.writeText(publicUrl);
    toast({ title: "URL copied to clipboard" });
  };

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

      {!site.isPublished && (
        <Alert className="border-primary/50 bg-primary/5">
          <Rocket className="h-4 w-4" />
          <AlertTitle>Your site is not published yet</AlertTitle>
          <AlertDescription className="mt-2">
            <p className="mb-3">
              Your site is currently in draft mode and not visible to customers. 
              When you're ready, publish it to make it live!
            </p>
            <div className="flex items-center gap-3">
              <PublishButton site={site} />
              <Link href="/admin/settings">
                <Button variant="outline" size="sm" data-testid="link-go-to-settings">
                  <Settings className="h-4 w-4 mr-2" />
                  Go to Settings
                </Button>
              </Link>
            </div>
          </AlertDescription>
        </Alert>
      )}

      {site.isPublished && (
        <Card className="border-green-500/30 bg-green-50/50 dark:bg-green-900/10">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between gap-4 flex-wrap">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                  <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-medium">Your site is live!</span>
                    <Badge variant="default" className="bg-green-600" data-testid="badge-site-live">
                      Published
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                    <Globe className="h-3 w-3" />
                    <span data-testid="text-public-url">{publicUrl}</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={copyUrl} data-testid="button-copy-url">
                  <Copy className="h-4 w-4 mr-2" />
                  Copy URL
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => window.open(publicUrl, "_blank")}
                  data-testid="button-view-site"
                >
                  <ExternalLink className="h-4 w-4 mr-2" />
                  View Site
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

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
            <div className="flex items-center gap-2">
              <div 
                className={`h-2 w-2 rounded-full ${site.isPublished ? "bg-green-500" : "bg-yellow-500"}`}
              />
              <span className="text-2xl font-bold" data-testid="text-tenant-site-status">
                {site.isPublished ? "Live" : "Draft"}
              </span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {site.customDomain || `${site.subdomain}.localblue.ai`}
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
              <span className="font-medium">{site.subdomain}.localblue.ai</span>
            </div>
            {site.customDomain && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Custom Domain</span>
                <span className="font-medium">{site.customDomain}</span>
              </div>
            )}
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Status</span>
              <Badge variant={site.isPublished ? "default" : "secondary"}>
                {site.isPublished ? "Published" : "Draft"}
              </Badge>
            </div>
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
