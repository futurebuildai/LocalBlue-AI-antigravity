import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Logo } from "@/components/Logo";
import { TypewriterText } from "@/components/TypewriterText";
import { FloatingIcons } from "@/components/FloatingIcons";
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
  Briefcase
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
  { value: "500+", label: "Contractors Served", icon: Building2 },
  { value: "< 5 min", label: "Average Build Time", icon: Clock },
  { value: "4.9/5", label: "Customer Rating", icon: Star },
  { value: "24/7", label: "AI Support", icon: Users },
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

const testimonials = [
  {
    quote: "I had my website up and running in 10 minutes. My clients are impressed!",
    name: "Mike Johnson",
    role: "Johnson Plumbing Co.",
    rating: 5,
  },
  {
    quote: "Finally, a website builder that understands contractors. No tech skills needed.",
    name: "Sarah Martinez",
    role: "Elite Electrical Services",
    rating: 5,
  },
  {
    quote: "The AI chatbot generates leads while I'm on the job. Game changer!",
    name: "David Chen",
    role: "Chen HVAC Solutions",
    rating: 5,
  },
];

const pricingPlans = [
  {
    name: "Starter",
    description: "Perfect for getting started",
    price: "Free",
    priceDetail: "forever",
    icon: Rocket,
    features: [
      "AI-built professional website",
      "LocalBlue subdomain",
      "Contact form with email alerts",
      "Mobile-responsive design",
      "Basic SEO optimization",
      "Community support",
    ],
    cta: "Get Started Free",
    popular: false,
    gradient: "from-slate-500 to-slate-600",
  },
  {
    name: "Professional",
    description: "For growing businesses",
    price: "$29",
    priceDetail: "/month",
    icon: Briefcase,
    features: [
      "Everything in Starter",
      "Custom domain connection",
      "AI chatbot for lead capture",
      "Quote calculator widget",
      "Appointment scheduling",
      "Priority email support",
      "Google Analytics integration",
      "Remove LocalBlue branding",
    ],
    cta: "Start 14-Day Trial",
    popular: true,
    gradient: "from-blue-500 to-indigo-600",
  },
  {
    name: "Enterprise",
    description: "For established contractors",
    price: "$79",
    priceDetail: "/month",
    icon: Crown,
    features: [
      "Everything in Professional",
      "Multiple team members",
      "Advanced lead management",
      "Custom integrations",
      "White-label solution",
      "Dedicated account manager",
      "Phone support",
      "Custom development",
    ],
    cta: "Contact Sales",
    popular: false,
    gradient: "from-violet-500 to-purple-600",
  },
];

