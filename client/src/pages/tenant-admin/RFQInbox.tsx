import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Inbox, ArrowLeft, Send, Clock, CheckCircle, XCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { usePreview } from "@/contexts/PreviewContext";

interface ScopeItem {
  item: string;
  quantity: number;
  unit: string;
}

interface Bid {
  id: number;
  totalAmountCents: number;
  laborCostCents: number | null;
  notes: string | null;
  estimatedDays: number | null;
  status: string;
  submittedAt: string | null;
}

interface RFQ {
  id: number;
  siteId: string;
  externalRfqId: string;
  builderName: string;
  projectName: string;
  projectAddress: string | null;
  phaseDescription: string;
  scopeItems: ScopeItem[];
  startDate: string | null;
  status: string;
  expiresAt: string | null;
  createdAt: string;
  bid?: Bid | null;
}

const statusColors: Record<string, string> = {
  pending: "bg-yellow-500/10 text-yellow-600 border-yellow-500/20",
  viewed: "bg-blue-500/10 text-blue-600 border-blue-500/20",
  bid_submitted: "bg-purple-500/10 text-purple-600 border-purple-500/20",
  accepted: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20",
  rejected: "bg-red-500/10 text-red-600 border-red-500/20",
};

const statusLabels: Record<string, string> = {
  pending: "New",
  viewed: "Viewed",
  bid_submitted: "Bid Sent",
  accepted: "Accepted",
  rejected: "Rejected",
};

