import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Brain } from "lucide-react";

interface LeadScoreBadgeProps {
  score: number | null | undefined;
  className?: string;
}

export function LeadScoreBadge({ score, className }: LeadScoreBadgeProps) {
  if (score == null) return null;

  const getColor = (s: number) => {
    if (s >= 80) return "bg-green-100 text-green-800 border-green-200";
    if (s >= 60) return "bg-yellow-100 text-yellow-800 border-yellow-200";
    if (s >= 40) return "bg-orange-100 text-orange-800 border-orange-200";
    return "bg-red-100 text-red-800 border-red-200";
  };

  const getLabel = (s: number) => {
    if (s >= 80) return "Hot";
    if (s >= 60) return "Warm";
    if (s >= 40) return "Cool";
    return "Cold";
  };

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Badge variant="outline" className={`gap-1 ${getColor(score)} ${className || ""}`}>
          <Brain className="h-3 w-3" />
          {score}
        </Badge>
      </TooltipTrigger>
      <TooltipContent>
        <p>AI Score: {score}/100 ({getLabel(score)})</p>
      </TooltipContent>
    </Tooltip>
  );
}
