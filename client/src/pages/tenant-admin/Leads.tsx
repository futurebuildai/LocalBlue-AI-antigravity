import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Mail, Phone, MessageSquare, Calendar, Reply } from "lucide-react";
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

  const formatShortDate = (date: string | Date) => {
    return new Date(date).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-xl sm:text-2xl font-semibold tracking-tight" data-testid="text-tenant-leads-title">
            Leads
          </h1>
          <p className="text-sm sm:text-base text-muted-foreground">Contact form submissions from your website</p>
        </div>
        <Badge variant="secondary" className="text-sm" data-testid="text-leads-count">
          {leads.length} {leads.length === 1 ? "lead" : "leads"}
        </Badge>
      </div>

      <Card>
        <CardHeader className="pb-3 sm:pb-6">
          <CardTitle className="text-base sm:text-lg">All Leads</CardTitle>
          <CardDescription className="text-sm">View and manage leads submitted through your contact form</CardDescription>
        </CardHeader>
        <CardContent className="p-3 sm:p-6 pt-0 sm:pt-0">
          {leads.length > 0 ? (
            <div className="space-y-3">
              {leads.map((lead) => (
                <div
                  key={lead.id}
                  className="p-3 sm:p-4 rounded-lg border bg-card"
                  data-testid={`row-lead-${lead.id}`}
                >
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-medium" data-testid={`text-lead-name-${lead.id}`}>
                          {lead.name}
                        </span>
                        <Badge variant="outline" className="text-xs">
                          <Calendar className="h-3 w-3 mr-1" />
                          <span className="hidden sm:inline" data-testid={`text-lead-date-${lead.id}`}>
                            {formatDate(lead.createdAt)}
                          </span>
                          <span className="sm:hidden">
                            {formatShortDate(lead.createdAt)}
                          </span>
                        </Badge>
                      </div>
                    </div>
                    <Button 
                      variant="outline" 
                      size="sm"
                      className="min-h-[44px] min-w-[44px] sm:min-w-0"
                      onClick={() => window.location.href = `mailto:${lead.email}`}
                      data-testid={`button-reply-lead-${lead.id}`}
                    >
                      <Reply className="h-4 w-4 sm:mr-2" />
                      <span className="hidden sm:inline">Reply</span>
                    </Button>
                  </div>
                  
                  <div className="space-y-1.5 text-sm">
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                      <a 
                        href={`mailto:${lead.email}`} 
                        className="text-primary hover:underline truncate"
                        data-testid={`text-lead-email-${lead.id}`}
                      >
                        {lead.email}
                      </a>
                    </div>
                    {lead.phone && (
                      <div className="flex items-center gap-2">
                        <Phone className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                        <a 
                          href={`tel:${lead.phone}`}
                          className="text-muted-foreground hover:underline"
                          data-testid={`text-lead-phone-${lead.id}`}
                        >
                          {lead.phone}
                        </a>
                      </div>
                    )}
                    {lead.message && (
                      <div className="mt-2 pt-2 border-t">
                        <p 
                          className="text-sm text-muted-foreground"
                          data-testid={`text-lead-message-${lead.id}`}
                        >
                          {lead.message}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
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