export default function RFQInbox() {
  const { toast } = useToast();
  const { getApiPath } = usePreview();
  const [selectedRfq, setSelectedRfq] = useState<RFQ | null>(null);
  const [bidAmount, setBidAmount] = useState("");
  const [bidDays, setBidDays] = useState("");
  const [bidNotes, setBidNotes] = useState("");

  const { data: rfqs = [], isLoading } = useQuery<RFQ[]>({
    queryKey: [getApiPath("/api/tenant/rfqs")],
  });

  const { data: rfqDetail, isLoading: detailLoading } = useQuery<RFQ>({
    queryKey: [getApiPath(`/api/tenant/rfqs/${selectedRfq?.id}`)],
    enabled: !!selectedRfq,
  });

  const submitBidMutation = useMutation({
    mutationFn: async (rfqId: number) => {
      const amountCents = Math.round(parseFloat(bidAmount) * 100);
      return apiRequest("POST", getApiPath(`/api/tenant/rfqs/${rfqId}/bid`), {
        totalAmountCents: amountCents,
        laborCostCents: amountCents,
        estimatedDays: bidDays ? parseInt(bidDays) : null,
        notes: bidNotes || null,
        lineItems: [],
      });
    },
    onSuccess: () => {
      toast({ title: "Bid submitted successfully" });
      queryClient.invalidateQueries({ queryKey: [getApiPath("/api/tenant/rfqs")] });
      if (selectedRfq) {
        queryClient.invalidateQueries({ queryKey: [getApiPath(`/api/tenant/rfqs/${selectedRfq.id}`)] });
      }
      setBidAmount("");
      setBidDays("");
      setBidNotes("");
    },
    onError: (error: Error) => {
      toast({ title: "Failed to submit bid", description: error.message, variant: "destructive" });
    },
  });

  if (selectedRfq) {
    const rfq = rfqDetail || selectedRfq;
    const canBid = rfq.status === "pending" || rfq.status === "viewed";

    return (
      <div className="space-y-6">
        <Button variant="ghost" onClick={() => setSelectedRfq(null)} className="gap-2">
          <ArrowLeft className="h-4 w-4" /> Back to Inbox
        </Button>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-xl">{rfq.projectName}</CardTitle>
                <CardDescription>
                  {rfq.phaseDescription} &bull; from {rfq.builderName}
                </CardDescription>
              </div>
              <Badge className={statusColors[rfq.status] || ""}>
                {statusLabels[rfq.status] || rfq.status}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {rfq.projectAddress && (
              <div>
                <Label className="text-muted-foreground text-xs">Project Address</Label>
                <p className="font-medium">{rfq.projectAddress}</p>
              </div>
            )}

            {rfq.startDate && (
              <div>
                <Label className="text-muted-foreground text-xs">Target Start Date</Label>
                <p className="font-medium">{rfq.startDate}</p>
              </div>
            )}

            {rfq.scopeItems && rfq.scopeItems.length > 0 && (
              <div>
                <Label className="text-muted-foreground text-xs mb-2 block">Scope of Work</Label>
                <div className="rounded-lg border">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b bg-muted/50">
                        <th className="text-left p-3 font-medium">Item</th>
                        <th className="text-right p-3 font-medium">Quantity</th>
                        <th className="text-left p-3 font-medium">Unit</th>
                      </tr>
                    </thead>
                    <tbody>
                      {rfq.scopeItems.map((item, i) => (
                        <tr key={i} className="border-b last:border-0">
                          <td className="p-3">{item.item}</td>
                          <td className="text-right p-3">{item.quantity}</td>
                          <td className="p-3">{item.unit}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {rfq.bid && (
              <Card className="bg-muted/50">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    {rfq.bid.status === "accepted" ? (
                      <CheckCircle className="h-4 w-4 text-emerald-500" />
                    ) : rfq.bid.status === "rejected" ? (
                      <XCircle className="h-4 w-4 text-red-500" />
                    ) : (
                      <Clock className="h-4 w-4 text-purple-500" />
                    )}
                    Your Bid
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Amount</span>
                    <span className="font-semibold">${(rfq.bid.totalAmountCents / 100).toLocaleString()}</span>
                  </div>
                  {rfq.bid.estimatedDays && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Estimated Days</span>
                      <span>{rfq.bid.estimatedDays}</span>
                    </div>
                  )}
                  {rfq.bid.notes && (
                    <div>
                      <span className="text-muted-foreground block mb-1">Notes</span>
                      <p>{rfq.bid.notes}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {canBid && !rfq.bid && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Submit Your Bid</CardTitle>
                  <CardDescription>Provide your pricing for this scope of work.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="bid-amount">Total Amount ($)</Label>
                      <Input
                        id="bid-amount"
                        type="number"
                        placeholder="15000"
                        value={bidAmount}
                        onChange={(e) => setBidAmount(e.target.value)}
                      />
                    </div>
                    <div>
                      <Label htmlFor="bid-days">Estimated Days</Label>
                      <Input
                        id="bid-days"
                        type="number"
                        placeholder="5"
                        value={bidDays}
                        onChange={(e) => setBidDays(e.target.value)}
                      />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="bid-notes">Notes</Label>
                    <Textarea
                      id="bid-notes"
                      placeholder="Additional details about your bid..."
                      value={bidNotes}
                      onChange={(e) => setBidNotes(e.target.value)}
                    />
                  </div>
                  <Button
                    onClick={() => submitBidMutation.mutate(rfq.id)}
                    disabled={!bidAmount || submitBidMutation.isPending}
                    className="gap-2"
                  >
                    <Send className="h-4 w-4" />
                    {submitBidMutation.isPending ? "Submitting..." : "Submit Bid"}
                  </Button>
                </CardContent>
              </Card>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">RFQ Inbox</h2>
        <p className="text-muted-foreground">Inbound requests for quotes from builders.</p>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <div className="relative h-8 w-8">
            <div className="absolute inset-0 rounded-full border-4 border-primary/20"></div>
            <div className="absolute inset-0 rounded-full border-4 border-primary border-t-transparent animate-spin"></div>
          </div>
        </div>
      ) : rfqs.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <Inbox className="h-12 w-12 text-muted-foreground/50 mb-4" />
            <h3 className="text-lg font-semibold mb-1">No RFQs yet</h3>
            <p className="text-muted-foreground text-sm max-w-sm">
              When builders send you requests for quotes, they'll appear here.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {rfqs.map((rfq) => (
            <Card
              key={rfq.id}
              className="cursor-pointer hover:border-primary/50 transition-colors"
              onClick={() => setSelectedRfq(rfq)}
            >
              <CardContent className="flex items-center gap-4 py-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-semibold truncate">{rfq.projectName}</h3>
                    <Badge variant="outline" className={statusColors[rfq.status] || ""}>
                      {statusLabels[rfq.status] || rfq.status}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground truncate">
                    {rfq.phaseDescription} &bull; {rfq.builderName}
                  </p>
                  {rfq.startDate && (
                    <p className="text-xs text-muted-foreground mt-1">
                      <Clock className="h-3 w-3 inline mr-1" />
                      Start: {rfq.startDate}
                    </p>
                  )}
                </div>
                <div className="text-xs text-muted-foreground whitespace-nowrap">
                  {new Date(rfq.createdAt).toLocaleDateString()}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
