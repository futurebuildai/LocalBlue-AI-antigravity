import { useQuery, useMutation } from "@tanstack/react-query";
import { Link, useRoute } from "wouter";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, Save } from "lucide-react";
import { useForm } from "react-hook-form";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import type { Page } from "@shared/schema";

interface HomeContent {
  hero?: { headline?: string; description?: string };
  services?: string[];
  aboutText?: string;
}

interface AboutContent {
  content?: string;
  serviceArea?: string;
}

interface ServicesContent {
  services?: { name: string; description: string }[];
}

interface ContactContent {
  phone?: string;
  email?: string;
  address?: string;
  formEnabled?: boolean;
}

type PageContent = HomeContent | AboutContent | ServicesContent | ContactContent;

interface PageFormValues {
  title: string;
  heroHeadline: string;
  heroDescription: string;
  services: string;
  aboutText: string;
  content: string;
  serviceArea: string;
  phone: string;
  email: string;
  address: string;
}

function getDefaultValues(page: Page): PageFormValues {
  const content = (page.content || {}) as PageContent;
  
  switch (page.slug) {
    case "home": {
      const homeContent = content as HomeContent;
      return {
        title: page.title,
        heroHeadline: homeContent.hero?.headline || "",
        heroDescription: homeContent.hero?.description || "",
        services: (homeContent.services || []).join(", "),
        aboutText: homeContent.aboutText || "",
        content: "",
        serviceArea: "",
        phone: "",
        email: "",
        address: "",
      };
    }
    case "about": {
      const aboutContent = content as AboutContent;
      return {
        title: page.title,
        heroHeadline: "",
        heroDescription: "",
        services: "",
        aboutText: "",
        content: aboutContent.content || "",
        serviceArea: aboutContent.serviceArea || "",
        phone: "",
        email: "",
        address: "",
      };
    }
    case "services": {
      const servicesContent = content as ServicesContent;
      const servicesStr = (servicesContent.services || [])
        .map((s) => `${s.name}: ${s.description}`)
        .join("\n");
      return {
        title: page.title,
        heroHeadline: "",
        heroDescription: "",
        services: servicesStr,
        aboutText: "",
        content: "",
        serviceArea: "",
        phone: "",
        email: "",
        address: "",
      };
    }
    case "contact": {
      const contactContent = content as ContactContent;
      return {
        title: page.title,
        heroHeadline: "",
        heroDescription: "",
        services: "",
        aboutText: "",
        content: "",
        serviceArea: "",
        phone: contactContent.phone || "",
        email: contactContent.email || "",
        address: contactContent.address || "",
      };
    }
    default:
      return {
        title: page.title,
        heroHeadline: "",
        heroDescription: "",
        services: "",
        aboutText: "",
        content: JSON.stringify(content, null, 2),
        serviceArea: "",
        phone: "",
        email: "",
        address: "",
      };
  }
}

function buildContent(slug: string, values: PageFormValues): PageContent {
  switch (slug) {
    case "home":
      return {
        hero: {
          headline: values.heroHeadline,
          description: values.heroDescription,
        },
        services: values.services.split(",").map((s) => s.trim()).filter(Boolean),
        aboutText: values.aboutText,
      };
    case "about":
      return {
        content: values.content,
        serviceArea: values.serviceArea,
      };
    case "services": {
      const lines = values.services.split("\n").filter(Boolean);
      const services = lines.map((line) => {
        const [name, ...descParts] = line.split(":");
        return {
          name: name.trim(),
          description: descParts.join(":").trim(),
        };
      });
      return { services };
    }
    case "contact":
      return {
        phone: values.phone,
        email: values.email,
        address: values.address,
        formEnabled: true,
      };
    default:
      try {
        return JSON.parse(values.content || "{}");
      } catch {
        return {};
      }
  }
}

