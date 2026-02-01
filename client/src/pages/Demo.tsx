import { useState, useRef, useEffect } from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  ArrowLeft, 
  ArrowRight, 
  Play,
  MessageSquare,
  Palette,
  Globe,
  Rocket,
  CheckCircle,
  Building2,
  Wrench,
  MapPin,
  Star
} from "lucide-react";

const demoSteps = [
  {
    id: 1,
    title: "Welcome & Business Basics",
    timestamp: "0:00 - 0:15",
    icon: Building2,
    description: "Mike from Mike's Reliable Plumbing starts his journey. He enters his business name and email to get started.",
    details: [
      "Simple signup form - just business name, email, and password",
      "No credit card required to start",
      "Instantly connects to the AI onboarding assistant"
    ],
    highlight: "The AI greets Mike and asks about his plumbing business"
  },
  {
    id: 2,
    title: "Describing Services",
    timestamp: "0:15 - 0:35",
    icon: Wrench,
    description: "Mike tells the AI about his services: emergency repairs, water heater installation, drain cleaning, and bathroom remodels.",
    details: [
      "Natural conversation - just type like you're talking to a colleague",
      "AI understands industry-specific terminology",
      "Automatically organizes services into categories"
    ],
    highlight: "Mike mentions he's been in business for 15 years with his father"
  },
  {
    id: 3,
    title: "Your Unique Story",
    timestamp: "0:35 - 0:55",
    icon: Star,
    description: "The AI asks what makes Mike's business special. He shares his family legacy and commitment to same-day service.",
    details: [
      "AI extracts unique selling points automatically",
      "Captures the human story behind the business",
      "Creates compelling content for the website"
    ],
    highlight: "\"We treat every home like it's our grandmother's house\""
  },
  {
    id: 4,
    title: "Service Area & Contact",
    timestamp: "0:55 - 1:15",
    icon: MapPin,
    description: "Mike specifies he serves Austin, TX and surrounding suburbs within 30 miles. Adds his phone number and business hours.",
    details: [
      "Interactive service area configuration",
      "Business hours and contact preferences",
      "Emergency availability options"
    ],
    highlight: "Available 24/7 for emergencies - a key differentiator"
  },
  {
    id: 5,
    title: "Choose Your Style",
    timestamp: "1:15 - 1:30",
    icon: Palette,
    description: "Mike picks the 'Professional' style - clean blues that convey trust and reliability. Perfect for a family-owned business.",
    details: [
      "Four style options: Professional, Bold, Warm, Luxury",
      "Each style has curated colors and typography",
      "Preview before committing"
    ],
    highlight: "Professional style chosen for trust and credibility"
  },
  {
    id: 6,
    title: "Site Generated!",
    timestamp: "1:30 - 1:50",
    icon: Globe,
    description: "In seconds, Mike's professional website is ready. Complete with services, about page, testimonials section, and contact form.",
    details: [
      "AI generates all page content automatically",
      "Professional hero section with call-to-action",
      "Built-in lead capture and contact forms"
    ],
    highlight: "Full website with 5+ pages generated in under 2 minutes"
  },
  {
    id: 7,
    title: "Publish & Go Live",
    timestamp: "1:50 - 2:00",
    icon: Rocket,
    description: "Mike connects his domain mikesplumbing.com and publishes with one click. His new website is live!",
    details: [
      "Custom domain connection (optional)",
      "Free subdomain available immediately",
      "Single-click publishing",
      "Admin panel at admin.mikesplumbing.com"
    ],
    highlight: "From signup to live website in under 5 minutes"
  }
];

