import { useState, useCallback } from "react";
import { Upload, X, Image as ImageIcon, Camera, Users, Briefcase, ArrowLeftRight, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { PhotoType } from "@shared/schema";

interface UploadedPhoto {
  id: string;
  type: PhotoType;
  url: string;
  file?: File;
  caption?: string;
}

interface PhotoUploadProps {
  photos: UploadedPhoto[];
  onPhotosChange: (photos: UploadedPhoto[]) => void;
  disabled?: boolean;
}

const PHOTO_TYPE_CONFIG: Record<PhotoType, { label: string; icon: typeof ImageIcon; description: string }> = {
  logo: {
    label: "Logo",
    icon: Briefcase,
    description: "Your business logo",
  },
  team: {
    label: "Team Photos",
    icon: Users,
    description: "Photos of your team",
  },
  project: {
    label: "Project Photos",
    icon: Camera,
    description: "Completed project photos",
  },
  before: {
    label: "Before Photos",
    icon: ArrowLeftRight,
    description: "Before transformation",
  },
  after: {
    label: "After Photos",
    icon: ArrowLeftRight,
    description: "After transformation",
  },
  hero: {
    label: "Hero Image",
    icon: ImageIcon,
    description: "Main website banner",
  },
  service: {
    label: "Service Photos",
    icon: Camera,
    description: "Photos of services",
  },
};

async function uploadFile(file: File): Promise<string> {
  const formData = new FormData();
  formData.append("file", file);

  const response = await fetch("/api/onboarding/upload", {
    method: "POST",
    body: formData,
    credentials: "include",
  });

  if (!response.ok) {
    throw new Error("Upload failed");
  }

  const data = await response.json();
  return data.url;
}

export function PhotoUpload({ photos, onPhotosChange, disabled = false }: PhotoUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [activeType, setActiveType] = useState<PhotoType>("project");
  const [uploading, setUploading] = useState<Set<string>>(new Set());

  const generateId = () => Math.random().toString(36).substring(2, 9);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    if (!disabled) {
      setIsDragging(true);
    }
  }, [disabled]);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const processFiles = useCallback(
    async (files: File[]) => {
      if (disabled || files.length === 0) return;

      // Create placeholder photos with temporary blob URLs for instant preview
      const placeholders: UploadedPhoto[] = files.map((file) => ({
        id: generateId(),
        type: activeType,
        url: URL.createObjectURL(file),
        file,
      }));

      const placeholderIds = new Set(placeholders.map((p) => p.id));
      setUploading((prev) => {
        const next = new Set(prev);
        placeholderIds.forEach((id) => next.add(id));
        return next;
      });
      onPhotosChange([...photos, ...placeholders]);

      // Upload each file and replace blob URL with server URL
      const updatedPhotos = [...photos];
      for (const placeholder of placeholders) {
        try {
          const serverUrl = await uploadFile(placeholder.file!);
          // Revoke blob URL
          URL.revokeObjectURL(placeholder.url);
          updatedPhotos.push({
            ...placeholder,
            url: serverUrl,
            file: undefined,
          });
        } catch (error) {
          console.error("Failed to upload file:", error);
          // Keep blob URL as fallback
          updatedPhotos.push(placeholder);
        }
        setUploading((prev) => {
          const next = new Set(prev);
          next.delete(placeholder.id);
          return next;
        });
      }

      onPhotosChange(updatedPhotos);
    },
    [photos, onPhotosChange, activeType, disabled]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      if (disabled) return;

      const files = Array.from(e.dataTransfer.files).filter((file) =>
        file.type.startsWith("image/")
      );

      processFiles(files);
    },
    [disabled, processFiles]
  );

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (disabled || !e.target.files) return;

    const files = Array.from(e.target.files).filter((file) =>
      file.type.startsWith("image/")
    );

    processFiles(files);
    e.target.value = "";
  };

  const handleDelete = (id: string) => {
    if (disabled) return;
    onPhotosChange(photos.filter((p) => p.id !== id));
  };

  const photosByType = photos.reduce((acc, photo) => {
    if (!acc[photo.type]) acc[photo.type] = [];
    acc[photo.type].push(photo);
    return acc;
  }, {} as Record<PhotoType, UploadedPhoto[]>);

  const availableTypes: PhotoType[] = ["logo", "team", "project", "before", "after", "hero", "service"];
  const isUploading = uploading.size > 0;

  return (
    <div className="space-y-4" data-testid="photo-upload">
      <div className="flex flex-wrap gap-2">
        {availableTypes.map((type) => {
          const config = PHOTO_TYPE_CONFIG[type];
          const count = photosByType[type]?.length || 0;
          const Icon = config.icon;

          return (
            <Button
              key={type}
              variant={activeType === type ? "default" : "outline"}
              size="sm"
              onClick={() => setActiveType(type)}
              disabled={disabled}
              className={cn(
                "gap-1.5",
                activeType === type && "bg-[#2563EB] hover:bg-[#1d4ed8]"
              )}
              data-testid={`photo-type-${type}`}
            >
              <Icon className="w-3.5 h-3.5" />
              {config.label}
              {count > 0 && (
                <Badge variant="secondary" className="ml-1 h-5 px-1.5 text-xs">
                  {count}
                </Badge>
              )}
            </Button>
          );
        })}
      </div>

      <Card
        className={cn(
          "border-2 border-dashed transition-colors",
          isDragging && "border-[#2563EB] bg-[#2563EB]/5",
          (disabled || isUploading) && "opacity-50"
        )}
      >
        <CardContent className="p-0">
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className="flex flex-col items-center justify-center py-8 px-4 text-center"
          >
            <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mb-3">
              {isUploading ? (
                <Loader2 className="w-5 h-5 text-muted-foreground animate-spin" />
              ) : (
                <Upload className="w-5 h-5 text-muted-foreground" />
              )}
            </div>
            <p className="text-sm font-medium mb-1">
              {isUploading
                ? `Uploading ${uploading.size} photo${uploading.size !== 1 ? "s" : ""}...`
                : `Drop ${PHOTO_TYPE_CONFIG[activeType].label.toLowerCase()} here`}
            </p>
            <p className="text-xs text-muted-foreground mb-3">
              {PHOTO_TYPE_CONFIG[activeType].description}
            </p>
            <label>
              <input
                type="file"
                accept="image/*"
                multiple
                onChange={handleFileInput}
                disabled={disabled || isUploading}
                className="sr-only"
                data-testid="photo-file-input"
              />
              <Button
                variant="outline"
                size="sm"
                disabled={disabled || isUploading}
                className="cursor-pointer"
                asChild
              >
                <span>Browse Files</span>
              </Button>
            </label>
          </div>
        </CardContent>
      </Card>

      {photos.length > 0 && (
        <div className="space-y-4">
          {availableTypes.map((type) => {
            const typePhotos = photosByType[type];
            if (!typePhotos || typePhotos.length === 0) return null;

            return (
              <div key={type}>
                <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
                  {PHOTO_TYPE_CONFIG[type].label}
                  <Badge variant="secondary" className="text-xs">
                    {typePhotos.length}
                  </Badge>
                </h4>
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                  {typePhotos.map((photo) => (
                    <div
                      key={photo.id}
                      className="relative group aspect-square rounded-md overflow-hidden bg-muted"
                      data-testid={`photo-thumbnail-${photo.id}`}
                    >
                      <img
                        src={photo.url}
                        alt={`${photo.type} photo`}
                        className="w-full h-full object-cover"
                      />
                      {uploading.has(photo.id) && (
                        <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                          <Loader2 className="w-6 h-6 text-white animate-spin" />
                        </div>
                      )}
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <Button
                          variant="destructive"
                          size="icon"
                          className="h-7 w-7"
                          onClick={() => handleDelete(photo.id)}
                          disabled={disabled || uploading.has(photo.id)}
                          data-testid={`delete-photo-${photo.id}`}
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
