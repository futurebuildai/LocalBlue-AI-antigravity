import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { MessageSquare, ArrowLeft } from "lucide-react";

export default function Onboarding() {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <header className="border-b">
        <div className="container mx-auto flex h-16 items-center px-4">
          <Link href="/landing">
            <Button variant="ghost" size="sm" data-testid="link-back-landing">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Home
            </Button>
          </Link>
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center p-4">
        <Card className="w-full max-w-md text-center">
          <CardHeader>
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-[#2563EB] text-white">
              <MessageSquare className="h-6 w-6" />
            </div>
            <CardTitle className="text-2xl" data-testid="text-onboarding-title">
              Onboarding Coming Soon
            </CardTitle>
            <CardDescription>
              Our AI-powered website builder is almost ready! You'll be able to create your professional contractor website through a simple chat conversation.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4" data-testid="text-onboarding-message">
              We're putting the finishing touches on the experience. Check back soon!
            </p>
            <Link href="/landing">
              <Button variant="outline" data-testid="button-back-home">
                Return to Home
              </Button>
            </Link>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