export default function Demo() {
  const [currentStep, setCurrentStep] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  const step = demoSteps[currentStep];

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => setIsPlaying(false);
    const handleEnded = () => setIsPlaying(false);

    video.addEventListener('play', handlePlay);
    video.addEventListener('pause', handlePause);
    video.addEventListener('ended', handleEnded);

    return () => {
      video.removeEventListener('play', handlePlay);
      video.removeEventListener('pause', handlePause);
      video.removeEventListener('ended', handleEnded);
    };
  }, []);

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleNext = () => {
    if (currentStep < demoSteps.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePlayVideo = () => {
    if (videoRef.current) {
      videoRef.current.play();
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900">
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
          <Link href="/">
            <Button variant="ghost" className="text-white" data-testid="link-back-home">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Home
            </Button>
          </Link>
          <Badge variant="secondary" className="bg-blue-500/20 text-blue-300 border-blue-500/30">
            Interactive Demo
          </Badge>
        </div>

        <div className="text-center mb-8">
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
            See LocalBlue.ai in Action
          </h1>
          <p className="text-xl text-blue-200 max-w-2xl mx-auto">
            Watch how Mike from Mike's Reliable Plumbing builds his professional website in under 5 minutes
          </p>
        </div>

        <div className="grid lg:grid-cols-3 gap-6 max-w-7xl mx-auto">
          <div className="lg:col-span-2">
            <Card className="bg-slate-800/50 border-slate-700 overflow-hidden">
              <div className="aspect-video bg-gradient-to-br from-slate-900 to-slate-800 relative flex items-center justify-center">
                <video 
                  ref={videoRef}
                  className="w-full h-full object-cover"
                  poster=""
                  controls
                  data-testid="video-demo"
                >
                  <source src="/demo/onboarding-demo.mp4" type="video/mp4" />
                  Your browser does not support the video tag.
                </video>
                
                {!isPlaying && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                    <button 
                      onClick={handlePlayVideo}
                      className="rounded-full h-20 w-20 bg-blue-600 flex items-center justify-center hover-elevate active-elevate-2"
                      aria-label="Play demo video"
                      data-testid="button-play-demo"
                    >
                      <Play className="h-8 w-8 ml-1 text-white" />
                    </button>
                  </div>
                )}
              </div>
              
              <CardContent className="p-4">
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div className="flex flex-wrap items-center gap-4">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={handlePrevious}
                      disabled={currentStep === 0}
                      className="border-slate-600 text-slate-300"
                      data-testid="button-prev-step"
                    >
                      <ArrowLeft className="h-4 w-4 mr-1" />
                      Previous
                    </Button>
                    <span className="text-slate-400 text-sm">
                      Step {currentStep + 1} of {demoSteps.length}
                    </span>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={handleNext}
                      disabled={currentStep === demoSteps.length - 1}
                      className="border-slate-600 text-slate-300"
                      data-testid="button-next-step"
                    >
                      Next
                      <ArrowRight className="h-4 w-4 ml-1" />
                    </Button>
                  </div>
                  
                  <Badge variant="outline" className="border-blue-500/50 text-blue-300">
                    {step.timestamp}
                  </Badge>
                </div>
                
                <div className="flex gap-1 mt-4">
                  {demoSteps.map((_, idx) => (
                    <button
                      key={idx}
                      onClick={() => setCurrentStep(idx)}
                      aria-label={`Go to step ${idx + 1}`}
                      className={`h-1 flex-1 rounded-full transition-colors ${
                        idx === currentStep 
                          ? 'bg-blue-500' 
                          : idx < currentStep 
                            ? 'bg-blue-500/50' 
                            : 'bg-slate-600'
                      }`}
                      data-testid={`button-step-${idx}`}
                    />
                  ))}
                </div>
              </CardContent>
            </Card>

            <div className="mt-6 text-center">
              <Link href="/signup">
                <Button size="lg" data-testid="button-demo-cta">
                  Start Building Your Site
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
            </div>
          </div>

          <div className="lg:col-span-1">
            <Card className="bg-slate-800/50 border-slate-700 h-full">
              <CardContent className="p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
                    <step.icon className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-white">{step.title}</h3>
                    <p className="text-sm text-blue-400">{step.timestamp}</p>
                  </div>
                </div>

                <p className="text-slate-300 mb-6">{step.description}</p>

                <div className="space-y-3 mb-6">
                  {step.details.map((detail, idx) => (
                    <div key={idx} className="flex items-start gap-3">
                      <CheckCircle className="h-5 w-5 text-green-400 mt-0.5 flex-shrink-0" />
                      <span className="text-sm text-slate-400">{detail}</span>
                    </div>
                  ))}
                </div>

                <div className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                  <div className="flex items-start gap-2">
                    <MessageSquare className="h-5 w-5 text-blue-400 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-sm font-medium text-blue-300 mb-1">Key Moment</p>
                      <p className="text-sm text-slate-300 italic">"{step.highlight}"</p>
                    </div>
                  </div>
                </div>

                <ScrollArea className="mt-6 h-48">
                  <div className="space-y-2">
                    {demoSteps.map((s, idx) => (
                      <button
                        key={s.id}
                        onClick={() => setCurrentStep(idx)}
                        aria-label={`Go to ${s.title}`}
                        className={`w-full text-left p-3 rounded-lg transition-colors hover-elevate ${
                          idx === currentStep
                            ? 'bg-blue-500/20 border border-blue-500/30'
                            : ''
                        }`}
                        data-testid={`button-timeline-${idx}`}
                      >
                        <div className="flex items-center gap-3">
                          <div className={`h-8 w-8 rounded-lg flex items-center justify-center ${
                            idx === currentStep 
                              ? 'bg-blue-500' 
                              : idx < currentStep 
                                ? 'bg-green-500/20' 
                                : 'bg-slate-700'
                          }`}>
                            {idx < currentStep ? (
                              <CheckCircle className="h-4 w-4 text-green-400" />
                            ) : (
                              <s.icon className={`h-4 w-4 ${idx === currentStep ? 'text-white' : 'text-slate-500'}`} />
                            )}
                          </div>
                          <div>
                            <p className={`text-sm font-medium ${idx === currentStep ? 'text-white' : 'text-slate-400'}`}>
                              {s.title}
                            </p>
                            <p className="text-xs text-slate-500">{s.timestamp}</p>
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </div>
        </div>

        <div className="mt-12 max-w-4xl mx-auto">
          <Card className="bg-gradient-to-r from-blue-600/20 to-indigo-600/20 border-blue-500/30">
            <CardContent className="p-8 text-center">
              <h2 className="text-2xl font-bold text-white mb-4">
                Ready to Build Your Contractor Website?
              </h2>
              <p className="text-blue-200 mb-6 max-w-xl mx-auto">
                Join 500+ contractors who've built professional websites with LocalBlue.ai. 
                No coding required, no monthly fees to start.
              </p>
              <div className="flex flex-wrap justify-center gap-4">
                <Link href="/signup">
                  <Button size="lg" className="bg-white text-blue-900" data-testid="button-demo-signup">
                    Get Started Free
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </Link>
                <Link href="/">
                  <Button size="lg" variant="outline" className="border-white/30 text-white" data-testid="button-demo-learn-more">
                    Learn More
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
