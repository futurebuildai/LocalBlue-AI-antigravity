import { useState, useEffect, useRef } from "react";
import { useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Send, Loader2, Sparkles, ArrowLeft } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import type { Site, User } from "@shared/schema";

type SanitizedUser = Omit<User, "password">;

interface OnboardingSession {
  user: SanitizedUser;
  site: Site;
  messages: Array<{ role: string; content: string }>;
}

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
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
      setMessages(prev => [...prev, { role: "assistant", content: "" }]);

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split("\n");

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
              if (data.done && data.readyToGenerate) {
                setReadyToGenerate(true);
              }
            } catch {
            }
          }
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

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-3">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => setLocation("/signup")}
              data-testid="button-back"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-md bg-[#2563EB] text-white font-bold text-sm">
                LB
              </div>
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

      <main className="flex-1 flex flex-col container mx-auto max-w-3xl p-4">
        <ScrollArea ref={scrollAreaRef} className="flex-1 pr-4" data-testid="chat-messages-container">
          <div className="space-y-4 pb-4">
            {displayMessages.length === 0 && (
              <div className="flex justify-start">
                <div className="max-w-[80%] rounded-lg bg-muted p-4" data-testid="message-welcome">
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
                  className={`max-w-[80%] rounded-lg p-4 ${
                    message.role === "user"
                      ? "bg-[#2563EB] text-white"
                      : "bg-muted"
                  }`}
                >
                  <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                </div>
              </div>
            ))}
            {isStreaming && messages[messages.length - 1]?.content === "" && (
              <div className="flex justify-start">
                <div className="max-w-[80%] rounded-lg bg-muted p-4" data-testid="typing-indicator">
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

        <div className="border-t pt-4 mt-auto">
          <div className="flex gap-2">
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
      </main>
    </div>
  );
}