export default function Landing() {
  return (
    <div className="min-h-screen bg-background overflow-x-hidden">
      {/* Header - Apple/Google-level premium design */}
      <header className="fixed top-0 left-0 right-0 z-[9999]">
        <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-xl border-b border-white/5" />
        <div className="relative max-w-7xl mx-auto flex h-16 items-center justify-between gap-6 px-4 sm:px-6 lg:px-8">
          <Logo size="md" linkTo="/" variant="light" />
          
          <nav className="hidden md:flex items-center gap-8 flex-wrap">
            <a href="#features" className="text-sm font-medium text-white/70 hover:text-white transition-colors" data-testid="link-nav-features">
              Features
            </a>
            <a href="#how-it-works" className="text-sm font-medium text-white/70 hover:text-white transition-colors" data-testid="link-nav-how-it-works">
              How It Works
            </a>
            <a href="#pricing" className="text-sm font-medium text-white/70 hover:text-white transition-colors" data-testid="link-nav-pricing">
              Pricing
            </a>
            <Link href="/demo" className="text-sm font-medium text-white/70 hover:text-white transition-colors" data-testid="link-nav-demo">
              Demo
            </Link>
          </nav>
          
          <div className="flex items-center gap-3 flex-wrap">
            <Link href="/login" className="hidden sm:block">
              <Button variant="ghost" size="sm" className="text-white/70 hover:text-white hover:bg-white/10" data-testid="link-header-login">
                Sign In
              </Button>
            </Link>
            <Link href="/signup">
              <Button size="sm" className="bg-white text-slate-900 hover:bg-white/90 shadow-lg shadow-white/10" data-testid="link-header-signup">
                Get Started
                <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
              </Button>
            </Link>
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
            {/* Animated badge */}
            <div className="inline-flex items-center gap-2.5 px-5 py-2.5 rounded-full bg-white/5 backdrop-blur-md border border-white/10 text-white/80 text-sm mb-10 animate-fade-in-up glow-subtle">
              <Sparkles className="h-4 w-4 text-blue-400" />
              <span className="font-medium tracking-wide">AI-Powered Website Builder for Contractors</span>
            </div>

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
                  Build Your Site Free
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              <Link href="/demo">
                <Button 
                  size="lg" 
                  variant="outline"
                  className="bg-white/5 border-white/20 text-white backdrop-blur-sm"
                  data-testid="button-hero-demo"
                >
                  <Play className="mr-2 h-5 w-5" />
                  Watch Demo
                </Button>
              </Link>
            </div>

            {/* Trust badges */}
            <div className="mt-20 flex flex-wrap items-center justify-center gap-8 text-white/50 text-sm animate-fade-in-up delay-700" style={{ opacity: 0, animationFillMode: 'forwards' }}>
              <div className="flex items-center gap-2.5" data-testid="badge-no-credit-card">
                <Shield className="h-4 w-4 text-emerald-400/80" />
                <span className="font-medium">No Credit Card Required</span>
              </div>
              <div className="flex items-center gap-2.5" data-testid="badge-free-plan">
                <CheckCircle className="h-4 w-4 text-emerald-400/80" />
                <span className="font-medium">Free Forever Plan</span>
              </div>
              <div className="flex items-center gap-2.5" data-testid="badge-launch-time">
                <Rocket className="h-4 w-4 text-emerald-400/80" />
                <span className="font-medium">Launch in 5 Minutes</span>
              </div>
            </div>
          </div>

          {/* Smooth gradient transition to next section */}
          <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-background to-transparent" />
        </section>

        {/* Stats Section */}
        <section className="py-20 bg-background relative" data-testid="section-stats">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-12">
              {stats.map((stat, index) => (
                <div key={index} className="text-center group" data-testid={`stat-${index}`}>
                  <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-primary/10 to-violet-500/10 mb-5 group-hover:scale-105 transition-transform">
                    <stat.icon className="h-6 w-6 text-primary" />
                  </div>
                  <div className="text-4xl md:text-5xl font-bold gradient-text mb-2 tracking-tight">{stat.value}</div>
                  <div className="text-muted-foreground text-sm font-medium">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section id="features" className="py-24 md:py-32 bg-muted/20 scroll-mt-20">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-20">
              <div className="inline-flex items-center gap-2.5 px-4 py-2 rounded-full bg-primary/5 border border-primary/10 text-primary text-sm font-medium mb-6">
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
            </div>
            
            <div className="grid gap-6 md:grid-cols-3">
              {features.map((feature, index) => (
                <Card 
                  key={index} 
                  className="group hover-elevate border border-border/50 shadow-sm bg-card overflow-visible"
                  data-testid={`card-feature-${index}`}
                >
                  <CardContent className="p-8">
                    <div className={`mb-6 flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br ${feature.gradient} shadow-lg shadow-primary/10 group-hover:scale-105 transition-transform duration-300`}>
                      <feature.icon className="h-6 w-6 text-white" />
                    </div>
                    <h3 className="mb-3 text-xl font-semibold tracking-tight">{feature.title}</h3>
                    <p className="text-muted-foreground leading-relaxed">{feature.description}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* How It Works Section */}
        <section id="how-it-works" className="py-24 md:py-32 scroll-mt-20">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-20">
              <div className="inline-flex items-center gap-2.5 px-4 py-2 rounded-full bg-primary/5 border border-primary/10 text-primary text-sm font-medium mb-6">
                <Rocket className="h-4 w-4" />
                How It Works
              </div>
              <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 tracking-tight">
                Three Simple Steps to
                <span className="gradient-text block sm:inline"> Launch</span>
              </h2>
              <p className="mx-auto mt-6 max-w-2xl text-muted-foreground text-lg font-light leading-relaxed">
                From sign-up to live website in under 5 minutes. It's that easy.
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-8 md:gap-16">
              {steps.map((step, index) => (
                <div key={index} className="relative group">
                  {/* Connector line */}
                  {index < steps.length - 1 && (
                    <div className="hidden md:block absolute top-10 left-full w-full h-px bg-gradient-to-r from-border to-transparent" />
                  )}
                  <div className="text-center">
                    <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl gradient-primary text-white text-2xl font-bold mb-8 shadow-lg shadow-primary/20 group-hover:scale-105 transition-transform">
                      {step.number}
                    </div>
                    <h3 className="text-xl font-semibold mb-4 tracking-tight">{step.title}</h3>
                    <p className="text-muted-foreground leading-relaxed">{step.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Testimonials Section */}
        <section className="py-24 md:py-32 bg-muted/20">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-20">
              <div className="inline-flex items-center gap-2.5 px-4 py-2 rounded-full bg-primary/5 border border-primary/10 text-primary text-sm font-medium mb-6">
                <Star className="h-4 w-4" />
                Testimonials
              </div>
              <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 tracking-tight">
                Loved by
                <span className="gradient-text"> Contractors</span>
              </h2>
              <p className="mx-auto mt-6 max-w-2xl text-muted-foreground text-lg font-light leading-relaxed">
                See what business owners like you are saying about LocalBlue
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-6">
              {testimonials.map((testimonial, index) => (
                <Card key={index} className="hover-elevate border border-border/50 shadow-sm bg-card overflow-visible">
                  <CardContent className="p-8">
                    <div className="flex gap-0.5 mb-5">
                      {Array.from({ length: testimonial.rating }).map((_, i) => (
                        <Star key={i} className="h-4 w-4 fill-amber-400 text-amber-400" />
                      ))}
                    </div>
                    <p className="text-foreground text-base mb-6 leading-relaxed font-light">"{testimonial.quote}"</p>
                    <div className="flex items-center gap-3 flex-wrap">
                      <div className="w-10 h-10 rounded-full gradient-primary flex items-center justify-center text-white text-sm font-semibold">
                        {testimonial.name.charAt(0)}
                      </div>
                      <div>
                        <div className="font-medium text-sm">{testimonial.name}</div>
                        <div className="text-xs text-muted-foreground">{testimonial.role}</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Pricing Section */}
        <section id="pricing" className="py-24 md:py-32 scroll-mt-20" data-testid="section-pricing">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-20">
              <div className="inline-flex items-center gap-2.5 px-4 py-2 rounded-full bg-primary/5 border border-primary/10 text-primary text-sm font-medium mb-6">
                <Crown className="h-4 w-4" />
                Pricing
              </div>
              <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 tracking-tight">
                Simple, Transparent
                <span className="gradient-text block sm:inline"> Pricing</span>
              </h2>
              <p className="mx-auto mt-6 max-w-2xl text-muted-foreground text-lg font-light leading-relaxed">
                Start free and upgrade as your business grows. No hidden fees, no surprises.
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
              {pricingPlans.map((plan, index) => (
                <Card 
                  key={index} 
                  className={`relative hover-elevate border shadow-sm bg-card overflow-visible ${plan.popular ? 'border-primary/50 shadow-lg shadow-primary/10' : 'border-border/50'}`}
                  data-testid={`card-pricing-${plan.name.toLowerCase()}`}
                >
                  {plan.popular && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                      <Badge className="bg-primary text-primary-foreground px-3 py-0.5 text-xs shadow-md">
                        Most Popular
                      </Badge>
                    </div>
                  )}
                  <CardHeader className="text-center pb-2 pt-8">
                    <div className={`mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br ${plan.gradient} shadow-md`}>
                      <plan.icon className="h-6 w-6 text-white" />
                    </div>
                    <CardTitle className="text-lg font-semibold">{plan.name}</CardTitle>
                    <CardDescription className="text-sm">{plan.description}</CardDescription>
                  </CardHeader>
                  <CardContent className="text-center">
                    <div className="mb-6">
                      <span className="text-5xl font-bold tracking-tight">{plan.price}</span>
                      <span className="text-muted-foreground ml-1 text-sm">{plan.priceDetail}</span>
                    </div>
                    <ul className="space-y-3 text-left mb-6">
                      {plan.features.map((feature, i) => (
                        <li key={i} className="flex items-start gap-2.5">
                          <Check className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                          <span className="text-sm text-muted-foreground">{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                  <CardFooter className="pb-8">
                    <Link href="/signup" className="w-full">
                      <Button 
                        className={`w-full ${plan.popular ? 'gradient-primary text-white shadow-md' : ''}`}
                        variant={plan.popular ? "default" : "outline"}
                        data-testid={`button-pricing-${plan.name.toLowerCase()}`}
                      >
                        {plan.cta}
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </Button>
                    </Link>
                  </CardFooter>
                </Card>
              ))}
            </div>

            <div className="mt-16 text-center">
              <p className="text-muted-foreground text-sm">
                All plans include a 14-day money-back guarantee. No questions asked.
              </p>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-24 md:py-32 relative overflow-hidden">
          {/* Dark immersive background matching hero */}
          <div className="absolute inset-0 gradient-hero-dark" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,hsl(221_80%_30%/0.4),transparent_70%)]" />
          
          <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-8 tracking-tight" data-testid="text-cta-title">
              Ready to Build Your Website?
            </h2>
            <p className="text-white/60 text-lg md:text-xl mb-12 max-w-2xl mx-auto font-light leading-relaxed">
              Join hundreds of contractors who have already launched their professional websites with LocalBlue
            </p>
            <Link href="/signup">
              <Button 
                size="lg" 
                className="bg-white text-slate-900 border-white shadow-2xl shadow-white/20 font-semibold"
                data-testid="button-footer-cta"
              >
                Get Started Now - It's Free
                <ChevronRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <p className="mt-8 text-white/40 text-sm font-medium">No credit card required</p>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-card border-t py-16" data-testid="footer">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-8">
            <div className="flex flex-col items-center md:items-start gap-4">
              <Logo size="md" />
              <p className="text-muted-foreground text-sm max-w-xs text-center md:text-left">
                Build professional contractor websites in minutes with AI.
              </p>
            </div>
            <div className="flex flex-col items-center md:items-end gap-4">
              <nav className="flex items-center gap-6 flex-wrap">
                <a href="#features" className="text-sm text-muted-foreground transition-colors" data-testid="link-footer-features">Features</a>
                <a href="#pricing" className="text-sm text-muted-foreground transition-colors" data-testid="link-footer-pricing">Pricing</a>
                <Link href="/demo" className="text-sm text-muted-foreground transition-colors" data-testid="link-footer-demo">Demo</Link>
              </nav>
              <p className="text-muted-foreground text-sm" data-testid="footer-copyright">
                &copy; {new Date().getFullYear()} LocalBlue. All rights reserved.
              </p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
