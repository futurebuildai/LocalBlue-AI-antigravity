import { useState, useEffect, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { 
  MessageCircle, 
  X, 
  Send, 
  Phone, 
  Calendar,
  Loader2,
  Bot,
  User
} from "lucide-react";
import type { Site } from "@shared/schema";
import { FormattedMessage } from "@/lib/message-utils";
import { usePreview } from "@/contexts/PreviewContext";

interface Message {
  role: "user" | "assistant";
  content: string;
  timestamp: string;
}

interface ChatBotProps {
  site: Site;
  isVisible?: boolean;
}

function generateVisitorId(): string {
  return `visitor_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
}

function getOrCreateVisitorId(): string {
  const stored = localStorage.getItem("chatbot_visitor_id");
  if (stored) return stored;
  const newId = generateVisitorId();
  localStorage.setItem("chatbot_visitor_id", newId);
  return newId;
}

export default function ChatBot({ site, isVisible = true }: ChatBotProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [visitorId] = useState(() => getOrCreateVisitorId());
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const { getSitePath } = usePreview();

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  useEffect(() => {
    if (isOpen && messages.length === 0) {
      fetchHistory();
    }
  }, [isOpen]);

  useEffect(() => {
    if (isOpen) {
      inputRef.current?.focus();
    }
  }, [isOpen]);

  const fetchHistory = async () => {
    try {
      const res = await fetch(`/api/site/chat/history?visitorId=${visitorId}`);
      if (res.ok) {
        const data = await res.json();
        if (data.messages && data.messages.length > 0) {
          setMessages(data.messages);
        } else {
          setMessages([{
            role: "assistant",
            content: `Hi there! I'm the virtual assistant for ${site.businessName}. How can I help you today? I can answer questions about our services, provide estimates, or help you schedule an appointment.`,
            timestamp: new Date().toISOString(),
          }]);
        }
      } else {
        setMessages([{
          role: "assistant",
          content: `Hi there! I'm the virtual assistant for ${site.businessName}. How can I help you today? I can answer questions about our services, provide estimates, or help you schedule an appointment.`,
          timestamp: new Date().toISOString(),
        }]);
      }
    } catch {
      setMessages([{
        role: "assistant",
        content: `Hi there! I'm the virtual assistant for ${site.businessName}. How can I help you today?`,
        timestamp: new Date().toISOString(),
      }]);
    }
  };

  const sendMessage = async (content: string) => {
    if (!content.trim() || isLoading) return;

    const userMessage: Message = {
      role: "user",
      content: content.trim(),
      timestamp: new Date().toISOString(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue("");
    setIsLoading(true);

    try {
      const res = await fetch(getSitePath("/api/site/chat"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: content.trim(),
          visitorId,
          history: messages.map(m => ({ role: m.role, content: m.content })),
        }),
      });

      if (!res.ok) {
        throw new Error("Failed to send message");
      }

      const reader = res.body?.getReader();
      if (!reader) throw new Error("No response body");

      const decoder = new TextDecoder();
      let assistantContent = "";

      setMessages(prev => [...prev, {
        role: "assistant",
        content: "",
        timestamp: new Date().toISOString(),
      }]);

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split("\n");

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            const data = line.slice(6);
            if (data === "[DONE]") continue;
            
            try {
              const parsed = JSON.parse(data);
              if (parsed.content) {
                assistantContent += parsed.content;
                setMessages(prev => {
                  const newMessages = [...prev];
                  const lastMessage = newMessages[newMessages.length - 1];
                  if (lastMessage && lastMessage.role === "assistant") {
                    lastMessage.content = assistantContent;
                  }
                  return newMessages;
                });
              }
            } catch {
              if (data.trim()) {
                assistantContent += data;
                setMessages(prev => {
                  const newMessages = [...prev];
                  const lastMessage = newMessages[newMessages.length - 1];
                  if (lastMessage && lastMessage.role === "assistant") {
                    lastMessage.content = assistantContent;
                  }
                  return newMessages;
                });
              }
            }
          }
        }
      }
    } catch (error) {
      console.error("Chat error:", error);
      setMessages(prev => [...prev, {
        role: "assistant",
        content: "I'm sorry, I'm having trouble connecting right now. Please try again or give us a call!",
        timestamp: new Date().toISOString(),
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sendMessage(inputValue);
  };

  const handleQuickAction = (action: string) => {
    if (action === "call" && site.phone) {
      window.location.href = `tel:${site.phone}`;
    } else if (action === "book") {
      sendMessage("I'd like to schedule an appointment");
    }
  };

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50" data-testid="chatbot-container">
      {!isOpen && (
        <Button
          onClick={() => setIsOpen(true)}
          size="lg"
          className="rounded-full w-14 h-14 shadow-lg"
          style={{ backgroundColor: site.brandColor }}
          data-testid="button-open-chat"
        >
          <MessageCircle className="h-6 w-6" />
        </Button>
      )}

      {isOpen && (
        <Card 
          className="w-[360px] h-[500px] flex flex-col shadow-2xl border-2"
          style={{ borderColor: site.brandColor }}
          data-testid="chatbot-window"
        >
          <CardHeader 
            className="p-4 flex flex-row items-center justify-between gap-2 border-b"
            style={{ backgroundColor: site.brandColor }}
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
                <Bot className="h-5 w-5 text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-white text-sm" data-testid="text-chat-business-name">
                  {site.businessName}
                </h3>
                <p className="text-white/80 text-xs">Virtual Assistant</p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsOpen(false)}
              className="text-white hover:bg-white/20"
              data-testid="button-close-chat"
            >
              <X className="h-5 w-5" />
            </Button>
          </CardHeader>

          <CardContent className="flex-1 overflow-y-auto p-4 space-y-4" data-testid="chat-messages">
            {messages.map((message, index) => (
              <div
                key={index}
                className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
                data-testid={`message-${message.role}-${index}`}
              >
                <div
                  className={`max-w-[80%] rounded-lg px-4 py-2 ${
                    message.role === "user"
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted"
                  }`}
                  style={message.role === "user" ? { backgroundColor: site.brandColor } : {}}
                >
                  <div className="flex items-start gap-2">
                    {message.role === "assistant" && (
                      <Bot className="h-4 w-4 mt-0.5 flex-shrink-0 text-muted-foreground" />
                    )}
                    <p className="text-sm whitespace-pre-wrap">
                      {message.role === "assistant" ? (
                        <FormattedMessage content={message.content} />
                      ) : (
                        message.content
                      )}
                    </p>
                    {message.role === "user" && (
                      <User className="h-4 w-4 mt-0.5 flex-shrink-0" />
                    )}
                  </div>
                </div>
              </div>
            ))}
            
            {isLoading && messages[messages.length - 1]?.role !== "assistant" && (
              <div className="flex justify-start" data-testid="typing-indicator">
                <div className="bg-muted rounded-lg px-4 py-2 flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span className="text-sm text-muted-foreground">Typing...</span>
                </div>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </CardContent>

          <div className="p-4 border-t space-y-3">
            <div className="flex gap-2">
              {site.phone && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleQuickAction("call")}
                  className="flex-1 text-xs"
                  data-testid="button-call-now"
                >
                  <Phone className="h-3 w-3 mr-1" />
                  Call Now
                </Button>
              )}
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleQuickAction("book")}
                className="flex-1 text-xs"
                data-testid="button-book-appointment"
              >
                <Calendar className="h-3 w-3 mr-1" />
                Book Appointment
              </Button>
            </div>
            
            <form onSubmit={handleSubmit} className="flex gap-2">
              <Input
                ref={inputRef}
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder="Type your message..."
                disabled={isLoading}
                className="flex-1"
                data-testid="input-chat-message"
              />
              <Button
                type="submit"
                size="icon"
                disabled={!inputValue.trim() || isLoading}
                style={{ backgroundColor: site.brandColor }}
                data-testid="button-send-message"
              >
                <Send className="h-4 w-4" />
              </Button>
            </form>
          </div>
        </Card>
      )}
    </div>
  );
}
