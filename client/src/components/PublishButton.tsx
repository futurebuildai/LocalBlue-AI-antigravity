import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Rocket, EyeOff, CheckCircle, Circle } from "lucide-react";
import { usePreview } from "@/contexts/PreviewContext";
import type { Site } from "@shared/schema";

interface PublishButtonProps {
  site: Site;
  variant?: "default" | "card";
}

export default function PublishButton({ site, variant = "default" }: PublishButtonProps) {
  const { toast } = useToast();
  const { getApiPath } = usePreview();

  const publishMutation = useMutation({
    mutationFn: async () => {
      return apiRequest("POST", getApiPath("/api/tenant/publish"));
    },
    onSuccess: (response: any) => {
      queryClient.invalidateQueries({ queryKey: [getApiPath("/api/tenant/settings")] });
      queryClient.invalidateQueries({ queryKey: [getApiPath("/api/tenant/auth/me")] });
      toast({
        title: response.isPublished ? "Site Published!" : "Site Unpublished",
        description: response.isPublished
          ? "Your site is now live and visible to customers."
          : "Your site is now in draft mode and hidden from customers.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to update publish status",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handlePublish = () => {
    publishMutation.mutate();
  };

  if (variant === "card") {
    return (
      <div className="flex items-center justify-between gap-4 p-4 border rounded-lg bg-card">
        <div className="flex items-center gap-3">
          {site.isPublished ? (
            <div className="h-10 w-10 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
              <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400" />
            </div>
          ) : (
            <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center">
              <Circle className="h-5 w-5 text-muted-foreground" />
            </div>
          )}
          <div>
            <div className="flex items-center gap-2">
              <span className="font-medium">Site Status</span>
              <Badge
                variant={site.isPublished ? "default" : "secondary"}
                data-testid="badge-publish-status"
              >
                {site.isPublished ? "Published" : "Draft"}
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground">
              {site.isPublished
                ? "Your site is live and visible to customers"
                : "Your site is hidden from customers"}
            </p>
          </div>
        </div>
        
        {site.isPublished ? (
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                variant="outline"
                disabled={publishMutation.isPending}
                data-testid="button-unpublish"
              >
                <EyeOff className="h-4 w-4 mr-2" />
                Unpublish
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Unpublish your site?</AlertDialogTitle>
                <AlertDialogDescription>
                  This will hide your site from customers. They won't be able to access it until you publish again.
                  Your data and settings will be preserved.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handlePublish} data-testid="button-confirm-unpublish">
                  Yes, Unpublish
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        ) : (
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                size="lg"
                disabled={publishMutation.isPending}
                data-testid="button-publish"
              >
                <Rocket className="h-4 w-4 mr-2" />
                {publishMutation.isPending ? "Publishing..." : "Publish Site"}
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Ready to go live?</AlertDialogTitle>
                <AlertDialogDescription>
                  Your site will be visible to everyone on the internet. Make sure you've reviewed all your content and settings before publishing.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Review First</AlertDialogCancel>
                <AlertDialogAction onClick={handlePublish} data-testid="button-confirm-publish">
                  Yes, Publish Now
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        )}
      </div>
    );
  }

  return (
    <div className="flex items-center gap-4">
      <Badge
        variant={site.isPublished ? "default" : "secondary"}
        data-testid="badge-publish-status-inline"
      >
        {site.isPublished ? "Published" : "Draft"}
      </Badge>
      
      {site.isPublished ? (
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              disabled={publishMutation.isPending}
              data-testid="button-unpublish-inline"
            >
              <EyeOff className="h-4 w-4 mr-2" />
              Unpublish
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Unpublish your site?</AlertDialogTitle>
              <AlertDialogDescription>
                This will hide your site from customers. They won't be able to access it until you publish again.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handlePublish}>Yes, Unpublish</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      ) : (
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button
              disabled={publishMutation.isPending}
              data-testid="button-publish-inline"
            >
              <Rocket className="h-4 w-4 mr-2" />
              {publishMutation.isPending ? "Publishing..." : "Publish Site"}
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Ready to go live?</AlertDialogTitle>
              <AlertDialogDescription>
                Your site will be visible to everyone. Make sure you've reviewed all your content before publishing.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Review First</AlertDialogCancel>
              <AlertDialogAction onClick={handlePublish}>Yes, Publish Now</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </div>
  );
}
