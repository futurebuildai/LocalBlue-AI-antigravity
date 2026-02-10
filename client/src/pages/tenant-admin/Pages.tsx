import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileText, ChevronRight } from "lucide-react";
import { usePreview } from "@/contexts/PreviewContext";
import type { Page } from "@shared/schema";

export default function Pages() {
  const { getApiPath } = usePreview();
  const { data: pages = [], isLoading } = useQuery<Page[]>({
    queryKey: [getApiPath("/api/tenant/pages")],
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-muted-foreground">Loading pages...</div>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      <div>
        <h1 className="text-xl sm:text-2xl font-semibold tracking-tight" data-testid="text-tenant-pages-title">
          Pages
        </h1>
        <p className="text-sm sm:text-base text-muted-foreground">Manage your website content</p>
      </div>

      <Card>
        <CardHeader className="pb-3 sm:pb-6">
          <CardTitle className="text-base sm:text-lg">Site Pages</CardTitle>
          <CardDescription className="text-sm">Click on a page to edit its content</CardDescription>
        </CardHeader>
        <CardContent className="p-3 sm:p-6 pt-0 sm:pt-0">
          {pages.length > 0 ? (
            <div className="space-y-2 sm:space-y-3">
              {pages.map((page) => (
                <Link key={page.id} href={`/pages/${page.slug}`}>
                  <div 
                    className="flex items-center justify-between gap-3 p-3 sm:p-4 rounded-lg border bg-card hover-elevate cursor-pointer min-h-[56px]"
                    data-testid={`row-page-${page.slug}`}
                  >
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted flex-shrink-0">
                        <FileText className="h-5 w-5 text-muted-foreground" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <span className="font-medium block truncate" data-testid={`text-page-title-${page.slug}`}>
                          {page.title}
                        </span>
                        <code className="text-xs sm:text-sm text-muted-foreground" data-testid={`text-page-slug-${page.slug}`}>
                          /{page.slug}
                        </code>
                      </div>
                    </div>
                    <Button variant="ghost" size="icon" className="h-10 w-10 flex-shrink-0" data-testid={`button-edit-page-${page.slug}`}>
                      <ChevronRight className="h-5 w-5" />
                    </Button>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <FileText className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium">No pages yet</h3>
              <p className="text-muted-foreground text-sm">
                Pages will be created when your site is generated
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
