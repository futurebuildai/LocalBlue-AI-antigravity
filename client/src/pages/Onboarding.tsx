import { useState, useEffect, useRef } from "react";
import { useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { Send, Loader2, Sparkles, ArrowLeft, Globe, Phone, Mail, MapPin, ImagePlus } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { FormattedMessage } from "@/lib/message-utils";
import { useIsMobile } from "@/hooks/use-mobile";
import { OnboardingProgress } from "@/components/OnboardingProgress";
import { PhotoUpload } from "@/components/PhotoUpload";
import type { Site, User, OnboardingPhase, PhotoType } from "@shared/schema";

type SanitizedUser = Omit<User, "password">;

interface OnboardingProgressData {
  currentPhase: OnboardingPhase;
  collectedData: Record<string, any>;
  completedPhases: OnboardingPhase[];
}

interface OnboardingSession {
  user: SanitizedUser;
  site: Site;
  messages: Array<{ role: string; content: string }>;
  progress?: OnboardingProgressData;
}

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

interface UploadedPhoto {
  id: string;
  type: PhotoType;
  url: string;
  file?: File;
  caption?: string;
}

interface CollectedData {
  businessName?: string;
  tradeType?: string;
  services?: string[];
  tagline?: string;
  ownerStory?: string;
  serviceArea?: string;
  stylePreference?: string;
  selectedPages?: string[];
}

export default function Onboarding() {
  const [, setLocation] = useLocation();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [readyToGenerate, setReadyToGenerate] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const isMobile = useIsMobile();

  const [currentPhase, setCurrentPhase] = useState<OnboardingPhase>("welcome");
  const [completedPhases, setCompletedPhases] = useState<OnboardingPhase[]>([]);
  const [collectedData, setCollectedData] = useState<CollectedData>({});
  const [photos, setPhotos] = useState<UploadedPhoto[]>([]);
  const [showPhotoUpload, setShowPhotoUpload] = useState(false);

  const { data: session, isLoading, error } = useQuery<OnboardingSession>({
    queryKey: ["/api/onboarding/session"],
  });

  useEffect(() => {
    if (session?.messages && session.messages.length > 0) {
      setMessages(session.messages.map(m => ({ 
        role: m.role as "user" | "assistant", 
        content: m.content 
      })));
      const lastAssistant = session.messages.filter(m => m.role === "assistant").pop();
      if (lastAssistant?.content.includes("READY_TO_GENERATE")) {
        setReadyToGenerate(true);
      }
    }
    if (session?.site) {
      setCollectedData(prev => ({
        ...prev,
        businessName: session.site.businessName,
        tradeType: session.site.tradeType || undefined,
        services: session.site.services || [],
        tagline: session.site.tagline || undefined,
        ownerStory: session.site.ownerStory || undefined,
        serviceArea: session.site.serviceArea || undefined,
        stylePreference: session.site.stylePreference || undefined,
        selectedPages: session.site.selectedPages || [],
      }));
    }
    if (session?.progress) {
      setCurrentPhase(session.progress.currentPhase);
      setCompletedPhases(session.progress.completedPhases || []);
      if (session.progress.collectedData) {
        setCollectedData(prev => ({ ...prev, ...session.progress!.collectedData }));
      }
    }
  }, [session]);

  useEffect(() => {
    if (scrollAreaRef.current) {
      const scrollContainer = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]');
      if (scrollContainer) {
        scrollContainer.scrollTop = scrollContainer.scrollHeight;
      }
    }
  }, [messages]);

  const generateMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/onboarding/generate", {});
      return response.json();
    },
    onSuccess: (data) => {
      if (data.redirectUrl) {
        window.location.href = data.redirectUrl;
      } else {
        setLocation("/");
      }
    },
  });

  const sendMessage = async () => {
    if (!inputValue.trim() || isStreaming) return;

    const userMessage = inputValue.trim();
    setInputValue("");
    setMessages(prev => [...prev, { role: "user", content: userMessage }]);
    setIsStreaming(true);

    try {
      const response = await fetch("/api/onboarding/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: userMessage }),
        credentials: "include",
      });

      if (!response.ok) {
        if (response.status === 401) {
          setLocation("/signup");
          return;
        }
        throw new Error("Failed to send message");
      }

      const reader = response.body?.getReader();
      if (!reader) throw new Error("No reader available");

      const decoder = new TextDecoder();
      let assistantMessage = "";
      let buffer = "";
      setMessages(prev => [...prev, { role: "assistant", content: "" }]);

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        buffer += chunk;
        
        // Process complete lines from buffer
        const lines = buffer.split("\n");
        // Keep last incomplete line in buffer
        buffer = lines.pop() || "";

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            try {
              const data = JSON.parse(line.slice(6));
              if (data.content) {
                assistantMessage += data.content;
                setMessages(prev => {
                  const newMessages = [...prev];
                  newMessages[newMessages.length - 1] = {
                    role: "assistant",
                    content: assistantMessage,
                  };
                  return newMessages;
                });
              }
              if (data.done) {
                // Process phase update - but don't overwrite user-controlled phases
                if (data.phase) {
                  setCurrentPhase(prevPhase => {
                    // Don't let SSE overwrite if user is in photos or review
                    if (prevPhase === "photos" || prevPhase === "review") {
                      return prevPhase;
                    }
                    return data.phase;
                  });
                }
                // Process collected data for live preview
                if (data.collectedData) {
                  setCollectedData(prev => ({ ...prev, ...data.collectedData }));
                }
                // Check if ready to generate
                if (data.readyToGenerate) {
                  setReadyToGenerate(true);
                  setCurrentPhase("review");
                  setCompletedPhases(prev => {
                    const updated = prev.includes("photos") ? prev : [...prev, "photos" as OnboardingPhase];
                    // Sync to backend
                    apiRequest("POST", "/api/onboarding/preferences", {
                      currentPhase: "review",
                      completedPhases: updated,
                    }).catch(err => console.error("Error syncing phase:", err));
                    return updated;
                  });
                }
              }
            } catch {
              // Silently ignore parse errors for incomplete chunks
            }
          }
        }
      }
      
      // Process any remaining data in buffer
      if (buffer.startsWith("data: ")) {
        try {
          const data = JSON.parse(buffer.slice(6));
          if (data.collectedData) {
            setCollectedData(prev => ({ ...prev, ...data.collectedData }));
          }
          if (data.phase) {
            // Don't overwrite user-controlled phases
            setCurrentPhase(prevPhase => {
              if (prevPhase === "photos" || prevPhase === "review") {
                return prevPhase;
              }
              return data.phase;
            });
          }
        } catch {
          // Ignore final parse error
        }
      }
    } catch (err) {
      console.error("Error sending message:", err);
      setMessages(prev => [
        ...prev,
        { role: "assistant", content: "Sorry, something went wrong. Please try again." },
      ]);
    } finally {
      setIsStreaming(false);
      inputRef.current?.focus();
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const handleGenerate = () => {
    setIsGenerating(true);
    generateMutation.mutate();
  };

  const handlePhaseClick = (phase: OnboardingPhase) => {
    setCurrentPhase(phase);
    if (phase === "photos") {
      setShowPhotoUpload(true);
    } else {
      setShowPhotoUpload(false);
    }
  };

  const handlePhotosChange = async (newPhotos: UploadedPhoto[]) => {
    setPhotos(newPhotos);
    
    // Persist new photos to the API
    const existingIds = photos.map(p => p.id);
    const newlyAdded = newPhotos.filter(p => !existingIds.includes(p.id));
    
    for (const photo of newlyAdded) {
      try {
        await apiRequest("POST", "/api/onboarding/photos", {
          url: photo.url,
          type: photo.type,
          caption: photo.caption,
        });
      } catch (error) {
        console.error("Error persisting photo:", error);
      }
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex items-center gap-2 text-muted-foreground" data-testid="text-loading">
          <Loader2 className="h-5 w-5 animate-spin" />
          Loading...
        </div>
      </div>
    );
  }

  if (error || !session) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Card className="p-6 text-center max-w-md">
          <h2 className="text-lg font-semibold mb-2" data-testid="text-error-title">Session Required</h2>
          <p className="text-muted-foreground mb-4" data-testid="text-error-message">
            Please sign up first to begin the onboarding process.
          </p>
          <Button onClick={() => setLocation("/signup")} data-testid="button-go-signup">
            Go to Sign Up
          </Button>
        </Card>
      </div>
    );
  }

  const displayMessages = messages.map(m => ({
    ...m,
    content: m.content.replace("READY_TO_GENERATE", "").trim(),
  }));

  const siteData = collectedData.businessName ? collectedData : {
    businessName: session.site.businessName,
    services: session.site.services || [],
    tagline: session.site.tagline,
    serviceArea: session.site.serviceArea,
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
        <div className="flex flex-col sm:flex-row h-auto sm:h-14 items-start sm:items-center justify-between gap-2 px-2 sm:px-4 py-2 sm:py-0">
          <div className="flex items-center gap-2 min-w-0">
            <Button 
              variant="ghost" 
              size="icon"
              onClick={() => setLocation("/signup")}
              data-testid="button-back"
              className="h-9 w-9"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div className="flex items-center gap-2 min-w-0">
              <img src="/logo-wordmark.png" alt="LocalBlue" className="h-5 sm:h-7 object-contain flex-shrink-0" />
              <div className="h-4 sm:h-6 w-px bg-border flex-shrink-0 hidden sm:block" />
              <div className="min-w-0">
                <h1 className="text-xs sm:text-sm font-semibold truncate" data-testid="text-business-name">
                  {session.site.businessName}
                </h1>
                <p className="text-[10px] sm:text-xs text-muted-foreground">Website Setup</p>
              </div>
            </div>
          </div>
          {readyToGenerate && (
            <Button
              onClick={handleGenerate}
              disabled={isGenerating}
              className="bg-[#2563EB] hover:bg-[#1d4ed8] w-full sm:w-auto text-xs sm:text-sm"
              size="sm"
              data-testid="button-generate-site"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="mr-1 sm:mr-2 h-3 w-3 sm:h-4 sm:w-4 animate-spin" />
                  <span className="text-xs sm:text-sm">Generating...</span>
                </>
              ) : (
                <>
                  <Sparkles className="mr-1 sm:mr-2 h-3 w-3 sm:h-4 sm:w-4" />
                  <span className="text-xs sm:text-sm">Generate Site</span>
                </>
              )}
            </Button>
          )}
        </div>
      </header>

      <OnboardingProgress
        currentPhase={currentPhase}
        completedPhases={completedPhases}
        onPhaseClick={handlePhaseClick}
      />

      <main className="flex-1 flex overflow-hidden">
        <div className={`flex flex-col ${isMobile ? 'w-full' : 'w-[55%]'} ${!isMobile && 'border-r'}`}>
          {showPhotoUpload && currentPhase === "photos" ? (
            <div className="flex-1 overflow-auto p-2 sm:p-4">
              <div className="max-w-2xl mx-auto px-2 sm:px-0">
                <h2 className="text-base sm:text-lg font-semibold mb-2">Upload Your Photos</h2>
                <p className="text-xs sm:text-sm text-muted-foreground mb-4">
                  Add photos to make your website stand out. You can upload your logo, team photos, project photos, and before/after shots.
                </p>
                <PhotoUpload
                  photos={photos}
                  onPhotosChange={handlePhotosChange}
                  disabled={isStreaming}
                />
                <div className="mt-4 flex justify-end">
                  <Button
                    onClick={async () => {
                      const newCompletedPhases: OnboardingPhase[] = completedPhases.includes("photos") 
                        ? completedPhases 
                        : [...completedPhases, "photos" as OnboardingPhase];
                      
                      // Update local state
                      setShowPhotoUpload(false);
                      setCurrentPhase("review");
                      setCompletedPhases(newCompletedPhases);
                      
                      // Sync with backend to prevent SSE from overriding
                      try {
                        await apiRequest("POST", "/api/onboarding/preferences", {
                          currentPhase: "review",
                          completedPhases: newCompletedPhases,
                        });
                      } catch (error) {
                        console.error("Error syncing phase:", error);
                      }
                    }}
                    className="bg-[#2563EB] hover:bg-[#1d4ed8] text-xs sm:text-sm w-full sm:w-auto"
                    size="sm"
                    data-testid="button-continue-chat"
                  >
                    Continue to Review
                  </Button>
                </div>
              </div>
            </div>
          ) : (
            <>
              <ScrollArea ref={scrollAreaRef} className="flex-1 p-2 sm:p-4" data-testid="chat-messages-container">
                <div className="space-y-3 sm:space-y-4 pb-4 max-w-2xl mx-auto px-2 sm:px-0">
                  {displayMessages.length === 0 && (
                    <div className="flex justify-start">
                      <div className="max-w-xs sm:max-w-sm rounded-lg bg-muted p-3 sm:p-4" data-testid="message-welcome">
                        <p className="text-xs sm:text-sm">
                          Hi there! I'm excited to help you set up your professional website for{" "}
                          <strong>{session.site.businessName}</strong>. Let's start with the basics - what services does your business offer?
                        </p>
                      </div>
                    </div>
                  )}
                  {displayMessages.map((message, index) => (
                    <div
                      key={index}
                      className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
                      data-testid={`message-${message.role}-${index}`}
                    >
                      <div
                        className={`max-w-xs sm:max-w-sm rounded-lg p-3 sm:p-4 ${
                          message.role === "user"
                            ? "bg-[#2563EB] text-white"
                            : "bg-muted"
                        }`}
                      >
                        <p className="text-xs sm:text-sm whitespace-pre-wrap break-words">
                          {message.role === "assistant" ? (
                            <FormattedMessage content={message.content} />
                          ) : (
                            message.content
                          )}
                        </p>
                      </div>
                    </div>
                  ))}
                  {isStreaming && messages[messages.length - 1]?.content === "" && (
                    <div className="flex justify-start">
                      <div className="max-w-xs sm:max-w-sm rounded-lg bg-muted p-3 sm:p-4" data-testid="typing-indicator">
                        <div className="flex items-center gap-1">
                          <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-muted-foreground/50 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                          <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-muted-foreground/50 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                          <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-muted-foreground/50 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </ScrollArea>

              <div className="border-t p-2 sm:p-4 bg-background">
                <div className="flex gap-2 max-w-2xl mx-auto px-2 sm:px-0">
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => {
                      setCurrentPhase("photos");
                      setShowPhotoUpload(true);
                    }}
                    disabled={isStreaming}
                    className="min-h-10 sm:min-h-9 flex-shrink-0"
                    data-testid="button-add-photos"
                    title="Upload photos"
                  >
                    <ImagePlus className="h-4 w-4" />
                  </Button>
                  <Input
                    ref={inputRef}
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onKeyDown={handleKeyPress}
                    placeholder="Type your message..."
                    disabled={isStreaming}
                    className="flex-1 min-h-10 sm:min-h-9"
                    data-testid="input-message"
                  />
                  <Button
                    onClick={sendMessage}
                    disabled={!inputValue.trim() || isStreaming}
                    className="bg-[#2563EB] hover:bg-[#1d4ed8] min-h-10 sm:min-h-9 flex-shrink-0"
                    size="sm"
                    data-testid="button-send"
                  >
                    {isStreaming ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <>
                        <Send className="h-4 w-4 sm:mr-1.5" />
                        <span className="hidden sm:inline">Send</span>
                      </>
                    )}
                  </Button>
                </div>
                <p className="text-[10px] sm:text-xs text-muted-foreground text-center mt-2 px-2">
                  Tell us about your business and we'll create your website
                </p>
              </div>
            </>
          )}
        </div>

        {!isMobile && (
          <div className="hidden md:flex w-[45%] bg-muted/30 overflow-auto p-3 flex-col" data-testid="preview-panel">
            <div className="sticky top-0 pb-2">
              <div className="flex items-center justify-between mb-3 gap-2">
                <h3 className="text-xs font-medium flex items-center gap-2 flex-shrink-0">
                  <Globe className="w-3 h-3 text-[#2563EB]" />
                  <span className="hidden lg:inline">Live Preview</span>
                  <span className="lg:hidden">Preview</span>
                </h3>
                <span className="text-[10px] text-muted-foreground bg-muted px-2 py-0.5 rounded whitespace-nowrap">
                  Live
                </span>
              </div>

              <div className="bg-background rounded-lg border shadow-sm overflow-hidden flex-1">
                <div className="h-1.5 bg-gradient-to-r from-[#2563EB] to-[#1d4ed8]" />

                <div className="p-2 border-b">
                  <div className="flex items-center justify-between gap-1">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <div className="w-6 h-6 rounded-md bg-[#2563EB] flex items-center justify-center text-white font-bold text-[10px] flex-shrink-0">
                        {siteData.businessName?.charAt(0) || "B"}
                      </div>
                      <span className="font-semibold text-[10px] truncate">{siteData.businessName || "Your Business"}</span>
                    </div>
                    <div className="flex gap-1">
                      <Skeleton className="h-5 w-10" />
                      <Skeleton className="h-5 w-10" />
                    </div>
                  </div>
                </div>

                <div className="bg-gradient-to-br from-[#2563EB]/10 to-[#2563EB]/5 p-3 text-center">
                  <h1 className="text-xs font-bold mb-0.5">{siteData.businessName || "Your Business"}</h1>
                  {siteData.tagline ? (
                    <p className="text-[9px] text-muted-foreground mb-2">{siteData.tagline}</p>
                  ) : (
                    <Skeleton className="h-2 w-32 mx-auto mb-2" />
                  )}
                  <Button size="sm" className="bg-[#2563EB] hover:bg-[#1d4ed8] text-[9px] h-6" onClick={(e) => e.preventDefault()}>
                    Get Quote
                  </Button>
                </div>

                <div className="p-2">
                  <h3 className="text-[9px] font-semibold mb-1">Services</h3>
                  {siteData.services && siteData.services.length > 0 ? (
                    <div className="grid grid-cols-2 gap-1">
                      {siteData.services.slice(0, 4).map((service, i) => (
                        <div key={i} className="bg-muted rounded-md p-1 text-[8px] line-clamp-2">
                          {service}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 gap-1">
                      <Skeleton className="h-6 rounded-md" />
                      <Skeleton className="h-6 rounded-md" />
                      <Skeleton className="h-6 rounded-md" />
                      <Skeleton className="h-6 rounded-md" />
                    </div>
                  )}
                </div>

                <div className="p-2 bg-muted/50">
                  <h3 className="text-[9px] font-semibold mb-1">Contact</h3>
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-1 text-[8px] text-muted-foreground">
                      <Phone className="w-2.5 h-2.5 flex-shrink-0" />
                      <span className="truncate">Phone</span>
                    </div>
                    <div className="flex items-center gap-1 text-[8px] text-muted-foreground">
                      <Mail className="w-2.5 h-2.5 flex-shrink-0" />
                      <span className="truncate">Email</span>
                    </div>
                    {siteData.serviceArea && (
                      <div className="flex items-center gap-1 text-[8px] text-muted-foreground">
                        <MapPin className="w-2.5 h-2.5 flex-shrink-0" />
                        <span className="truncate">{siteData.serviceArea}</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="p-1.5 border-t bg-muted/30 text-center">
                  <p className="text-[7px] text-muted-foreground">
                    Powered by LocalBlue
                  </p>
                </div>
              </div>

              {photos.length > 0 && (
                <div className="mt-2">
                  <h4 className="text-[9px] font-medium mb-1">Photos ({photos.length})</h4>
                  <div className="grid grid-cols-4 gap-1">
                    {photos.slice(0, 8).map((photo) => (
                      <div key={photo.id} className="aspect-square rounded-md overflow-hidden bg-muted">
                        <img src={photo.url} alt="" className="w-full h-full object-cover" />
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
