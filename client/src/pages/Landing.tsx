import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-[9999] glass border-b">
        <div className="max-w-7xl mx-auto flex h-16 items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
          <Link href="/" className="flex items-center">
            <img src="/logo-wordmark.png" alt="LocalBlue" className="h-9 object-contain" />
          </Link>
          <div className="flex items-center gap-3 flex-wrap">
            <Link href="/signup">
              <Button data-testid="link-header-signup">
                Get Started Free
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </header>

      <main>
        {/* Hero Section */}
        <section className="relative min-h-screen flex items-center justify-center pt-16">
          {/* Background */}
          <div className="absolute inset-0 gradient-hero" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(120,119,198,0.15),transparent_50%)]" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_right,rgba(59,130,246,0.15),transparent_50%)]" />
          
          {/* Floating elements */}
          <div className="absolute top-1/4 left-10 w-72 h-72 bg-blue-500/10 rounded-full blur-3xl animate-pulse-slow" />
          <div className="absolute bottom-1/4 right-10 w-96 h-96 bg-violet-500/10 rounded-full blur-3xl animate-pulse-slow" style={{ animationDelay: '2s' }} />
          
          {/* Grid pattern overlay */}
          <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:72px_72px]" />

          <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 text-center py-20">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 text-white/90 text-sm mb-8 animate-float">
              <Sparkles className="h-4 w-4 text-amber-400" />
              <span>AI-Powered Website Builder for Contractors</span>
            </div>

            <h1 
              className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-extrabold text-white mb-6 leading-[1.1] tracking-tight"
              data-testid="text-hero-headline"
            >
              Build Your Professional
              <br />
              <span className="bg-gradient-to-r from-blue-400 via-violet-400 to-purple-400 bg-clip-text text-transparent">
                Contractor Website
              </span>
              <br />
              in Minutes
            </h1>
            
            <p 
              className="mx-auto mt-6 max-w-2xl text-lg sm:text-xl text-white/70 leading-relaxed"
              data-testid="text-hero-subheadline"
            >
              Just chat with our AI, and we'll create a stunning website for your business. 
              Manage everything from your own domain - your customers never see LocalBlue.
            </p>
            
            <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row flex-wrap">
              <Link href="/signup">
                <Button 
                  size="lg" 
                  className="bg-white text-slate-900 border-white shadow-xl"
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
                  className="bg-white/5 border-white/20 text-white"
                  data-testid="button-hero-demo"
                >
                  <Play className="mr-2 h-5 w-5" />
                  Watch Demo
                </Button>
              </Link>
            </div>

            {/* Trust badges */}
            <div className="mt-16 flex flex-wrap items-center justify-center gap-6 text-white/80 text-sm">
              <div className="flex items-center gap-2" data-testid="badge-no-credit-card">
                <Shield className="h-5 w-5 text-emerald-400" />
                <span>No Credit Card Required</span>
              </div>
              <div className="flex items-center gap-2" data-testid="badge-free-plan">
                <CheckCircle className="h-5 w-5 text-emerald-400" />
                <span>Free Forever Plan</span>
              </div>
              <div className="flex items-center gap-2" data-testid="badge-launch-time">
                <Rocket className="h-5 w-5 text-emerald-400" />
                <span>Launch in 5 Minutes</span>
              </div>
            </div>
          </div>

          {/* Wave divider */}
          <div className="absolute bottom-0 left-0 right-0">
            <svg className="w-full h-24" viewBox="0 0 1440 100" preserveAspectRatio="none">
              <path 
                d="M0,100 L0,40 Q360,80 720,40 T1440,40 L1440,100 Z" 
                className="fill-background"
              />
            </svg>
          </div>
        </section>

        {/* Stats Section */}
        <section className="py-16 bg-background relative" data-testid="section-stats">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
              {stats.map((stat, index) => (
                <div key={index} className="text-center" data-testid={`stat-${index}`}>
                  <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-primary/10 mb-4">
                    <stat.icon className="h-6 w-6 text-primary" />
                  </div>
                  <div className="text-3xl md:text-4xl font-bold gradient-text mb-1">{stat.value}</div>
                  <div className="text-muted-foreground text-sm">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="py-20 md:py-32 bg-muted/30">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium mb-4">
                <Zap className="h-4 w-4" />
                Features
              </div>
              <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4" data-testid="text-features-title">
                Everything You Need to
                <span className="gradient-text"> Get Online</span>
              </h2>
              <p className="mx-auto mt-4 max-w-2xl text-muted-foreground text-lg">
                No technical skills required. Our AI handles the hard work so you can focus on your business.
              </p>
            </div>
            
            <div className="grid gap-8 md:grid-cols-3">
              {features.map((feature, index) => (
                <Card 
                  key={index} 
                  className="group hover-elevate border-0 shadow-lg bg-card/80 backdrop-blur-sm overflow-visible"
                  data-testid={`card-feature-${index}`}
                >
                  <CardContent className="p-8">
                    <div className={`mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br ${feature.gradient} shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                      <feature.icon className="h-7 w-7 text-white" />
                    </div>
                    <h3 className="mb-3 text-xl font-bold">{feature.title}</h3>
                    <p className="text-muted-foreground leading-relaxed">{feature.description}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* How It Works Section */}
        <section className="py-20 md:py-32">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium mb-4">
                <Rocket className="h-4 w-4" />
                How It Works
              </div>
              <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4">
                Three Simple Steps to
                <span className="gradient-text"> Launch</span>
              </h2>
              <p className="mx-auto mt-4 max-w-2xl text-muted-foreground text-lg">
                From sign-up to live website in under 5 minutes. It's that easy.
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-8 md:gap-12">
              {steps.map((step, index) => (
                <div key={index} className="relative">
                  {/* Connector line */}
                  {index < steps.length - 1 && (
                    <div className="hidden md:block absolute top-12 left-full w-full h-0.5 bg-gradient-to-r from-primary/50 to-transparent -translate-x-4" />
                  )}
                  <div className="text-center">
                    <div className="inline-flex items-center justify-center w-24 h-24 rounded-3xl gradient-primary text-white text-3xl font-bold mb-6 shadow-xl shadow-primary/25">
                      {step.number}
                    </div>
                    <h3 className="text-xl font-bold mb-3">{step.title}</h3>
                    <p className="text-muted-foreground">{step.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Testimonials Section */}
        <section className="py-20 md:py-32 bg-muted/30">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium mb-4">
                <Star className="h-4 w-4" />
                Testimonials
              </div>
              <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4">
                Loved by
                <span className="gradient-text"> Contractors</span>
              </h2>
              <p className="mx-auto mt-4 max-w-2xl text-muted-foreground text-lg">
                See what business owners like you are saying about LocalBlue
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
              {testimonials.map((testimonial, index) => (
                <Card key={index} className="hover-elevate border-0 shadow-lg bg-card">
                  <CardContent className="p-8">
                    <div className="flex gap-1 mb-4">
                      {Array.from({ length: testimonial.rating }).map((_, i) => (
                        <Star key={i} className="h-5 w-5 fill-amber-400 text-amber-400" />
                      ))}
                    </div>
                    <p className="text-foreground text-lg mb-6 leading-relaxed">"{testimonial.quote}"</p>
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-full gradient-primary flex items-center justify-center text-white font-bold">
                        {testimonial.name.charAt(0)}
                      </div>
                      <div>
                        <div className="font-semibold">{testimonial.name}</div>
                        <div className="text-sm text-muted-foreground">{testimonial.role}</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Pricing Section */}
        <section className="py-20 md:py-32" data-testid="section-pricing">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium mb-4">
                <Crown className="h-4 w-4" />
                Pricing
              </div>
              <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4">
                Simple, Transparent
                <span className="gradient-text"> Pricing</span>
              </h2>
              <p className="mx-auto mt-4 max-w-2xl text-muted-foreground text-lg">
                Start free and upgrade as your business grows. No hidden fees, no surprises.
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
              {pricingPlans.map((plan, index) => (
                <Card 
                  key={index} 
                  className={`relative hover-elevate border-0 shadow-lg bg-card overflow-visible ${plan.popular ? 'ring-2 ring-primary shadow-xl' : ''}`}
                  data-testid={`card-pricing-${plan.name.toLowerCase()}`}
                >
                  {plan.popular && (
                    <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                      <Badge className="bg-primary text-primary-foreground px-4 py-1 shadow-lg">
                        Most Popular
                      </Badge>
                    </div>
                  )}
                  <CardHeader className="text-center pb-2">
                    <div className={`mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br ${plan.gradient} shadow-lg`}>
                      <plan.icon className="h-7 w-7 text-white" />
                    </div>
                    <CardTitle className="text-xl">{plan.name}</CardTitle>
                    <CardDescription>{plan.description}</CardDescription>
                  </CardHeader>
                  <CardContent className="text-center">
                    <div className="mb-6">
                      <span className="text-4xl font-bold">{plan.price}</span>
                      <span className="text-muted-foreground ml-1">{plan.priceDetail}</span>
                    </div>
                    <ul className="space-y-3 text-left mb-6">
                      {plan.features.map((feature, i) => (
                        <li key={i} className="flex items-start gap-3">
                          <Check className="h-5 w-5 text-primary mt-0.5 shrink-0" />
                          <span className="text-sm">{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                  <CardFooter>
                    <Link href="/signup" className="w-full">
                      <Button 
                        className={`w-full ${plan.popular ? 'gradient-primary text-white shadow-lg' : ''}`}
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

            <div className="mt-12 text-center">
              <p className="text-muted-foreground">
                All plans include a 14-day money-back guarantee. No questions asked.
              </p>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-20 md:py-32 relative overflow-hidden">
          {/* Background */}
          <div className="absolute inset-0 gradient-primary opacity-95" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(255,255,255,0.1),transparent_70%)]" />
          
          <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-6" data-testid="text-cta-title">
              Ready to Build Your Website?
            </h2>
            <p className="text-white/80 text-lg md:text-xl mb-10 max-w-2xl mx-auto">
              Join hundreds of contractors who have already launched their professional websites with LocalBlue
            </p>
            <Link href="/signup">
              <Button 
                size="lg" 
                className="bg-white text-primary border-white shadow-xl"
                data-testid="button-footer-cta"
              >
                Get Started Now - It's Free
                <ChevronRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <p className="mt-6 text-white/60 text-sm">No credit card required</p>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-card border-t py-12" data-testid="footer">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6 flex-wrap">
            <div className="flex items-center" data-testid="footer-logo">
              <img src="/logo-wordmark.png" alt="LocalBlue" className="h-8 object-contain" />
            </div>
            <p className="text-muted-foreground text-sm" data-testid="footer-copyright">
              &copy; {new Date().getFullYear()} LocalBlue. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
