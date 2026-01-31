import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";
import { AVAILABLE_PAGES } from "@shared/tradeTemplates";
import {
  Home,
  Users,
  Wrench,
  Image,
  Star,
  HelpCircle,
  MapPin,
  Mail,
  Calculator,
  Calendar,
  CreditCard,
  FileText,
} from "lucide-react";

interface PageSelectorProps {
  selectedPages: string[];
  onSelectionChange: (pages: string[]) => void;
}

const PAGE_ICONS: Record<string, React.ElementType> = {
  home: Home,
  about: Users,
  services: Wrench,
  gallery: Image,
  testimonials: Star,
  faq: HelpCircle,
  "service-area": MapPin,
  contact: Mail,
  quote: Calculator,
  schedule: Calendar,
  financing: CreditCard,
  blog: FileText,
};

export function PageSelector({
  selectedPages,
  onSelectionChange,
}: PageSelectorProps) {
  const handleToggle = (pageId: string, isRequired: boolean) => {
    if (isRequired) return;

    if (selectedPages.includes(pageId)) {
      onSelectionChange(selectedPages.filter((id) => id !== pageId));
    } else {
      onSelectionChange([...selectedPages, pageId]);
    }
  };

  return (
    <div
      className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3"
      data-testid="page-selector"
    >
      {AVAILABLE_PAGES.map((page) => {
        const Icon = PAGE_ICONS[page.id] || FileText;
        const isSelected = selectedPages.includes(page.id) || page.required;
        const isDisabled = page.required;

        return (
          <Card
            key={page.id}
            className={cn(
              "transition-all",
              !isDisabled && "cursor-pointer hover-elevate",
              isSelected && !isDisabled && "ring-1 ring-primary/50",
              isDisabled && "opacity-75"
            )}
            onClick={() => handleToggle(page.id, page.required)}
            data-testid={`page-option-${page.id}`}
          >
            <CardContent className="p-3">
              <div className="flex items-start gap-3">
                <div className="pt-0.5">
                  <Checkbox
                    checked={isSelected}
                    disabled={isDisabled}
                    onCheckedChange={() => handleToggle(page.id, page.required)}
                    onClick={(e) => e.stopPropagation()}
                    data-testid={`page-checkbox-${page.id}`}
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <Icon className="w-4 h-4 text-muted-foreground shrink-0" />
                    <span
                      className="font-medium text-sm text-foreground"
                      data-testid={`page-name-${page.id}`}
                    >
                      {page.name}
                    </span>
                    {page.required && (
                      <span
                        className="text-[10px] px-1.5 py-0.5 bg-primary/10 text-primary rounded font-medium"
                        data-testid={`page-required-badge-${page.id}`}
                      >
                        Required
                      </span>
                    )}
                  </div>
                  <p
                    className="text-xs text-muted-foreground mt-1"
                    data-testid={`page-description-${page.id}`}
                  >
                    {page.description}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
