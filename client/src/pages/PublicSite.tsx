import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { 
  Phone, 
  Mail, 
  MapPin, 
  CheckCircle, 
  Shield, 
  Clock, 
  Star,
  Menu,
  X,
  ChevronRight,
  Award,
  Users,
  ThumbsUp,
  Hammer,
  Wrench,
  Zap,
  Home,
  Thermometer,
  Paintbrush,
  Leaf,
  ArrowRight,
  Quote
} from "lucide-react";
import type { Site, Page, Testimonial, TradeType } from "@shared/schema";
import { TRADE_TEMPLATES } from "@shared/tradeTemplates";
import ChatBot from "@/components/ChatBot";

const contactFormSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Please enter a valid email"),
  phone: z.string().optional(),
  message: z.string().min(10, "Message must be at least 10 characters"),
});

type ContactFormValues = z.infer<typeof contactFormSchema>;

interface PublicSiteProps {
  site: Site;
  isPreview?: boolean;
}

const TRADE_ICONS: Record<string, typeof Hammer> = {
  general_contractor: Hammer,
  plumber: Wrench,
  electrician: Zap,
  roofer: Home,
  hvac: Thermometer,
  painter: Paintbrush,
  landscaper: Leaf,
};

function getTradeIcon(tradeType?: TradeType | null) {
  if (!tradeType) return Wrench;
  return TRADE_ICONS[tradeType] || Wrench;
}

function getTrustBadges(tradeType?: TradeType | null) {
  if (tradeType && TRADE_TEMPLATES[tradeType]) {
    return TRADE_TEMPLATES[tradeType].trustBadges;
  }
  return ["Licensed & Insured", "Free Estimates", "Satisfaction Guaranteed", "24/7 Service"];
}

function StickyHeader({ site, isScrolled }: { site: Site; isScrolled: boolean }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const scrollToSection = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
    setMobileMenuOpen(false);
  };

  const navLinks = [
    { label: "Home", id: "hero" },
    { label: "Services", id: "services" },
    { label: "About", id: "about" },
    { label: "Reviews", id: "testimonials" },
    { label: "Contact", id: "contact" },
  ];

  return (
    <header 
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled 
          ? "bg-background/95 backdrop-blur-md shadow-md border-b" 
          : "bg-transparent"
      }`}
      data-testid="header-sticky"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 md:h-20">
          <div className="flex items-center gap-3">
            <div 
              className="w-10 h-10 rounded-md flex items-center justify-center"
              style={{ backgroundColor: site.brandColor }}
            >
              <span className="text-lg font-bold text-white">
                {site.businessName.charAt(0)}
              </span>
            </div>
            <span className={`font-bold text-lg md:text-xl ${isScrolled ? "text-foreground" : "text-white"}`}>
              {site.businessName}
            </span>
          </div>

          <nav className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => (
              <button
                key={link.id}
                onClick={() => scrollToSection(link.id)}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  isScrolled 
                    ? "text-muted-foreground hover:text-foreground hover:bg-muted" 
                    : "text-white/80 hover:text-white hover:bg-white/10"
                }`}
                data-testid={`nav-${link.id}`}
              >
                {link.label}
              </button>
            ))}
          </nav>

          <div className="flex items-center gap-3">
            {site.phone && (
              <a
                href={`tel:${site.phone}`}
                className="hidden sm:flex items-center gap-2"
                data-testid="header-phone"
              >
                <Button 
                  size="sm"
                  style={{ backgroundColor: site.brandColor }}
                  className="border-0"
                >
                  <Phone className="h-4 w-4" />
                  <span className="hidden lg:inline">{site.phone}</span>
                  <span className="lg:hidden">Call</span>
                </Button>
              </a>
            )}
            <button
              className={`md:hidden p-2 rounded-md ${isScrolled ? "text-foreground" : "text-white"}`}
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              data-testid="button-mobile-menu"
            >
              {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>
      </div>

      {mobileMenuOpen && (
        <div className="md:hidden bg-background border-t shadow-lg">
          <nav className="px-4 py-4 space-y-1">
            {navLinks.map((link) => (
              <button
                key={link.id}
                onClick={() => scrollToSection(link.id)}
                className="block w-full text-left px-4 py-3 rounded-md text-foreground hover:bg-muted transition-colors"
                data-testid={`nav-mobile-${link.id}`}
              >
                {link.label}
              </button>
            ))}
            {site.phone && (
              <a
                href={`tel:${site.phone}`}
                className="block w-full mt-4"
              >
                <Button 
                  className="w-full"
                  style={{ backgroundColor: site.brandColor }}
                >
                  <Phone className="h-4 w-4 mr-2" />
                  Call {site.phone}
                </Button>
              </a>
            )}
          </nav>
        </div>
      )}
    </header>
  );
}

