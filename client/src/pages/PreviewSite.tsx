import { useQuery } from "@tanstack/react-query";
import { useParams, Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, ExternalLink, Eye } from "lucide-react";
import PublicSite from "./PublicSite";
import type { Site } from "@shared/schema";

export default function PreviewSite() {
  const { subdomain } = useParams<{ subdomain: string }>();

  const { data: site, isLoading, error } = useQuery<Site>({
    queryKey: ["/api/preview", subdomain],
    queryFn: async () => {
      const response = await fetch(`/api/preview/${subdomain}`);
      if (!response.ok) {
        throw new Error("Site not found");
      }
      return response.json();
    },
    enabled: !!subdomain,
  });

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-muted-foreground" data-testid="text-loading">Loading preview...</div>
      </div>
    );
  }

  if (error || !site) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background px-4">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4" data-testid="text-error-title">Site Not Found</h1>
          <p className="text-muted-foreground mb-6">
            The site you're looking for doesn't exist or hasn't been configured yet.
          </p>
          <Link href="/">
            <Button data-testid="button-back-home">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Home
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <div className="bg-blue-600 text-white py-2 px-4 flex items-center justify-between sticky top-0 z-50">
        <div className="flex items-center gap-3">
          <Eye className="h-4 w-4" />
          <span className="text-sm font-medium">Preview Mode</span>
          <Badge variant="secondary" className="text-xs">
            {site.isPublished ? "Published" : "Draft"}
          </Badge>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm opacity-80">{site.businessName}</span>
          <Link href="/">
            <Button size="sm" variant="secondary" data-testid="button-back-dashboard">
              <ArrowLeft className="h-3 w-3 mr-1" />
              Back
            </Button>
          </Link>
        </div>
      </div>
      <PublicSite site={site} isPreview />
    </div>
  );
}