export default function PageEditor() {
  const [, params] = useRoute("/pages/:slug");
  const slug = params?.slug || "";
  const { toast } = useToast();

  const { data: page, isLoading } = useQuery<Page>({
    queryKey: ["/api/tenant/pages", slug],
  });

  const form = useForm<PageFormValues>({
    defaultValues: page ? getDefaultValues(page) : {},
  });

  const updateMutation = useMutation({
    mutationFn: async (data: PageFormValues) => {
      const content = buildContent(slug, data);
      return apiRequest("PATCH", `/api/tenant/pages/${slug}`, {
        title: data.title,
        content,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tenant/pages"] });
      queryClient.invalidateQueries({ queryKey: ["/api/tenant/pages", slug] });
      toast({ title: "Page updated successfully" });
    },
    onError: (error: Error) => {
      toast({ title: "Failed to update page", description: error.message, variant: "destructive" });
    },
  });

  const handleSubmit = (values: PageFormValues) => {
    updateMutation.mutate(values);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-muted-foreground">Loading page...</div>
      </div>
    );
  }

  if (!page) {
    return (
      <div className="space-y-6">
        <Button asChild variant="ghost" data-testid="button-back-to-pages">
          <Link href="/pages">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Pages
          </Link>
        </Button>
        <div className="flex items-center justify-center h-64">
          <div className="text-muted-foreground">Page not found</div>
        </div>
      </div>
    );
  }

  if (!form.formState.isDirty && page) {
    form.reset(getDefaultValues(page));
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button asChild variant="ghost" size="sm" data-testid="button-back-to-pages">
          <Link href="/pages">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-semibold tracking-tight" data-testid="text-page-editor-title">
            Edit {page.title}
          </h1>
          <p className="text-muted-foreground text-sm">
            /{page.slug}
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Page Content</CardTitle>
          <CardDescription>Edit the content for this page</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Page Title</FormLabel>
                    <FormControl>
                      <Input {...field} data-testid="input-page-title" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {slug === "home" && (
                <>
                  <FormField
                    control={form.control}
                    name="heroHeadline"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Hero Headline</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="Your main headline" data-testid="input-hero-headline" />
                        </FormControl>
                        <FormDescription>The main headline displayed in the hero section</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="heroDescription"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Hero Description</FormLabel>
                        <FormControl>
                          <Textarea {...field} placeholder="A brief description of your business" data-testid="input-hero-description" />
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
                          <Input {...field} placeholder="Plumbing, Electrical, HVAC" data-testid="input-home-services" />
                        </FormControl>
                        <FormDescription>Comma-separated list of services</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="aboutText"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>About Text</FormLabel>
                        <FormControl>
                          <Textarea {...field} placeholder="Brief description about your company" data-testid="input-about-text" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </>
              )}

              {slug === "about" && (
                <>
                  <FormField
                    control={form.control}
                    name="content"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>About Content</FormLabel>
                        <FormControl>
                          <Textarea {...field} className="min-h-32" placeholder="Tell visitors about your business..." data-testid="input-about-content" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="serviceArea"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Service Area</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="e.g., Greater Seattle Area" data-testid="input-service-area" />
                        </FormControl>
                        <FormDescription>Where you provide your services</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </>
              )}

              {slug === "services" && (
                <FormField
                  control={form.control}
                  name="services"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Services List</FormLabel>
                      <FormControl>
                        <Textarea 
                          {...field} 
                          className="min-h-48 font-mono text-sm" 
                          placeholder={`Plumbing: Full residential and commercial plumbing services\nElectrical: Licensed electrical work and repairs\nHVAC: Heating, cooling, and ventilation services`}
                          data-testid="input-services-list" 
                        />
                      </FormControl>
                      <FormDescription>One service per line, format: Name: Description</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              {slug === "contact" && (
                <>
                  <FormField
                    control={form.control}
                    name="phone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Phone</FormLabel>
                        <FormControl>
                          <Input {...field} type="tel" placeholder="(555) 123-4567" data-testid="input-contact-phone" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email</FormLabel>
                        <FormControl>
                          <Input {...field} type="email" placeholder="contact@example.com" data-testid="input-contact-email" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="address"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Address</FormLabel>
                        <FormControl>
                          <Textarea {...field} placeholder="123 Main St, City, State 12345" data-testid="input-contact-address" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </>
              )}

              {!["home", "about", "services", "contact"].includes(slug) && (
                <FormField
                  control={form.control}
                  name="content"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Content (JSON)</FormLabel>
                      <FormControl>
                        <Textarea {...field} className="min-h-48 font-mono text-sm" data-testid="input-json-content" />
                      </FormControl>
                      <FormDescription>Edit the raw JSON content for this page</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              <div className="flex justify-end">
                <Button type="submit" disabled={updateMutation.isPending} data-testid="button-save-page">
                  <Save className="h-4 w-4 mr-2" />
                  {updateMutation.isPending ? "Saving..." : "Save Changes"}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
