import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { FileText, ChevronRight } from "lucide-react";
import type { Page } from "@shared/schema";

export default function Pages() {
  const { data: pages = [], isLoading } = useQuery<Page[]>({
    queryKey: ["/api/tenant/pages"],
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-muted-foreground">Loading pages...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight" data-testid="text-tenant-pages-title">
          Pages
        </h1>
        <p className="text-muted-foreground">Manage your website content</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Site Pages</CardTitle>
          <CardDescription>Click on a page to edit its content</CardDescription>
        </CardHeader>
        <CardContent>
          {pages.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead>Slug</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pages.map((page) => (
                  <TableRow key={page.id} data-testid={`row-page-${page.slug}`}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium" data-testid={`text-page-title-${page.slug}`}>
                          {page.title}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <code className="text-sm text-muted-foreground" data-testid={`text-page-slug-${page.slug}`}>
                        /{page.slug}
                      </code>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button asChild variant="ghost" size="sm" data-testid={`button-edit-page-${page.slug}`}>
                        <Link href={`/pages/${page.slug}`}>
                          Edit
                          <ChevronRight className="h-4 w-4 ml-1" />
                        </Link>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
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
