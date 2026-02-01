import { useState } from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  ArrowLeft, 
  ArrowRight, 
  MessageSquare,
  Palette,
  Globe,
  Rocket,
  CheckCircle,
  Building2,
  Wrench,
  MapPin,
  Star,
  ChevronLeft,
  ChevronRight,
  Lightbulb
} from "lucide-react";

const demoSteps = [
  {
    id: 1,
    title: "Sign Up in Seconds",
    screenshot: "/demo/step-1-signup.png",
    icon: Building2,
    explainer: {
      headline: "Getting Started is Easy",
      description: "Mike from Mike's Reliable Plumbing is ready to get his business online. All he needs is his business name, email, and a password.",
      tips: [
        "No credit card required to start",
        "Free plan available forever",
        "Takes less than 30 seconds"
      ],
      highlight: "Just 3 fields to fill out - business name, email, and password"
    }
  },
  {
    id: 2,
    title: "Tell Us About Your Services",
    screenshot: "/demo/step-2-services.png",
    icon: Wrench,
    explainer: {
      headline: "Chat Naturally with Our AI",
      description: "Mike tells the AI about his plumbing services: emergency repairs, water heater installation, drain cleaning, and bathroom remodels.",
      tips: [
        "Just type like you're talking to a friend",
        "No forms to fill out - just conversation",
        "AI understands plumbing industry terms"
      ],
      highlight: "The AI asks smart follow-up questions to understand your business"
    }
  },
  {
    id: 3,
    title: "Share Your Story",
    screenshot: "/demo/step-3-story.png",
    icon: Star,
    explainer: {
      headline: "What Makes You Special?",
      description: "Mike shares his family legacy and same-day service guarantee. The AI captures these unique selling points for his website.",
      tips: [
        "Your story builds trust with customers",
        "AI highlights what makes you different",
        "Creates compelling website copy"
      ],
      highlight: "\"We treat every home like it's our grandmother's house\""
    }
  },
  {
    id: 4,
    title: "Service Area & Contact Info",
    screenshot: "/demo/step-4-contact.png",
    icon: MapPin,
    explainer: {
      headline: "Where Do You Work?",
      description: "Mike specifies he serves Austin, TX and surrounding suburbs within 30 miles. He adds his phone number and business hours.",
      tips: [
        "Set your service radius",
        "Add contact information",
        "Specify emergency availability"
      ],
      highlight: "Available 24/7 for emergencies - a key selling point for customers"
    }
  },
  {
    id: 5,
    title: "Choose Your Style",
    screenshot: "/demo/step-5-style.png",
    icon: Palette,
    explainer: {
      headline: "Pick Your Look",
      description: "Mike chooses the 'Professional' style - clean blues that convey trust and reliability. Perfect for a family-owned business.",
      tips: [
        "4 professional styles to choose from",
        "Each style has curated colors",
        "Preview before you commit"
      ],
      highlight: "Professional, Bold, Warm, or Luxury - pick what fits your brand"
    }
  },
  {
    id: 6,
    title: "Your Site is Ready!",
    screenshot: "/demo/step-6-preview.png",
    icon: Globe,
    explainer: {
      headline: "AI Builds Your Website",
      description: "In just a few minutes, Mike's professional website is ready. Complete with services, about page, testimonials section, and contact form.",
      tips: [
        "Full website generated automatically",
        "Professional hero section",
        "Built-in lead capture forms"
      ],
      highlight: "A complete 5+ page website built in under 5 minutes"
    }
  },
  {
    id: 7,
    title: "Go Live!",
    screenshot: "/demo/step-7-published.png",
    icon: Rocket,
    explainer: {
      headline: "Publish with One Click",
      description: "Mike's website is now live! He can connect his own domain later, but for now he's already accepting leads through his new professional site.",
      tips: [
        "Instant free subdomain",
        "Connect custom domain anytime",
        "Admin panel at admin.yoursite.com"
      ],
      highlight: "From signup to live website in under 5 minutes!"
    }
  }
];

