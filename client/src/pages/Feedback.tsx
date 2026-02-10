import { useState, useCallback } from "react";
import { useParams, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Loader2, Sparkles, CheckCircle, Type, Palette, FileText, LayoutGrid, ArrowRight, RefreshCw } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { usePreview } from "@/contexts/PreviewContext";
import PublicSite from "./PublicSite";
import type { Site } from "@shared/schema";

const QUICK_FEEDBACK = [
  { label: "Change headline", icon: Type, sections: ["hero"], prompt: "I'd like a different hero headline and subheadline that better represents my business." },
  { label: "Update colors", icon: Palette, sections: [], prompt: "I'd like to try different brand colors. Suggest something more modern and appealing for my trade." },
  { label: "Revise about section", icon: FileText, sections: ["about"], prompt: "Please revise the about section to be more compelling and personal." },
  { label: "Different services layout", icon: LayoutGrid, sections: ["services"], prompt: "I'd like the services section content reorganized with better descriptions." },
];

export default function Feedback() {
  const { subdomain } = useParams<{ subdomain: string }>();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { getSitePath } = usePreview();
  const [feedbackText, setFeedbackText] = useState("");
  const [selectedSections, setSelectedSections] = useState<string[]>([]);
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [regenerationCount, setRegenerationCount] = useState(0);

  const { data: site, isLoading, error, refetch } = useQuery<Site>({
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

  const handleQuickFeedback = useCallback((prompt: string, sections: string[]) => {
    setFeedbackText(prev => {
      if (prev.trim()) return prev + "\n" + prompt;
      return prompt;
    });
    setSelectedSections(prev => {
      const combined = new Set([...prev, ...sections]);
      return Array.from(combined);
    });
  }, []);

  const handleRegenerate = useCallback(async () => {
    if (!feedbackText.trim()) {
      toast({ title: "Please enter feedback", description: "Tell us what you'd like to change about your site.", variant: "destructive" });
      return;
    }

    setIsRegenerating(true);
    try {
      const response = await apiRequest("POST", getSitePath("/api/site/feedback"), {
        feedback: feedbackText.trim(),
        sections: selectedSections.length > 0 ? selectedSections : undefined,
      });

      const data = await response.json();

      if (data.success) {
        setRegenerationCount(prev => prev + 1);
        setFeedbackText("");
        setSelectedSections([]);
        queryClient.invalidateQueries({ queryKey: ["/api/preview", subdomain] });
        await refetch();
        toast({ title: "Site updated!", description: `Updated ${data.updatedSlugs?.length || 0} page(s) based on your feedback.` });
      } else {
        throw new Error(data.error || "Failed to regenerate");
      }
    } catch (err: any) {
      toast({ title: "Regeneration failed", description: err.message || "Something went wrong. Please try again.", variant: "destructive" });
    } finally {
      setIsRegenerating(false);
    }
  }, [feedbackText, selectedSections, subdomain, refetch, toast]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4" data-testid="loading-feedback">
          <div className="relative h-12 w-12">
            <div className="absolute inset-0 rounded-full border-4 border-primary/20"></div>
            <div className="absolute inset-0 rounded-full border-4 border-primary border-t-transparent animate-spin"></div>
          </div>
          <p className="text-muted-foreground text-sm animate-pulse">Loading your site preview...</p>
        </div>
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
          <Button onClick={() => setLocation("/")} data-testid="button-back-home">
            Back to Home
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col lg:flex-row">
      <div className="lg:w-[65%] w-full lg:h-screen lg:overflow-y-auto border-b lg:border-b-0 lg:border-r border-border">
        <div className="bg-muted/50 border-b px-4 py-2 flex flex-wrap items-center justify-between gap-2 sticky top-0 z-40">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="secondary" className="text-xs">Preview</Badge>
            <span className="text-sm font-medium text-foreground">{site.businessName}</span>
          </div>
          {regenerationCount > 0 && (
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <RefreshCw className="h-3 w-3" />
              <span>{regenerationCount} revision{regenerationCount !== 1 ? "s" : ""}</span>
            </div>
          )}
        </div>
        <PublicSite key={regenerationCount} site={site} isPreview />
      </div>

      <div className="lg:w-[35%] w-full lg:h-screen lg:overflow-y-auto bg-background">
        <div className="p-6 flex flex-col gap-6">
          <div>
            <h2 className="text-xl font-bold text-foreground mb-1" data-testid="text-feedback-heading">
              How does your site look?
            </h2>
            <p className="text-sm text-muted-foreground">
              Review your site and let us know what to change. Our AI will regenerate the content based on your feedback.
            </p>
          </div>

          <div>
            <p className="text-sm font-medium text-foreground mb-3">Quick suggestions</p>
            <div className="flex flex-wrap gap-2">
              {QUICK_FEEDBACK.map((item) => (
                <Button
                  key={item.label}
                  variant="outline"
                  size="sm"
                  onClick={() => handleQuickFeedback(item.prompt, item.sections)}
                  disabled={isRegenerating}
                  data-testid={`button-quick-${item.label.toLowerCase().replace(/\s+/g, "-")}`}
                >
                  <item.icon className="h-3.5 w-3.5 mr-1.5" />
                  {item.label}
                </Button>
              ))}
            </div>
          </div>

          <div>
            <label htmlFor="feedback-textarea" className="text-sm font-medium text-foreground mb-2 block">
              Your feedback
            </label>
            <Textarea
              id="feedback-textarea"
              placeholder="Tell us what you'd like to change... e.g., 'Make the headline more catchy', 'Add more detail to the services section', 'The about section should mention my 15 years of experience'"
              value={feedbackText}
              onChange={(e) => setFeedbackText(e.target.value)}
              className="min-h-[120px] resize-none"
              disabled={isRegenerating}
              data-testid="textarea-feedback"
            />
          </div>

          {selectedSections.length > 0 && (
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-xs text-muted-foreground">Targeting:</span>
              {selectedSections.map((section) => (
                <Badge key={section} variant="secondary" className="text-xs">
                  {section}
                </Badge>
              ))}
            </div>
          )}

          <div className="flex flex-col gap-3">
            <Button
              onClick={handleRegenerate}
              disabled={isRegenerating || !feedbackText.trim()}
              data-testid="button-regenerate"
            >
              {isRegenerating ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Regenerating...
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4 mr-2" />
                  Regenerate
                </>
              )}
            </Button>

            <Button
              variant="outline"
              onClick={() => setLocation(`/preview/${subdomain}/admin`)}
              disabled={isRegenerating}
              data-testid="button-publish"
            >
              <CheckCircle className="h-4 w-4 mr-2" />
              Looks Great! Publish
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </div>

          {regenerationCount > 0 && (
            <p className="text-xs text-muted-foreground text-center">
              You can regenerate as many times as you'd like until you're happy with the result.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}