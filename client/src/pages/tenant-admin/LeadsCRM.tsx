import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Mail, Phone, MessageSquare, Clock, DollarSign, Users,
  TrendingUp, ChevronRight, StickyNote, Calendar, Target,
} from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { usePreview } from "@/contexts/PreviewContext";
import { LeadScoreBadge } from "@/components/agents/LeadScoreBadge";
import { LeadSuggestedActions } from "@/components/agents/LeadSuggestedActions";
import type { Lead, LeadNote } from "@shared/schema";
import { LEAD_STAGES, LEAD_PRIORITIES } from "@shared/schema";

interface LeadMetrics {
  totalLeads: number;
  byStage: Record<string, number>;
  byPriority: Record<string, number>;
  avgResponseTime: number;
  conversionRate: number;
}

const STAGE_COLORS: Record<string, string> = {
  new: "bg-blue-500/10 text-blue-600 border-0",
  contacted: "bg-amber-500/10 text-amber-600 border-0",
  quoted: "bg-purple-500/10 text-purple-600 border-0",
  won: "bg-emerald-500/10 text-emerald-600 border-0",
  lost: "bg-gray-500/10 text-gray-500 border-0",
};

const STAGE_BAR_COLORS: Record<string, string> = {
  new: "bg-blue-500",
  contacted: "bg-amber-500",
  quoted: "bg-purple-500",
  won: "bg-emerald-500",
  lost: "bg-gray-400",
};

const STAGE_LABELS: Record<string, string> = {
  new: "New",
  contacted: "Contacted",
  quoted: "Quoted",
  won: "Won",
  lost: "Lost",
};

const PRIORITY_LABELS: Record<string, string> = {
  low: "Low",
  medium: "Medium",
  high: "High",
};

const NOTE_TYPE_LABELS: Record<string, string> = {
  note: "Note",
  call: "Call",
  email: "Email",
};