export default function Demo() {
  const [currentStep, setCurrentStep] = useState(0);
  const [showExplainer, setShowExplainer] = useState(true);

  const step = demoSteps[currentStep];
  const isFirstStep = currentStep === 0;
  const isLastStep = currentStep === demoSteps.length - 1;

  const handlePrevious = () => {
    if (currentStep > 0) {
      setShowExplainer(true);
      setCurrentStep(currentStep - 1);
    }
  };

  const handleNext = () => {
    if (showExplainer) {
      setShowExplainer(false);
    } else if (currentStep < demoSteps.length - 1) {
      setCurrentStep(currentStep + 1);
      setShowExplainer(true);
    }
  };

  const handleGoBack = () => {
    if (!showExplainer) {
      setShowExplainer(true);
    } else if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
      setShowExplainer(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900">
      <div className="container mx-auto px-4 py-6">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
          <Link href="/">
            <Button variant="ghost" className="text-white" data-testid="link-back-home">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Home
            </Button>
          </Link>
          <div className="flex items-center gap-3">
            <Badge variant="secondary" className="bg-blue-500/20 text-blue-300 border-blue-500/30">
              Step {currentStep + 1} of {demoSteps.length}
            </Badge>
            <Badge variant="outline" className="border-emerald-500/50 text-emerald-300">
              {showExplainer ? "Explainer" : "Screenshot"}
            </Badge>
          </div>
        </div>

        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-6">
            <div className="flex items-center justify-center gap-3 mb-2">
              <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
                <step.icon className="h-5 w-5 text-white" />
              </div>
              <h1 className="text-2xl md:text-3xl font-bold text-white">
                {step.title}
              </h1>
            </div>
          </div>

          <div className="relative">
            {showExplainer ? (
              <Card className="bg-slate-800/80 border-slate-700 overflow-hidden">
                <CardContent className="p-8 md:p-12">
                  <div className="max-w-2xl mx-auto text-center">
                    <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center mx-auto mb-6">
                      <Lightbulb className="h-8 w-8 text-white" />
                    </div>
                    
                    <h2 className="text-3xl font-bold text-white mb-4">
                      {step.explainer.headline}
                    </h2>
                    
                    <p className="text-lg text-slate-300 mb-8">
                      {step.explainer.description}
                    </p>

                    <div className="grid sm:grid-cols-3 gap-4 mb-8">
                      {step.explainer.tips.map((tip, idx) => (
                        <div key={idx} className="flex items-start gap-2 text-left p-4 bg-slate-700/50 rounded-lg">
                          <CheckCircle className="h-5 w-5 text-green-400 mt-0.5 flex-shrink-0" />
                          <span className="text-sm text-slate-300">{tip}</span>
                        </div>
                      ))}
                    </div>

                    <div className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg inline-block">
                      <div className="flex items-center gap-2">
                        <MessageSquare className="h-5 w-5 text-blue-400" />
                        <p className="text-blue-200 font-medium">{step.explainer.highlight}</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card className="bg-slate-800/50 border-slate-700 overflow-hidden">
                <div className="aspect-video bg-slate-900 relative">
                  <img 
                    src={step.screenshot} 
                    alt={step.title}
                    className="w-full h-full object-contain"
                    data-testid={`screenshot-step-${currentStep + 1}`}
                  />
                </div>
                <CardContent className="p-4 bg-slate-800/80">
                  <p className="text-center text-slate-400 text-sm">
                    {step.explainer.description}
                  </p>
                </CardContent>
              </Card>
            )}
          </div>

          <div className="flex items-center justify-between gap-4 mt-6">
            <Button 
              variant="outline" 
              size="lg"
              onClick={handleGoBack}
              disabled={isFirstStep && showExplainer}
              className="border-slate-600 text-slate-300"
              data-testid="button-prev"
            >
              <ChevronLeft className="h-5 w-5 mr-1" />
              Back
            </Button>

            <span className="text-slate-400 text-sm">
              Step {currentStep + 1} of {demoSteps.length}
            </span>

            {isLastStep && !showExplainer ? (
              <Link href="/signup">
                <Button size="lg" data-testid="button-start-now">
                  Start Building Now
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
            ) : (
              <Button 
                size="lg"
                onClick={handleNext}
                data-testid="button-next"
              >
                {showExplainer ? "See Screenshot" : "Next Step"}
                <ChevronRight className="h-5 w-5 ml-1" />
              </Button>
            )}
          </div>

          <div className="flex flex-wrap gap-2 mt-4 justify-center">
            {demoSteps.map((s, idx) => (
              <Button
                key={s.id}
                variant={idx === currentStep ? "default" : "ghost"}
                size="sm"
                onClick={() => {
                  setCurrentStep(idx);
                  setShowExplainer(true);
                }}
                data-testid={`button-timeline-${idx}`}
              >
                {idx + 1}. {s.title}
              </Button>
            ))}
          </div>
        </div>

        <div className="mt-10 max-w-3xl mx-auto">
          <Card className="bg-gradient-to-r from-blue-600/20 to-indigo-600/20 border-blue-500/30">
            <CardContent className="p-6 text-center">
              <h2 className="text-xl font-bold text-white mb-3">
                Ready to Build Your Contractor Website?
              </h2>
              <p className="text-blue-200 mb-4">
                Join 500+ contractors who've built professional websites with LocalBlue.ai.
              </p>
              <div className="flex flex-wrap justify-center gap-3">
                <Link href="/signup">
                  <Button size="lg" variant="secondary" data-testid="button-demo-signup">
                    Get Started Free
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
