import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { 
  Users, Settings, Globe, ExternalLink, Copy, Rocket, CheckCircle, 
  Mail, Phone, MessageSquare, TrendingUp, Calendar, ArrowRight, Clock,
  Eye, Zap, FileText, Crown, Sparkles, CreditCard
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Link } from "wouter";
import PublishButton from "@/components/PublishButton";
import type { Site, User, Lead } from "@shared/schema";

type SanitizedUser = Omit<User, "password">;

interface TenantDashboardProps {
  site: Site;
}

export default function Dashboard({ site }: TenantDashboardProps) {
  const { toast } = useToast();
  
  const { data: users = [], isLoading: usersLoading } = useQuery<SanitizedUser[]>({
    queryKey: ["/api/tenant/users"],
  });

  const { data: leads = [], isLoading: leadsLoading } = useQuery<Lead[]>({
    queryKey: ["/api/tenant/leads"],
  });

  const publicUrl = site.customDomain 
    ? `https://${site.customDomain}`
    : `https://${site.subdomain}.localblue.co`;

  const copyUrl = () => {
    navigator.clipboard.writeText(publicUrl);
    toast({ title: "URL copied to clipboard" });
  };

  const now = new Date();
  const thisMonth = leads.filter(lead => {
    const leadDate = new Date(lead.createdAt);
    return leadDate.getMonth() === now.getMonth() && leadDate.getFullYear() === now.getFullYear();
  });
  
  const lastMonth = leads.filter(lead => {
    const leadDate = new Date(lead.createdAt);
    const lastMonthDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    return leadDate.getMonth() === lastMonthDate.getMonth() && leadDate.getFullYear() === lastMonthDate.getFullYear();
  });

  const leadGrowth = lastMonth.length > 0 
    ? Math.round(((thisMonth.length - lastMonth.length) / lastMonth.length) * 100)
    : thisMonth.length > 0 ? 100 : 0;

  const recentLeads = leads.slice(0, 5);

  const formatDate = (date: Date | string) => {
    const d = new Date(date);
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    
    if (diffHours < 1) return 'Just now';
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  if (usersLoading || leadsLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-pulse text-muted-foreground">Loading dashboard...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight" data-testid="text-tenant-dashboard-title">
            Dashboard
          </h1>
          <p className="text-muted-foreground">
            Welcome back to {site.businessName}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => window.open(publicUrl, "_blank")}
            data-testid="button-view-site-header"
          >
            <Eye className="h-4 w-4 mr-2" />
            View Site
          </Button>
          <Link href="/admin/settings">
            <Button variant="outline" size="sm" data-testid="link-settings-header">
              <Settings className="h-4 w-4 mr-2" />
              Settings
            </Button>
          </Link>
        </div>
      </div>

      {/* Trial Status Banner */}
      {(site.trialPhase === 'test_drive' || site.trialPhase === 'professional_launch') && (
        <Card className="border-violet-500/30 bg-gradient-to-r from-violet-500/10 to-purple-500/10" data-testid="card-trial-status">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between gap-4 flex-wrap">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-full bg-gradient-to-br from-violet-500 to-purple-500 flex items-center justify-center shadow-lg shadow-violet-500/30">
                  {site.trialPhase === 'test_drive' ? (
                    <Rocket className="h-6 w-6 text-white" />
                  ) : (
                    <Sparkles className="h-6 w-6 text-white" />
                  )}
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold">
                      {site.trialPhase === 'test_drive' ? 'Test Drive' : 'Professional Launch'}
                    </span>
                    <Badge className="bg-violet-500/20 text-violet-300 border-violet-500/30" data-testid="badge-trial-phase">
                      {site.subscriptionPlan?.charAt(0).toUpperCase()}{site.subscriptionPlan?.slice(1) || 'Growth'} Plan
                    </Badge>
                    {!site.hasCreditCard && (
                      <Badge variant="outline" className="text-amber-400 border-amber-400/30" data-testid="badge-no-card">
                        No Card
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">
                    {site.trialPhase === 'test_drive' ? (
                      <>Your site is live at <span className="font-medium text-violet-400">{site.subdomain}.localblue.co</span></>
                    ) : (
                      <>Your custom domain is active. Card on file - billing starts soon.</>
                    )}
                  </p>
                </div>
              </div>
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                {site.trialPhase === 'test_drive' ? (
                  <>
                    <Link href="/admin/settings">
                      <Button className="bg-gradient-to-r from-violet-500 to-purple-500 text-white shadow-lg shadow-violet-500/30" data-testid="button-upgrade-domain">
                        <Globe className="h-4 w-4 mr-2" />
                        Connect Custom Domain
                      </Button>
                    </Link>
                    <p className="text-xs text-muted-foreground text-center sm:text-left max-w-[200px]">
                      Get 14 extra days free when you go live
                    </p>
                  </>
                ) : (
                  <div className="text-center sm:text-right">
                    <div className="flex items-center gap-2 text-sm">
                      <CreditCard className="h-4 w-4 text-green-400" />
                      <span className="text-green-400 font-medium">Card on file</span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      Billing starts after 14-day launch period
                    </p>
                  </div>
                )}
              </div>
            </div>
            {site.trialPhase === 'test_drive' && (
              <div className="mt-4 pt-4 border-t border-violet-500/20">
                <div className="flex items-center justify-between gap-4 text-sm mb-2">
                  <span className="text-muted-foreground">Trial Progress</span>
                  <span className="text-violet-400 font-medium">
                    {site.trialStartDate ? 
                      `${Math.max(0, 30 - Math.floor((Date.now() - new Date(site.trialStartDate).getTime()) / (1000 * 60 * 60 * 24)))} days remaining` :
                      '30 days remaining'
                    }
                  </span>
                </div>
                <Progress 
                  value={site.trialStartDate ? 
                    Math.min(100, (Math.floor((Date.now() - new Date(site.trialStartDate).getTime()) / (1000 * 60 * 60 * 24)) / 30) * 100) : 
                    0
                  } 
                  className="h-2 bg-violet-500/20"
                />
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Active Subscription Banner */}
      {site.trialPhase === 'active' && (
        <Card className="border-green-500/30 bg-green-500/5" data-testid="card-subscription-active">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between gap-4 flex-wrap">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                  <Crown className="h-5 w-5 text-green-600 dark:text-green-400" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-medium">Active Subscription</span>
                    <Badge className="bg-green-500" data-testid="badge-subscription-plan">
                      {site.subscriptionPlan?.charAt(0).toUpperCase()}{site.subscriptionPlan?.slice(1) || 'Growth'} Plan
                    </Badge>
                    <Badge variant="outline" data-testid="badge-billing-period">
                      {site.billingPeriod === 'annual' ? 'Annual' : 'Monthly'}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">
                    Unlimited leads included
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

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
            <CardTitle className="text-sm font-medium">Total Leads</CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-tenant-total-leads">{leads.length}</div>
            <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
              {leadGrowth > 0 ? (
                <>
                  <TrendingUp className="h-3 w-3 text-green-500" />
                  <span className="text-green-500">+{leadGrowth}%</span>
                  <span>vs last month</span>
                </>
              ) : leadGrowth < 0 ? (
                <>
                  <TrendingUp className="h-3 w-3 text-red-500 rotate-180" />
                  <span className="text-red-500">{leadGrowth}%</span>
                  <span>vs last month</span>
                </>
              ) : (
                <span>Contact form submissions</span>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">This Month</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-tenant-leads-month">{thisMonth.length}</div>
            <p className="text-xs text-muted-foreground">
              New leads in {now.toLocaleDateString('en-US', { month: 'long' })}
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
                className={`h-2 w-2 rounded-full ${site.isPublished ? "bg-green-500 animate-pulse" : "bg-yellow-500"}`}
              />
              <span className="text-2xl font-bold" data-testid="text-tenant-site-status">
                {site.isPublished ? "Live" : "Draft"}
              </span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {site.customDomain || `${site.subdomain}.localblue.co`}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Team Members</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-tenant-total-users">{users.length}</div>
            <p className="text-xs text-muted-foreground">
              Admin users
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between gap-2 flex-wrap">
            <div>
              <CardTitle>Recent Leads</CardTitle>
              <CardDescription>Latest inquiries from potential customers</CardDescription>
            </div>
            <Link href="/admin/leads">
              <Button variant="ghost" size="sm" data-testid="link-view-all-leads">
                View All
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            {recentLeads.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <MessageSquare className="h-12 w-12 mx-auto mb-3 opacity-30" />
                <p className="font-medium">No leads yet</p>
                <p className="text-sm">When customers submit your contact form, they'll appear here</p>
              </div>
            ) : (
              <div className="space-y-4">
                {recentLeads.map((lead) => (
                  <div
                    key={lead.id}
                    className="flex items-start justify-between gap-4 p-3 rounded-lg bg-muted/30 hover-elevate"
                    data-testid={`row-tenant-lead-${lead.id}`}
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-medium truncate">{lead.name}</p>
                        <Badge variant="secondary" className="text-xs">
                          <Clock className="h-3 w-3 mr-1" />
                          {formatDate(lead.createdAt)}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-3 mt-1 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1 truncate">
                          <Mail className="h-3 w-3" />
                          {lead.email}
                        </span>
                        {lead.phone && (
                          <span className="flex items-center gap-1">
                            <Phone className="h-3 w-3" />
                            {lead.phone}
                          </span>
                        )}
                      </div>
                      {lead.message && (
                        <p className="text-sm text-muted-foreground mt-2 line-clamp-2">
                          {lead.message}
                        </p>
                      )}
                    </div>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => window.location.href = `mailto:${lead.email}`}
                      data-testid={`button-reply-lead-${lead.id}`}
                    >
                      Reply
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Common tasks for your site</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Link href="/admin/pages">
              <Button variant="outline" className="w-full justify-start" data-testid="link-edit-pages">
                <FileText className="h-4 w-4 mr-3" />
                Edit Pages
              </Button>
            </Link>
            <Link href="/admin/leads">
              <Button variant="outline" className="w-full justify-start" data-testid="link-view-leads">
                <MessageSquare className="h-4 w-4 mr-3" />
                View All Leads
                {leads.length > 0 && (
                  <Badge variant="secondary" className="ml-auto">{leads.length}</Badge>
                )}
              </Button>
            </Link>
            <Link href="/admin/settings">
              <Button variant="outline" className="w-full justify-start" data-testid="link-site-settings">
                <Settings className="h-4 w-4 mr-3" />
                Site Settings
              </Button>
            </Link>
            <Link href="/admin/users">
              <Button variant="outline" className="w-full justify-start" data-testid="link-manage-users">
                <Users className="h-4 w-4 mr-3" />
                Manage Team
              </Button>
            </Link>
            <Button 
              variant="outline" 
              className="w-full justify-start"
              onClick={() => window.open(publicUrl, "_blank")}
              data-testid="button-preview-site"
            >
              <Eye className="h-4 w-4 mr-3" />
              Preview Site
            </Button>
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
            <div className="flex justify-between gap-4">
              <span className="text-muted-foreground">Business Name</span>
              <span className="font-medium truncate" data-testid="text-tenant-business-name">{site.businessName}</span>
            </div>
            <div className="flex justify-between gap-4">
              <span className="text-muted-foreground">Subdomain</span>
              <span className="font-medium">{site.subdomain}.localblue.co</span>
            </div>
            {site.customDomain && (
              <div className="flex justify-between gap-4">
                <span className="text-muted-foreground">Custom Domain</span>
                <span className="font-medium">{site.customDomain}</span>
              </div>
            )}
            {site.tradeType && (
              <div className="flex justify-between gap-4">
                <span className="text-muted-foreground">Trade Type</span>
                <Badge variant="outline">{site.tradeType.replace('_', ' ')}</Badge>
              </div>
            )}
            <div className="flex justify-between gap-4 items-center">
              <span className="text-muted-foreground">Status</span>
              <Badge variant={site.isPublished ? "default" : "secondary"}>
                {site.isPublished ? "Published" : "Draft"}
              </Badge>
            </div>
            {site.serviceArea && (
              <div className="flex justify-between gap-4">
                <span className="text-muted-foreground">Service Area</span>
                <span className="font-medium truncate">{site.serviceArea}</span>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Features Enabled</CardTitle>
            <CardDescription>Interactive components on your site</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <MessageSquare className="h-4 w-4 text-muted-foreground" />
                <span>AI Chatbot</span>
              </div>
              <Badge variant={site.enableChatbot ? "default" : "secondary"}>
                {site.enableChatbot ? "On" : "Off"}
              </Badge>
            </div>
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <Zap className="h-4 w-4 text-muted-foreground" />
                <span>Quote Calculator</span>
              </div>
              <Badge variant={site.enableQuoteCalculator ? "default" : "secondary"}>
                {site.enableQuoteCalculator ? "On" : "Off"}
              </Badge>
            </div>
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span>Appointment Scheduler</span>
              </div>
              <Badge variant={site.enableAppointmentScheduler ? "default" : "secondary"}>
                {site.enableAppointmentScheduler ? "On" : "Off"}
              </Badge>
            </div>
            <div className="pt-3 border-t">
              <Link href="/admin/settings">
                <Button variant="outline" size="sm" className="w-full" data-testid="link-manage-features">
                  <Settings className="h-4 w-4 mr-2" />
                  Manage Features
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
