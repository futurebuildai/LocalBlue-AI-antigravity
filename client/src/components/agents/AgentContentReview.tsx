import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Check, X, FileText, Loader2, Send, Mail } from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { usePreview } from "@/contexts/PreviewContext";
import { ContentDiffView } from "./ContentDiffView";

interface GeneratedContentItem {
  id: number;
  agentType: string;
  contentType: string;
  targetPage: string | null;
  title: string;
  content: Record<string, any>;
  currentContent: Record<string, any>;
  status: string;
  createdAt: string;
}

const AGENT_NAMES: Record<string, string> = {
  lead_scorer: "Lead Scorer",
  content_optimizer: "Content Optimizer",
  seo_agent: "SEO Agent",
  bid_advisor: "Bid Advisor",
  outreach_agent: "Outreach Agent",
  analytics_insights: "Analytics Insights",
};

const contentTypeLabels: Record<string, string> = {
  page_update: "Page Update",
  blog_post: "Blog Post",
  meta_description: "Meta Description",
  bid_proposal: "Bid Proposal",
  outreach_email: "Outreach Email",
  insight: "Insight",
};

interface AgentContentReviewProps {
  items: GeneratedContentItem[];
}

export function AgentContentReview({ items }: AgentContentReviewProps) {
  const pendingItems = items.filter(i => i.status === "pending_review");
  const sendableItems = items.filter(i => i.contentType === "outreach_email" && i.status === "approved");

  if (pendingItems.length === 0 && sendableItems.length === 0) {
    return (
      <p className="text-sm text-muted-foreground text-center py-4">No items pending review</p>
    );
  }

  return (
    <div className="space-y-3">
      {pendingItems.map((item) => (
        <ContentReviewCard key={item.id} item={item} />
      ))}
      {sendableItems.length > 0 && (
        <>
          {pendingItems.length > 0 && (
            <p className="text-xs font-medium text-muted-foreground pt-2">Ready to Send</p>
          )}
          {sendableItems.map((item) => (
            <OutreachSendCard key={item.id} item={item} />
          ))}
        </>
      )}
    </div>
  );
}

