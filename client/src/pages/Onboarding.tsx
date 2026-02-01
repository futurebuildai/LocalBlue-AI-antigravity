import { useState, useEffect, useRef } from "react";
import { useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { Send, Loader2, Sparkles, ArrowLeft, Globe, Phone, Mail, MapPin } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { FormattedMessage } from "@/lib/message-utils";
import { useIsMobile } from "@/hooks/use-mobile";
import { OnboardingProgress } from "@/components/OnboardingProgress";
import { PhotoUpload } from "@/components/PhotoUpload";
import { StylePicker } from "@/components/StylePicker";
import { PageSelector } from "@/components/PageSelector";
import type { Site, User, OnboardingPhase, PhotoType, StylePreference } from "@shared/schema";

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
                // Process phase update
                if (data.phase) {
                  setCurrentPhase(data.phase);
                }
                // Process collected data for live preview
                if (data.collectedData) {
                  setCollectedData(prev => ({ ...prev, ...data.collectedData }));
                }
                // Check if ready to generate
                if (data.readyToGenerate) {
                  setReadyToGenerate(true);
                  setCurrentPhase("review");
                  setCompletedPhases(prev => 
                    prev.includes("photos") ? prev : [...prev, "photos"]
                  );
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
            setCurrentPhase(data.phase);
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

  const handleStyleSelect = async (styleId: StylePreference) => {
    setCollectedData(prev => ({ ...prev, stylePreference: styleId }));
    
    try {
      await apiRequest("POST", "/api/onboarding/preferences", {
        stylePreference: styleId,
      });
    } catch (error) {
      console.error("Error saving style preference:", error);
    }
  };

  const handlePagesChange = async (pages: string[]) => {
    setCollectedData(prev => ({ ...prev, selectedPages: pages }));
    
    try {
      await apiRequest("POST", "/api/onboarding/preferences", {
        selectedPages: pages,
      });
    } catch (error) {
      console.error("Error saving page preferences:", error);
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
        <div className="flex h-14 items-center justify-between px-4">
          <div className="flex items-center gap-3">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => setLocation("/signup")}
              data-testid="button-back"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div className="flex items-center gap-3">
              <img src="/logo-wordmark.png" alt="LocalBlue" className="h-7 object-contain" />
              <div className="h-6 w-px bg-border" />
              <div>
                <h1 className="text-sm font-semibold" data-testid="text-business-name">
                  {session.site.businessName}
                </h1>
                <p className="text-xs text-muted-foreground">Website Setup</p>
              </div>
            </div>
          </div>
          {readyToGenerate && (
            <Button
              onClick={handleGenerate}
              disabled={isGenerating}
              className="bg-[#2563EB] hover:bg-[#1d4ed8]"
              data-testid="button-generate-site"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Sparkles className="mr-2 h-4 w-4" />
                  Generate My Site
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
        <div className={`flex flex-col ${isMobile ? 'w-full' : 'w-[60%]'} border-r`}>
          {currentPhase === "style" ? (
            <div className="flex-1 overflow-auto p-4">
              <div className="max-w-2xl mx-auto">
                <h2 className="text-lg font-semibold mb-2" data-testid="text-style-title">Choose Your Style</h2>
                <p className="text-sm text-muted-foreground mb-4">
                  Select a visual style that best represents your brand and business personality.
                </p>
                <StylePicker
                  onSelect={handleStyleSelect}
                  selectedStyle={collectedData.stylePreference as StylePreference | undefined}
                />
                <div className="mt-4 flex justify-end">
                  <Button
                    onClick={() => setCurrentPhase("pages")}
                    className="bg-[#2563EB] hover:bg-[#1d4ed8]"
                    data-testid="button-continue-to-pages"
                  >
                    Continue to Page Selection
                  </Button>
                </div>
              </div>
            </div>
          ) : currentPhase === "pages" ? (
            <div className="flex-1 overflow-auto p-4">
              <div className="max-w-2xl mx-auto">
                <h2 className="text-lg font-semibold mb-2" data-testid="text-pages-title">Select Your Pages</h2>
                <p className="text-sm text-muted-foreground mb-4">
                  Choose which pages you want to include on your website. Required pages are pre-selected.
                </p>
                <PageSelector
                  selectedPages={collectedData.selectedPages || ["home", "services", "contact"]}
                  onSelectionChange={handlePagesChange}
                />
                <div className="mt-4 flex justify-end">
                  <Button
                    onClick={() => {
                      setCurrentPhase("photos");
                      setShowPhotoUpload(true);
                    }}
                    className="bg-[#2563EB] hover:bg-[#1d4ed8]"
                    data-testid="button-continue-to-photos"
                  >
                    Continue to Photos
                  </Button>
                </div>
              </div>
            </div>
          ) : showPhotoUpload && currentPhase === "photos" ? (
            <div className="flex-1 overflow-auto p-4">
              <div className="max-w-2xl mx-auto">
                <h2 className="text-lg font-semibold mb-2">Upload Your Photos</h2>
                <p className="text-sm text-muted-foreground mb-4">
                  Add photos to make your website stand out. You can upload your logo, team photos, project photos, and before/after shots.
                </p>
                <PhotoUpload
                  photos={photos}
                  onPhotosChange={handlePhotosChange}
                  disabled={isStreaming}
                />
                <div className="mt-4 flex justify-end">
                  <Button
                    onClick={() => setShowPhotoUpload(false)}
                    className="bg-[#2563EB] hover:bg-[#1d4ed8]"
                    data-testid="button-continue-chat"
                  >
                    Continue to Chat
                  </Button>
                </div>
              </div>
            </div>
          ) : (
            <>
              <ScrollArea ref={scrollAreaRef} className="flex-1 p-4" data-testid="chat-messages-container">
                <div className="space-y-4 pb-4 max-w-2xl mx-auto">
                  {displayMessages.length === 0 && (
                    <div className="flex justify-start">
                      <div className="max-w-[85%] rounded-lg bg-muted p-4" data-testid="message-welcome">
                        <p className="text-sm">
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
                        className={`max-w-[85%] rounded-lg p-4 ${
                          message.role === "user"
                            ? "bg-[#2563EB] text-white"
                            : "bg-muted"
                        }`}
                      >
                        <p className="text-sm whitespace-pre-wrap">
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
                      <div className="max-w-[85%] rounded-lg bg-muted p-4" data-testid="typing-indicator">
                        <div className="flex items-center gap-1">
                          <div className="w-2 h-2 bg-muted-foreground/50 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                          <div className="w-2 h-2 bg-muted-foreground/50 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                          <div className="w-2 h-2 bg-muted-foreground/50 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </ScrollArea>

              <div className="border-t p-4">
                <div className="flex gap-2 max-w-2xl mx-auto">
                  <Input
                    ref={inputRef}
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onKeyDown={handleKeyPress}
                    placeholder="Type your message..."
                    disabled={isStreaming}
                    className="flex-1"
                    data-testid="input-message"
                  />
                  <Button
                    onClick={sendMessage}
                    disabled={!inputValue.trim() || isStreaming}
                    className="bg-[#2563EB] hover:bg-[#1d4ed8]"
                    data-testid="button-send"
                  >
                    {isStreaming ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Send className="h-4 w-4" />
                    )}
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground text-center mt-2">
                  Tell us about your business and we'll create your website
                </p>
              </div>
            </>
          )}
        </div>

        {!isMobile && (
          <div className="w-[40%] bg-muted/30 overflow-auto p-4" data-testid="preview-panel">
            <div className="sticky top-0">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-medium flex items-center gap-2">
                  <Globe className="w-4 h-4 text-[#2563EB]" />
                  Live Preview
                </h3>
                <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded">
                  Updates as you chat
                </span>
              </div>

              <div className="bg-background rounded-lg border shadow-sm overflow-hidden">
                <div className="h-2 bg-gradient-to-r from-[#2563EB] to-[#1d4ed8]" />

                <div className="p-4 border-b">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-md bg-[#2563EB] flex items-center justify-center text-white font-bold text-xs">
                        {siteData.businessName?.charAt(0) || "B"}
                      </div>
                      <span className="font-semibold text-sm">{siteData.businessName || "Your Business"}</span>
                    </div>
                    <div className="flex gap-2">
                      <Skeleton className="h-6 w-12" />
                      <Skeleton className="h-6 w-12" />
                      <Skeleton className="h-6 w-16" />
                    </div>
                  </div>
                </div>

                <div className="bg-gradient-to-br from-[#2563EB]/10 to-[#2563EB]/5 p-6 text-center">
                  <h1 className="text-lg font-bold mb-1">{siteData.businessName || "Your Business"}</h1>
                  {siteData.tagline ? (
                    <p className="text-xs text-muted-foreground mb-3">{siteData.tagline}</p>
                  ) : (
                    <Skeleton className="h-3 w-48 mx-auto mb-3" />
                  )}
                  <Button size="sm" className="bg-[#2563EB] hover:bg-[#1d4ed8] text-xs h-7">
                    Get a Free Quote
                  </Button>
                </div>

                <div className="p-4">
                  <h3 className="text-xs font-semibold mb-2">Our Services</h3>
                  {siteData.services && siteData.services.length > 0 ? (
                    <div className="grid grid-cols-2 gap-2">
                      {siteData.services.slice(0, 4).map((service, i) => (
                        <div key={i} className="bg-muted rounded-md p-2 text-xs">
                          {service}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 gap-2">
                      <Skeleton className="h-8 rounded-md" />
                      <Skeleton className="h-8 rounded-md" />
                      <Skeleton className="h-8 rounded-md" />
                      <Skeleton className="h-8 rounded-md" />
                    </div>
                  )}
                </div>

                <div className="p-4 bg-muted/50">
                  <h3 className="text-xs font-semibold mb-2">Contact</h3>
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Phone className="w-3 h-3" />
                      <span>Phone number</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Mail className="w-3 h-3" />
                      <span>Email address</span>
                    </div>
                    {siteData.serviceArea && (
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <MapPin className="w-3 h-3" />
                        <span>{siteData.serviceArea}</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="p-2 border-t bg-muted/30 text-center">
                  <p className="text-[10px] text-muted-foreground">
                    Powered by LocalBlue
                  </p>
                </div>
              </div>

              {photos.length > 0 && (
                <div className="mt-4">
                  <h4 className="text-xs font-medium mb-2">Uploaded Photos ({photos.length})</h4>
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
