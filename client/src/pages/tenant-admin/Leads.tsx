import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Mail, Phone, MessageSquare, Calendar } from "lucide-react";
import type { Lead } from "@shared/schema";

export default function Leads() {
  const { data: leads = [], isLoading } = useQuery<Lead[]>({
    queryKey: ["/api/tenant/leads"],
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-muted-foreground">Loading leads...</div>
      </div>
    );
  }

  const formatDate = (date: string | Date) => {
    return new Date(date).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight" data-testid="text-tenant-leads-title">
            Leads
          </h1>
          <p className="text-muted-foreground">Contact form submissions from your website</p>
        </div>
        <Badge variant="secondary" data-testid="text-leads-count">
          {leads.length} {leads.length === 1 ? "lead" : "leads"}
        </Badge>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Leads</CardTitle>
          <CardDescription>View and manage leads submitted through your contact form</CardDescription>
        </CardHeader>
        <CardContent>
          {leads.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>Message</TableHead>
                  <TableHead>Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {leads.map((lead) => (
                  <TableRow key={lead.id} data-testid={`row-lead-${lead.id}`}>
                    <TableCell>
                      <span className="font-medium" data-testid={`text-lead-name-${lead.id}`}>
                        {lead.name}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <div className="flex items-center gap-1 text-sm">
                          <Mail className="h-3 w-3 text-muted-foreground" />
                          <a 
                            href={`mailto:${lead.email}`} 
                            className="text-primary hover:underline"
                            data-testid={`text-lead-email-${lead.id}`}
                          >
                            {lead.email}
                          </a>
                        </div>
                        {lead.phone && (
                          <div className="flex items-center gap-1 text-sm text-muted-foreground">
                            <Phone className="h-3 w-3" />
                            <a 
                              href={`tel:${lead.phone}`}
                              className="hover:underline"
                              data-testid={`text-lead-phone-${lead.id}`}
                            >
                              {lead.phone}
                            </a>
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <p 
                        className="text-sm text-muted-foreground max-w-xs truncate" 
                        title={lead.message || undefined}
                        data-testid={`text-lead-message-${lead.id}`}
                      >
                        {lead.message || "-"}
                      </p>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1 text-sm text-muted-foreground">
                        <Calendar className="h-3 w-3" />
                        <span data-testid={`text-lead-date-${lead.id}`}>
                          {formatDate(lead.createdAt)}
                        </span>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <MessageSquare className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium">No leads yet</h3>
              <p className="text-muted-foreground text-sm">
                Leads will appear here when visitors submit your contact form
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
