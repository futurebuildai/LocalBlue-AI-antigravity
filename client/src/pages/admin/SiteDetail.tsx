import { useQuery, useMutation } from "@tanstack/react-query";
import { useParams, Link } from "wouter";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  ArrowLeft, 
  ExternalLink, 
  LogIn, 
  Settings, 
  Users, 
  FileText, 
  Image, 
  Mail, 
  Phone, 
  MapPin,
  CheckCircle2,
  Circle,
  Clock,
  Building2,
  Briefcase,
  Award
} from "lucide-react";
import type { Site, Lead, Page, OnboardingProgress, SitePhoto, Testimonial, TenantUser } from "@shared/schema";

interface SanitizedUser {
  id: string;
  email: string;
  siteId: string | null;
  name?: string;
  role?: string;
}

interface SiteDetailsResponse {
  site: Site;
  leads: Lead[];
  onboardingProgress: OnboardingProgress | null;
  pages: Page[];
  users: SanitizedUser[];
  photos: SitePhoto[];
  testimonials: Testimonial[];
}

const ONBOARDING_PHASES = [
  { key: "welcome", label: "Welcome" },
  { key: "business_basics", label: "Business Basics" },
  { key: "trade_detection", label: "Trade Detection" },
  { key: "services", label: "Services" },
  { key: "story", label: "Story" },
  { key: "differentiators", label: "Differentiators" },
  { key: "service_area", label: "Service Area" },
  { key: "style", label: "Style" },
  { key: "pages", label: "Pages" },
  { key: "photos", label: "Photos" },
  { key: "review", label: "Review" },
  { key: "complete", label: "Complete" },
];

function formatDate(dateStr: string | Date | null | undefined): string {
  if (!dateStr) return "N/A";
  const date = new Date(dateStr);
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  });
}

function formatOnboardingPhase(phase: string): string {
  return phase.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase());
}

