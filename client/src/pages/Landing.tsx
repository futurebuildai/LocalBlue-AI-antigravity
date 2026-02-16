import { useMemo, useState } from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Logo } from "@/components/Logo";
import { TypewriterText } from "@/components/TypewriterText";
import { FloatingIcons } from "@/components/FloatingIcons";
import { AnimatedSection } from "@/components/AnimatedSection";
import { useScrollSpy } from "@/hooks/use-scroll-spy";
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from "@/components/ui/sheet";
import { VideoModal } from "@/components/VideoModal";
import { useAuth } from "@/hooks/use-auth";
import { 
  MessageSquare, 
  Globe, 
  Zap, 
  ArrowRight, 
  Sparkles,
  CheckCircle,
  Shield,
  Rocket,
  ChevronRight,
  Play,
  Menu,
  X,
  LogOut,
  LayoutDashboard
} from "lucide-react";

const features = [
  {
    icon: MessageSquare,
    title: "AI Chat Builds Your Site",
    description: "Answer a few questions and our AI creates a website draft for your business. We're improving it every day.",
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
    description: "Connect your custom domain and go live. We handle the technical setup for you.",
    gradient: "from-amber-500 to-orange-600",
  },
];

const stats = [
  { value: "AI-Powered", label: "Site Generation", icon: Sparkles },
  { value: "Your Brand", label: "White-Label Admin", icon: Shield },
  { value: "Open Beta", label: "Free Early Access", icon: Rocket },
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
    description: "Our AI generates a professional website draft with your content and branding.",
  },
  {
    number: "03",
    title: "Preview & Refine",
    description: "Review your site, give feedback, and we'll refine it. Connect your domain when you're ready.",
  },
];

const foundingPartnerBenefits = [
  {
    title: "Free During Beta",
    description: "Use LocalBlue at no cost while we're in beta. Help us build something great together.",
    icon: Shield,
  },
  {
    title: "Shape the Product",
    description: "Your feedback goes directly to our development team. Tell us what works and what doesn't.",
    icon: MessageSquare,
  },
  {
    title: "Early Adopter Benefits",
    description: "Beta testers who help us improve will be first in line for special pricing when we launch.",
    icon: Zap,
  },
];

