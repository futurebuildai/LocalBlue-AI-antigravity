import { Check } from "lucide-react";
import { cn } from "@/lib/utils";
import type { OnboardingPhase } from "@shared/schema";

interface PhaseConfig {
  id: OnboardingPhase;
  label: string;
  shortLabel: string;
}

const PHASE_CONFIG: PhaseConfig[] = [
  { id: "welcome", label: "Welcome", shortLabel: "Welcome" },
  { id: "business_basics", label: "Business Basics", shortLabel: "Basics" },
  { id: "trade_detection", label: "Trade & Services", shortLabel: "Trade" },
  { id: "services", label: "Services", shortLabel: "Services" },
  { id: "story", label: "Your Story", shortLabel: "Story" },
  { id: "differentiators", label: "What Makes You Different", shortLabel: "Unique" },
  { id: "service_area", label: "Service Area", shortLabel: "Area" },
  { id: "style", label: "Style & Design", shortLabel: "Style" },
  { id: "pages", label: "Pages", shortLabel: "Pages" },
  { id: "photos", label: "Photos", shortLabel: "Photos" },
  { id: "review", label: "Review", shortLabel: "Review" },
];

const DISPLAY_PHASES: PhaseConfig[] = [
  { id: "welcome", label: "Welcome", shortLabel: "Welcome" },
  { id: "business_basics", label: "Business Basics", shortLabel: "Basics" },
  { id: "trade_detection", label: "Trade & Services", shortLabel: "Trade" },
  { id: "story", label: "Your Story", shortLabel: "Story" },
  { id: "style", label: "Style & Design", shortLabel: "Style" },
  { id: "pages", label: "Pages", shortLabel: "Pages" },
  { id: "photos", label: "Photos", shortLabel: "Photos" },
  { id: "review", label: "Review", shortLabel: "Review" },
];

interface OnboardingProgressProps {
  currentPhase: OnboardingPhase;
  completedPhases: OnboardingPhase[];
  onPhaseClick?: (phase: OnboardingPhase) => void;
}

export function OnboardingProgress({
  currentPhase,
  completedPhases,
  onPhaseClick,
}: OnboardingProgressProps) {
  const currentIndex = PHASE_CONFIG.findIndex((p) => p.id === currentPhase);

  const getPhaseStatus = (phase: PhaseConfig) => {
    if (completedPhases.includes(phase.id)) return "completed";
    if (phase.id === currentPhase) return "current";
    const phaseIndex = PHASE_CONFIG.findIndex((p) => p.id === phase.id);
    if (phaseIndex < currentIndex) return "completed";
    return "upcoming";
  };

  const handlePhaseClick = (phase: PhaseConfig) => {
    const status = getPhaseStatus(phase);
    if ((status === "completed" || status === "current") && onPhaseClick) {
      onPhaseClick(phase.id);
    }
  };

  const completedCount = DISPLAY_PHASES.filter(
    (p) => getPhaseStatus(p) === "completed"
  ).length;
  const progressPercent = (completedCount / DISPLAY_PHASES.length) * 100;

  return (
    <div className="w-full bg-card border-b" data-testid="onboarding-progress">
      <div className="px-2 sm:px-4 py-2 sm:py-3">
        <div className="relative mb-2">
          <div className="h-0.5 sm:h-1 w-full bg-muted rounded-full overflow-hidden">
            <div
              className="h-full bg-[#2563EB] transition-all duration-300"
              style={{ width: `${progressPercent}%` }}
              data-testid="progress-bar"
            />
          </div>
        </div>

        <div className="flex items-center justify-start overflow-x-auto gap-0.5 sm:gap-1 hide-scrollbar">
          {DISPLAY_PHASES.map((phase, index) => {
            const status = getPhaseStatus(phase);
            const isClickable = status === "completed" || status === "current";

            return (
              <button
                key={phase.id}
                onClick={() => handlePhaseClick(phase)}
                disabled={!isClickable}
                className={cn(
                  "flex flex-col items-center gap-0.5 px-1 sm:px-2 py-1 rounded-md transition-colors min-w-0 flex-shrink-0",
                  isClickable && "cursor-pointer hover-elevate",
                  !isClickable && "cursor-default opacity-50"
                )}
                data-testid={`phase-${phase.id}`}
              >
                <div
                  className={cn(
                    "flex items-center justify-center w-5 h-5 sm:w-6 sm:h-6 rounded-full text-[9px] sm:text-xs font-medium transition-colors",
                    status === "completed" &&
                      "bg-[#2563EB] text-white",
                    status === "current" &&
                      "bg-[#2563EB] text-white ring-2 ring-[#2563EB]/30 ring-offset-1 sm:ring-offset-2 ring-offset-background",
                    status === "upcoming" &&
                      "bg-muted text-muted-foreground"
                  )}
                >
                  {status === "completed" ? (
                    <Check className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                  ) : (
                    index + 1
                  )}
                </div>
                <span
                  className={cn(
                    "text-[8px] sm:text-[10px] whitespace-nowrap transition-colors leading-tight",
                    status === "current" && "font-medium text-foreground",
                    status === "completed" && "text-muted-foreground",
                    status === "upcoming" && "text-muted-foreground"
                  )}
                >
                  <span className="hidden sm:inline">{phase.label}</span>
                  <span className="sm:hidden">{phase.shortLabel}</span>
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