function ContentReviewCard({ item }: { item: GeneratedContentItem }) {
  const { toast } = useToast();
  const { getApiPath } = usePreview();

  const approveMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", getApiPath(`/api/tenant/agents/content/${item.id}/approve`));
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "Content approved" });
      queryClient.invalidateQueries({ queryKey: [getApiPath("/api/tenant/agents/content")] });
      queryClient.invalidateQueries({ queryKey: [getApiPath("/api/tenant/agents/activity")] });
    },
    onError: () => {
      toast({ title: "Failed to approve", variant: "destructive" });
    },
  });

  const rejectMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", getApiPath(`/api/tenant/agents/content/${item.id}/reject`));
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "Content rejected" });
      queryClient.invalidateQueries({ queryKey: [getApiPath("/api/tenant/agents/content")] });
    },
    onError: () => {
      toast({ title: "Failed to reject", variant: "destructive" });
    },
  });

  const isPending = approveMutation.isPending || rejectMutation.isPending;

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium">{item.title}</CardTitle>
          <div className="flex items-center gap-1">
            <Badge variant="outline" className="text-xs">
              {AGENT_NAMES[item.agentType] || item.agentType}
            </Badge>
            <Badge variant="secondary" className="text-xs">
              {contentTypeLabels[item.contentType] || item.contentType}
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {item.targetPage && (
          <div className="flex items-center gap-1 text-xs text-muted-foreground mb-2">
            <FileText className="h-3 w-3" />
            <span>Page: {item.targetPage}</span>
          </div>
        )}

        {/* Content diff for page updates and meta descriptions */}
        {(item.contentType === "page_update" || item.contentType === "meta_description") && (
          <div className="mb-3">
            <ContentDiffView
              title=""
              contentType={item.contentType}
              targetPage={item.targetPage}
              currentContent={item.currentContent}
              proposedContent={item.content}
            />
          </div>
        )}

        {/* Show summary for insights */}
        {item.contentType === "insight" && item.content?.headline && (
          <div className="mb-3 space-y-1">
            <p className="text-sm font-medium">{item.content.headline}</p>
            {item.content.highlights && (
              <ul className="text-xs text-muted-foreground space-y-0.5">
                {(item.content.highlights as string[]).slice(0, 3).map((h: string, i: number) => (
                  <li key={i}>• {h}</li>
                ))}
              </ul>
            )}
          </div>
        )}

        {item.contentType === "bid_proposal" && item.content?.recommendedTotalCents && (
          <p className="text-sm mb-3">
            Recommended bid: <strong>${(item.content.recommendedTotalCents / 100).toLocaleString()}</strong>
          </p>
        )}

        {item.contentType === "outreach_email" && item.content?.subject && (
          <div className="mb-3 space-y-2 text-sm">
            <div className="flex items-center gap-1 text-muted-foreground">
              <Mail className="h-3 w-3" />
              <span className="font-medium">Subject:</span> {item.content.subject}
            </div>
            <div className="bg-muted/50 rounded-md p-3 text-xs whitespace-pre-wrap max-h-32 overflow-y-auto">
              {item.content.body}
            </div>
            {item.content.targetType && (
              <Badge variant="outline" className="text-xs">
                {item.content.targetType === "residential_gc" ? "Residential GC" :
                 item.content.targetType === "commercial_builder" ? "Commercial Builder" :
                 "Follow-up"}
              </Badge>
            )}
          </div>
        )}

        <div className="flex gap-2">
          <Button
            variant="default"
            size="sm"
            onClick={() => approveMutation.mutate()}
            disabled={isPending}
          >
            {approveMutation.isPending ? <Loader2 className="h-3 w-3 mr-1 animate-spin" /> : <Check className="h-3 w-3 mr-1" />}
            Approve
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => rejectMutation.mutate()}
            disabled={isPending}
          >
            {rejectMutation.isPending ? <Loader2 className="h-3 w-3 mr-1 animate-spin" /> : <X className="h-3 w-3 mr-1" />}
            Reject
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function OutreachSendCard({ item }: { item: GeneratedContentItem }) {
  const { toast } = useToast();
  const { getApiPath } = usePreview();
  const [showSendDialog, setShowSendDialog] = useState(false);
  const [recipientName, setRecipientName] = useState("");
  const [recipientEmail, setRecipientEmail] = useState("");
  const [recipientCompany, setRecipientCompany] = useState("");

  const sendMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", getApiPath(`/api/tenant/agents/content/${item.id}/send`), {
        recipientName,
        recipientEmail,
        recipientCompany: recipientCompany || undefined,
      });
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "Email sent", description: `Outreach email sent to ${recipientEmail}` });
      setShowSendDialog(false);
      setRecipientName("");
      setRecipientEmail("");
      setRecipientCompany("");
      queryClient.invalidateQueries({ queryKey: [getApiPath("/api/tenant/agents/content")] });
      queryClient.invalidateQueries({ queryKey: [getApiPath("/api/tenant/agents/activity")] });
    },
    onError: () => {
      toast({ title: "Failed to send email", variant: "destructive" });
    },
  });

  const filledSubject = (item.content?.subject || item.title)
    .replace(/\{builder_name\}/gi, recipientName || "{builder_name}")
    .replace(/\{builder_company\}/gi, recipientCompany || recipientName || "{builder_company}");

  return (
    <>
      <Card className="border-green-200 bg-green-50/30">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-medium">{item.title}</CardTitle>
            <Badge variant="default" className="text-xs bg-green-600">Approved</Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 mb-3 text-sm">
            <div className="flex items-center gap-1 text-muted-foreground">
              <Mail className="h-3 w-3" />
              <span className="font-medium">Subject:</span> {item.content?.subject}
            </div>
            <div className="bg-white rounded-md p-3 text-xs whitespace-pre-wrap max-h-24 overflow-y-auto border">
              {item.content?.body}
            </div>
          </div>
          <Button
            size="sm"
            onClick={() => setShowSendDialog(true)}
          >
            <Send className="h-3 w-3 mr-1" />
            Send to Recipient
          </Button>
        </CardContent>
      </Card>

      <Dialog open={showSendDialog} onOpenChange={setShowSendDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Send Outreach Email</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="recipientName">Recipient Name *</Label>
              <Input
                id="recipientName"
                placeholder="e.g. John Smith"
                value={recipientName}
                onChange={(e) => setRecipientName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="recipientEmail">Recipient Email *</Label>
              <Input
                id="recipientEmail"
                type="email"
                placeholder="e.g. john@smithconstruction.com"
                value={recipientEmail}
                onChange={(e) => setRecipientEmail(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="recipientCompany">Company (optional)</Label>
              <Input
                id="recipientCompany"
                placeholder="e.g. Smith Construction"
                value={recipientCompany}
                onChange={(e) => setRecipientCompany(e.target.value)}
              />
            </div>
            {recipientName && (
              <div className="bg-muted/50 rounded-md p-3 text-xs">
                <p className="font-medium mb-1">Preview subject: {filledSubject}</p>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowSendDialog(false)}>Cancel</Button>
            <Button
              onClick={() => sendMutation.mutate()}
              disabled={!recipientName || !recipientEmail || sendMutation.isPending}
            >
              {sendMutation.isPending ? (
                <Loader2 className="h-3 w-3 mr-1 animate-spin" />
              ) : (
                <Send className="h-3 w-3 mr-1" />
              )}
              Send Email
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
