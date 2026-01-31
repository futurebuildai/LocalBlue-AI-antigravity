import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { STYLE_TEMPLATES } from "@shared/tradeTemplates";
import type { StylePreference } from "@shared/schema";

interface StylePickerProps {
  onSelect: (styleId: StylePreference) => void;
  selectedStyle?: StylePreference;
}

export function StylePicker({ onSelect, selectedStyle }: StylePickerProps) {
  const styles = Object.values(STYLE_TEMPLATES);

  const getButtonPreview = (buttonStyle: "rounded" | "square" | "pill") => {
    switch (buttonStyle) {
      case "pill":
        return "rounded-full";
      case "square":
        return "rounded-none";
      default:
        return "rounded-md";
    }
  };

  return (
    <div
      className="grid grid-cols-1 sm:grid-cols-2 gap-4"
      data-testid="style-picker"
    >
      {styles.map((style) => {
        const isSelected = selectedStyle === style.id;

        return (
          <Card
            key={style.id}
            className={cn(
              "cursor-pointer transition-all hover-elevate",
              isSelected && "ring-2 ring-primary ring-offset-2 ring-offset-background"
            )}
            onClick={() => onSelect(style.id)}
            data-testid={`style-option-${style.id}`}
          >
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <div
                  className="w-12 h-12 rounded-lg shrink-0 shadow-sm"
                  style={{ backgroundColor: style.colors.primary }}
                  data-testid={`style-swatch-${style.id}`}
                />
                <div className="flex-1 min-w-0">
                  <h3
                    className="font-semibold text-foreground"
                    data-testid={`style-name-${style.id}`}
                  >
                    {style.name}
                  </h3>
                  <p
                    className="text-sm text-muted-foreground mt-0.5"
                    data-testid={`style-description-${style.id}`}
                  >
                    {style.description}
                  </p>
                </div>
              </div>

              <div
                className="mt-4 p-3 rounded-lg"
                style={{ backgroundColor: style.colors.background }}
                data-testid={`style-preview-${style.id}`}
              >
                <div
                  className="text-sm font-medium mb-2"
                  style={{
                    fontFamily: style.fontFamily.heading,
                    color: style.colors.foreground,
                  }}
                >
                  Sample Heading
                </div>
                <div
                  className="text-xs mb-3"
                  style={{
                    fontFamily: style.fontFamily.body,
                    color: style.colors.foreground,
                    opacity: 0.8,
                  }}
                >
                  Body text preview
                </div>
                <div
                  className={cn(
                    "inline-block px-3 py-1.5 text-xs font-medium text-white",
                    getButtonPreview(style.buttonStyle)
                  )}
                  style={{ backgroundColor: style.colors.primary }}
                >
                  Button Style
                </div>
              </div>

              {isSelected && (
                <div
                  className="mt-3 text-xs font-medium text-primary flex items-center gap-1"
                  data-testid={`style-selected-${style.id}`}
                >
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                  Selected
                </div>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
