import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { usePreview } from "@/contexts/PreviewContext";
import { X, ChevronLeft, ChevronRight } from "lucide-react";
import type { SitePhoto, PhotoType } from "@shared/schema";

interface ProjectGalleryProps {
  siteId: string;
  className?: string;
}

const FILTER_OPTIONS: { label: string; value: PhotoType | "all" }[] = [
  { label: "All", value: "all" },
  { label: "Projects", value: "project" },
  { label: "Before", value: "before" },
  { label: "After", value: "after" },
  { label: "Team", value: "team" },
  { label: "Services", value: "service" },
];

export function ProjectGallery({ siteId, className }: ProjectGalleryProps) {
  const [activeFilter, setActiveFilter] = useState<PhotoType | "all">("all");
  const [selectedPhoto, setSelectedPhoto] = useState<SitePhoto | null>(null);
  const [selectedIndex, setSelectedIndex] = useState<number>(0);
  const { getApiPath } = usePreview();

  const { data: photos, isLoading } = useQuery<SitePhoto[]>({
    queryKey: [getApiPath("/api/tenant/photos"), siteId],
    enabled: !!siteId,
  });

  const filteredPhotos =
    photos?.filter(
      (photo) => activeFilter === "all" || photo.type === activeFilter
    ) || [];

  const handlePhotoClick = (photo: SitePhoto, index: number) => {
    setSelectedPhoto(photo);
    setSelectedIndex(index);
  };

  const handlePrevious = () => {
    if (filteredPhotos.length === 0) return;
    const newIndex =
      selectedIndex === 0 ? filteredPhotos.length - 1 : selectedIndex - 1;
    setSelectedIndex(newIndex);
    setSelectedPhoto(filteredPhotos[newIndex]);
  };

  const handleNext = () => {
    if (filteredPhotos.length === 0) return;
    const newIndex =
      selectedIndex === filteredPhotos.length - 1 ? 0 : selectedIndex + 1;
    setSelectedIndex(newIndex);
    setSelectedPhoto(filteredPhotos[newIndex]);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowLeft") {
      handlePrevious();
    } else if (e.key === "ArrowRight") {
      handleNext();
    } else if (e.key === "Escape") {
      setSelectedPhoto(null);
    }
  };

  if (isLoading) {
    return (
      <div className={cn("w-full", className)} data-testid="gallery-loading">
        <div className="flex gap-2 mb-6 flex-wrap">
          {FILTER_OPTIONS.map((option) => (
            <Skeleton key={option.value} className="h-9 w-20" />
          ))}
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="aspect-square rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  if (!photos || photos.length === 0) {
    return (
      <div
        className={cn("w-full text-center py-12", className)}
        data-testid="gallery-empty"
      >
        <p className="text-muted-foreground">No photos available yet.</p>
      </div>
    );
  }

  return (
    <div className={cn("w-full", className)} data-testid="project-gallery">
      <div
        className="flex gap-2 mb-6 flex-wrap"
        data-testid="gallery-filters"
      >
        {FILTER_OPTIONS.map((option) => {
          const count =
            option.value === "all"
              ? photos.length
              : photos.filter((p) => p.type === option.value).length;

          if (count === 0 && option.value !== "all") return null;

          return (
            <Button
              key={option.value}
              variant={activeFilter === option.value ? "default" : "outline"}
              size="sm"
              onClick={() => setActiveFilter(option.value)}
              data-testid={`filter-${option.value}`}
            >
              {option.label}
              <span className="ml-1.5 text-xs opacity-70">({count})</span>
            </Button>
          );
        })}
      </div>

      <div
        className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4"
        data-testid="gallery-grid"
      >
        {filteredPhotos.map((photo, index) => (
          <div
            key={photo.id}
            className="group relative aspect-square rounded-lg overflow-hidden cursor-pointer hover-elevate"
            onClick={() => handlePhotoClick(photo, index)}
            data-testid={`gallery-photo-${photo.id}`}
          >
            <img
              src={photo.url}
              alt={photo.caption || `Photo ${index + 1}`}
              className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
              loading="lazy"
            />
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-300" />
            {photo.caption && (
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                <p className="text-white text-sm truncate">{photo.caption}</p>
              </div>
            )}
          </div>
        ))}
      </div>

      <Dialog
        open={!!selectedPhoto}
        onOpenChange={(open) => !open && setSelectedPhoto(null)}
      >
        <DialogContent
          className="max-w-4xl w-full p-0 bg-black/95 border-none"
          onKeyDown={handleKeyDown}
          data-testid="gallery-lightbox"
        >
          <div className="relative flex items-center justify-center min-h-[60vh]">
            <Button
              variant="ghost"
              size="icon"
              className="absolute left-2 top-1/2 -translate-y-1/2 text-white hover:bg-white/20 z-10"
              onClick={handlePrevious}
              data-testid="lightbox-previous"
            >
              <ChevronLeft className="h-8 w-8" />
            </Button>

            <Button
              variant="ghost"
              size="icon"
              className="absolute right-2 top-1/2 -translate-y-1/2 text-white hover:bg-white/20 z-10"
              onClick={handleNext}
              data-testid="lightbox-next"
            >
              <ChevronRight className="h-8 w-8" />
            </Button>

            {selectedPhoto && (
              <div className="flex flex-col items-center w-full p-4">
                <img
                  src={selectedPhoto.url}
                  alt={selectedPhoto.caption || "Photo"}
                  className="max-h-[70vh] max-w-full object-contain rounded-lg"
                  data-testid="lightbox-image"
                />
                {selectedPhoto.caption && (
                  <p
                    className="mt-4 text-white text-center text-sm"
                    data-testid="lightbox-caption"
                  >
                    {selectedPhoto.caption}
                  </p>
                )}
                <p className="mt-2 text-white/60 text-xs">
                  {selectedIndex + 1} of {filteredPhotos.length}
                </p>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
