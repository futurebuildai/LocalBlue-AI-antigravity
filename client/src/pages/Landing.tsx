import { useMemo, useState } from "react";
import { Link } from "wouter";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Logo } from "@/components/Logo";
import { TypewriterText } from "@/components/TypewriterText";
import { FloatingIcons } from "@/components/FloatingIcons";
import { AnimatedSection } from "@/components/AnimatedSection";
import { useScrollSpy } from "@/hooks/use-scroll-spy";
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from "@/components/ui/sheet";
import { VideoModal } from "@/components/VideoModal";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { 
  MessageSquare, 
  Globe, 
  Zap, 
  ArrowRight, 
  Sparkles,
  CheckCircle,
  Shield,
  Rocket,
  Building2,
  Star,
  Users,
  Clock,
  ChevronRight,
  Play,
  Check,
  Crown,
  Briefcase,
  Menu,
  X,
  Loader2
} from "lucide-react";

const features = [
  {
    icon: MessageSquare,
    title: "AI Chat Builds Your Site",
    description: "Just answer a few questions and our AI creates a professional website for your business in minutes.",
    gradient: "from-blue-500 to-indigo-600",
  },
  {
    icon: Globe,
    title: "Your Domain, Your Brand",
    description: "Manage everything from admin.yoursite.com - not on LocalBlue. Your customers see only your brand.",
    gradient: "from-violet-500 to-purple-600",
  },
  {
    icon: Zap,
    title: "Single-Click Publish",
    description: "Connect your custom domain and go live instantly. No technical setup required.",
    gradient: "from-amber-500 to-orange-600",
  },
];

const stats = [
  { value: "< 15 min", label: "Average Build Time", icon: Clock },
  { value: "24/7", label: "AI Support", icon: Users },
  { value: "100%", label: "White-Label", icon: Shield },
];

const steps = [
  {
    number: "01",
    title: "Answer a Few Questions",
    description: "Tell our AI about your business, services, and what makes you unique.",
  },
  {
    number: "02", 
    title: "AI Builds Your Site",
    description: "Watch as your professional website is generated in real-time with all your content.",
  },
  {
    number: "03",
    title: "Connect & Go Live",
    description: "Add your domain and publish with a single click. You're in business!",
  },
];

const foundingPartnerBenefits = [
  {
    title: "Lock In Founder Pricing",
    description: "Your rate stays the same forever - even as we add more features and raise prices.",
    icon: Shield,
  },
  {
    title: "Shape the Product",
    description: "Direct line to our team. Your feedback directly influences what we build next.",
    icon: MessageSquare,
  },
  {
    title: "Priority Support",
    description: "Founding partners get white-glove onboarding and priority support.",
    icon: Zap,
  },
];

const pricingPlans = [
  {
    name: "Starter",
    description: "Professional Presence",
    price: "$49",
    priceDetail: "/month",
    annualPrice: "$490",
    annualPriceDetail: "/year",
    monthlyEquivalent: "$41",
    savings: "$98",
    icon: Rocket,
    features: [
      "Unlimited leads",
      "AI-built professional website",
      "White-label admin panel",
      "Contact forms with email alerts",
      "Appointment request system",
      "Project gallery",
      "Mobile-responsive design",
      "SEO optimization",
    ],
    cta: "Start 30-Day Free Trial",
    popular: false,
    gradient: "from-slate-500 to-slate-600",
  },
  {
    name: "Growth",
    description: "Lead Automation",
    price: "$99",
    priceDetail: "/month",
    annualPrice: "$990",
    annualPriceDetail: "/year",
    monthlyEquivalent: "$82",
    savings: "$198",
    icon: Briefcase,
    features: [
      "Unlimited leads",
      "Everything in Starter",
      "AI Sales Chatbot (24/7)",
      "Before/After project galleries",
      "Testimonials showcase",
      "Priority email support",
      "Google Analytics integration",
      "Custom domain connection",
    ],
    cta: "Start 30-Day Free Trial",
    popular: true,
    gradient: "from-blue-500 to-indigo-600",
  },
  {
    name: "Scale",
    description: "Custom Implementation",
    price: "Custom",
    priceDetail: "",
    annualPrice: "",
    annualPriceDetail: "",
    monthlyEquivalent: "",
    savings: "",
    icon: Crown,
    features: [
      "Unlimited leads",
      "Everything in Growth",
      "Instant quote calculator",
      "Service pricing display",
      "Multi-service pages",
      "Priority AI site build",
      "Dedicated account manager",
      "Phone support",
    ],
    cta: "Contact Sales",
    popular: false,
    gradient: "from-violet-500 to-purple-600",
    isContactSales: true,
  },
];