function HeroSection({ site, homePage }: { site: Site; homePage?: Page }) {
  // Use rich content from AI generation
  const headline = homePage?.content?.heroHeadline || site.tagline || site.businessName;
  const subheadline = homePage?.content?.heroSubheadline || 
    `Serving ${site.serviceArea || "Your Local Community"}`;
  const description = homePage?.content?.heroDescription || site.businessDescription || 
    `Expert ${site.tradeType?.replace(/_/g, ' ') || 'contractor'} services for your home.`;
  const ctaPrimary = homePage?.content?.ctaPrimary || "Get Your Free Quote";
  const ctaSecondary = homePage?.content?.ctaSecondary || "Call Now";

  const TradeIcon = getTradeIcon(site.tradeType);

  // Trade-specific hero backgrounds for visual variety
  const getHeroGradient = () => {
    const baseColor = site.brandColor;
    return `linear-gradient(135deg, ${baseColor} 0%, ${baseColor}dd 50%, ${baseColor}aa 100%)`;
  };

  return (
    <section 
      id="hero"
      className="relative min-h-[100vh] flex items-center justify-center overflow-hidden"
      data-testid="section-hero"
    >
      {/* Dynamic gradient background */}
      <div 
        className="absolute inset-0"
        style={{ background: getHeroGradient() }}
      />
      
      {/* Sophisticated overlay pattern */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-black/30 to-black/60" />
      <div 
        className="absolute inset-0 opacity-20"
        style={{ 
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.15'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }}
      />
      
      <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 text-center pt-24 pb-16">
        {/* Floating badge */}
        <div 
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-white/15 backdrop-blur-md border border-white/25 text-white text-sm font-medium mb-10 shadow-lg"
        >
          <TradeIcon className="h-4 w-4" />
          <span>{site.serviceArea ? `Serving ${site.serviceArea}` : "Trusted Local Experts"}</span>
        </div>

        {/* Main headline - now uses AI-generated content */}
        <h1 
          className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold text-white mb-6 leading-[1.1] tracking-tight"
          data-testid="text-headline"
        >
          {headline}
        </h1>
        
        {/* Subheadline */}
        <p 
          className="text-xl sm:text-2xl md:text-3xl text-white/95 mb-6 font-medium tracking-wide"
          data-testid="text-subheadline"
        >
          {subheadline}
        </p>
        
        {/* Description - AI-generated compelling copy */}
        <p className="text-lg md:text-xl text-white/80 mb-12 max-w-3xl mx-auto leading-relaxed">
          {description}
        </p>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center mb-14">
          <Button 
            size="lg" 
            className="text-lg px-10 py-7 bg-white text-gray-900 hover:bg-white/95 border-0 shadow-xl font-semibold"
            onClick={() => document.getElementById("contact")?.scrollIntoView({ behavior: "smooth" })}
            data-testid="button-get-quote"
          >
            {ctaPrimary}
            <ArrowRight className="ml-2 h-5 w-5" />
          </Button>
          {site.phone && (
            <a href={`tel:${site.phone}`}>
              <Button 
                size="lg" 
                variant="outline"
                className="text-lg px-10 py-7 bg-white/10 backdrop-blur-sm border-2 border-white/50 text-white hover:bg-white/20 w-full sm:w-auto font-semibold"
                data-testid="button-call-now"
              >
                <Phone className="mr-2 h-5 w-5" />
                {ctaSecondary}: {site.phone}
              </Button>
            </a>
          )}
        </div>

        {/* Trust indicators */}
        <div className="flex flex-wrap items-center justify-center gap-6 md:gap-10 text-white/80">
          {site.yearsInBusiness && (
            <div className="flex items-center gap-2">
              <Award className="h-5 w-5" />
              <span className="font-medium">{site.yearsInBusiness}+ Years Experience</span>
            </div>
          )}
          <div className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            <span className="font-medium">Licensed & Insured</span>
          </div>
          <div className="flex items-center gap-2">
            <Star className="h-5 w-5 fill-yellow-400 text-yellow-400" />
            <span className="font-medium">5-Star Rated</span>
          </div>
        </div>
      </div>

      {/* Modern wave divider */}
      <div className="absolute bottom-0 left-0 right-0">
        <svg className="w-full h-20 md:h-32" viewBox="0 0 1440 120" preserveAspectRatio="none">
          <path 
            d="M0,120 L0,60 Q360,0 720,60 T1440,60 L1440,120 Z" 
            className="fill-background"
          />
        </svg>
      </div>
    </section>
  );
}

function TrustBadgesBar({ site }: { site: Site }) {
  const badges = getTrustBadges(site.tradeType);
  
  const badgeIcons = [Shield, Clock, CheckCircle, Award];

  return (
    <section className="bg-background py-8 md:py-10 border-b">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8">
          {badges.slice(0, 4).map((badge, index) => {
            const IconComponent = badgeIcons[index % badgeIcons.length];
            return (
              <div 
                key={index} 
                className="flex flex-col sm:flex-row items-center gap-3 text-center sm:text-left"
              >
                <div 
                  className="w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0"
                  style={{ backgroundColor: `${site.brandColor}15` }}
                >
                  <IconComponent className="h-6 w-6" style={{ color: site.brandColor }} />
                </div>
                <span className="font-semibold text-foreground">{badge}</span>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function ServicesSection({ site, servicesPage }: { site: Site; servicesPage?: Page }) {
  const services = site.services || [];
  const TradeIcon = getTradeIcon(site.tradeType);
  
  // Get service descriptions from AI-generated page content
  const serviceDescriptions = servicesPage?.content?.servicesList?.reduce((acc: Record<string, string>, item: { name: string; description: string }) => {
    acc[item.name] = item.description;
    return acc;
  }, {}) || {};

  if (services.length === 0) return null;

  return (
    <section id="services" className="py-20 md:py-28 bg-muted/30" data-testid="section-services">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-14 md:mb-20">
          <div 
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-semibold mb-6"
            style={{ backgroundColor: `${site.brandColor}15`, color: site.brandColor }}
          >
            <TradeIcon className="h-4 w-4" />
            What We Do Best
          </div>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-6">Our Expert Services</h2>
          <p className="text-muted-foreground text-lg md:text-xl max-w-3xl mx-auto leading-relaxed">
            {site.serviceArea 
              ? `From ${site.serviceArea}, we bring expertise and dedication to every project. Here's how we can help you.`
              : "Every project receives our full attention and expertise. Discover the services that set us apart."
            }
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {services.map((service, index) => {
            // Use AI-generated description or create a more specific fallback
            const description = serviceDescriptions[service] || 
              `Our expert team delivers exceptional ${service.toLowerCase()} solutions with attention to detail and lasting results.`;
            
            return (
              <Card 
                key={index} 
                className="group hover-elevate border border-border/50 hover:border-[var(--brand-color)] transition-all duration-300 hover:shadow-xl"
                style={{ "--brand-color": site.brandColor } as React.CSSProperties}
                data-testid={`card-service-${index}`}
              >
                <CardContent className="p-8">
                  <div 
                    className="w-16 h-16 rounded-2xl flex items-center justify-center mb-6 transition-all duration-300 group-hover:scale-110 group-hover:shadow-lg"
                    style={{ 
                      backgroundColor: `${site.brandColor}15`,
                      boxShadow: `0 4px 14px ${site.brandColor}20`
                    }}
                  >
                    <TradeIcon className="h-8 w-8" style={{ color: site.brandColor }} />
                  </div>
                  <h3 className="text-xl font-bold mb-4">{service}</h3>
                  <p className="text-muted-foreground leading-relaxed mb-6">
                    {description}
                  </p>
                  <button 
                    onClick={() => document.getElementById("contact")?.scrollIntoView({ behavior: "smooth" })}
                    className="inline-flex items-center text-sm font-semibold transition-all duration-200 group-hover:gap-2"
                    style={{ color: site.brandColor }}
                  >
                    Get Started <ChevronRight className="ml-1 h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function AboutSection({ site, aboutPage }: { site: Site; aboutPage?: Page }) {
  // Use rich AI-generated content when available
  const sectionTitle = aboutPage?.content?.sectionTitle || 
    (site.ownerName ? `Meet ${site.ownerName}` : `The ${site.businessName} Story`);
  const description = aboutPage?.content?.companyStory || site.ownerStory || site.businessDescription || 
    `${site.businessName} is dedicated to providing exceptional service to our community.`;
  const uniquePoints = site.uniqueSellingPoints || [];
  const certifications = site.certifications || [];

  return (
    <section id="about" className="py-20 md:py-28" data-testid="section-about">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-16 lg:gap-20 items-center">
          <div>
            <div 
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-semibold mb-6"
              style={{ backgroundColor: `${site.brandColor}15`, color: site.brandColor }}
            >
              <Users className="h-4 w-4" />
              Our Story
            </div>
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-8 leading-tight">
              {sectionTitle}
            </h2>
            <p className="text-muted-foreground text-lg md:text-xl mb-10 leading-relaxed">
              {description}
            </p>

            {site.yearsInBusiness && (
              <div className="flex items-center gap-4 mb-8 p-4 rounded-xl bg-muted/50">
                <div 
                  className="w-16 h-16 rounded-full flex items-center justify-center"
                  style={{ backgroundColor: site.brandColor }}
                >
                  <span className="text-2xl font-bold text-white">{site.yearsInBusiness}+</span>
                </div>
                <div>
                  <p className="font-semibold text-lg">Years of Experience</p>
                  <p className="text-muted-foreground">Serving our community with pride</p>
                </div>
              </div>
            )}

            {uniquePoints.length > 0 && (
              <div className="space-y-3">
                <p className="font-semibold text-lg mb-4">Why Choose Us:</p>
                {uniquePoints.map((point, index) => (
                  <div key={index} className="flex items-start gap-3">
                    <CheckCircle className="h-5 w-5 mt-0.5 flex-shrink-0" style={{ color: site.brandColor }} />
                    <span className="text-muted-foreground">{point}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="space-y-6">
            <div 
              className="relative aspect-square rounded-2xl overflow-hidden"
              style={{ backgroundColor: `${site.brandColor}10` }}
            >
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center p-8">
                  <div 
                    className="w-32 h-32 rounded-full flex items-center justify-center mx-auto mb-6"
                    style={{ backgroundColor: site.brandColor }}
                  >
                    <span className="text-5xl font-bold text-white">
                      {site.businessName.charAt(0)}
                    </span>
                  </div>
                  <p className="text-2xl font-bold">{site.businessName}</p>
                  <p className="text-muted-foreground text-lg">Your Trusted Local Contractor</p>
                </div>
              </div>
            </div>

            {certifications.length > 0 && (
              <div className="grid grid-cols-2 gap-3">
                {certifications.slice(0, 4).map((cert, index) => (
                  <div 
                    key={index}
                    className="flex items-center gap-2 p-3 rounded-lg bg-muted/50"
                  >
                    <Award className="h-5 w-5 flex-shrink-0" style={{ color: site.brandColor }} />
                    <span className="text-sm font-medium">{cert}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

function TestimonialsSection({ site }: { site: Site }) {
  const { data: testimonials = [] } = useQuery<Testimonial[]>({
    queryKey: ["/api/site/testimonials"],
  });

  if (testimonials.length === 0) {
    return null;
  }

  return (
    <section id="testimonials" className="py-16 md:py-24 bg-muted/30" data-testid="section-testimonials">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12 md:mb-16">
          <div 
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium mb-4"
            style={{ backgroundColor: `${site.brandColor}15`, color: site.brandColor }}
          >
            <ThumbsUp className="h-4 w-4" />
            Customer Reviews
          </div>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4">What Our Customers Say</h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Don't just take our word for it. Here's what our satisfied customers have to say.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {testimonials.slice(0, 6).map((testimonial) => (
            <Card 
              key={testimonial.id} 
              className="hover-elevate"
              data-testid={`card-testimonial-${testimonial.id}`}
            >
              <CardContent className="p-6 md:p-8">
                <div className="flex items-center gap-1 mb-4">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star 
                      key={i}
                      className={`h-5 w-5 ${i < testimonial.rating ? "fill-yellow-400 text-yellow-400" : "text-muted"}`}
                    />
                  ))}
                </div>
                <Quote className="h-8 w-8 text-muted-foreground/30 mb-3" />
                <p className="text-muted-foreground mb-6 leading-relaxed">
                  "{testimonial.content}"
                </p>
                <div className="flex items-center gap-3">
                  <div 
                    className="w-10 h-10 rounded-full flex items-center justify-center text-white font-semibold"
                    style={{ backgroundColor: site.brandColor }}
                  >
                    {testimonial.customerName.charAt(0)}
                  </div>
                  <div>
                    <p className="font-semibold">{testimonial.customerName}</p>
                    {testimonial.customerLocation && (
                      <p className="text-sm text-muted-foreground">{testimonial.customerLocation}</p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}

function ServiceAreaSection({ site }: { site: Site }) {
  if (!site.serviceArea) return null;

  return (
    <section id="service-area" className="py-16 md:py-24" data-testid="section-service-area">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div>
            <div 
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium mb-4"
              style={{ backgroundColor: `${site.brandColor}15`, color: site.brandColor }}
            >
              <MapPin className="h-4 w-4" />
              Service Area
            </div>
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-6">Where We Serve</h2>
            <p className="text-muted-foreground text-lg mb-8 leading-relaxed">
              We proudly serve {site.serviceArea} and surrounding communities. Not sure if you're in our area? Give us a call!
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Button 
                size="lg"
                style={{ backgroundColor: site.brandColor }}
                onClick={() => document.getElementById("contact")?.scrollIntoView({ behavior: "smooth" })}
              >
                Check Availability
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
              {site.phone && (
                <a href={`tel:${site.phone}`}>
                  <Button size="lg" variant="outline" className="w-full sm:w-auto">
                    <Phone className="mr-2 h-5 w-5" />
                    {site.phone}
                  </Button>
                </a>
              )}
            </div>
          </div>
          <div 
            className="aspect-video rounded-2xl flex items-center justify-center"
            style={{ backgroundColor: `${site.brandColor}10` }}
          >
            <div className="text-center p-8">
              <MapPin className="h-16 w-16 mx-auto mb-4" style={{ color: site.brandColor }} />
              <p className="text-xl font-semibold mb-2">Serving {site.serviceArea}</p>
              <p className="text-muted-foreground">Map integration coming soon</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function ContactSection({ site }: { site: Site }) {
  const { toast } = useToast();
  const [submitted, setSubmitted] = useState(false);

  const form = useForm<ContactFormValues>({
    resolver: zodResolver(contactFormSchema),
    defaultValues: {
      name: "",
      email: "",
      phone: "",
      message: "",
    },
  });

  const submitLead = useMutation({
    mutationFn: async (data: ContactFormValues) => {
      const response = await apiRequest("POST", "/api/site/leads", data);
      return response.json();
    },
    onSuccess: () => {
      setSubmitted(true);
      form.reset();
      toast({
        title: "Message sent!",
        description: "We'll get back to you as soon as possible.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to send message. Please try again.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: ContactFormValues) => {
    submitLead.mutate(data);
  };

  return (
    <section id="contact" className="py-16 md:py-24 bg-muted/30" data-testid="section-contact">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12 md:mb-16">
          <div 
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium mb-4"
            style={{ backgroundColor: `${site.brandColor}15`, color: site.brandColor }}
          >
            <Mail className="h-4 w-4" />
            Get In Touch
          </div>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4">Ready to Get Started?</h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Contact us today for a free estimate. We're here to help with all your needs.
          </p>
        </div>

        <div className="grid lg:grid-cols-5 gap-8 lg:gap-12">
          <div className="lg:col-span-2 space-y-6">
            {site.phone && (
              <a 
                href={`tel:${site.phone}`}
                className="group flex items-start gap-4 p-5 rounded-xl bg-background hover-elevate border"
              >
                <div 
                  className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ backgroundColor: `${site.brandColor}15` }}
                >
                  <Phone className="h-6 w-6" style={{ color: site.brandColor }} />
                </div>
                <div>
                  <p className="font-semibold text-lg">Phone</p>
                  <p className="text-muted-foreground">{site.phone}</p>
                  <p className="text-sm text-muted-foreground">Available for emergency calls 24/7</p>
                </div>
              </a>
            )}

            {site.email && (
              <a 
                href={`mailto:${site.email}`}
                className="group flex items-start gap-4 p-5 rounded-xl bg-background hover-elevate border"
              >
                <div 
                  className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ backgroundColor: `${site.brandColor}15` }}
                >
                  <Mail className="h-6 w-6" style={{ color: site.brandColor }} />
                </div>
                <div>
                  <p className="font-semibold text-lg">Email</p>
                  <p className="text-muted-foreground">{site.email}</p>
                  <p className="text-sm text-muted-foreground">We respond within 24 hours</p>
                </div>
              </a>
            )}

            {site.address && (
              <div className="flex items-start gap-4 p-5 rounded-xl bg-background border">
                <div 
                  className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ backgroundColor: `${site.brandColor}15` }}
                >
                  <MapPin className="h-6 w-6" style={{ color: site.brandColor }} />
                </div>
                <div>
                  <p className="font-semibold text-lg">Address</p>
                  <p className="text-muted-foreground">{site.address}</p>
                </div>
              </div>
            )}

            <div 
              className="p-6 rounded-xl text-white"
              style={{ backgroundColor: site.brandColor }}
            >
              <h3 className="font-bold text-xl mb-2">Need Immediate Help?</h3>
              <p className="text-white/80 mb-4">
                For emergencies, don't wait - give us a call right now!
              </p>
              {site.phone && (
                <a href={`tel:${site.phone}`}>
                  <Button 
                    variant="secondary" 
                    className="w-full bg-white text-foreground hover:bg-white/90"
                  >
                    <Phone className="mr-2 h-5 w-5" />
                    Call {site.phone}
                  </Button>
                </a>
              )}
            </div>
          </div>

          <div className="lg:col-span-3">
            {submitted ? (
              <Card className="h-full flex items-center justify-center">
                <CardContent className="text-center p-8 md:p-12">
                  <div 
                    className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6"
                    style={{ backgroundColor: `${site.brandColor}15` }}
                  >
                    <CheckCircle className="h-10 w-10" style={{ color: site.brandColor }} />
                  </div>
                  <h3 className="text-2xl md:text-3xl font-bold mb-4">Thank You!</h3>
                  <p className="text-muted-foreground text-lg mb-6">
                    Your message has been received. We'll get back to you as soon as possible.
                  </p>
                  <Button 
                    onClick={() => setSubmitted(false)}
                    style={{ backgroundColor: site.brandColor }}
                    data-testid="button-send-another"
                  >
                    Send Another Message
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardContent className="p-6 md:p-8">
                  <h3 className="text-xl font-bold mb-6">Request a Free Quote</h3>
                  <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
                      <div className="grid sm:grid-cols-2 gap-5">
                        <FormField
                          control={form.control}
                          name="name"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Full Name</FormLabel>
                              <FormControl>
                                <Input 
                                  placeholder="John Smith" 
                                  {...field} 
                                  data-testid="input-name" 
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="phone"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Phone Number</FormLabel>
                              <FormControl>
                                <Input 
                                  type="tel" 
                                  placeholder="(555) 123-4567" 
                                  {...field} 
                                  data-testid="input-phone" 
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                      <FormField
                        control={form.control}
                        name="email"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Email Address</FormLabel>
                            <FormControl>
                              <Input 
                                type="email" 
                                placeholder="john@example.com" 
                                {...field} 
                                data-testid="input-email" 
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="message"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Tell Us About Your Project</FormLabel>
                            <FormControl>
                              <Textarea 
                                placeholder="Describe your project or ask us a question..." 
                                className="min-h-[140px]"
                                {...field} 
                                data-testid="input-message"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <Button 
                        type="submit" 
                        size="lg"
                        className="w-full"
                        style={{ backgroundColor: site.brandColor }}
                        disabled={submitLead.isPending}
                        data-testid="button-submit-contact"
                      >
                        {submitLead.isPending ? "Sending..." : "Get Your Free Quote"}
                        <ArrowRight className="ml-2 h-5 w-5" />
                      </Button>
                      <p className="text-xs text-muted-foreground text-center">
                        By submitting this form, you agree to be contacted about your project.
                      </p>
                    </form>
                  </Form>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

function Footer({ site }: { site: Site }) {
  const currentYear = new Date().getFullYear();
  const services = site.services || [];

  const scrollToSection = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <footer className="bg-foreground text-background" data-testid="section-footer">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-12 mb-12">
          <div className="lg:col-span-1">
            <div className="flex items-center gap-3 mb-4">
              <div 
                className="w-10 h-10 rounded-md flex items-center justify-center"
                style={{ backgroundColor: site.brandColor }}
              >
                <span className="text-lg font-bold text-white">
                  {site.businessName.charAt(0)}
                </span>
              </div>
              <span className="font-bold text-xl">{site.businessName}</span>
            </div>
            <p className="text-background/70 mb-4 leading-relaxed">
              Your trusted local contractor for all your home service needs. Quality workmanship guaranteed.
            </p>
            {site.yearsInBusiness && (
              <p className="text-sm text-background/50">
                Proudly serving for {site.yearsInBusiness}+ years
              </p>
            )}
          </div>

          <div>
            <h4 className="font-semibold text-lg mb-4">Services</h4>
            <ul className="space-y-2">
              {services.slice(0, 6).map((service, index) => (
                <li key={index}>
                  <button 
                    onClick={() => scrollToSection("services")}
                    className="text-background/70 hover:text-background transition-colors text-left"
                  >
                    {service}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="font-semibold text-lg mb-4">Quick Links</h4>
            <ul className="space-y-2">
              {[
                { label: "Home", id: "hero" },
                { label: "Services", id: "services" },
                { label: "About Us", id: "about" },
                { label: "Reviews", id: "testimonials" },
                { label: "Contact", id: "contact" },
              ].map((link) => (
                <li key={link.id}>
                  <button 
                    onClick={() => scrollToSection(link.id)}
                    className="text-background/70 hover:text-background transition-colors"
                  >
                    {link.label}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="font-semibold text-lg mb-4">Contact Info</h4>
            <ul className="space-y-3">
              {site.phone && (
                <li>
                  <a 
                    href={`tel:${site.phone}`}
                    className="flex items-center gap-2 text-background/70 hover:text-background transition-colors"
                  >
                    <Phone className="h-4 w-4" />
                    {site.phone}
                  </a>
                </li>
              )}
              {site.email && (
                <li>
                  <a 
                    href={`mailto:${site.email}`}
                    className="flex items-center gap-2 text-background/70 hover:text-background transition-colors"
                  >
                    <Mail className="h-4 w-4" />
                    {site.email}
                  </a>
                </li>
              )}
              {site.address && (
                <li className="flex items-start gap-2 text-background/70">
                  <MapPin className="h-4 w-4 mt-0.5 flex-shrink-0" />
                  {site.address}
                </li>
              )}
              {site.serviceArea && (
                <li className="flex items-start gap-2 text-background/70">
                  <MapPin className="h-4 w-4 mt-0.5 flex-shrink-0" />
                  Serving: {site.serviceArea}
                </li>
              )}
            </ul>
          </div>
        </div>

        <div className="border-t border-background/20 pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-background/60 text-sm text-center md:text-left">
              &copy; {currentYear} {site.businessName}. All rights reserved.
            </p>
            <p className="text-background/40 text-sm">
              Powered by LocalBlue.ai
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}

function ComingSoon({ site }: { site: Site }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="text-center max-w-md">
        <div 
          className="w-24 h-24 rounded-2xl flex items-center justify-center mx-auto mb-8"
          style={{ backgroundColor: site.brandColor }}
        >
          <span className="text-4xl font-bold text-white">
            {site.businessName.charAt(0)}
          </span>
        </div>
        <h1 className="text-4xl font-bold mb-4" data-testid="text-coming-soon-title">
          {site.businessName}
        </h1>
        <p className="text-muted-foreground text-lg mb-8" data-testid="text-coming-soon-message">
          Our website is coming soon. Check back later!
        </p>
        {site.phone && (
          <a href={`tel:${site.phone}`}>
            <Button 
              size="lg"
              style={{ backgroundColor: site.brandColor }}
            >
              <Phone className="mr-2 h-5 w-5" />
              Call Us: {site.phone}
            </Button>
          </a>
        )}
      </div>
    </div>
  );
}

export default function PublicSite({ site, isPreview }: PublicSiteProps) {
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const { data: homePage } = useQuery<Page>({
    queryKey: ["/api/site/pages", "home"],
    queryFn: async () => {
      const res = await fetch("/api/site/pages/home");
      if (!res.ok) return null;
      return res.json();
    },
  });

  const { data: aboutPage } = useQuery<Page>({
    queryKey: ["/api/site/pages", "about"],
    queryFn: async () => {
      const res = await fetch("/api/site/pages/about");
      if (!res.ok) return null;
      return res.json();
    },
  });

  const { data: servicesPage } = useQuery<Page>({
    queryKey: ["/api/site/pages", "services"],
    queryFn: async () => {
      const res = await fetch("/api/site/pages/services");
      if (!res.ok) return null;
      return res.json();
    },
  });

  if (!site.isPublished && !isPreview) {
    return <ComingSoon site={site} />;
  }

  return (
    <div className="min-h-screen bg-background">
      <StickyHeader site={site} isScrolled={isScrolled} />
      <HeroSection site={site} homePage={homePage || undefined} />
      <TrustBadgesBar site={site} />
      <ServicesSection site={site} servicesPage={servicesPage || undefined} />
      <AboutSection site={site} aboutPage={aboutPage || undefined} />
      <TestimonialsSection site={site} />
      <ServiceAreaSection site={site} />
      <ContactSection site={site} />
      <Footer site={site} />
      {site.enableChatbot && <ChatBot site={site} isVisible={true} />}
    </div>
  );
}