export default function SiteDetail() {
  const params = useParams<{ id: string }>();
  const siteId = params.id;
  const { toast } = useToast();

  const { data, isLoading, error } = useQuery<SiteDetailsResponse>({
    queryKey: ["/api/admin/sites", siteId, "details"],
    queryFn: async () => {
      const response = await fetch(`/api/admin/sites/${siteId}/details`, {
        credentials: "include"
      });
      if (!response.ok) {
        throw new Error("Failed to fetch site details");
      }
      return response.json();
    },
    enabled: !!siteId
  });

  const impersonateMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", `/api/admin/sites/${siteId}/impersonate`);
      return response.json();
    },
    onSuccess: (data) => {
      window.open(`/tenant/${data.subdomain}/impersonate?token=${data.token}`, "_blank");
    },
    onError: (error: Error) => {
      toast({ title: "Failed to login as customer", description: error.message, variant: "destructive" });
    },
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Skeleton className="h-10 w-10" />
          <div className="space-y-2">
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-4 w-32" />
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
        <Skeleton className="h-96" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <Building2 className="h-12 w-12 text-muted-foreground mb-4" />
        <h3 className="text-lg font-medium">Site not found</h3>
        <p className="text-muted-foreground text-sm mb-4">The site you're looking for doesn't exist.</p>
        <Link href="/admin/sites">
          <Button variant="outline" data-testid="button-back-to-sites">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Sites
          </Button>
        </Link>
      </div>
    );
  }

  const { site, leads, onboardingProgress, pages, users, photos, testimonials } = data;

  const handleViewSite = () => {
    window.open(`/preview/${site.subdomain}`, "_blank");
  };

  const handleLoginAsCustomer = () => {
    impersonateMutation.mutate();
  };

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-4">
          <Link href="/admin/sites">
            <Button variant="ghost" size="icon" data-testid="button-back-to-sites">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <div className="flex items-center gap-3 flex-wrap">
              <div
                className="h-10 w-10 rounded-lg flex items-center justify-center text-white font-bold text-lg shrink-0"
                style={{ backgroundColor: site.brandColor }}
              >
                {site.businessName.charAt(0)}
              </div>
              <h1 className="text-2xl font-semibold tracking-tight" data-testid="text-business-name">
                {site.businessName}
              </h1>
            </div>
            <div className="flex items-center gap-2 mt-2 flex-wrap">
              <Badge 
                className={site.isPublished 
                  ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100" 
                  : ""}
                variant={site.isPublished ? "default" : "secondary"}
              >
                {site.isPublished ? "Published" : "Draft"}
              </Badge>
              {onboardingProgress && (
                <Badge 
                  className={onboardingProgress.currentPhase === "complete" 
                    ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100"
                    : "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100"
                  }
                >
                  {onboardingProgress.currentPhase === "complete" 
                    ? "Onboarding Complete" 
                    : `Onboarding: ${formatOnboardingPhase(onboardingProgress.currentPhase)}`
                  }
                </Badge>
              )}
              <span className="text-sm text-muted-foreground">{site.subdomain}.localblue</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-wrap w-full sm:w-auto">
          <Button variant="outline" size="sm" onClick={handleViewSite} data-testid="button-view-site" className="flex-1 sm:flex-initial min-h-[44px]">
            <ExternalLink className="h-4 w-4 mr-2" />
            View Site
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleLoginAsCustomer}
            disabled={impersonateMutation.isPending}
            data-testid="button-login-as-customer"
            className="flex-1 sm:flex-initial min-h-[44px]"
          >
            <LogIn className="h-4 w-4 mr-2" />
            Login as Customer
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2 p-3 sm:p-6 sm:pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium">Total Leads</CardTitle>
            <Mail className="h-4 w-4 text-muted-foreground shrink-0" />
          </CardHeader>
          <CardContent className="p-3 pt-0 sm:p-6 sm:pt-0">
            <div className="text-xl sm:text-2xl font-bold" data-testid="stat-leads">{leads.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2 p-3 sm:p-6 sm:pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium">Pages Created</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground shrink-0" />
          </CardHeader>
          <CardContent className="p-3 pt-0 sm:p-6 sm:pt-0">
            <div className="text-xl sm:text-2xl font-bold" data-testid="stat-pages">{pages.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2 p-3 sm:p-6 sm:pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium">Team Members</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground shrink-0" />
          </CardHeader>
          <CardContent className="p-3 pt-0 sm:p-6 sm:pt-0">
            <div className="text-xl sm:text-2xl font-bold" data-testid="stat-users">{users.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2 p-3 sm:p-6 sm:pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium">Photos Uploaded</CardTitle>
            <Image className="h-4 w-4 text-muted-foreground shrink-0" />
          </CardHeader>
          <CardContent className="p-3 pt-0 sm:p-6 sm:pt-0">
            <div className="text-xl sm:text-2xl font-bold" data-testid="stat-photos">{photos.length}</div>
          </CardContent>
        </Card>
      </div>

      {/* Tabbed Interface */}
      <Tabs defaultValue="overview" className="w-full">
        <div className="overflow-x-auto -mx-1 px-1">
          <TabsList className="inline-flex w-auto min-w-full sm:grid sm:w-full sm:grid-cols-6">
            <TabsTrigger value="overview" data-testid="tab-overview" className="min-h-[44px] min-w-[80px] sm:min-w-0">Overview</TabsTrigger>
            <TabsTrigger value="leads" data-testid="tab-leads" className="min-h-[44px] min-w-[60px] sm:min-w-0">Leads</TabsTrigger>
            <TabsTrigger value="onboarding" data-testid="tab-onboarding" className="min-h-[44px] min-w-[90px] sm:min-w-0">Onboarding</TabsTrigger>
            <TabsTrigger value="pages" data-testid="tab-pages" className="min-h-[44px] min-w-[60px] sm:min-w-0">Pages</TabsTrigger>
            <TabsTrigger value="team" data-testid="tab-team" className="min-h-[44px] min-w-[60px] sm:min-w-0">Team</TabsTrigger>
            <TabsTrigger value="photos" data-testid="tab-photos" className="min-h-[44px] min-w-[60px] sm:min-w-0">Photos</TabsTrigger>
          </TabsList>
        </div>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Building2 className="h-5 w-5" />
                  Business Details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <span className="text-sm text-muted-foreground">Business Name</span>
                  <p className="font-medium">{site.businessName}</p>
                </div>
                {site.tagline && (
                  <div>
                    <span className="text-sm text-muted-foreground">Tagline</span>
                    <p className="font-medium">{site.tagline}</p>
                  </div>
                )}
                {site.tradeType && (
                  <div>
                    <span className="text-sm text-muted-foreground">Trade Type</span>
                    <p className="font-medium capitalize">{site.tradeType.replace(/_/g, " ")}</p>
                  </div>
                )}
                {site.yearsInBusiness && (
                  <div>
                    <span className="text-sm text-muted-foreground">Years in Business</span>
                    <p className="font-medium">{site.yearsInBusiness} years</p>
                  </div>
                )}
                {site.businessDescription && (
                  <div>
                    <span className="text-sm text-muted-foreground">Description</span>
                    <p className="text-sm">{site.businessDescription}</p>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Phone className="h-5 w-5" />
                  Contact Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {site.phone && (
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <span>{site.phone}</span>
                  </div>
                )}
                {site.email && (
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <span>{site.email}</span>
                  </div>
                )}
                {site.address && (
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    <span>{site.address}</span>
                  </div>
                )}
                {site.serviceArea && (
                  <div>
                    <span className="text-sm text-muted-foreground">Service Area</span>
                    <p className="font-medium">{site.serviceArea}</p>
                  </div>
                )}
                {!site.phone && !site.email && !site.address && (
                  <p className="text-sm text-muted-foreground">No contact information provided</p>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Briefcase className="h-5 w-5" />
                  Services
                </CardTitle>
              </CardHeader>
              <CardContent>
                {site.services && Array.isArray(site.services) && site.services.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {site.services.map((service, index) => (
                      <Badge key={index} variant="secondary">{service}</Badge>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">No services listed</p>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Award className="h-5 w-5" />
                  Certifications & USPs
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {site.certifications && Array.isArray(site.certifications) && site.certifications.length > 0 && (
                  <div>
                    <span className="text-sm text-muted-foreground">Certifications</span>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {site.certifications.map((cert, index) => (
                        <Badge key={index} variant="outline">{cert}</Badge>
                      ))}
                    </div>
                  </div>
                )}
                {site.uniqueSellingPoints && Array.isArray(site.uniqueSellingPoints) && site.uniqueSellingPoints.length > 0 && (
                  <div>
                    <span className="text-sm text-muted-foreground">Unique Selling Points</span>
                    <ul className="list-disc list-inside mt-1 text-sm">
                      {site.uniqueSellingPoints.map((usp, index) => (
                        <li key={index}>{usp}</li>
                      ))}
                    </ul>
                  </div>
                )}
                {(!site.certifications || site.certifications.length === 0) && 
                 (!site.uniqueSellingPoints || site.uniqueSellingPoints.length === 0) && (
                  <p className="text-sm text-muted-foreground">No certifications or USPs listed</p>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Leads Tab */}
        <TabsContent value="leads">
          <Card>
            <CardHeader>
              <CardTitle>Leads</CardTitle>
              <CardDescription>All leads captured from the site</CardDescription>
            </CardHeader>
            <CardContent>
              {leads.length === 0 ? (
                <div className="text-center py-8">
                  <Mail className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
                  <p className="text-muted-foreground">No leads yet</p>
                </div>
              ) : (
                <div className="overflow-x-auto -mx-6 px-6">
                  <Table data-testid="table-leads" className="min-w-[600px]">
                    <TableHeader>
                      <TableRow>
                        <TableHead className="min-w-[100px]">Name</TableHead>
                        <TableHead className="min-w-[140px]">Email</TableHead>
                        <TableHead className="min-w-[100px]">Phone</TableHead>
                        <TableHead className="min-w-[120px]">Message</TableHead>
                        <TableHead className="min-w-[120px]">Date</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {leads.map((lead) => (
                        <TableRow key={lead.id} data-testid={`row-lead-${lead.id}`}>
                          <TableCell className="font-medium">{lead.name}</TableCell>
                          <TableCell className="break-all">{lead.email}</TableCell>
                          <TableCell>{lead.phone || "-"}</TableCell>
                          <TableCell className="max-w-xs truncate">{lead.message || "-"}</TableCell>
                          <TableCell className="whitespace-nowrap">{formatDate(lead.createdAt)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Onboarding Tab */}
        <TabsContent value="onboarding">
          <Card>
            <CardHeader>
              <CardTitle>Onboarding Progress</CardTitle>
              <CardDescription>Customer journey through the onboarding process</CardDescription>
            </CardHeader>
            <CardContent>
              {!onboardingProgress ? (
                <div className="text-center py-8">
                  <Clock className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
                  <p className="text-muted-foreground">Onboarding not started</p>
                </div>
              ) : (
                <div className="space-y-6" data-testid="timeline-onboarding">
                  <div className="relative">
                    {ONBOARDING_PHASES.map((phase, index) => {
                      const completedPhases = onboardingProgress.completedPhases || [];
                      const isCompleted = completedPhases.includes(phase.key as any);
                      const isCurrent = onboardingProgress.currentPhase === phase.key;
                      const isLast = index === ONBOARDING_PHASES.length - 1;
                      
                      return (
                        <div key={phase.key} className="flex gap-4 pb-4">
                          <div className="flex flex-col items-center">
                            {isCompleted ? (
                              <CheckCircle2 className="h-6 w-6 text-green-600" />
                            ) : isCurrent ? (
                              <Circle className="h-6 w-6 text-blue-600 fill-blue-100" />
                            ) : (
                              <Circle className="h-6 w-6 text-muted-foreground" />
                            )}
                            {!isLast && (
                              <div className={`w-0.5 flex-1 mt-1 ${isCompleted ? "bg-green-600" : "bg-muted"}`} />
                            )}
                          </div>
                          <div className="flex-1 pb-4">
                            <div className="flex items-center gap-2">
                              <span className={`font-medium ${isCurrent ? "text-blue-600" : isCompleted ? "text-foreground" : "text-muted-foreground"}`}>
                                {phase.label}
                              </span>
                              {isCurrent && (
                                <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100">
                                  Current
                                </Badge>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {onboardingProgress.collectedData && Object.keys(onboardingProgress.collectedData).length > 0 && (
                    <div className="border-t pt-4">
                      <h4 className="font-medium mb-3">Collected Data</h4>
                      <div className="grid md:grid-cols-2 gap-4 text-sm">
                        {Object.entries(onboardingProgress.collectedData).map(([key, value]) => (
                          <div key={key}>
                            <span className="text-muted-foreground capitalize">{key.replace(/_/g, " ")}</span>
                            <p className="font-medium">
                              {typeof value === "object" ? JSON.stringify(value) : String(value)}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Pages Tab */}
        <TabsContent value="pages">
          <Card>
            <CardHeader>
              <CardTitle>Pages</CardTitle>
              <CardDescription>All pages created for this site</CardDescription>
            </CardHeader>
            <CardContent>
              {pages.length === 0 ? (
                <div className="text-center py-8">
                  <FileText className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
                  <p className="text-muted-foreground">No pages created yet</p>
                </div>
              ) : (
                <div className="overflow-x-auto -mx-6 px-6">
                  <Table data-testid="table-pages" className="min-w-[500px]">
                    <TableHeader>
                      <TableRow>
                        <TableHead className="min-w-[120px]">Title</TableHead>
                        <TableHead className="min-w-[100px]">Slug</TableHead>
                        <TableHead className="min-w-[130px]">Created</TableHead>
                        <TableHead className="min-w-[130px]">Updated</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {pages.map((page) => (
                        <TableRow key={page.id} data-testid={`row-page-${page.id}`}>
                          <TableCell className="font-medium">{page.title}</TableCell>
                          <TableCell className="text-muted-foreground">/{page.slug}</TableCell>
                          <TableCell className="whitespace-nowrap">{formatDate(page.createdAt)}</TableCell>
                          <TableCell className="whitespace-nowrap">{formatDate(page.updatedAt)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Team Tab */}
        <TabsContent value="team">
          <Card>
            <CardHeader>
              <CardTitle>Team Members</CardTitle>
              <CardDescription>Users with access to this site's admin panel</CardDescription>
            </CardHeader>
            <CardContent>
              {users.length === 0 ? (
                <div className="text-center py-8">
                  <Users className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
                  <p className="text-muted-foreground">No team members</p>
                </div>
              ) : (
                <div className="overflow-x-auto -mx-6 px-6">
                  <Table data-testid="table-team" className="min-w-[400px]">
                    <TableHeader>
                      <TableRow>
                        <TableHead className="min-w-[100px]">Name</TableHead>
                        <TableHead className="min-w-[160px]">Email</TableHead>
                        <TableHead className="min-w-[80px]">Role</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {users.map((user) => (
                        <TableRow key={user.id} data-testid={`row-user-${user.id}`}>
                          <TableCell className="font-medium">{user.name || "N/A"}</TableCell>
                          <TableCell className="break-all">{user.email}</TableCell>
                          <TableCell>
                            <Badge variant={user.role === "admin" ? "default" : "secondary"}>
                              {user.role || "member"}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Photos Tab */}
        <TabsContent value="photos">
          <Card>
            <CardHeader>
              <CardTitle>Photos</CardTitle>
              <CardDescription>All photos uploaded for this site</CardDescription>
            </CardHeader>
            <CardContent>
              {photos.length === 0 ? (
                <div className="text-center py-8">
                  <Image className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
                  <p className="text-muted-foreground">No photos uploaded yet</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 sm:gap-4" data-testid="grid-photos">
                  {photos.map((photo) => (
                    <div key={photo.id} className="relative group">
                      <div className="aspect-square rounded-lg overflow-hidden bg-muted">
                        <img
                          src={photo.url}
                          alt={photo.caption || "Site photo"}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = "/placeholder.svg";
                          }}
                        />
                      </div>
                      <div className="mt-1">
                        <Badge variant="outline" className="text-xs">{photo.type || "general"}</Badge>
                        {photo.caption && (
                          <p className="text-xs text-muted-foreground mt-1 truncate">{photo.caption}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
