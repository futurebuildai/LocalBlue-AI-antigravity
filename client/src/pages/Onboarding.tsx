import { useState, useEffect, useRef } from "react";
import { useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Send, Loader2, Sparkles, ArrowLeft, ImagePlus, Bot, User } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { FormattedMessage } from "@/lib/message-utils";
import { PhotoUpload } from "@/components/PhotoUpload";
import type { Site, User as UserType, OnboardingPhase, PhotoType } from "@shared/schema";

type SanitizedUser = Omit<UserType, "password">;

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
      if (session.progress.currentPhase === "review") {
        setReadyToGenerate(true);
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
        
        const lines = buffer.split("\n");
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
                if (data.phase) {
                  setCurrentPhase(prevPhase => {
                    if (prevPhase === "photos" || prevPhase === "review") {
                      return prevPhase;
                    }
                    return data.phase;
                  });
                }
                if (data.collectedData) {
                  setCollectedData(prev => ({ ...prev, ...data.collectedData }));
                }
                if (data.readyToGenerate) {
                  setReadyToGenerate(true);
                  setCurrentPhase("review");
                  setCompletedPhases(prev => {
                    const updated = prev.includes("photos") ? prev : [...prev, "photos" as OnboardingPhase];
                    apiRequest("POST", "/api/onboarding/preferences", {
                      currentPhase: "review",
                      completedPhases: updated,
                    }).catch(err => console.error("Error syncing phase:", err));
                    return updated;
                  });
                }
              }
            } catch {
            }
          }
        }
      }
      
      if (buffer.startsWith("data: ")) {
        try {
          const data = JSON.parse(buffer.slice(6));
          if (data.collectedData) {
            setCollectedData(prev => ({ ...prev, ...data.collectedData }));
          }
          if (data.phase) {
            setCurrentPhase(prevPhase => {
              if (prevPhase === "photos" || prevPhase === "review") {
                return prevPhase;
              }
              return data.phase;
            });
          }
        } catch {
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
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-background to-muted/30">
        <div className="flex flex-col items-center gap-3" data-testid="text-loading">
          <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
          <p className="text-sm text-muted-foreground">Setting up your workspace...</p>
        </div>
      </div>
    );
  }

  if (error || !session) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-background to-muted/30 p-4">
        <Card className="p-8 text-center max-w-md shadow-lg">
          <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center mx-auto mb-4">
            <Bot className="h-8 w-8 text-destructive" />
          </div>
          <h2 className="text-xl font-semibold mb-2" data-testid="text-error-title">Session Required</h2>
          <p className="text-muted-foreground mb-6" data-testid="text-error-message">
            Please sign up first to begin the onboarding process.
          </p>
          <Button onClick={() => setLocation("/signup")} size="lg" data-testid="button-go-signup">
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

  return (
    <div className="h-screen flex flex-col overflow-hidden bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 dark:from-blue-800 dark:via-blue-900 dark:to-indigo-950">
      {/* Minimal Header */}
      <header className="flex-shrink-0 z-50">
        <div className="max-w-3xl mx-auto flex items-center justify-between gap-4 h-14 px-4">
          <div className="flex items-center gap-3 flex-wrap">
            <Button 
              variant="ghost" 
              size="icon"
              onClick={() => setLocation("/signup")}
              data-testid="button-back"
              className="rounded-full text-white/80"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div className="flex items-center gap-2.5 flex-wrap">
              <div className="w-9 h-9 rounded-lg bg-white/20 backdrop-blur-sm flex items-center justify-center text-white font-bold text-sm">
                {session.site.businessName?.charAt(0) || "B"}
              </div>
              <h1 className="text-base font-semibold text-white" data-testid="text-business-name">
                {session.site.businessName}
              </h1>
            </div>
          </div>
          {readyToGenerate && (
            <Button
              onClick={handleGenerate}
              disabled={isGenerating}
              variant="outline"
              className="bg-white/10 backdrop-blur-sm border-white/30 text-white"
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
                  Generate Site
                </>
              )}
            </Button>
          )}
        </div>
      </header>

      <main className="flex-1 flex flex-col overflow-hidden min-h-0">
        {showPhotoUpload && currentPhase === "photos" ? (
          <div className="flex-1 overflow-auto">
            <div className="max-w-2xl mx-auto p-6">
              <div className="bg-white/10 backdrop-blur-md rounded-2xl p-8 border border-white/20">
                <div className="text-center mb-6">
                  <div className="w-16 h-16 rounded-2xl bg-white/20 flex items-center justify-center mx-auto mb-4">
                    <ImagePlus className="h-8 w-8 text-white" />
                  </div>
                  <h2 className="text-2xl font-bold text-white mb-2">Upload Your Photos</h2>
                  <p className="text-white/70 text-lg">
                    Add photos to make your website stand out
                  </p>
                </div>
                <div className="bg-white/10 rounded-xl p-4">
                  <PhotoUpload
                    photos={photos}
                    onPhotosChange={handlePhotosChange}
                    disabled={isStreaming}
                  />
                </div>
                <div className="mt-6 flex justify-center">
                  <Button
                    onClick={async () => {
                      const newCompletedPhases: OnboardingPhase[] = completedPhases.includes("photos") 
                        ? completedPhases 
                        : [...completedPhases, "photos" as OnboardingPhase];
                      
                      setShowPhotoUpload(false);
                      setCurrentPhase("review");
                      setCompletedPhases(newCompletedPhases);
                      setReadyToGenerate(true);
                      
                      try {
                        await apiRequest("POST", "/api/onboarding/preferences", {
                          currentPhase: "review",
                          completedPhases: newCompletedPhases,
                        });
                      } catch (error) {
                        console.error("Error syncing phase:", error);
                      }
                    }}
                    size="lg"
                    variant="outline"
                    className="px-8 bg-white/10 backdrop-blur-sm border-white/30 text-white"
                    data-testid="button-continue-review"
                  >
                    Continue to Review
                  </Button>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <>
            <ScrollArea ref={scrollAreaRef} className="flex-1" data-testid="chat-messages-container">
              <div className="max-w-2xl mx-auto py-8 px-4 space-y-5">
                {displayMessages.length === 0 && (
                  <div className="flex gap-3 flex-wrap" data-testid="message-welcome">
                    <div className="flex-shrink-0">
                      <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
                        <Bot className="h-5 w-5 text-white" />
                      </div>
                    </div>
                    <div className="flex-1">
                      <div className="bg-white/15 backdrop-blur-md border border-white/20 rounded-2xl rounded-tl-md px-5 py-4">
                        <p className="text-base leading-relaxed text-white">
                          Hi there! I'm excited to help you set up your professional website for{" "}
                          <strong className="font-semibold">{session.site.businessName}</strong>. Let's start with the basics - what services does your business offer?
                        </p>
                      </div>
                    </div>
                  </div>
                )}
                {displayMessages.map((message, index) => (
                  <div
                    key={index}
                    className={`flex gap-3 flex-wrap ${message.role === "user" ? "flex-row-reverse" : ""}`}
                    data-testid={`message-${message.role}-${index}`}
                  >
                    <div className="flex-shrink-0">
                      {message.role === "assistant" ? (
                        <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
                          <Bot className="h-5 w-5 text-white" />
                        </div>
                      ) : (
                        <div className="w-10 h-10 rounded-xl bg-white/30 backdrop-blur-sm flex items-center justify-center">
                          <User className="h-5 w-5 text-white" />
                        </div>
                      )}
                    </div>
                    <div className={`flex-1 ${message.role === "user" ? "flex justify-end flex-wrap" : ""}`}>
                      <div
                        className={`max-w-[85%] px-5 py-4 ${
                          message.role === "user"
                            ? "bg-white text-gray-900 rounded-2xl rounded-tr-md shadow-lg"
                            : "bg-white/15 backdrop-blur-md border border-white/20 text-white rounded-2xl rounded-tl-md"
                        }`}
                      >
                        <p className="text-base leading-relaxed whitespace-pre-wrap break-words">
                          {message.role === "assistant" ? (
                            <FormattedMessage content={message.content} />
                          ) : (
                            message.content
                          )}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
                {isStreaming && messages[messages.length - 1]?.content === "" && (
                  <div className="flex gap-3 flex-wrap" data-testid="typing-indicator">
                    <div className="flex-shrink-0">
                      <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
                        <Bot className="h-5 w-5 text-white" />
                      </div>
                    </div>
                    <div className="flex-1">
                      <div className="bg-white/15 backdrop-blur-md border border-white/20 rounded-2xl rounded-tl-md px-5 py-4 inline-block">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <div className="w-2.5 h-2.5 bg-white/60 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                          <div className="w-2.5 h-2.5 bg-white/60 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                          <div className="w-2.5 h-2.5 bg-white/60 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </ScrollArea>

            <div className="flex-shrink-0 px-4 pb-6 pt-2">
              <div className="max-w-2xl mx-auto">
                <div className="bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 p-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => {
                        setCurrentPhase("photos");
                        setShowPhotoUpload(true);
                      }}
                      disabled={isStreaming}
                      className="rounded-xl flex-shrink-0 text-white/70"
                      data-testid="button-add-photos"
                      title="Upload photos"
                    >
                      <ImagePlus className="h-5 w-5" />
                    </Button>
                    <Input
                      ref={inputRef}
                      type="text"
                      value={inputValue}
                      onChange={(e) => setInputValue(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && !e.shiftKey) {
                          e.preventDefault();
                          sendMessage();
                        }
                      }}
                      placeholder="Tell us about your business..."
                      disabled={isStreaming}
                      className="flex-1 bg-transparent border-0 text-white placeholder:text-white/50 focus-visible:ring-0 focus-visible:ring-offset-0"
                      data-testid="input-message"
                    />
                    <Button
                      onClick={sendMessage}
                      disabled={!inputValue.trim() || isStreaming}
                      size="icon"
                      variant="outline"
                      className="rounded-xl flex-shrink-0 bg-white/20 border-white/30 text-white"
                      data-testid="button-send"
                    >
                      {isStreaming ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Send className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>
                <p className="text-sm text-white/50 text-center mt-3">
                  Share details about your services, location, and what makes your business unique
                </p>
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  );
}
