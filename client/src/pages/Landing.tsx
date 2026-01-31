import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { MessageSquare, Globe, Zap, ArrowRight } from "lucide-react";

const features = [
  {
    icon: MessageSquare,
    title: "AI Chat Builds Your Site",
    description: "Just answer a few questions and our AI creates a professional website for your business in minutes.",
  },
  {
    icon: Globe,
    title: "Your Domain, Your Brand",
    description: "Manage everything from admin.yoursite.com - not on LocalBlue.ai. Your customers see only your brand.",
  },
  {
    icon: Zap,
    title: "Single-Click Publish",
    description: "Connect your custom domain and go live instantly. No technical setup required.",
  },
];

export default function Landing() {
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-md bg-[#2563EB] text-white font-bold text-sm">
              LB
            </div>
            <span className="text-lg font-semibold">LocalBlue.ai</span>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/signup">
              <Button variant="ghost" data-testid="link-header-signup">
                Sign Up
              </Button>
            </Link>
          </div>
        </div>
      </header>

      <main>
        <section className="py-20 md:py-32">
          <div className="container mx-auto px-4 text-center">
            <h1 
              className="text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl"
              data-testid="text-hero-headline"
            >
              AI-Powered Websites for{" "}
              <span className="text-[#2563EB]">Local Contractors</span>
            </h1>
            <p 
              className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground md:text-xl"
              data-testid="text-hero-subheadline"
            >
              Get a professional website in minutes. Manage everything from your own domain - 
              your customers never see LocalBlue.ai. Just your brand, your business.
            </p>
            <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
              <Link href="/signup">
                <Button 
                  size="lg" 
                  className="bg-[#2563EB] hover-elevate text-lg px-8"
                  data-testid="button-hero-cta"
                >
                  Build Your Site Free
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
            </div>
          </div>
        </section>

        <section className="border-t bg-muted/30 py-20">
          <div className="container mx-auto px-4">
            <h2 className="text-center text-3xl font-bold" data-testid="text-features-title">
              Everything You Need to Get Online
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-center text-muted-foreground">
              No technical skills required. Our AI handles the hard work so you can focus on your business.
            </p>
            <div className="mt-12 grid gap-8 md:grid-cols-3">
              {features.map((feature, index) => (
                <div 
                  key={index} 
                  className="rounded-lg border bg-card p-6"
                  data-testid={`card-feature-${index}`}
                >
                  <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-[#2563EB]/10">
                    <feature.icon className="h-6 w-6 text-[#2563EB]" />
                  </div>
                  <h3 className="mb-2 text-lg font-semibold">{feature.title}</h3>
                  <p className="text-muted-foreground">{feature.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="py-20">
          <div className="container mx-auto px-4 text-center">
            <h2 className="text-3xl font-bold" data-testid="text-cta-title">
              Ready to Build Your Website?
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-muted-foreground">
              Join hundreds of contractors who have already launched their professional websites with LocalBlue.
            </p>
            <div className="mt-8">
              <Link href="/signup">
                <Button 
                  size="lg" 
                  className="bg-[#2563EB] hover-elevate text-lg px-8"
                  data-testid="button-footer-cta"
                >
                  Get Started Now
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t py-8">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          <p>&copy; {new Date().getFullYear()} LocalBlue.ai. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
