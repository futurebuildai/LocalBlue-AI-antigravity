import { Badge } from "@/components/ui/badge";
import { Lightbulb } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

interface SuggestedAction {
  action: string;
  reason: string;
  priority: string;
}

interface LeadSuggestedActionsProps {
  actions: SuggestedAction[] | null | undefined;
}

export function LeadSuggestedActions({ actions }: LeadSuggestedActionsProps) {
  if (!actions || actions.length === 0) return null;

  const priorityColor = (p: string) => {
    if (p === "high") return "bg-red-50 text-red-700 border-red-200";
    if (p === "medium") return "bg-yellow-50 text-yellow-700 border-yellow-200";
    return "bg-gray-50 text-gray-700 border-gray-200";
  };

  return (
    <div className="flex flex-wrap gap-1 mt-1">
      {actions.slice(0, 2).map((a, i) => (
        <Tooltip key={i}>
          <TooltipTrigger asChild>
            <Badge variant="outline" className={`gap-1 text-xs ${priorityColor(a.priority)}`}>
              <Lightbulb className="h-3 w-3" />
              {a.action.length > 30 ? a.action.slice(0, 30) + "..." : a.action}
            </Badge>
          </TooltipTrigger>
          <TooltipContent>
            <p className="max-w-xs">{a.reason}</p>
          </TooltipContent>
        </Tooltip>
      ))}
    </div>
  );
}