function formatResponseTime(ms: number): string {
  if (!ms || ms <= 0) return "N/A";
  const totalMinutes = Math.floor(ms / (1000 * 60));
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${minutes}m`;
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 0 }).format(value);
}

function formatDate(date: string | Date): string {
  return new Date(date).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function formatDateTime(date: string | Date): string {
  return new Date(date).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function isOverdue(date: string | Date): boolean {
  return new Date(date) < new Date();
}

function getPriorityVariant(priority: string): "outline" | "secondary" | "destructive" {
  if (priority === "high") return "destructive";
  if (priority === "medium") return "secondary";
  return "outline";
}

function LeadCard({
  lead,
  onViewDetail,
  onStageChange,
  onPriorityChange,
  onOpenNotes,
}: {
  lead: Lead;
  onViewDetail: (lead: Lead) => void;
  onStageChange: (leadId: number, stage: string) => void;
  onPriorityChange: (leadId: number, priority: string) => void;
  onOpenNotes: (lead: Lead) => void;
}) {
  const [expanded, setExpanded] = useState(false);

  return (
    <Card data-testid={`card-lead-${lead.id}`}>
      <CardContent className="p-3 sm:p-4">
        <div className="flex flex-col gap-3">
          <div className="flex items-start justify-between gap-3 flex-wrap">
            <div className="flex items-center gap-2 flex-wrap min-w-0 flex-1">
              <button
                className="font-semibold text-left hover:underline cursor-pointer"
                onClick={() => onViewDetail(lead)}
                data-testid={`button-view-lead-${lead.id}`}
              >
                {lead.name}
              </button>
              <Badge className={STAGE_COLORS[lead.stage] || ""} data-testid={`badge-stage-${lead.id}`}>
                {STAGE_LABELS[lead.stage] || lead.stage}
              </Badge>
              <Badge variant={getPriorityVariant(lead.priority)} data-testid={`badge-priority-${lead.id}`}>
                {PRIORITY_LABELS[lead.priority] || lead.priority}
              </Badge>
              <LeadScoreBadge score={(lead as any).aiScore} />
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <Select
                value={lead.stage}
                onValueChange={(val) => onStageChange(lead.id, val)}
              >
                <SelectTrigger className="w-[120px]" data-testid={`select-stage-${lead.id}`}>
                  <SelectValue placeholder="Stage" />
                </SelectTrigger>
                <SelectContent>
                  {LEAD_STAGES.map((s) => (
                    <SelectItem key={s} value={s}>{STAGE_LABELS[s]}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select
                value={lead.priority}
                onValueChange={(val) => onPriorityChange(lead.id, val)}
              >
                <SelectTrigger className="w-[110px]" data-testid={`select-priority-${lead.id}`}>
                  <SelectValue placeholder="Priority" />
                </SelectTrigger>
                <SelectContent>
                  {LEAD_PRIORITIES.map((p) => (
                    <SelectItem key={p} value={p}>{PRIORITY_LABELS[p]}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button
                variant="outline"
                size="sm"
                onClick={() => onOpenNotes(lead)}
                data-testid={`button-notes-${lead.id}`}
              >
                <StickyNote className="h-4 w-4 mr-1" />
                Notes
              </Button>
            </div>
          </div>

          <div className="flex items-center gap-4 text-sm text-muted-foreground flex-wrap">
            <a href={`mailto:${lead.email}`} className="flex items-center gap-1.5 hover:underline" data-testid={`text-lead-email-${lead.id}`}>
              <Mail className="h-3.5 w-3.5 flex-shrink-0" />
              <span className="truncate">{lead.email}</span>
            </a>
            {lead.phone && (
              <a href={`tel:${lead.phone}`} className="flex items-center gap-1.5 hover:underline" data-testid={`text-lead-phone-${lead.id}`}>
                <Phone className="h-3.5 w-3.5 flex-shrink-0" />
                <span>{lead.phone}</span>
              </a>
            )}
            {lead.source && (
              <Badge variant="outline" className="text-xs" data-testid={`badge-source-${lead.id}`}>
                {lead.source}
              </Badge>
            )}
          </div>

          <LeadSuggestedActions actions={(lead as any).aiSuggestedActions} />

          {lead.message && (
            <div className="text-sm text-muted-foreground">
              <p
                className={expanded ? "" : "line-clamp-2"}
                data-testid={`text-lead-message-${lead.id}`}
              >
                {lead.message}
              </p>
              {lead.message.length > 120 && (
                <button
                  className="text-xs text-foreground/70 hover:underline mt-1"
                  onClick={() => setExpanded(!expanded)}
                  data-testid={`button-expand-message-${lead.id}`}
                >
                  {expanded ? "Show less" : "Show more"}
                </button>
              )}
            </div>
          )}

          <div className="flex items-center gap-4 text-xs text-muted-foreground flex-wrap">
            <span className="flex items-center gap-1" data-testid={`text-lead-created-${lead.id}`}>
              <Calendar className="h-3 w-3" />
              {formatDate(lead.createdAt)}
            </span>
            {lead.nextFollowUpAt && (
              <span
                className={`flex items-center gap-1 ${isOverdue(lead.nextFollowUpAt) ? "text-red-500 font-medium" : ""}`}
                data-testid={`text-lead-followup-${lead.id}`}
              >
                <Clock className="h-3 w-3" />
                Follow-up: {formatDate(lead.nextFollowUpAt)}
                {isOverdue(lead.nextFollowUpAt) && " (overdue)"}
              </span>
            )}
            {lead.estimatedValue != null && lead.estimatedValue > 0 && (
              <span className="flex items-center gap-1" data-testid={`text-lead-value-${lead.id}`}>
                <DollarSign className="h-3 w-3" />
                {formatCurrency(lead.estimatedValue)}
              </span>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function LeadDetailDialog({
  lead,
  open,
  onOpenChange,
}: {
  lead: Lead | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { toast } = useToast();
  const { getApiPath } = usePreview();
  const [noteContent, setNoteContent] = useState("");
  const [noteType, setNoteType] = useState("note");
  const [editValue, setEditValue] = useState("");
  const [editFollowUp, setEditFollowUp] = useState("");

  const { data: notes = [], isLoading: notesLoading } = useQuery<LeadNote[]>({
    queryKey: [getApiPath("/api/tenant/leads"), lead?.id, "notes"],
    queryFn: async () => {
      const res = await fetch(getApiPath(`/api/tenant/leads/${lead!.id}/notes`), { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch notes");
      return res.json();
    },
    enabled: !!lead && open,
  });

  const stageMutation = useMutation({
    mutationFn: async (stage: string) => {
      await apiRequest("PATCH", getApiPath(`/api/tenant/leads/${lead!.id}/stage`), { stage });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [getApiPath("/api/tenant/leads")] });
      queryClient.invalidateQueries({ queryKey: [getApiPath("/api/tenant/leads/metrics")] });
      toast({ title: "Stage updated" });
    },
    onError: (err: Error) => {
      toast({ title: "Failed to update stage", description: err.message, variant: "destructive" });
    },
  });

  const priorityMutation = useMutation({
    mutationFn: async (priority: string) => {
      await apiRequest("PATCH", getApiPath(`/api/tenant/leads/${lead!.id}/priority`), { priority });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [getApiPath("/api/tenant/leads")] });
      queryClient.invalidateQueries({ queryKey: [getApiPath("/api/tenant/leads/metrics")] });
      toast({ title: "Priority updated" });
    },
    onError: (err: Error) => {
      toast({ title: "Failed to update priority", description: err.message, variant: "destructive" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (body: Record<string, unknown>) => {
      await apiRequest("PATCH", getApiPath(`/api/tenant/leads/${lead!.id}`), body);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [getApiPath("/api/tenant/leads")] });
      queryClient.invalidateQueries({ queryKey: [getApiPath("/api/tenant/leads/metrics")] });
      toast({ title: "Lead updated" });
    },
    onError: (err: Error) => {
      toast({ title: "Failed to update lead", description: err.message, variant: "destructive" });
    },
  });

  const addNoteMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("POST", getApiPath(`/api/tenant/leads/${lead!.id}/notes`), { content: noteContent, type: noteType });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [getApiPath("/api/tenant/leads"), lead!.id, "notes"] });
      setNoteContent("");
      toast({ title: "Note added" });
    },
    onError: (err: Error) => {
      toast({ title: "Failed to add note", description: err.message, variant: "destructive" });
    },
  });

  const handleSaveValue = () => {
    const num = parseInt(editValue, 10);
    if (!isNaN(num)) {
      updateMutation.mutate({ estimatedValue: num });
    }
  };

  const handleSaveFollowUp = () => {
    if (editFollowUp) {
      updateMutation.mutate({ nextFollowUpAt: new Date(editFollowUp).toISOString() });
    }
  };

  if (!lead) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto" data-testid="dialog-lead-detail">
        <DialogHeader>
          <DialogTitle data-testid="text-detail-lead-name">{lead.name}</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-sm">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <a href={`mailto:${lead.email}`} className="hover:underline" data-testid="text-detail-email">{lead.email}</a>
              </div>
              {lead.phone && (
                <div className="flex items-center gap-2 text-sm">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <a href={`tel:${lead.phone}`} className="hover:underline" data-testid="text-detail-phone">{lead.phone}</a>
                </div>
              )}
              {lead.source && (
                <div className="flex items-center gap-2 text-sm">
                  <Target className="h-4 w-4 text-muted-foreground" />
                  <span data-testid="text-detail-source">{lead.source}</span>
                </div>
              )}
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Calendar className="h-4 w-4" />
                <span data-testid="text-detail-created">Created {formatDateTime(lead.createdAt)}</span>
              </div>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">Stage</label>
                <Select
                  value={lead.stage}
                  onValueChange={(val) => stageMutation.mutate(val)}
                >
                  <SelectTrigger data-testid="select-detail-stage">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {LEAD_STAGES.map((s) => (
                      <SelectItem key={s} value={s}>{STAGE_LABELS[s]}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">Priority</label>
                <Select
                  value={lead.priority}
                  onValueChange={(val) => priorityMutation.mutate(val)}
                >
                  <SelectTrigger data-testid="select-detail-priority">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {LEAD_PRIORITIES.map((p) => (
                      <SelectItem key={p} value={p}>{PRIORITY_LABELS[p]}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {lead.message && (
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">Message</label>
              <p className="text-sm bg-muted/50 rounded-md p-3" data-testid="text-detail-message">{lead.message}</p>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">Estimated Value</label>
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  placeholder="0"
                  defaultValue={lead.estimatedValue ?? ""}
                  onChange={(e) => setEditValue(e.target.value)}
                  data-testid="input-detail-value"
                />
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleSaveValue}
                  disabled={updateMutation.isPending}
                  data-testid="button-save-value"
                >
                  Save
                </Button>
              </div>
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">Next Follow-up</label>
              <div className="flex items-center gap-2">
                <Input
                  type="date"
                  defaultValue={lead.nextFollowUpAt ? new Date(lead.nextFollowUpAt).toISOString().split("T")[0] : ""}
                  onChange={(e) => setEditFollowUp(e.target.value)}
                  data-testid="input-detail-followup"
                />
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleSaveFollowUp}
                  disabled={updateMutation.isPending}
                  data-testid="button-save-followup"
                >
                  Save
                </Button>
              </div>
            </div>
          </div>

          <div>
            <h3 className="text-sm font-semibold mb-3">Notes</h3>
            <div className="space-y-3 mb-4">
              <div className="flex items-end gap-2 flex-wrap">
                <div className="flex-1 min-w-[200px]">
                  <Textarea
                    placeholder="Add a note..."
                    value={noteContent}
                    onChange={(e) => setNoteContent(e.target.value)}
                    className="resize-none"
                    rows={2}
                    data-testid="textarea-add-note"
                  />
                </div>
                <Select value={noteType} onValueChange={setNoteType}>
                  <SelectTrigger className="w-[100px]" data-testid="select-note-type">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="note">Note</SelectItem>
                    <SelectItem value="call">Call</SelectItem>
                    <SelectItem value="email">Email</SelectItem>
                  </SelectContent>
                </Select>
                <Button
                  size="default"
                  onClick={() => addNoteMutation.mutate()}
                  disabled={!noteContent.trim() || addNoteMutation.isPending}
                  data-testid="button-submit-note"
                >
                  Add
                </Button>
              </div>
            </div>

            {notesLoading ? (
              <div className="space-y-2">
                <Skeleton className="h-16 w-full" />
                <Skeleton className="h-16 w-full" />
              </div>
            ) : notes.length > 0 ? (
              <div className="space-y-2">
                {notes.map((note) => (
                  <div
                    key={note.id}
                    className="rounded-md border p-3 text-sm"
                    data-testid={`card-note-${note.id}`}
                  >
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <Badge variant="outline" className="text-xs" data-testid={`badge-note-type-${note.id}`}>
                        {NOTE_TYPE_LABELS[note.type] || note.type}
                      </Badge>
                      <span className="text-xs text-muted-foreground" data-testid={`text-note-date-${note.id}`}>
                        {formatDateTime(note.createdAt)}
                      </span>
                    </div>
                    <p data-testid={`text-note-content-${note.id}`}>{note.content}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-4" data-testid="text-no-notes">
                No notes yet. Add a note above.
              </p>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default function LeadsCRM() {
  const { toast } = useToast();
  const { getApiPath } = usePreview();
  const [stageFilter, setStageFilter] = useState("all");
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [sortBy, setSortBy] = useState<"newest" | "ai_score">("newest");
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [notesLead, setNotesLead] = useState<Lead | null>(null);
  const [notesOpen, setNotesOpen] = useState(false);

  const queryParams = new URLSearchParams();
  if (stageFilter !== "all") queryParams.set("stage", stageFilter);
  if (priorityFilter !== "all") queryParams.set("priority", priorityFilter);
  const queryString = queryParams.toString();

  const { data: leads = [], isLoading: leadsLoading } = useQuery<Lead[]>({
    queryKey: [getApiPath("/api/tenant/leads"), queryString],
    queryFn: async () => {
      const baseUrl = getApiPath("/api/tenant/leads");
      const url = queryString ? `${baseUrl}?${queryString}` : baseUrl;
      const res = await fetch(url, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch leads");
      return res.json();
    },
  });

  const { data: metrics, isLoading: metricsLoading } = useQuery<LeadMetrics>({
    queryKey: [getApiPath("/api/tenant/leads/metrics")],
  });

  const stageMutation = useMutation({
    mutationFn: async ({ leadId, stage }: { leadId: number; stage: string }) => {
      await apiRequest("PATCH", getApiPath(`/api/tenant/leads/${leadId}/stage`), { stage });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [getApiPath("/api/tenant/leads")] });
      queryClient.invalidateQueries({ queryKey: [getApiPath("/api/tenant/leads/metrics")] });
      toast({ title: "Stage updated" });
    },
    onError: (err: Error) => {
      toast({ title: "Failed to update stage", description: err.message, variant: "destructive" });
    },
  });

  const priorityMutation = useMutation({
    mutationFn: async ({ leadId, priority }: { leadId: number; priority: string }) => {
      await apiRequest("PATCH", getApiPath(`/api/tenant/leads/${leadId}/priority`), { priority });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [getApiPath("/api/tenant/leads")] });
      queryClient.invalidateQueries({ queryKey: [getApiPath("/api/tenant/leads/metrics")] });
      toast({ title: "Priority updated" });
    },
    onError: (err: Error) => {
      toast({ title: "Failed to update priority", description: err.message, variant: "destructive" });
    },
  });

  const handleViewDetail = (lead: Lead) => {
    setSelectedLead(lead);
    setDetailOpen(true);
  };

  const handleOpenNotes = (lead: Lead) => {
    setNotesLead(lead);
    setNotesOpen(true);
  };

  const wonCount = metrics?.byStage?.won ?? 0;
  const totalForPipeline = metrics?.totalLeads ?? 0;

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-xl sm:text-2xl font-semibold tracking-tight" data-testid="text-lead-management-title">
            Lead Management
          </h1>
          <p className="text-sm sm:text-base text-muted-foreground">
            Track and manage your leads through the sales pipeline
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {metricsLoading ? (
          <>
            <Skeleton className="h-20" />
            <Skeleton className="h-20" />
            <Skeleton className="h-20" />
            <Skeleton className="h-20" />
          </>
        ) : (
          <>
            <Card data-testid="card-metric-total">
              <CardContent className="p-3 sm:p-4">
                <div className="flex items-center gap-2 mb-1">
                  <Users className="h-4 w-4 text-muted-foreground" />
                  <span className="text-xs text-muted-foreground">Total Leads</span>
                </div>
                <p className="text-xl sm:text-2xl font-bold" data-testid="text-metric-total">{metrics?.totalLeads ?? 0}</p>
              </CardContent>
            </Card>
            <Card data-testid="card-metric-conversion">
              <CardContent className="p-3 sm:p-4">
                <div className="flex items-center gap-2 mb-1">
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                  <span className="text-xs text-muted-foreground">Conversion</span>
                </div>
                <p className="text-xl sm:text-2xl font-bold" data-testid="text-metric-conversion">
                  {metrics?.conversionRate != null ? `${Math.round(metrics.conversionRate)}%` : "0%"}
                </p>
              </CardContent>
            </Card>
            <Card data-testid="card-metric-response">
              <CardContent className="p-3 sm:p-4">
                <div className="flex items-center gap-2 mb-1">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <span className="text-xs text-muted-foreground">Avg Response</span>
                </div>
                <p className="text-xl sm:text-2xl font-bold" data-testid="text-metric-response">
                  {formatResponseTime(metrics?.avgResponseTime ?? 0)}
                </p>
              </CardContent>
            </Card>
            <Card data-testid="card-metric-won">
              <CardContent className="p-3 sm:p-4">
                <div className="flex items-center gap-2 mb-1">
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                  <span className="text-xs text-muted-foreground">Won</span>
                </div>
                <p className="text-xl sm:text-2xl font-bold" data-testid="text-metric-won">{wonCount}</p>
              </CardContent>
            </Card>
          </>
        )}
      </div>

      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm font-medium text-muted-foreground">Stage:</span>
          {["all", ...LEAD_STAGES].map((s) => (
            <Button
              key={s}
              variant={stageFilter === s ? "default" : "outline"}
              size="sm"
              onClick={() => setStageFilter(s)}
              data-testid={`button-filter-stage-${s}`}
            >
              {s === "all" ? "All" : STAGE_LABELS[s]}
            </Button>
          ))}
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm font-medium text-muted-foreground">Priority:</span>
          <Select value={priorityFilter} onValueChange={setPriorityFilter}>
            <SelectTrigger className="w-[120px]" data-testid="select-filter-priority">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              {LEAD_PRIORITIES.map((p) => (
                <SelectItem key={p} value={p}>{PRIORITY_LABELS[p]}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm font-medium text-muted-foreground">Sort:</span>
          <Select value={sortBy} onValueChange={(v) => setSortBy(v as "newest" | "ai_score")}>
            <SelectTrigger className="w-[130px]" data-testid="select-sort">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="newest">Newest</SelectItem>
              <SelectItem value="ai_score">AI Score</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div>
        {leadsLoading ? (
          <div className="space-y-3">
            <Skeleton className="h-32" />
            <Skeleton className="h-32" />
            <Skeleton className="h-32" />
          </div>
        ) : leads.length > 0 ? (
          <div className="space-y-3">
            {[...leads].sort((a, b) => {
              if (sortBy === "ai_score") {
                // Nulls sort to end
                const aScore = (a as any).aiScore ?? -1;
                const bScore = (b as any).aiScore ?? -1;
                return bScore - aScore;
              }
              return 0; // default server ordering (newest)
            }).map((lead) => (
              <LeadCard
                key={lead.id}
                lead={lead}
                onViewDetail={handleViewDetail}
                onStageChange={(id, stage) => stageMutation.mutate({ leadId: id, stage })}
                onPriorityChange={(id, priority) => priorityMutation.mutate({ leadId: id, priority })}
                onOpenNotes={handleOpenNotes}
              />
            ))}
          </div>
        ) : stageFilter !== "all" || priorityFilter !== "all" ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12 text-center">
              <MessageSquare className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium" data-testid="text-no-filtered-leads">No leads match your current filters.</h3>
              <p className="text-muted-foreground text-sm mt-1">Try adjusting your filters to see more leads.</p>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12 text-center">
              <MessageSquare className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium" data-testid="text-no-leads">No leads yet</h3>
              <p className="text-muted-foreground text-sm mt-1">
                Leads will appear here when visitors interact with your website.
              </p>
            </CardContent>
          </Card>
        )}
      </div>

      {metrics && totalForPipeline > 0 && (
        <Card data-testid="card-pipeline-summary">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Pipeline Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-1 text-xs font-medium flex-wrap">
              {LEAD_STAGES.filter((s) => s !== "lost").map((stage, i) => {
                const count = metrics.byStage?.[stage] ?? 0;
                const pct = totalForPipeline > 0 ? Math.max((count / totalForPipeline) * 100, 8) : 0;
                return (
                  <div key={stage} className="flex items-center gap-1">
                    {i > 0 && <ChevronRight className="h-3 w-3 text-muted-foreground flex-shrink-0" />}
                    <div className="flex flex-col items-center gap-1" data-testid={`pipeline-stage-${stage}`}>
                      <div
                        className={`${STAGE_BAR_COLORS[stage]} rounded-sm h-6`}
                        style={{ width: `${pct}px`, minWidth: "32px" }}
                      />
                      <span className="text-muted-foreground whitespace-nowrap">
                        {STAGE_LABELS[stage]} ({count})
                      </span>
                    </div>
                  </div>
                );
              })}
              <div className="flex items-center gap-1 ml-2">
                <span className="text-muted-foreground">/</span>
                <div className="flex flex-col items-center gap-1" data-testid="pipeline-stage-lost">
                  <div
                    className={`${STAGE_BAR_COLORS.lost} rounded-sm h-6`}
                    style={{ width: `${Math.max(((metrics.byStage?.lost ?? 0) / totalForPipeline) * 100, 8)}px`, minWidth: "32px" }}
                  />
                  <span className="text-muted-foreground whitespace-nowrap">
                    Lost ({metrics.byStage?.lost ?? 0})
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <LeadDetailDialog
        lead={selectedLead}
        open={detailOpen}
        onOpenChange={setDetailOpen}
      />

      <LeadDetailDialog
        lead={notesLead}
        open={notesOpen}
        onOpenChange={setNotesOpen}
      />
    </div>
  );
}
