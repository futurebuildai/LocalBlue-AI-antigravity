import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Plus, Pencil, Trash2, Globe, Building2 } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import type { Site, InsertSite } from "@shared/schema";

const siteFormSchema = z.object({
  subdomain: z.string().min(2, "Subdomain must be at least 2 characters").regex(/^[a-z0-9-]+$/, "Subdomain can only contain lowercase letters, numbers, and hyphens"),
  customDomain: z.string().optional().nullable(),
  businessName: z.string().min(1, "Business name is required"),
  brandColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/, "Must be a valid hex color"),
  services: z.string().optional(),
  isPublished: z.boolean().default(false),
});

type SiteFormValues = z.infer<typeof siteFormSchema>;

export default function Sites() {
  const { toast } = useToast();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingSite, setEditingSite] = useState<Site | null>(null);

  const { data: sites = [], isLoading } = useQuery<Site[]>({
    queryKey: ["/api/admin/sites"],
  });

  const createMutation = useMutation({
    mutationFn: async (data: InsertSite) => {
      return apiRequest("POST", "/api/admin/sites", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/sites"] });
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
      queryClient.invalidateQueries({ queryKey: ["/api/admin/sites"] });
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
      queryClient.invalidateQueries({ queryKey: ["/api/admin/sites"] });
      toast({ title: "Site deleted successfully" });
    },
    onError: (error: Error) => {
      toast({ title: "Failed to delete site", description: error.message, variant: "destructive" });
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

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-muted-foreground">Loading sites...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight" data-testid="text-sites-title">Sites</h1>
          <p className="text-muted-foreground">Manage your tenant sites</p>
        </div>
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button data-testid="button-create-site">
              <Plus className="h-4 w-4 mr-2" />
              Create Site
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Create New Site</DialogTitle>
              <DialogDescription>Add a new tenant site to your platform</DialogDescription>
            </DialogHeader>
            <SiteForm onSubmit={handleCreate} isLoading={createMutation.isPending} />
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {sites.map((site) => (
          <Card key={site.id} data-testid={`card-site-${site.id}`}>
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-3">
                  <div
                    className="h-10 w-10 rounded-md flex items-center justify-center text-white font-medium"
                    style={{ backgroundColor: site.brandColor }}
                  >
                    {site.businessName.charAt(0)}
                  </div>
                  <div>
                    <CardTitle className="text-base">{site.businessName}</CardTitle>
                    <CardDescription className="flex items-center gap-1">
                      <Globe className="h-3 w-3" />
                      {site.subdomain}.yourplatform.com
                    </CardDescription>
                  </div>
                </div>
                <Badge variant={site.isPublished ? "default" : "secondary"}>
                  {site.isPublished ? "Published" : "Draft"}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {site.customDomain && (
                <div className="text-sm">
                  <span className="text-muted-foreground">Custom Domain: </span>
                  <span className="font-medium">{site.customDomain}</span>
                </div>
              )}
              {site.services && Array.isArray(site.services) && site.services.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {(site.services as string[]).slice(0, 3).map((service, idx) => (
                    <Badge key={idx} variant="secondary" className="text-xs">
                      {service}
                    </Badge>
                  ))}
                  {(site.services as string[]).length > 3 && (
                    <Badge variant="secondary" className="text-xs">
                      +{(site.services as string[]).length - 3}
                    </Badge>
                  )}
                </div>
              )}
              <div className="flex items-center gap-2 pt-2">
                <Dialog open={editingSite?.id === site.id} onOpenChange={(open) => !open && setEditingSite(null)}>
                  <DialogTrigger asChild>
                    <Button variant="outline" size="sm" onClick={() => setEditingSite(site)} data-testid={`button-edit-site-${site.id}`}>
                      <Pencil className="h-3 w-3 mr-1" />
                      Edit
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-md">
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
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="outline" size="sm" data-testid={`button-delete-site-${site.id}`}>
                      <Trash2 className="h-3 w-3 mr-1" />
                      Delete
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Delete Site</AlertDialogTitle>
                      <AlertDialogDescription>
                        Are you sure you want to delete "{site.businessName}"? This action cannot be undone.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction onClick={() => deleteMutation.mutate(site.id)}>
                        Delete
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </CardContent>
          </Card>
        ))}
        {sites.length === 0 && (
          <div className="col-span-full flex flex-col items-center justify-center py-12 text-center">
            <Building2 className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium">No sites yet</h3>
            <p className="text-muted-foreground text-sm mb-4">Create your first tenant site to get started</p>
            <Button onClick={() => setIsCreateOpen(true)} data-testid="button-create-first-site">
              <Plus className="h-4 w-4 mr-2" />
              Create Site
            </Button>
          </div>
        )}
      </div>
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
        <Button type="submit" className="w-full" disabled={isLoading} data-testid="button-submit-site">
          {isLoading ? "Saving..." : defaultValues ? "Update Site" : "Create Site"}
        </Button>
      </form>
    </Form>
  );
}
