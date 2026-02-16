import { useState, useEffect } from "react";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { MessageSquare, X, CheckCircle, Loader2 } from "lucide-react";

export function FeedbackWidget() {
  const { toast } = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [showSuccess, setShowSuccess] = useState(false);

  const feedbackMutation = useMutation({
    mutationFn: async (data: { name: string; email: string; message: string }) => {
      const res = await apiRequest("POST", "/api/feedback", data);
      return res.json();
    },
    onSuccess: () => {
      setName("");
      setEmail("");
      setMessage("");
      setShowSuccess(true);
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to send feedback. Please try again.",
        variant: "destructive",
      });
    },
  });

  useEffect(() => {
    if (showSuccess) {
      const timer = setTimeout(() => {
        setShowSuccess(false);
        setIsOpen(false);
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [showSuccess]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    feedbackMutation.mutate({ name, email, message });
  };

  return (
    <>
      {isOpen && (
        <Card
          className="fixed bottom-20 right-6 z-[9998] w-80 max-w-sm shadow-2xl"
          data-testid="card-feedback-panel"
        >
          <CardHeader className="flex flex-row items-start justify-between gap-2 pb-2">
            <div>
              <h3 className="text-sm font-semibold">Send Feedback</h3>
              <p className="text-xs text-muted-foreground">Help us improve LocalBlue</p>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => {
                setIsOpen(false);
                setShowSuccess(false);
              }}
            >
              <X className="h-4 w-4" />
            </Button>
          </CardHeader>
          <CardContent>
            {showSuccess ? (
              <div className="flex flex-col items-center justify-center py-6 gap-3" data-testid="text-feedback-success">
                <CheckCircle className="h-10 w-10 text-emerald-500" />
                <p className="text-sm font-medium text-center">
                  Thank you! Your feedback has been sent.
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-3">
                <div className="space-y-1.5">
                  <Label htmlFor="feedback-name" className="text-xs">Name (optional)</Label>
                  <Input
                    id="feedback-name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Your name"
                    data-testid="input-feedback-name"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="feedback-email" className="text-xs">Email</Label>
                  <Input
                    id="feedback-email"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    data-testid="input-feedback-email"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="feedback-message" className="text-xs">Message</Label>
                  <Textarea
                    id="feedback-message"
                    required
                    rows={3}
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Tell us what you think..."
                    data-testid="input-feedback-message"
                  />
                </div>
                <Button
                  type="submit"
                  className="w-full"
                  disabled={feedbackMutation.isPending}
                  data-testid="button-feedback-submit"
                >
                  {feedbackMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Sending...
                    </>
                  ) : (
                    "Send Feedback"
                  )}
                </Button>
              </form>
            )}
          </CardContent>
        </Card>
      )}

      <Button
        className="fixed bottom-6 right-6 z-[9998] h-12 w-12 rounded-full bg-gradient-to-r from-emerald-500 to-cyan-500 text-white shadow-xl"
        onClick={() => {
          setIsOpen((prev) => !prev);
          setShowSuccess(false);
        }}
        data-testid="button-feedback-toggle"
      >
        <MessageSquare className="h-5 w-5" />
      </Button>
    </>
  );
}
