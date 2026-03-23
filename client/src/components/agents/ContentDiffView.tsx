import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowRight } from "lucide-react";

interface ContentDiffViewProps {
  title: string;
  contentType: string;
  targetPage?: string | null;
  currentContent?: Record<string, any> | null;
  proposedContent: Record<string, any>;
}

export function ContentDiffView({
  title,
  contentType,
  targetPage,
  currentContent,
  proposedContent,
}: ContentDiffViewProps) {
  const currentValue = currentContent?.value || null;
  const proposedValue = proposedContent?.proposedValue || JSON.stringify(proposedContent, null, 2);
  const reasoning = proposedContent?.reasoning || null;
  const priority = proposedContent?.priority || null;

  const priorityColors: Record<string, string> = {
    high: "bg-red-100 text-red-700 border-red-200",
    medium: "bg-yellow-100 text-yellow-700 border-yellow-200",
    low: "bg-green-100 text-green-700 border-green-200",
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-sm font-medium">{title}</span>
        {targetPage && (
          <Badge variant="outline" className="text-xs">{targetPage}</Badge>
        )}
        {priority && (
          <Badge variant="outline" className={`text-xs ${priorityColors[priority] || ""}`}>
            {priority} priority
          </Badge>
        )}
        <Badge variant="secondary" className="text-xs">
          {contentType === "meta_description" ? "Meta Description" : "Page Update"}
        </Badge>
      </div>

      {currentValue && proposedValue ? (
        <div className="grid grid-cols-1 md:grid-cols-[1fr,auto,1fr] gap-2 items-start">
          {/* Current */}
          <div className="rounded-md border border-red-200 bg-red-50 dark:bg-red-950/20 p-3">
            <span className="text-xs font-medium text-red-600 uppercase tracking-wide block mb-1">Current</span>
            <p className="text-sm whitespace-pre-wrap">{currentValue}</p>
          </div>
          <div className="hidden md:flex items-center justify-center h-full">
            <ArrowRight className="h-4 w-4 text-muted-foreground" />
          </div>
          {/* Proposed */}
          <div className="rounded-md border border-green-200 bg-green-50 dark:bg-green-950/20 p-3">
            <span className="text-xs font-medium text-green-600 uppercase tracking-wide block mb-1">Proposed</span>
            <p className="text-sm whitespace-pre-wrap">{proposedValue}</p>
          </div>
        </div>
      ) : (
        <div className="rounded-md border border-green-200 bg-green-50 dark:bg-green-950/20 p-3">
          <span className="text-xs font-medium text-green-600 uppercase tracking-wide block mb-1">Proposed</span>
          <p className="text-sm whitespace-pre-wrap">{proposedValue}</p>
        </div>
      )}

      {reasoning && (
        <p className="text-xs text-muted-foreground italic">{reasoning}</p>
      )}
    </div>
  );
}