export default function Landing() {
  const { toast } = useToast();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [videoModalOpen, setVideoModalOpen] = useState(false);
  const [billingPeriod, setBillingPeriod] = useState<'monthly' | 'annual'>('monthly');
  const [contactModalOpen, setContactModalOpen] = useState(false);
  const [contactForm, setContactForm] = useState({ name: '', email: '', phone: '', businessName: '', message: '' });
  const [contactSubmitted, setContactSubmitted] = useState(false);
  const sectionIds = useMemo(() => ['features', 'how-it-works', 'founding-partners', 'pricing'], []);
  const activeSection = useScrollSpy({ sectionIds, offset: 64 });

  const navLinks = [
    { id: 'features', label: 'Features' },
    { id: 'how-it-works', label: 'How It Works' },
    { id: 'founding-partners', label: 'Founding Partners' },
    { id: 'pricing', label: 'Pricing' },
  ];

  const contactMutation = useMutation({
    mutationFn: async (data: typeof contactForm) => {
      const response = await apiRequest('POST', '/api/contact-sales', data);
      return response.json();
    },
    onSuccess: () => {
      setContactSubmitted(true);
      toast({
        title: "Message Sent!",
        description: "We'll be in touch within 24 hours.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to send message. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleContactSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    contactMutation.mutate(contactForm);
  };

  const handleMobileNavClick = () => {
    setMobileMenuOpen(false);
  };

  return (
    <div className="min-h-screen bg-background overflow-x-hidden">
      {/* Header - Apple/Google-level premium design */}
      <header className="fixed top-0 left-0 right-0 z-[9999]">
        <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-xl border-b border-white/5" />
        <div className="relative max-w-7xl mx-auto flex h-16 items-center justify-between gap-6 px-4 sm:px-6 lg:px-8">
          <Logo size="md" linkTo="/" variant="light" />
          
          <nav className="hidden md:flex items-center justify-center gap-8">
            {navLinks.map((link) => (
              <a
                key={link.id}
                href={`#${link.id}`}
                className={`text-sm font-medium transition-all duration-300 relative ${
                  activeSection === link.id
                    ? 'text-white after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-blue-400 after:rounded-full'
                    : 'text-white/70 hover:text-white'
                }`}
                data-testid={`link-nav-${link.id}`}
              >
                {link.label}
              </a>
            ))}
          </nav>
          
          <div className="flex items-center gap-3 flex-wrap">
            <Link href="/login" className="hidden sm:block">
              <Button variant="ghost" size="sm" className="text-white/70 hover:text-white hover:bg-white/10" data-testid="link-header-login">
                Sign In
              </Button>
            </Link>
            <Link href="/signup" className="hidden md:block">
              <Button size="sm" className="bg-white text-slate-900 hover:bg-white/90 shadow-lg shadow-white/10" data-testid="link-header-signup">
                Get Started
                <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
              </Button>
            </Link>
            
            <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
              <SheetTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="md:hidden text-white/70 hover:text-white hover:bg-white/10"
                  data-testid="button-mobile-menu"
                  aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
                >
                  {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
                </Button>
              </SheetTrigger>
              <SheetContent 
                side="right" 
                className="w-[300px] sm:w-[350px] bg-slate-950/95 backdrop-blur-xl border-l border-white/10 p-0"
                aria-label="Mobile navigation menu"
              >
                <SheetTitle className="sr-only">Navigation Menu</SheetTitle>
                <div className="flex flex-col h-full">
                  <div className="p-6 border-b border-white/10">
                    <Logo size="md" variant="light" />
                  </div>
                  
                  <nav className="flex-1 p-6">
                    <div className="flex flex-col gap-1">
                      {navLinks.map((link) => (
                        <a
                          key={link.id}
                          href={`#${link.id}`}
                          onClick={handleMobileNavClick}
                          className={`text-lg font-medium py-3 px-4 rounded-lg transition-all duration-200 ${
                            activeSection === link.id
                              ? 'text-white bg-white/10'
                              : 'text-white/70 hover:text-white hover:bg-white/5'
                          }`}
                          data-testid={`link-mobile-nav-${link.id}`}
                        >
                          {link.label}
                        </a>
                      ))}
                    </div>
                  </nav>
                  
                  <div className="p-6 border-t border-white/10 space-y-3">
                    <Link href="/login" onClick={handleMobileNavClick} className="block">
                      <Button 
                        variant="outline" 
                        className="w-full bg-white/5 border-white/20 text-white hover:bg-white/10 hover:text-white"
                        data-testid="link-mobile-login"
                      >
                        Sign In
                      </Button>
                    </Link>
                    <Link href="/signup" onClick={handleMobileNavClick} className="block">
                      <Button 
                        className="w-full bg-white text-slate-900 hover:bg-white/90 shadow-lg shadow-white/10"
                        data-testid="link-mobile-signup"
                      >
                        Get Started
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </Button>
                    </Link>
                  </div>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </header>

      <main>
        {/* Hero Section - Modern Antigravity-inspired design */}
        <section className="relative min-h-screen flex items-center justify-center pt-16 overflow-hidden">
          {/* Dark immersive background */}
          <div className="absolute inset-0 gradient-hero-dark" />
          
          {/* Subtle glow orbs */}
          <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-blue-600/20 rounded-full blur-[120px] animate-pulse-slow" />
          <div className="absolute bottom-1/3 right-1/4 w-[600px] h-[600px] bg-violet-600/15 rounded-full blur-[150px] animate-pulse-slow" style={{ animationDelay: '2s' }} />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-indigo-500/10 rounded-full blur-[180px]" />
          
          {/* Floating icons */}
          <FloatingIcons />
          
          {/* Subtle grid pattern */}
          <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.015)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.015)_1px,transparent_1px)] bg-[size:60px_60px]" />

          <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center py-24">
            {/* Large bold headline with typewriter effect */}
            <h1 
              className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-bold text-white mb-8 leading-[1.05] tracking-tight animate-fade-in-up delay-100"
              data-testid="text-hero-headline"
              style={{ opacity: 0, animationFillMode: 'forwards' }}
            >
              <span className="block">Build Your</span>
              <span className="block mt-2 bg-gradient-to-r from-blue-400 via-violet-400 to-purple-400 bg-clip-text text-transparent glow-text">
                <TypewriterText text="Contractor Website" speed={60} delay={500} />
              </span>
              <span className="block mt-2 text-white/90">in Minutes</span>
            </h1>
            
            <p 
              className="mx-auto mt-8 max-w-2xl text-lg sm:text-xl text-white/60 leading-relaxed font-light animate-fade-in-up delay-300"
              data-testid="text-hero-subheadline"
              style={{ opacity: 0, animationFillMode: 'forwards' }}
            >
              Just chat with our AI, and we'll create a stunning website for your business. 
              Your customers only see your brand - never LocalBlue.
            </p>
            
            <div className="mt-12 flex flex-col items-center justify-center gap-4 sm:flex-row animate-fade-in-up delay-500" style={{ opacity: 0, animationFillMode: 'forwards' }}>
              <Link href="/signup">
                <Button 
                  size="lg" 
                  className="bg-white text-slate-900 border-white shadow-2xl shadow-white/20 font-semibold"
                  data-testid="button-hero-cta"
                >
                  Start Your Free Trial
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              <Button 
                  size="lg" 
                  variant="outline"
                  className="bg-white/5 border-white/20 text-white backdrop-blur-sm"
                  data-testid="button-hero-demo"
                  onClick={() => setVideoModalOpen(true)}
                >
                  <Play className="mr-2 h-5 w-5" />
                  Watch Demo
                </Button>
            </div>

            {/* Trust badges */}
            <div className="mt-20 flex flex-wrap items-center justify-center gap-8 text-white/50 text-sm animate-fade-in-up delay-700" style={{ opacity: 0, animationFillMode: 'forwards' }}>
              <div className="flex items-center gap-2.5" data-testid="badge-no-credit-card">
                <Shield className="h-4 w-4 text-emerald-400/80" />
                <span className="font-medium">30-Day Free Trial</span>
              </div>
              <div className="flex items-center gap-2.5" data-testid="badge-free-plan">
                <CheckCircle className="h-4 w-4 text-emerald-400/80" />
                <span className="font-medium">No Credit Card to Start</span>
              </div>
              <div className="flex items-center gap-2.5" data-testid="badge-launch-time">
                <Rocket className="h-4 w-4 text-emerald-400/80" />
                <span className="font-medium">Launch in 5 Minutes</span>
              </div>
            </div>
          </div>

          {/* Smooth gradient transition to dark stats section */}
          <div className="absolute bottom-0 left-0 right-0 h-40 bg-gradient-to-t from-slate-950 via-slate-950/80 to-transparent" />
        </section>

        {/* Stats Section - Dark striking background */}
        <section className="py-24 relative section-gradient-dark" data-testid="section-stats">
          <div className="absolute inset-0 mesh-gradient opacity-50" />
          <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 md:gap-12 justify-items-center">
              {stats.map((stat, index) => (
                <AnimatedSection key={index} animation="fade-up" delay={index * 100}>
                  <div className="text-center group" data-testid={`stat-${index}`}>
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500/20 to-violet-500/20 border border-white/10 mb-6 group-hover:scale-110 transition-transform pulse-glow">
                      <stat.icon className="h-7 w-7 text-blue-400" />
                    </div>
                    <div className="text-5xl md:text-6xl font-bold bg-gradient-to-r from-white via-blue-100 to-violet-200 bg-clip-text text-transparent mb-3 tracking-tight">{stat.value}</div>
                    <div className="text-white/60 text-sm font-medium tracking-wide uppercase">{stat.label}</div>
                  </div>
                </AnimatedSection>
              ))}
            </div>
          </div>
        </section>

        {/* Features Section - Vibrant with gradient accents */}
        <section id="features" className="py-24 md:py-32 relative scroll-mt-20 overflow-hidden">
          <div className="absolute inset-0 section-gradient-accent" />
          <div className="absolute inset-0 grid-pattern" />
          <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <AnimatedSection animation="fade-up" className="text-center mb-20">
              <div className="inline-flex items-center gap-2.5 px-5 py-2.5 rounded-full bg-gradient-to-r from-blue-500/10 to-violet-500/10 border border-blue-500/20 text-blue-600 dark:text-blue-400 text-sm font-semibold mb-8 shimmer">
                <Zap className="h-4 w-4" />
                Features
              </div>
              <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 tracking-tight" data-testid="text-features-title">
                Everything You Need to
                <span className="gradient-text block sm:inline"> Get Online</span>
              </h2>
              <p className="mx-auto mt-6 max-w-2xl text-muted-foreground text-lg font-light leading-relaxed">
                No technical skills required. Our AI handles the hard work so you can focus on your business.
              </p>
            </AnimatedSection>
            
            <div className="grid gap-6 md:grid-cols-3">
              {features.map((feature, index) => (
                <AnimatedSection key={index} animation="fade-up" delay={index * 150}>
                  <Card 
                    className="group card-lift border border-border/50 shadow-lg bg-card/80 backdrop-blur-sm overflow-visible border-accent-top h-full"
                    data-testid={`card-feature-${index}`}
                  >
                    <CardContent className="p-8 pt-10">
                      <div className={`mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br ${feature.gradient} shadow-xl group-hover:shadow-2xl group-hover:scale-110 transition-all duration-300`}>
                        <feature.icon className="h-7 w-7 text-white" />
                      </div>
                      <h3 className="mb-3 text-xl font-bold tracking-tight">{feature.title}</h3>
                      <p className="text-muted-foreground leading-relaxed">{feature.description}</p>
                    </CardContent>
                  </Card>
                </AnimatedSection>
              ))}
            </div>
          </div>
        </section>

        {/* How It Works Section - Dark immersive */}
        <section id="how-it-works" className="py-24 md:py-32 relative scroll-mt-20 section-gradient-dark overflow-hidden">
          <div className="absolute inset-0 mesh-gradient opacity-40" />
          <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <AnimatedSection animation="fade-up" className="text-center mb-20">
              <div className="inline-flex items-center gap-2.5 px-5 py-2.5 rounded-full bg-gradient-to-r from-emerald-500/10 to-cyan-500/10 border border-emerald-500/20 text-emerald-400 text-sm font-semibold mb-8 shimmer">
                <Rocket className="h-4 w-4" />
                How It Works
              </div>
              <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 tracking-tight text-white">
                Three Simple Steps to
                <span className="bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent block sm:inline"> Launch</span>
              </h2>
              <p className="mx-auto mt-6 max-w-2xl text-white/60 text-lg font-light leading-relaxed">
                From sign-up to live website in under 5 minutes. It's that easy.
              </p>
            </AnimatedSection>

            <div className="grid md:grid-cols-3 gap-8 md:gap-12">
              {steps.map((step, index) => (
                <AnimatedSection key={index} animation="slide-left" delay={index * 150}>
                  <div className="relative group">
                    {/* Connector line */}
                    {index < steps.length - 1 && (
                      <div className="hidden md:block absolute top-12 left-full w-full h-px bg-gradient-to-r from-emerald-500/50 via-cyan-500/30 to-transparent" />
                    )}
                    <div className="text-center p-8 rounded-3xl bg-white/5 backdrop-blur-sm border border-white/10 group-hover:bg-white/10 group-hover:border-emerald-500/30 transition-all duration-300">
                      <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br from-emerald-500 to-cyan-500 text-white text-2xl font-bold mb-8 shadow-xl shadow-emerald-500/30 group-hover:scale-110 group-hover:shadow-emerald-500/50 transition-all duration-300">
                        {step.number}
                      </div>
                      <h3 className="text-xl font-bold mb-4 tracking-tight text-white">{step.title}</h3>
                      <p className="text-white/60 leading-relaxed">{step.description}</p>
                    </div>
                  </div>
                </AnimatedSection>
              ))}
            </div>
          </div>
        </section>

        {/* Founding Partners Section - Warm amber accents */}
        <section id="founding-partners" className="py-24 md:py-32 relative overflow-hidden scroll-mt-20">
          <div className="absolute inset-0 bg-gradient-to-br from-amber-500/5 via-orange-500/5 to-rose-500/5" />
          <div className="absolute inset-0 grid-pattern" />
          <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <AnimatedSection animation="fade-up" className="text-center mb-16">
              <div className="inline-flex items-center gap-2.5 px-5 py-2.5 rounded-full bg-gradient-to-r from-amber-500/10 to-orange-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400 text-sm font-semibold mb-8 shimmer">
                <Rocket className="h-4 w-4" />
                Early Access
              </div>
              <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 tracking-tight">
                Become a
                <span className="bg-gradient-to-r from-amber-500 to-orange-500 bg-clip-text text-transparent"> Founding Partner</span>
              </h2>
              <p className="mx-auto mt-6 max-w-3xl text-muted-foreground text-lg font-light leading-relaxed">
                We're building LocalBlue because we believe contractors deserve better than overpriced, 
                complicated website builders. As a founding partner, you'll help shape the future of 
                contractor marketing while locking in exclusive benefits.
              </p>
            </AnimatedSection>

            <div className="grid md:grid-cols-3 gap-6 mb-12">
              {foundingPartnerBenefits.map((benefit, index) => (
                <AnimatedSection key={index} animation="scale-up" delay={index * 150}>
                  <Card className="card-lift border border-border/50 shadow-lg bg-card/80 backdrop-blur-sm overflow-visible h-full">
                    <CardContent className="p-8 text-center">
                      <div className="mx-auto mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-500 to-orange-500 shadow-xl shadow-amber-500/20">
                        <benefit.icon className="h-7 w-7 text-white" />
                      </div>
                      <h3 className="text-xl font-bold mb-3">{benefit.title}</h3>
                      <p className="text-muted-foreground leading-relaxed">{benefit.description}</p>
                    </CardContent>
                  </Card>
                </AnimatedSection>
              ))}
            </div>

            <AnimatedSection animation="fade-up" delay={450}>
              <Card className="border border-amber-500/20 bg-gradient-to-br from-amber-500/5 to-orange-500/5 backdrop-blur-sm">
                <CardContent className="p-8 md:p-12 text-center">
                  <h3 className="text-2xl md:text-3xl font-bold mb-4">Why We're Building LocalBlue</h3>
                  <p className="max-w-3xl mx-auto text-muted-foreground leading-relaxed mb-6">
                    Too many contractors are paying $200-500/month for websites that don't work for them — 
                    or worse, getting locked into contracts with companies that own their domain and content. 
                    We're changing that. LocalBlue gives you a professional website you actually own, 
                    at a price that makes sense, with AI that does the heavy lifting.
                  </p>
                  <p className="text-lg font-semibold text-amber-600 dark:text-amber-400">
                    Join us in the early days and help build something great.
                  </p>
                </CardContent>
              </Card>
            </AnimatedSection>
          </div>
        </section>

        {/* Pricing Section - Dark with purple accents */}
        <section id="pricing" className="py-24 md:py-32 relative scroll-mt-20 section-gradient-dark overflow-hidden" data-testid="section-pricing">
          <div className="absolute inset-0 mesh-gradient opacity-30" />
          <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <AnimatedSection animation="fade-up" className="text-center mb-16">
              <div className="inline-flex items-center gap-2.5 px-5 py-2.5 rounded-full bg-gradient-to-r from-violet-500/10 to-purple-500/10 border border-violet-500/20 text-violet-400 text-sm font-semibold mb-8 shimmer">
                <Crown className="h-4 w-4" />
                Pricing
              </div>
              <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 tracking-tight text-white">
                Simple, Transparent
                <span className="bg-gradient-to-r from-violet-400 to-purple-400 bg-clip-text text-transparent block sm:inline"> Pricing</span>
              </h2>
              <p className="mx-auto mt-6 max-w-2xl text-white/60 text-lg font-light leading-relaxed">
                All plans include <span className="text-emerald-400 font-medium">unlimited leads</span>. Start with a 30-day free trial — no credit card required.
              </p>
            </AnimatedSection>

            <AnimatedSection animation="fade-up" delay={100} className="flex justify-center mb-12">
              <div 
                className="inline-flex items-center p-1.5 rounded-full bg-white/5 backdrop-blur-md border border-white/10"
                data-testid="toggle-billing-period"
              >
                <button
                  onClick={() => setBillingPeriod('monthly')}
                  className={`px-6 py-2.5 rounded-full text-sm font-medium transition-all duration-300 ${
                    billingPeriod === 'monthly'
                      ? 'bg-white/20 text-white shadow-lg'
                      : 'text-white/60 hover:text-white'
                  }`}
                  data-testid="button-billing-monthly"
                >
                  Monthly
                </button>
                <button
                  onClick={() => setBillingPeriod('annual')}
                  className={`px-6 py-2.5 rounded-full text-sm font-medium transition-all duration-300 flex items-center gap-2 ${
                    billingPeriod === 'annual'
                      ? 'bg-white/20 text-white shadow-lg'
                      : 'text-white/60 hover:text-white'
                  }`}
                  data-testid="button-billing-annual"
                >
                  Annual
                  <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 text-xs font-semibold border border-emerald-500/30">
                    2 Months Free
                  </span>
                </button>
              </div>
            </AnimatedSection>

            <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
              {pricingPlans.map((plan, index) => (
                <AnimatedSection key={index} animation="fade-up" delay={index * 150}>
                  <Card 
                    className={`relative card-lift border bg-white/5 backdrop-blur-sm overflow-visible h-full ${plan.popular ? 'border-violet-500/50 shadow-2xl shadow-violet-500/20 scale-105' : 'border-white/10'}`}
                    data-testid={`card-pricing-${plan.name.toLowerCase()}`}
                  >
                    {plan.popular && (
                      <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                        <Badge className="bg-gradient-to-r from-violet-500 to-purple-500 text-white px-4 py-1 text-xs shadow-lg shadow-violet-500/30 shimmer">
                          Most Popular
                        </Badge>
                      </div>
                    )}
                    <CardHeader className="text-center pb-2 pt-10">
                      <div className={`mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br ${plan.gradient} shadow-xl`}>
                        <plan.icon className="h-7 w-7 text-white" />
                      </div>
                      <CardTitle className="text-xl font-bold text-white">{plan.name}</CardTitle>
                      <CardDescription className="text-white/50">{plan.description}</CardDescription>
                    </CardHeader>
                    <CardContent className="text-center">
                      <div className="mb-8">
                        <div className="relative transition-all duration-300 ease-out">
                          {billingPeriod === 'annual' && plan.monthlyEquivalent ? (
                            <div className="animate-fade-in-up" style={{ animationDuration: '200ms' }}>
                              <div className="flex items-center justify-center gap-2 mb-1">
                                <span className="text-lg text-white/40 line-through">{plan.price}</span>
                              </div>
                              <span className="text-5xl font-bold tracking-tight text-white">{plan.monthlyEquivalent}</span>
                              <span className="text-white/40 ml-1 text-sm">/mo</span>
                              <div className="mt-2 text-xs text-white/50">
                                {plan.annualPrice} billed annually
                              </div>
                              {plan.savings && (
                                <div className="mt-2 inline-flex items-center gap-1 px-2 py-1 rounded-full bg-emerald-500/20 text-emerald-400 text-xs font-semibold border border-emerald-500/30">
                                  Save {plan.savings}
                                </div>
                              )}
                            </div>
                          ) : (
                            <div className="animate-fade-in-up" style={{ animationDuration: '200ms' }}>
                              <span className="text-5xl font-bold tracking-tight text-white">{plan.price}</span>
                              <span className="text-white/40 ml-1 text-sm">{plan.priceDetail}</span>
                            </div>
                          )}
                        </div>
                      </div>
                      <ul className="space-y-4 text-left mb-8">
                        {plan.features.map((feature, i) => (
                          <li key={i} className="flex items-start gap-3">
                            <Check className="h-5 w-5 text-violet-400 mt-0.5 shrink-0" />
                            <span className="text-sm text-white/70">{feature}</span>
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                    <CardFooter className="pb-8">
                      {(plan as any).isContactSales ? (
                        <Button 
                          className="w-full bg-white/10 border-white/20 text-white hover:bg-white/20"
                          variant="outline"
                          data-testid={`button-pricing-${plan.name.toLowerCase()}`}
                          onClick={() => setContactModalOpen(true)}
                        >
                          {plan.cta}
                          <ArrowRight className="ml-2 h-4 w-4" />
                        </Button>
                      ) : (
                        <Link href="/signup" className="w-full">
                          <Button 
                            className={`w-full ${plan.popular ? 'bg-gradient-to-r from-violet-500 to-purple-500 text-white shadow-lg shadow-violet-500/30 border-0' : 'bg-white/10 border-white/20 text-white hover:bg-white/20'}`}
                            variant={plan.popular ? "default" : "outline"}
                            data-testid={`button-pricing-${plan.name.toLowerCase()}`}
                          >
                            {plan.cta}
                            <ArrowRight className="ml-2 h-4 w-4" />
                          </Button>
                        </Link>
                      )}
                    </CardFooter>
                  </Card>
                </AnimatedSection>
              ))}
            </div>

            <AnimatedSection animation="fade-in" delay={500} className="mt-16 text-center">
              <p className="text-white/40 text-sm">
                30-day "Test Drive" on localblue.co subdomain. No credit card required to start.
              </p>
              <p className="text-white/30 text-xs mt-2">
                Connect your custom domain when you're ready - includes 14 extra days free before billing.
              </p>
            </AnimatedSection>
          </div>
        </section>

        {/* CTA Section - Vibrant gradient */}
        <section className="py-24 md:py-32 relative overflow-hidden">
          {/* Vibrant gradient background */}
          <div className="absolute inset-0 bg-gradient-to-br from-blue-600 via-violet-600 to-purple-700" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(255,255,255,0.1),transparent_50%)]" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom,rgba(0,0,0,0.2),transparent_50%)]" />
          
          <AnimatedSection animation="scale-up" className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-8 tracking-tight drop-shadow-lg" data-testid="text-cta-title">
              Ready to Build Your Website?
            </h2>
            <p className="text-white/80 text-lg md:text-xl mb-12 max-w-2xl mx-auto font-light leading-relaxed">
              Join hundreds of contractors who have already launched their professional websites with LocalBlue
            </p>
            <Link href="/signup">
              <Button 
                size="lg" 
                className="bg-white text-slate-900 border-white shadow-2xl shadow-white/20 font-semibold"
                data-testid="button-footer-cta"
              >
                Start Your 30-Day Free Trial
                <ChevronRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <p className="mt-8 text-white/40 text-sm font-medium">No credit card required to start</p>
          </AnimatedSection>
        </section>
      </main>

      {/* Footer - Dark matching sections */}
      <footer className="bg-slate-950 border-t border-white/5 py-16" data-testid="footer">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-8">
            <div className="flex flex-col items-center md:items-start gap-4">
              <Logo size="md" variant="light" />
              <p className="text-white/50 text-sm max-w-xs text-center md:text-left">
                Build professional contractor websites in minutes with AI.
              </p>
            </div>
            <div className="flex flex-col items-center md:items-end gap-4">
              <nav className="flex items-center gap-6 flex-wrap">
                <a href="#features" className="text-sm text-white/50 hover:text-white transition-colors" data-testid="link-footer-features">Features</a>
                <a href="#pricing" className="text-sm text-white/50 hover:text-white transition-colors" data-testid="link-footer-pricing">Pricing</a>
              </nav>
              <p className="text-white/30 text-sm" data-testid="footer-copyright">
                &copy; {new Date().getFullYear()} LocalBlue. All rights reserved.
              </p>
            </div>
          </div>
        </div>
      </footer>

      <VideoModal 
        open={videoModalOpen} 
        onOpenChange={setVideoModalOpen} 
      />

      {/* Contact Sales Modal */}
      <Dialog open={contactModalOpen} onOpenChange={(open) => {
        setContactModalOpen(open);
        if (!open) {
          setContactSubmitted(false);
          setContactForm({ name: '', email: '', phone: '', businessName: '', message: '' });
        }
      }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Contact Sales</DialogTitle>
            <DialogDescription>
              Tell us about your business and we'll reach out to discuss custom implementation options.
            </DialogDescription>
          </DialogHeader>
          
          {contactSubmitted ? (
            <div className="text-center py-8">
              <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Thank You!</h3>
              <p className="text-muted-foreground">
                We've received your message and will be in touch within 24 hours.
              </p>
              <Button 
                className="mt-6"
                onClick={() => setContactModalOpen(false)}
                data-testid="button-contact-close"
              >
                Close
              </Button>
            </div>
          ) : (
            <form onSubmit={handleContactSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="contact-name">Your Name</Label>
                <Input
                  id="contact-name"
                  placeholder="John Smith"
                  value={contactForm.name}
                  onChange={(e) => setContactForm({ ...contactForm, name: e.target.value })}
                  required
                  data-testid="input-contact-name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="contact-email">Email</Label>
                <Input
                  id="contact-email"
                  type="email"
                  placeholder="john@example.com"
                  value={contactForm.email}
                  onChange={(e) => setContactForm({ ...contactForm, email: e.target.value })}
                  required
                  data-testid="input-contact-email"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="contact-phone">Phone (optional)</Label>
                <Input
                  id="contact-phone"
                  type="tel"
                  placeholder="(555) 123-4567"
                  value={contactForm.phone}
                  onChange={(e) => setContactForm({ ...contactForm, phone: e.target.value })}
                  data-testid="input-contact-phone"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="contact-business">Business Name</Label>
                <Input
                  id="contact-business"
                  placeholder="Smith Plumbing"
                  value={contactForm.businessName}
                  onChange={(e) => setContactForm({ ...contactForm, businessName: e.target.value })}
                  required
                  data-testid="input-contact-business"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="contact-message">How can we help?</Label>
                <Textarea
                  id="contact-message"
                  placeholder="Tell us about your business and what you're looking for..."
                  value={contactForm.message}
                  onChange={(e) => setContactForm({ ...contactForm, message: e.target.value })}
                  rows={3}
                  data-testid="input-contact-message"
                />
              </div>
              <Button 
                type="submit" 
                className="w-full"
                disabled={contactMutation.isPending}
                data-testid="button-contact-submit"
              >
                {contactMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Sending...
                  </>
                ) : (
                  "Send Message"
                )}
              </Button>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
