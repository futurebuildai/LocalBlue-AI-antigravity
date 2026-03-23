import { useState, useEffect, useRef, useCallback } from "react";
import { useParams, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Loader2,
  Sparkles,
  CheckCircle,
  Type,
  Palette,
  FileText,
  LayoutGrid,
  RefreshCw,
  Send,
  Bot,
  User,
  Rocket,
  ExternalLink,
  Copy,
  ArrowRight,
  X,
} from "lucide-react";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { OnboardingPreviewProvider } from "@/contexts/PreviewContext";
import { FormattedMessage } from "@/lib/message-utils";
import PublicSite from "./PublicSite";
import { getBaseDomain } from "@/lib/domain";
import type { Site } from "@shared/schema";

const QUICK_SUGGESTIONS = [
  { label: "Change headline", icon: Type, prompt: "I'd like a different hero headline and subheadline that better represents my business." },
  { label: "Update colors", icon: Palette, prompt: "I'd like to try different brand colors. Suggest something more modern and appealing for my trade." },
  { label: "Revise about section", icon: FileText, prompt: "Please revise the about section to be more compelling and personal." },
  { label: "Different services layout", icon: LayoutGrid, prompt: "I'd like the services section content reorganized with better descriptions." },
];

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

function cleanDisplayContent(content: string): string {
  return content
    .replace(/<!--CHANGES:[\s\S]*?-->/g, "")
    .replace(/<!--[^>]*-->/g, "")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

export default function Feedback() {
  const { subdomain } = useParams<{ subdomain: string }>();
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  // Chat state
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: "assistant",
      content: "Your website is ready! Take a look at the preview on the left and tell me what you'd like to change. I can update headlines, descriptions, colors, and more.",
    },
  ]);
  const [chatHistory, setChatHistory] = useState<Array<{ role: string; content: string }>>([]);
  const [inputValue, setInputValue] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [regenerationCount, setRegenerationCount] = useState(0);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Publish state
  const [showPublishConfirm, setShowPublishConfirm] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [publishSuccess, setPublishSuccess] = useState<{
    liveUrl: string;
    adminUrl: string;
  } | null>(null);
  const [copiedUrl, setCopiedUrl] = useState(false);

  const { data: site, isLoading, error, refetch } = useQuery<Site>({
    queryKey: ["/api/onboarding/preview", subdomain],
    queryFn: async () => {
      const response = await fetch(`/api/onboarding/preview/${subdomain}`, {
        credentials: "include",
      });
      if (!response.ok) {
        throw new Error("Site not found");
      }
      return response.json();
    },
    enabled: !!subdomain,
  });

  // Auto-scroll chat
  useEffect(() => {
    if (scrollAreaRef.current) {
      const scrollContainer = scrollAreaRef.current.querySelector("[data-radix-scroll-area-viewport]");
      if (scrollContainer) {
        scrollContainer.scrollTop = scrollContainer.scrollHeight;
      }
    }
  }, [messages]);

  const sendMessage = useCallback(
    async (messageText?: string) => {
      const text = messageText || inputValue.trim();
      if (!text || isStreaming) return;

      setInputValue("");
      setMessages((prev) => [...prev, { role: "user", content: text }]);
      setIsStreaming(true);

      try {
        const response = await fetch("/api/site/feedback/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            message: text,
            history: chatHistory,
          }),
          credentials: "include",
        });

        if (!response.ok) {
          throw new Error("Failed to send message");
        }

        const reader = response.body?.getReader();
        if (!reader) throw new Error("No reader available");

        const decoder = new TextDecoder();
        let assistantMessage = "";
        let buffer = "";
        setMessages((prev) => [...prev, { role: "assistant", content: "" }]);

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
                  setMessages((prev) => {
                    const newMessages = [...prev];
                    newMessages[newMessages.length - 1] = {
                      role: "assistant",
                      content: assistantMessage,
                    };
                    return newMessages;
                  });
                }
                if (data.done) {
                  if (data.updatedSlugs && data.updatedSlugs.length > 0) {
                    setRegenerationCount((prev) => prev + 1);
                    queryClient.invalidateQueries({
                      queryKey: ["/api/onboarding/preview", subdomain],
                    });
                    await refetch();
                  }
                }
              } catch {
                // Ignore parse errors for incomplete chunks
              }
            }
          }
        }

        // Update chat history for context
        setChatHistory((prev) => [
          ...prev,
          { role: "user", content: text },
          { role: "assistant", content: assistantMessage },
        ]);
      } catch (err) {
        console.error("Error sending message:", err);
        setMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            content: "Sorry, something went wrong. Please try again.",
          },
        ]);
      } finally {
        setIsStreaming(false);
        inputRef.current?.focus();
      }
    },
    [inputValue, isStreaming, chatHistory, subdomain, refetch]
  );

  const handlePublish = useCallback(async () => {
    setIsPublishing(true);
    try {
      const response = await fetch("/api/onboarding/publish", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to publish");
      }

      setPublishSuccess({
        liveUrl: data.liveUrl,
        adminUrl: data.adminUrl,
      });
      setShowPublishConfirm(false);
    } catch (err: any) {
      toast({
        title: "Publish failed",
        description: err.message || "Something went wrong. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsPublishing(false);
    }
  }, [toast]);

  const copyUrl = useCallback(
    (url: string) => {
      navigator.clipboard.writeText(url);
      setCopiedUrl(true);
      setTimeout(() => setCopiedUrl(false), 2000);
      toast({ title: "URL copied!" });
    },
    [toast]
  );

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4" data-testid="loading-feedback">
          <div className="relative h-12 w-12">
            <div className="absolute inset-0 rounded-full border-4 border-primary/20"></div>
            <div className="absolute inset-0 rounded-full border-4 border-primary border-t-transparent animate-spin"></div>
          </div>
          <p className="text-muted-foreground text-sm animate-pulse">Loading your site preview...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error || !site) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background px-4">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4" data-testid="text-error-title">
            Site Not Found
          </h1>
          <p className="text-muted-foreground mb-6">
            The site you're looking for doesn't exist or hasn't been configured yet.
          </p>
          <Button onClick={() => setLocation("/")} data-testid="button-back-home">
            Back to Home
          </Button>
        </div>
      </div>
    );
  }

  // Publish celebration screen
  if (publishSuccess) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-700 via-blue-800 to-indigo-900 p-4">
        <div className="max-w-lg w-full text-center">
          <div className="bg-white/10 backdrop-blur-md rounded-3xl border border-white/20 p-8 sm:p-12">
            {/* Success animation */}
            <div className="mb-6">
              <div className="w-20 h-20 rounded-full bg-green-500/20 flex items-center justify-center mx-auto mb-4 animate-bounce">
                <CheckCircle className="h-10 w-10 text-green-400" />
              </div>
              <h1 className="text-3xl sm:text-4xl font-bold text-white mb-2">
                Your Site is Live!
              </h1>
              <p className="text-white/70 text-lg">
                Congratulations! Your professional website is now published and ready for customers.
              </p>
            </div>

            {/* Live URL */}
            <div className="bg-white/10 rounded-xl p-4 mb-6">
              <p className="text-white/60 text-sm mb-2">Your website URL</p>
              <div className="flex items-center justify-center gap-2">
                <code className="text-white font-mono text-sm sm:text-base break-all">
                  {publishSuccess.liveUrl}
                </code>
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-white/70 hover:text-white flex-shrink-0"
                  onClick={() => copyUrl(publishSuccess.liveUrl)}
                >
                  {copiedUrl ? (
                    <CheckCircle className="h-4 w-4 text-green-400" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>

            {/* Next steps */}
            <div className="text-left bg-white/5 rounded-xl p-4 mb-6">
              <p className="text-white font-medium mb-3">Next steps:</p>
              <ul className="space-y-2 text-white/70 text-sm">
                <li className="flex items-start gap-2">
                  <ArrowRight className="h-4 w-4 mt-0.5 text-blue-300 flex-shrink-0" />
                  Set up a custom domain from your admin dashboard
                </li>
                <li className="flex items-start gap-2">
                  <ArrowRight className="h-4 w-4 mt-0.5 text-blue-300 flex-shrink-0" />
                  Manage incoming leads and customer inquiries
                </li>
                <li className="flex items-start gap-2">
                  <ArrowRight className="h-4 w-4 mt-0.5 text-blue-300 flex-shrink-0" />
                  Edit pages and content anytime from your dashboard
                </li>
              </ul>
            </div>

            {/* Action buttons */}
            <div className="flex flex-col sm:flex-row gap-3">
              <Button
                size="lg"
                className="flex-1 bg-white text-blue-700 hover:bg-white/90 font-semibold"
                onClick={() => window.open(publishSuccess.liveUrl, "_blank")}
              >
                <ExternalLink className="h-4 w-4 mr-2" />
                View Your Site
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="flex-1 border-white/30 text-white hover:bg-white/10"
                onClick={() => setLocation(`/preview/${subdomain}/admin`)}
              >
                Go to Dashboard
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const displayMessages = messages.map((m) => ({
    ...m,
    content: cleanDisplayContent(m.content),
  }));

  return (
    <div className="min-h-screen flex flex-col lg:flex-row">
      {/* Left: Site Preview */}
      <div className="lg:w-[65%] w-full lg:h-screen lg:overflow-y-auto border-b lg:border-b-0 lg:border-r border-border">
        <div className="bg-muted/50 border-b px-4 py-2 flex flex-wrap items-center justify-between gap-2 sticky top-0 z-40">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="secondary" className="text-xs">
              Preview
            </Badge>
            <span className="text-sm font-medium text-foreground">{site.businessName}</span>
          </div>
          {regenerationCount > 0 && (
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <RefreshCw className="h-3 w-3" />
              <span>
                {regenerationCount} revision{regenerationCount !== 1 ? "s" : ""}
              </span>
            </div>
          )}
        </div>
        <OnboardingPreviewProvider subdomain={subdomain!}>
          <PublicSite key={regenerationCount} site={site} isPreview />
        </OnboardingPreviewProvider>
      </div>

      {/* Right: Chat Panel */}
      <div className="lg:w-[35%] w-full lg:h-screen flex flex-col bg-background">
        {/* Chat header */}
        <div className="flex-shrink-0 border-b p-4">
          <h2 className="text-lg font-bold text-foreground" data-testid="text-feedback-heading">
            Refine Your Website
          </h2>
          <p className="text-sm text-muted-foreground">
            Chat with AI to make changes to your site
          </p>
        </div>

        {/* Quick suggestions */}
        <div className="flex-shrink-0 border-b px-4 py-3">
          <div className="flex flex-wrap gap-2">
            {QUICK_SUGGESTIONS.map((item) => (
              <Button
                key={item.label}
                variant="outline"
                size="sm"
                onClick={() => sendMessage(item.prompt)}
                disabled={isStreaming}
                data-testid={`button-quick-${item.label.toLowerCase().replace(/\s+/g, "-")}`}
              >
                <item.icon className="h-3.5 w-3.5 mr-1.5" />
                {item.label}
              </Button>
            ))}
          </div>
        </div>

        {/* Messages */}
        <ScrollArea ref={scrollAreaRef} className="flex-1" data-testid="chat-messages-container">
          <div className="p-4 space-y-4">
            {displayMessages.map((message, index) => (
              <div
                key={index}
                className={`flex gap-3 ${message.role === "user" ? "flex-row-reverse" : ""}`}
                data-testid={`message-${message.role}-${index}`}
              >
                <div className="flex-shrink-0">
                  {message.role === "assistant" ? (
                    <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                      <Bot className="h-4 w-4 text-primary" />
                    </div>
                  ) : (
                    <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center">
                      <User className="h-4 w-4 text-muted-foreground" />
                    </div>
                  )}
                </div>
                <div className={`flex-1 ${message.role === "user" ? "flex justify-end" : ""}`}>
                  <div
                    className={`max-w-[90%] px-4 py-3 text-sm leading-relaxed ${
                      message.role === "user"
                        ? "bg-primary text-primary-foreground rounded-2xl rounded-tr-md"
                        : "bg-muted rounded-2xl rounded-tl-md"
                    }`}
                  >
                    {message.content ? (
                      <FormattedMessage content={message.content} />
                    ) : null}
                  </div>
                </div>
              </div>
            ))}
            {isStreaming && messages[messages.length - 1]?.content === "" && (
              <div className="flex gap-3" data-testid="typing-indicator">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Bot className="h-4 w-4 text-primary" />
                  </div>
                </div>
                <div className="flex-1">
                  <div className="bg-muted rounded-2xl rounded-tl-md px-4 py-3 inline-block">
                    <div className="flex items-center gap-1.5">
                      <div className="w-2 h-2 bg-muted-foreground/40 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                      <div className="w-2 h-2 bg-muted-foreground/40 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                      <div className="w-2 h-2 bg-muted-foreground/40 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </ScrollArea>

        {/* Input + Publish */}
        <div className="flex-shrink-0 border-t p-4 space-y-3">
          {/* Chat input */}
          <div className="flex items-center gap-2">
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
              placeholder="Tell me what to change..."
              disabled={isStreaming}
              className="flex-1"
              data-testid="input-feedback"
            />
            <Button
              onClick={() => sendMessage()}
              disabled={!inputValue.trim() || isStreaming}
              size="icon"
              data-testid="button-send"
            >
              {isStreaming ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            </Button>
          </div>

          {/* Publish button */}
          <Button
            className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold"
            size="lg"
            onClick={() => setShowPublishConfirm(true)}
            disabled={isStreaming}
            data-testid="button-publish"
          >
            <Rocket className="h-4 w-4 mr-2" />
            Publish My Site
          </Button>
        </div>

        {/* Publish confirmation dialog */}
        {showPublishConfirm && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-background rounded-2xl shadow-xl max-w-md w-full p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold">Publish Your Site?</h3>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setShowPublishConfirm(false)}
                  className="h-8 w-8"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
              <p className="text-muted-foreground mb-6">
                Your website will go live at{" "}
                <code className="text-foreground font-mono text-sm">
                  {subdomain}.{getBaseDomain()}
                </code>
                . You can continue to make changes from your admin dashboard after publishing.
              </p>
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => setShowPublishConfirm(false)}
                  disabled={isPublishing}
                >
                  Keep Editing
                </Button>
                <Button
                  className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                  onClick={handlePublish}
                  disabled={isPublishing}
                  data-testid="button-confirm-publish"
                >
                  {isPublishing ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Publishing...
                    </>
                  ) : (
                    <>
                      <Rocket className="h-4 w-4 mr-2" />
                      Publish Now
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
