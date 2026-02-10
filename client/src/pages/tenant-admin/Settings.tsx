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
import DomainSetup from "@/components/DomainSetup";
import PublishButton from "@/components/PublishButton";
import { usePreview } from "@/contexts/PreviewContext";
import type { Site } from "@shared/schema";

const settingsSchema = z.object({
  businessName: z.string().min(1, "Business name is required"),
  brandColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/, "Must be a valid hex color"),
  services: z.string().optional(),
});

type SettingsFormValues = z.infer<typeof settingsSchema>;

interface SettingsProps {
  site: Site;
}

export default function Settings({ site }: SettingsProps) {
  const { toast } = useToast();
  const { getApiPath } = usePreview();

  const form = useForm<SettingsFormValues>({
    resolver: zodResolver(settingsSchema),
    defaultValues: {
      businessName: site.businessName,
      brandColor: site.brandColor,
      services: Array.isArray(site.services) ? site.services.join(", ") : "",
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (data: SettingsFormValues) => {
      const services = data.services 
        ? data.services.split(",").map((s) => s.trim()).filter(Boolean) 
        : [];
      return apiRequest("PATCH", getApiPath("/api/tenant/settings"), {
        businessName: data.businessName,
        brandColor: data.brandColor,
        services,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [getApiPath("/api/tenant/settings")] });
      queryClient.invalidateQueries({ queryKey: [getApiPath("/api/tenant/auth/me")] });
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
    <div className="space-y-4 sm:space-y-6">
      <div>
        <h1 className="text-xl sm:text-2xl font-semibold tracking-tight" data-testid="text-tenant-settings-title">
          Settings
        </h1>
        <p className="text-sm sm:text-base text-muted-foreground">
          Manage your site configuration
        </p>
      </div>

      <Card>
        <CardHeader className="pb-3 sm:pb-6">
          <CardTitle className="text-base sm:text-lg">Publishing</CardTitle>
          <CardDescription className="text-sm">Control when your site goes live</CardDescription>
        </CardHeader>
        <CardContent className="p-3 sm:p-6 pt-0 sm:pt-0">
          <PublishButton site={site} variant="card" />
        </CardContent>
      </Card>

      <DomainSetup site={site} />

      <Card>
        <CardHeader className="pb-3 sm:pb-6">
          <CardTitle className="text-base sm:text-lg">Brand Settings</CardTitle>
          <CardDescription className="text-sm">Update your site's appearance and configuration</CardDescription>
        </CardHeader>
        <CardContent className="p-3 sm:p-6 pt-0 sm:pt-0">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4 sm:space-y-6">
              <FormField
                control={form.control}
                name="businessName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Business Name</FormLabel>
                    <FormControl>
                      <Input className="min-h-[44px]" {...field} data-testid="input-settings-business-name" />
                    </FormControl>
                    <FormDescription className="text-xs sm:text-sm">
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
                        <Input className="min-h-[44px] flex-1" {...field} data-testid="input-settings-brand-color" />
                        <div 
                          className="h-11 w-11 rounded-md border flex-shrink-0"
                          style={{ backgroundColor: field.value }}
                        />
                      </div>
                    </FormControl>
                    <FormDescription className="text-xs sm:text-sm">
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
                        className="min-h-[44px]"
                        {...field} 
                        value={field.value || ""}
                        data-testid="input-settings-services" 
                      />
                    </FormControl>
                    <FormDescription className="text-xs sm:text-sm">
                      Comma-separated list of services you offer
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="pt-2">
                <Button 
                  type="submit" 
                  className="min-h-[44px] w-full sm:w-auto"
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
        <CardHeader className="pb-3 sm:pb-6">
          <CardTitle className="text-base sm:text-lg">Current Services</CardTitle>
          <CardDescription className="text-sm">Services currently configured for your site</CardDescription>
        </CardHeader>
        <CardContent className="p-3 sm:p-6 pt-0 sm:pt-0">
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
