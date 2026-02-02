import { useState, useMemo } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Pencil, Trash2, ExternalLink, LogIn, Building2, Eye } from "lucide-react";
import { Link } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import type { Site, InsertSite } from "@shared/schema";

interface EnhancedSite extends Site {
  leadCount: number;
  onboardingStatus: string;
  lastActivity: string | null;
}

const siteFormSchema = z.object({
  subdomain: z.string().min(2, "Subdomain must be at least 2 characters").regex(/^[a-z0-9-]+$/, "Subdomain can only contain lowercase letters, numbers, and hyphens"),
  customDomain: z.string().optional().nullable(),
  businessName: z.string().min(1, "Business name is required"),
  brandColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/, "Must be a valid hex color"),
  services: z.string().optional(),
  isPublished: z.boolean().default(false),
});

type SiteFormValues = z.infer<typeof siteFormSchema>;

type StatusFilter = "all" | "published" | "draft" | "onboarding";

function formatOnboardingStatus(status: string): string {
  const statusMap: Record<string, string> = {
    not_started: "Not Started",
    welcome: "Welcome",
    business_basics: "Business Basics",
    trade_detection: "Trade Detection",
    services: "Services",
    story: "Story",
    differentiators: "Differentiators",
    service_area: "Service Area",
    style: "Style",
    pages: "Pages",
    photos: "Photos",
    review: "Review",
    complete: "Complete",
    completed: "Completed",
  };
  return statusMap[status] || status.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase());
}

function formatLastActivity(dateStr: string | null): string {
  if (!dateStr) return "Never";
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  
  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString();
}