export default function Landing() {
  const { user, isAuthenticated } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [videoModalOpen, setVideoModalOpen] = useState(false);
  const sectionIds = useMemo(() => ['features', 'how-it-works', 'founding-partners'], []);
  const activeSection = useScrollSpy({ sectionIds, offset: 64 });

  const navLinks = [
    { id: 'features', label: 'Features' },
    { id: 'how-it-works', label: 'How It Works' },
    { id: 'founding-partners', label: 'Founding Partners' },
  ];

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
            {isAuthenticated && user ? (
              <>
                <div className="hidden sm:flex items-center gap-2" data-testid="text-header-username">
                  <Avatar className="h-7 w-7">
                    {user.profileImageUrl && <AvatarImage src={user.profileImageUrl} alt={user.firstName || ''} />}
                    <AvatarFallback className="text-xs bg-white/20 text-white">
                      {(user.firstName?.[0] || '')}{(user.lastName?.[0] || '')}
                    </AvatarFallback>
                  </Avatar>
                  <span className="text-sm font-medium text-white/70">{user.firstName}</span>
                </div>
                <Link href="/admin" className="hidden sm:block">
                  <Button variant="ghost" size="sm" className="text-white/70" data-testid="link-header-dashboard">
                    <LayoutDashboard className="mr-1.5 h-3.5 w-3.5" />
                    Dashboard
                  </Button>
                </Link>
                <a href="/api/logout" className="hidden sm:block">
                  <Button variant="ghost" size="sm" className="text-white/70" data-testid="button-header-logout">
                    <LogOut className="mr-1.5 h-3.5 w-3.5" />
                    Log Out
                  </Button>
                </a>
              </>
            ) : (
              <>
                <a href="/api/login" className="hidden sm:block">
                  <Button variant="ghost" size="sm" className="text-white/70" data-testid="link-header-login">
                    Sign In
                  </Button>
                </a>
                <Link href="/signup" className="hidden md:block">
                  <Button size="sm" className="bg-white text-slate-900 shadow-lg shadow-white/10" data-testid="link-header-signup">
                    Join Beta
                    <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
                  </Button>
                </Link>
              </>
            )}
            
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
                    {isAuthenticated && user ? (
                      <>
                        <div className="flex items-center gap-3 px-4 py-3">
                          <Avatar className="h-8 w-8">
                            {user.profileImageUrl && <AvatarImage src={user.profileImageUrl} alt={user.firstName || ''} />}
                            <AvatarFallback className="text-xs bg-white/20 text-white">
                              {(user.firstName?.[0] || '')}{(user.lastName?.[0] || '')}
                            </AvatarFallback>
                          </Avatar>
                          <span className="text-sm font-medium text-white">{user.firstName} {user.lastName}</span>
                        </div>
                        <Link href="/admin" onClick={handleMobileNavClick} className="block">
                          <Button 
                            className="w-full bg-white text-slate-900 shadow-lg shadow-white/10"
                            data-testid="link-mobile-dashboard"
                          >
                            <LayoutDashboard className="mr-2 h-4 w-4" />
                            Go to Dashboard
                          </Button>
                        </Link>
                        <a href="/api/logout" onClick={handleMobileNavClick} className="block">
                          <Button 
                            variant="outline" 
                            className="w-full bg-white/5 border-white/20 text-white"
                            data-testid="button-mobile-logout"
                          >
                            <LogOut className="mr-2 h-4 w-4" />
                            Log Out
                          </Button>
                        </a>
                      </>
                    ) : (
                      <>
                        <a href="/api/login" onClick={handleMobileNavClick} className="block">
                          <Button 
                            variant="outline" 
                            className="w-full bg-white/5 border-white/20 text-white"
                            data-testid="link-mobile-login"
                          >
                            Sign In
                          </Button>
                        </a>
                        <Link href="/signup" onClick={handleMobileNavClick} className="block">
                          <Button 
                            className="w-full bg-white text-slate-900 shadow-lg shadow-white/10"
                            data-testid="link-mobile-signup"
                          >
                            Join Beta
                            <ArrowRight className="ml-2 h-4 w-4" />
                          </Button>
                        </Link>
                      </>
                    )}
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
              We're building an AI-powered website builder made specifically for contractors. Join our beta and help us get it right.
            </p>
            
            <div className="mt-12 flex flex-col items-center justify-center gap-4 sm:flex-row animate-fade-in-up delay-500" style={{ opacity: 0, animationFillMode: 'forwards' }}>
              <Link href="/signup">
                <Button 
                  size="lg" 
                  className="bg-white text-slate-900 border-white shadow-2xl shadow-white/20 font-semibold"
                  data-testid="button-hero-cta"
                >
                  Join the Beta
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
                <span className="font-medium">Free During Beta</span>
              </div>
              <div className="flex items-center gap-2.5" data-testid="badge-free-plan">
                <CheckCircle className="h-4 w-4 text-emerald-400/80" />
                <span className="font-medium">No Credit Card Required</span>
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
                We're working to make the process as simple as possible. Here's how it works today.
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
                Beta Program
              </div>
              <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 tracking-tight">
                Become a
                <span className="bg-gradient-to-r from-amber-500 to-orange-500 bg-clip-text text-transparent"> Beta Tester</span>
              </h2>
              <p className="mx-auto mt-6 max-w-3xl text-muted-foreground text-lg font-light leading-relaxed">
                We're building LocalBlue because we believe contractors deserve better website tools. As a beta tester, you'll get free access while helping us build something that truly works for your business.
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
                    Too many contractors are stuck with expensive, complicated website builders that don't understand their business. We're working to change that. LocalBlue uses AI to make building a professional contractor website simple and affordable. We're not there yet — but with your help, we will be.
                  </p>
                  <p className="text-lg font-semibold text-amber-600 dark:text-amber-400">
                    Join our beta program and help us build the website tool contractors actually need.
                  </p>
                </CardContent>
              </Card>
            </AnimatedSection>
          </div>
        </section>

        <section className="py-24 md:py-32 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-600 via-violet-600 to-purple-700" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(255,255,255,0.1),transparent_50%)]" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom,rgba(0,0,0,0.2),transparent_50%)]" />
          
          <AnimatedSection animation="scale-up" className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-8 tracking-tight drop-shadow-lg" data-testid="text-cta-title">
              Help Us Build Something Great
            </h2>
            <p className="text-white/80 text-lg md:text-xl mb-12 max-w-2xl mx-auto font-light leading-relaxed">
              We're looking for contractors who want to try LocalBlue and share honest feedback. It's free during beta.
            </p>
            <Link href="/signup">
              <Button 
                size="lg" 
                className="bg-white text-slate-900 border-white shadow-2xl shadow-white/20 font-semibold"
                data-testid="button-footer-cta"
              >
                Join the Beta Program
                <ChevronRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <p className="mt-8 text-white/40 text-sm font-medium">Free during beta • Your feedback shapes the product</p>
          </AnimatedSection>
        </section>
      </main>

      <footer className="bg-slate-950 border-t border-white/5 py-16" data-testid="footer">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-8">
            <div className="flex flex-col items-center md:items-start gap-4">
              <Logo size="md" variant="light" />
              <p className="text-white/50 text-sm max-w-xs text-center md:text-left">
                AI-powered website builder for contractors. Currently in beta.
              </p>
            </div>
            <div className="flex flex-col items-center md:items-end gap-4">
              <nav className="flex items-center gap-6 flex-wrap">
                <a href="#features" className="text-sm text-white/50 hover:text-white transition-colors" data-testid="link-footer-features">Features</a>
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
    </div>
  );
}
