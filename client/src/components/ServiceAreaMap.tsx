import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { MapPin, Map } from "lucide-react";

interface ServiceAreaMapProps {
  serviceArea: string;
  cities?: string[];
  className?: string;
}

export function ServiceAreaMap({
  serviceArea,
  cities,
  className,
}: ServiceAreaMapProps) {
  return (
    <div className={cn("w-full", className)} data-testid="service-area-map">
      <div className="flex items-start gap-3 mb-6" data-testid="service-area-header">
        <div className="p-2 rounded-lg bg-primary/10">
          <MapPin className="h-6 w-6 text-primary" />
        </div>
        <div>
          <h3 className="text-lg font-semibold" data-testid="service-area-title">
            Service Area
          </h3>
          <p
            className="text-xl font-bold text-primary mt-1"
            data-testid="service-area-text"
          >
            {serviceArea}
          </p>
        </div>
      </div>

      {cities && cities.length > 0 && (
        <div className="mb-6" data-testid="cities-container">
          <p className="text-sm text-muted-foreground mb-3">Cities We Serve</p>
          <div className="flex flex-wrap gap-2" data-testid="cities-list">
            {cities.map((city, index) => (
              <Badge
                key={index}
                variant="secondary"
                className="px-3 py-1"
                data-testid={`city-badge-${index}`}
              >
                <MapPin className="h-3 w-3 mr-1.5" />
                {city}
              </Badge>
            ))}
          </div>
        </div>
      )}

      <Card className="overflow-hidden" data-testid="map-placeholder">
        <CardContent className="p-0">
          <div className="relative bg-muted h-64 flex items-center justify-center">
            <div className="absolute inset-0 opacity-10">
              <svg
                className="w-full h-full"
                viewBox="0 0 100 100"
                preserveAspectRatio="none"
              >
                <defs>
                  <pattern
                    id="grid"
                    width="10"
                    height="10"
                    patternUnits="userSpaceOnUse"
                  >
                    <path
                      d="M 10 0 L 0 0 0 10"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="0.5"
                    />
                  </pattern>
                </defs>
                <rect width="100" height="100" fill="url(#grid)" />
              </svg>
            </div>
            
            <div className="relative z-10 text-center" data-testid="map-placeholder-content">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
                <Map className="h-8 w-8 text-primary" />
              </div>
              <p className="text-muted-foreground text-sm font-medium">
                Interactive Map Coming Soon
              </p>
              <p className="text-muted-foreground text-xs mt-1">
                Serving {serviceArea}
              </p>
            </div>

            <div className="absolute top-4 right-4 flex flex-col gap-2">
              <div className="w-8 h-8 bg-background rounded-md shadow-sm flex items-center justify-center text-muted-foreground">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
              </div>
              <div className="w-8 h-8 bg-background rounded-md shadow-sm flex items-center justify-center text-muted-foreground">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                </svg>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