export default function Sites() {
  const { toast } = useToast();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingSite, setEditingSite] = useState<EnhancedSite | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");

  const { data: sites = [], isLoading } = useQuery<EnhancedSite[]>({
    queryKey: ["/api/admin/sites/enhanced"],
  });

  const filteredSites = useMemo(() => {
    return sites.filter((site) => {
      const matchesSearch = searchQuery === "" ||
        site.businessName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        site.subdomain.toLowerCase().includes(searchQuery.toLowerCase());
      
      let matchesStatus = true;
      if (statusFilter === "published") {
        matchesStatus = site.isPublished;
      } else if (statusFilter === "draft") {
        matchesStatus = !site.isPublished;
      } else if (statusFilter === "onboarding") {
        matchesStatus = site.onboardingStatus !== "not_started" && 
                        site.onboardingStatus !== "completed" && 
                        site.onboardingStatus !== "complete";
      }
      
      return matchesSearch && matchesStatus;
    });
  }, [sites, searchQuery, statusFilter]);

  const createMutation = useMutation({
    mutationFn: async (data: InsertSite) => {
      return apiRequest("POST", "/api/admin/sites", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/sites/enhanced"] });
      setIsCreateOpen(false);
      toast({ title: "Site created successfully" });
    },
    onError: (error: Error) => {
      toast({ title: "Failed to create site", description: error.message, variant: "destructive" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<InsertSite> }) => {
      return apiRequest("PATCH", `/api/admin/sites/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/sites/enhanced"] });
      setEditingSite(null);
      toast({ title: "Site updated successfully" });
    },
    onError: (error: Error) => {
      toast({ title: "Failed to update site", description: error.message, variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiRequest("DELETE", `/api/admin/sites/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/sites/enhanced"] });
      toast({ title: "Site deleted successfully" });
    },
    onError: (error: Error) => {
      toast({ title: "Failed to delete site", description: error.message, variant: "destructive" });
    },
  });

  const impersonateMutation = useMutation({
    mutationFn: async (siteId: string) => {
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

  const handleCreate = (values: SiteFormValues) => {
    const services = values.services ? values.services.split(",").map((s) => s.trim()).filter(Boolean) : [];
    createMutation.mutate({
      subdomain: values.subdomain,
      customDomain: values.customDomain || null,
      businessName: values.businessName,
      brandColor: values.brandColor,
      services,
      isPublished: values.isPublished,
    });
  };

  const handleUpdate = (values: SiteFormValues) => {
    if (!editingSite) return;
    const services = values.services ? values.services.split(",").map((s) => s.trim()).filter(Boolean) : [];
    updateMutation.mutate({
      id: editingSite.id,
      data: {
        subdomain: values.subdomain,
        customDomain: values.customDomain || null,
        businessName: values.businessName,
        brandColor: values.brandColor,
        services,
        isPublished: values.isPublished,
      },
    });
  };

  const handleViewSite = (site: EnhancedSite) => {
    const url = `/preview/${site.subdomain}`;
    window.open(url, "_blank");
  };

  const handleLoginAsCustomer = (site: EnhancedSite) => {
    impersonateMutation.mutate(site.id);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-muted-foreground">Loading sites...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-semibold tracking-tight" data-testid="text-sites-title">Sites</h1>
          <p className="text-sm sm:text-base text-muted-foreground">Manage your tenant sites and customer accounts</p>
        </div>
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button data-testid="button-create-site" className="w-full sm:w-auto min-h-[44px]">
              <Plus className="h-4 w-4 mr-2" />
              Create Site
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md w-[calc(100%-2rem)] sm:w-full max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create New Site</DialogTitle>
              <DialogDescription>Add a new tenant site to your platform</DialogDescription>
            </DialogHeader>
            <SiteForm onSubmit={handleCreate} isLoading={createMutation.isPending} />
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
        <div className="w-full sm:flex-1 sm:max-w-sm">
          <Input
            placeholder="Search sites..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            data-testid="input-search-sites"
            className="min-h-[44px]"
          />
        </div>
        <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as StatusFilter)}>
          <SelectTrigger className="w-full sm:w-[180px] min-h-[44px]" data-testid="select-status-filter">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Sites</SelectItem>
            <SelectItem value="published">Published</SelectItem>
            <SelectItem value="draft">Draft</SelectItem>
            <SelectItem value="onboarding">Onboarding</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {filteredSites.length === 0 && sites.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-center border rounded-lg">
          <Building2 className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium">No sites yet</h3>
          <p className="text-muted-foreground text-sm mb-4">Create your first tenant site to get started</p>
          <Button onClick={() => setIsCreateOpen(true)} data-testid="button-create-first-site">
            <Plus className="h-4 w-4 mr-2" />
            Create Site
          </Button>
        </div>
      ) : filteredSites.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-center border rounded-lg">
          <p className="text-muted-foreground">No sites match your search criteria</p>
        </div>
      ) : (
        <div className="border rounded-lg overflow-x-auto">
          <Table data-testid="table-sites" className="min-w-[800px]">
            <TableHeader>
              <TableRow>
                <TableHead className="min-w-[180px]">Business Name</TableHead>
                <TableHead className="min-w-[100px]">Subdomain</TableHead>
                <TableHead className="min-w-[90px]">Status</TableHead>
                <TableHead className="min-w-[100px]">Onboarding</TableHead>
                <TableHead className="text-right min-w-[60px]">Leads</TableHead>
                <TableHead className="min-w-[100px]">Last Activity</TableHead>
                <TableHead className="text-right min-w-[150px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredSites.map((site) => (
                <TableRow key={site.id} data-testid={`row-site-${site.id}`}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div
                        className="h-8 w-8 rounded-md flex items-center justify-center text-white font-medium text-sm shrink-0"
                        style={{ backgroundColor: site.brandColor }}
                      >
                        {site.businessName.charAt(0)}
                      </div>
                      <span className="font-medium">{site.businessName}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {site.subdomain}
                  </TableCell>
                  <TableCell>
                    {site.isPublished ? (
                      <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100">
                        Published
                      </Badge>
                    ) : (
                      <Badge variant="secondary">Draft</Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    {site.onboardingStatus === "completed" || site.onboardingStatus === "complete" ? (
                      <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100">
                        Completed
                      </Badge>
                    ) : site.onboardingStatus === "not_started" ? (
                      <Badge variant="secondary">Not Started</Badge>
                    ) : (
                      <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100">
                        {formatOnboardingStatus(site.onboardingStatus)}
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-right font-medium">
                    {site.leadCount}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {formatLastActivity(site.lastActivity)}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center justify-end gap-1">
                      <Link href={`/sites/${site.id}`}>
                        <Button
                          variant="ghost"
                          size="icon"
                          title="View Details"
                          data-testid={`button-view-details-${site.id}`}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      </Link>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleViewSite(site)}
                        title="View Site"
                        data-testid={`button-view-site-${site.id}`}
                      >
                        <ExternalLink className="h-4 w-4" />
                      </Button>
                      <Dialog open={editingSite?.id === site.id} onOpenChange={(open) => !open && setEditingSite(null)}>
                        <DialogTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setEditingSite(site)}
                            title="Edit Site"
                            data-testid={`button-edit-site-${site.id}`}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-md w-[calc(100%-2rem)] sm:w-full max-h-[90vh] overflow-y-auto">
                          <DialogHeader>
                            <DialogTitle>Edit Site</DialogTitle>
                            <DialogDescription>Update site configuration</DialogDescription>
                          </DialogHeader>
                          <SiteForm 
                            onSubmit={handleUpdate} 
                            isLoading={updateMutation.isPending}
                            defaultValues={{
                              subdomain: site.subdomain,
                              customDomain: site.customDomain || "",
                              businessName: site.businessName,
                              brandColor: site.brandColor,
                              services: Array.isArray(site.services) ? site.services.join(", ") : "",
                              isPublished: site.isPublished,
                            }}
                          />
                        </DialogContent>
                      </Dialog>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleLoginAsCustomer(site)}
                        title="Login as Customer"
                        data-testid={`button-login-as-${site.id}`}
                      >
                        <LogIn className="h-4 w-4" />
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            title="Delete Site"
                            data-testid={`button-delete-site-${site.id}`}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent className="w-[calc(100%-2rem)] sm:w-full max-w-md">
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete Site</AlertDialogTitle>
                            <AlertDialogDescription>
                              Are you sure you want to delete "{site.businessName}"? This action cannot be undone.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter className="flex-col sm:flex-row gap-2">
                            <AlertDialogCancel className="min-h-[44px]">Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={() => deleteMutation.mutate(site.id)} className="min-h-[44px]">
                              Delete
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}

function SiteForm({
  onSubmit,
  isLoading,
  defaultValues,
}: {
  onSubmit: (values: SiteFormValues) => void;
  isLoading: boolean;
  defaultValues?: Partial<SiteFormValues>;
}) {
  const form = useForm<SiteFormValues>({
    resolver: zodResolver(siteFormSchema),
    defaultValues: {
      subdomain: defaultValues?.subdomain || "",
      customDomain: defaultValues?.customDomain || "",
      businessName: defaultValues?.businessName || "",
      brandColor: defaultValues?.brandColor || "#3B82F6",
      services: defaultValues?.services || "",
      isPublished: defaultValues?.isPublished || false,
    },
  });

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="businessName"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Business Name</FormLabel>
              <FormControl>
                <Input placeholder="ACME Corporation" {...field} data-testid="input-business-name" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="subdomain"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Subdomain</FormLabel>
              <FormControl>
                <div className="flex items-center">
                  <Input placeholder="acme" {...field} data-testid="input-subdomain" />
                  <span className="ml-2 text-sm text-muted-foreground">.yourplatform.com</span>
                </div>
              </FormControl>
              <FormDescription>Lowercase letters, numbers, and hyphens only</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="customDomain"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Custom Domain (Optional)</FormLabel>
              <FormControl>
                <Input placeholder="www.acme.com" {...field} value={field.value || ""} data-testid="input-custom-domain" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="brandColor"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Brand Color</FormLabel>
              <FormControl>
                <div className="flex items-center gap-2">
                  <Input type="color" className="h-9 w-14 p-1" {...field} data-testid="input-brand-color" />
                  <Input placeholder="#3B82F6" {...field} className="flex-1" />
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="services"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Services</FormLabel>
              <FormControl>
                <Input placeholder="Consulting, Development, Support" {...field} data-testid="input-services" />
              </FormControl>
              <FormDescription>Comma-separated list of services</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="isPublished"
          render={({ field }) => (
            <FormItem className="flex items-center justify-between rounded-lg border p-3">
              <div className="space-y-0.5">
                <FormLabel>Published</FormLabel>
                <FormDescription>Make this site publicly accessible</FormDescription>
              </div>
              <FormControl>
                <Switch checked={field.value} onCheckedChange={field.onChange} data-testid="switch-is-published" />
              </FormControl>
            </FormItem>
          )}
        />
        <Button type="submit" className="w-full min-h-[44px]" disabled={isLoading} data-testid="button-submit-site">
          {isLoading ? "Saving..." : defaultValues ? "Update Site" : "Create Site"}
        </Button>
      </form>
    </Form>
  );
}
