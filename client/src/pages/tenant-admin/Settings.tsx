import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Save } from "lucide-react";
import type { Site } from "@shared/schema";

const settingsSchema = z.object({
  businessName: z.string().min(1, "Business name is required"),
  brandColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/, "Must be a valid hex color"),
  services: z.string().optional(),
  customDomain: z.string().optional().nullable(),
});

type SettingsFormValues = z.infer<typeof settingsSchema>;

interface SettingsProps {
  site: Site;
}

export default function Settings({ site }: SettingsProps) {
  const { toast } = useToast();

  const form = useForm<SettingsFormValues>({
    resolver: zodResolver(settingsSchema),
    defaultValues: {
      businessName: site.businessName,
      brandColor: site.brandColor,
      services: Array.isArray(site.services) ? site.services.join(", ") : "",
      customDomain: site.customDomain || "",
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (data: SettingsFormValues) => {
      const services = data.services 
        ? data.services.split(",").map((s) => s.trim()).filter(Boolean) 
        : [];
      return apiRequest("PATCH", "/api/tenant/settings", {
        businessName: data.businessName,
        brandColor: data.brandColor,
        services,
        customDomain: data.customDomain || null,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tenant/settings"] });
      queryClient.invalidateQueries({ queryKey: ["/api/tenant/auth/me"] });
      toast({ title: "Settings updated successfully" });
    },
    onError: (error: Error) => {
      toast({ title: "Failed to update settings", description: error.message, variant: "destructive" });
    },
  });

  const handleSubmit = (values: SettingsFormValues) => {
    updateMutation.mutate(values);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight" data-testid="text-tenant-settings-title">
          Settings
        </h1>
        <p className="text-muted-foreground">
          Manage your site configuration
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Site Settings</CardTitle>
          <CardDescription>Update your site's appearance and configuration</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="businessName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Business Name</FormLabel>
                    <FormControl>
                      <Input {...field} data-testid="input-settings-business-name" />
                    </FormControl>
                    <FormDescription>
                      This will be displayed in your site's header
                    </FormDescription>
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
                      <div className="flex gap-2">
                        <Input {...field} data-testid="input-settings-brand-color" />
                        <div 
                          className="h-9 w-9 rounded-md border flex-shrink-0"
                          style={{ backgroundColor: field.value }}
                        />
                      </div>
                    </FormControl>
                    <FormDescription>
                      Your primary brand color (hex format, e.g., #3B82F6)
                    </FormDescription>
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
                      <Input 
                        placeholder="e.g., Consulting, Development, Support" 
                        {...field} 
                        value={field.value || ""}
                        data-testid="input-settings-services" 
                      />
                    </FormControl>
                    <FormDescription>
                      Comma-separated list of services you offer
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="customDomain"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Custom Domain</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="e.g., www.yourdomain.com" 
                        {...field} 
                        value={field.value || ""}
                        data-testid="input-settings-custom-domain" 
                      />
                    </FormControl>
                    <FormDescription>
                      Optional custom domain for your site
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="pt-4">
                <Button 
                  type="submit" 
                  disabled={updateMutation.isPending}
                  data-testid="button-save-settings"
                >
                  <Save className="h-4 w-4 mr-2" />
                  {updateMutation.isPending ? "Saving..." : "Save Changes"}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Current Services</CardTitle>
          <CardDescription>Services currently configured for your site</CardDescription>
        </CardHeader>
        <CardContent>
          {Array.isArray(site.services) && site.services.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {(site.services as string[]).map((service, idx) => (
                <Badge key={idx} variant="secondary" data-testid={`badge-service-${idx}`}>
                  {service}
                </Badge>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No services configured</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
