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
import { usePreview } from "@/contexts/PreviewContext";
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
  ChevronDown,
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
  Quote,
  Camera,
  ChevronLeft,
  Briefcase
} from "lucide-react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import type { Site, Page, Testimonial, TradeType, StylePreference, SitePhoto } from "@shared/schema";
import { TRADE_TEMPLATES, STYLE_TEMPLATES } from "@shared/tradeTemplates";
import ChatBot from "@/components/ChatBot";
import { useSEO } from "@/hooks/use-seo";

function toTitleCase(str: string): string {
  return str.replace(/\b\w/g, c => c.toUpperCase());
}

import plumberHero from "@assets/plumber-hero.jpg";
import electricianHero from "@assets/electrician-hero.jpg";
import rooferHero from "@assets/roofer-hero.jpg";
import hvacHero from "@assets/hvac-hero.jpg";
import painterHero from "@assets/painter-hero.jpg";
import landscaperHero from "@assets/landscaper-hero.jpg";
import generalContractorHero from "@assets/general-contractor-hero.jpg";

const TRADE_HERO_IMAGES: Record<string, string> = {
  general_contractor: generalContractorHero,
  plumber: plumberHero,
  electrician: electricianHero,
  roofer: rooferHero,
  hvac: hvacHero,
  painter: painterHero,
  landscaper: landscaperHero,
};

const contactFormSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Please enter a valid email"),
  phone: z.string().optional(),
  message: z.string().min(10, "Message must be at least 10 characters"),
  website: z.string().optional(),
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

function getStyleClasses(stylePreference?: StylePreference | null) {
  const style = stylePreference && STYLE_TEMPLATES[stylePreference] 
    ? STYLE_TEMPLATES[stylePreference] 
    : STYLE_TEMPLATES.professional;
  
  // Return style-specific class modifiers
  return {
    headingFont: style.fontFamily.heading,
    bodyFont: style.fontFamily.body,
    buttonStyle: style.buttonStyle,
    borderRadius: style.borderRadius,
    isLuxury: stylePreference === 'luxury',
    isBold: stylePreference === 'bold',
    isWarm: stylePreference === 'warm',
  };
}

function StickyHeader({ site, isScrolled }: { site: Site; isScrolled: boolean }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { getSitePath } = usePreview();
  const { data: photos } = useQuery<SitePhoto[]>({
    queryKey: [getSitePath("/api/site/photos")],
    queryFn: async () => {
      const res = await fetch(getSitePath("/api/site/photos"));
      if (!res.ok) return [];
      return res.json();
    },
  });
  const logoPhoto = photos?.find(p => p.type === "logo");

  const scrollToSection = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
    setMobileMenuOpen(false);
  };

  const navLinks = [
    { label: "Home", id: "hero" },
    { label: "Services", id: "services" },
    { label: "About", id: "about" },
    { label: "Gallery", id: "gallery" },
    { label: "Reviews", id: "testimonials" },
    { label: "Contact", id: "contact" },
  ];

  return (
    <header 
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled 
          ? "bg-background/95 backdrop-blur-md shadow-sm border-b" 
          : "bg-black/20 backdrop-blur-sm"
      }`}
      data-testid="header-sticky"
    >
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-14 sm:h-16 md:h-18 gap-2 sm:gap-4">
          <a 
            href="#hero" 
            onClick={(e) => { e.preventDefault(); scrollToSection("hero"); }}
            className="flex items-center gap-2 sm:gap-2.5 min-w-0 flex-shrink"
          >
            {logoPhoto ? (
              <img
                src={logoPhoto.url}
                alt={`${site.businessName} logo`}
                className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg object-cover flex-shrink-0 shadow-sm"
                data-testid="img-header-logo"
              />
            ) : (
              <div 
                className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg flex items-center justify-center flex-shrink-0 shadow-sm"
                style={{ backgroundColor: site.brandColor }}
              >
                <span className="text-sm sm:text-base font-bold text-white">
                  {site.businessName.charAt(0).toUpperCase()}
                </span>
              </div>
            )}
            <span 
              className={`font-semibold text-sm sm:text-base md:text-lg truncate max-w-[120px] sm:max-w-[180px] md:max-w-none ${
                isScrolled ? "text-foreground" : "text-white"
              }`}
            >
              {site.businessName}
            </span>
          </a>

          <nav className="hidden lg:flex items-center gap-1">
            {navLinks.map((link) => (
              <button
                key={link.id}
                onClick={() => scrollToSection(link.id)}
                className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  isScrolled 
                    ? "text-muted-foreground hover:text-foreground hover:bg-muted" 
                    : "text-white/90 hover:text-white hover:bg-white/10"
                }`}
                data-testid={`nav-${link.id}`}
              >
                {link.label}
              </button>
            ))}
          </nav>

          <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
            {site.phone && (
              <a
                href={`tel:${site.phone}`}
                className="hidden sm:block"
                data-testid="header-phone"
              >
                <Button 
                  size="sm"
                  style={{ backgroundColor: site.brandColor }}
                  className="border-0 shadow-sm gap-2"
                >
                  <Phone className="h-4 w-4" />
                  <span className="hidden xl:inline">{site.phone}</span>
                  <span className="xl:hidden">Call Now</span>
                </Button>
              </a>
            )}
            <button
              className={`lg:hidden p-2.5 min-h-[44px] min-w-[44px] flex items-center justify-center rounded-md transition-colors ${
                isScrolled 
                  ? "text-foreground hover:bg-muted" 
                  : "text-white hover:bg-white/10"
              }`}
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              data-testid="button-mobile-menu"
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>
      </div>

      {mobileMenuOpen && (
        <>
          <div 
            className="lg:hidden fixed inset-0 top-14 sm:top-16 bg-black/20 z-40"
            onClick={() => setMobileMenuOpen(false)}
            aria-hidden="true"
          />
          <div className="lg:hidden bg-background/98 backdrop-blur-md border-t relative z-50">
            <nav className="px-3 sm:px-4 py-2 space-y-1">
              {navLinks.map((link) => (
                <button
                  key={link.id}
                  onClick={() => scrollToSection(link.id)}
                  className="block w-full text-left px-4 py-4 min-h-[48px] rounded-lg text-foreground font-medium hover:bg-muted transition-colors active:bg-muted"
                  data-testid={`nav-mobile-${link.id}`}
                >
                  {link.label}
                </button>
              ))}
              {site.phone && (
                <div className="pt-2 border-t mt-2">
                  <a href={`tel:${site.phone}`} className="block">
                    <Button 
                      className="w-full gap-2 min-h-[48px] text-base"
                      style={{ backgroundColor: site.brandColor }}
                    >
                      <Phone className="h-5 w-5" />
                      Call Now
                    </Button>
                  </a>
                </div>
              )}
            </nav>
          </div>
        </>
      )}
    </header>
  );
}

function HeroSection({ site, homePage }: { site: Site; homePage?: Page }) {
  const [isDescriptionExpanded, setIsDescriptionExpanded] = useState(false);
  const { getSitePath } = usePreview();
  const { data: photos } = useQuery<SitePhoto[]>({
    queryKey: [getSitePath("/api/site/photos")],
    queryFn: async () => {
      const res = await fetch(getSitePath("/api/site/photos"));
      if (!res.ok) return [];
      return res.json();
    },
  });
  
  // Use rich content from AI generation
  const headline = homePage?.content?.heroHeadline || site.tagline || site.businessName;
  const subheadline = homePage?.content?.heroSubheadline || 
    `Serving ${site.serviceArea || "Your Local Community"}`;
  const description = homePage?.content?.heroDescription || site.businessDescription || 
    `Expert ${site.tradeType?.replace(/_/g, ' ') || 'contractor'} services for your home.`;
  const ctaPrimary = homePage?.content?.ctaPrimary || "Get Your Free Quote";
  const ctaSecondary = homePage?.content?.ctaSecondary || "Call Now";

  const TradeIcon = getTradeIcon(site.tradeType);
  const styleClasses = getStyleClasses(site.stylePreference);
  
  // Determine hero background: uploaded hero photo > first project photo > stock trade image
  const heroPhoto = photos?.find(p => p.type === "hero");
  const firstProjectPhoto = photos?.find(p => p.type === "project");
  const stockImage = site.tradeType ? TRADE_HERO_IMAGES[site.tradeType] : generalContractorHero;
  const heroImage = heroPhoto?.url || firstProjectPhoto?.url || stockImage;
  
  const getOverlayStyle = () => {
    if (styleClasses.isLuxury) {
      return `linear-gradient(160deg, ${site.brandColor}88 0%, rgba(0,0,0,0.7) 60%, rgba(0,0,0,0.85) 100%)`;
    }
    if (styleClasses.isBold) {
      return `linear-gradient(180deg, ${site.brandColor}77 0%, rgba(0,0,0,0.55) 50%, rgba(0,0,0,0.75) 100%)`;
    }
    if (styleClasses.isWarm) {
      return `linear-gradient(160deg, ${site.brandColor}66 0%, rgba(0,0,0,0.45) 50%, rgba(0,0,0,0.65) 100%)`;
    }
    return `linear-gradient(160deg, ${site.brandColor}66 0%, rgba(0,0,0,0.55) 50%, rgba(0,0,0,0.7) 100%)`;
  };

  const yearsExp = site.totalYearsExperience || site.yearsInBusiness;

  const badgeEl = (
    <div 
      className={`inline-flex items-center gap-2 sm:gap-2.5 px-4 sm:px-6 py-2 sm:py-2.5 text-white text-xs sm:text-sm font-medium mb-6 sm:mb-8 ${
        styleClasses.isLuxury 
          ? 'bg-white/10 backdrop-blur-xl border border-white/20 rounded-sm tracking-widest uppercase'
          : styleClasses.isBold
          ? 'bg-white/15 backdrop-blur-md border-2 border-white/30 rounded-none font-bold'
          : styleClasses.isWarm
          ? 'bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl'
          : 'bg-white/10 backdrop-blur-md border border-white/20 rounded-full'
      }`}
      data-testid="badge-hero-credentials"
    >
      <Shield className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
      <span>
        {yearsExp 
          ? `${yearsExp}+ Years Experience`
          : "Licensed & Insured"
        }
        {yearsExp ? ' \u00B7 Licensed & Insured' : ' \u00B7 Trusted Local Experts'}
      </span>
    </div>
  );

  const headlineEl = (
    <h1 
      className={`font-bold text-white mb-4 sm:mb-5 leading-[1.1] ${
        styleClasses.isLuxury 
          ? 'text-3xl sm:text-4xl md:text-5xl lg:text-6xl tracking-tight font-serif max-w-4xl' 
          : styleClasses.isBold 
          ? 'text-4xl sm:text-5xl md:text-6xl lg:text-7xl tracking-wide uppercase' 
          : styleClasses.isWarm
          ? 'text-3xl sm:text-4xl md:text-5xl lg:text-6xl tracking-tight max-w-4xl'
          : 'text-3xl sm:text-4xl md:text-5xl lg:text-6xl tracking-tight max-w-4xl'
      }`}
      style={styleClasses.isLuxury ? { fontFamily: 'Playfair Display, serif' } : undefined}
      data-testid="text-headline"
    >
      {headline}
    </h1>
  );

  const descriptionEl = (
    <div 
      className={`text-base sm:text-lg md:text-xl text-white/90 mb-8 sm:mb-10 leading-relaxed ${
        styleClasses.isLuxury ? 'tracking-wide max-w-2xl' : styleClasses.isBold ? 'max-w-3xl' : 'max-w-2xl'
      }`}
      data-testid="text-subheadline"
    >
      {isDescriptionExpanded || description.length <= 160 ? (
        <>
          <span>{description}</span>
          {description.length > 160 && (
            <button
              onClick={() => setIsDescriptionExpanded(false)}
              className="inline ml-1 text-white/80 underline font-medium cursor-pointer bg-transparent border-none p-0"
              data-testid="button-show-less"
              aria-label="Show less"
            >
              Show Less
            </button>
          )}
        </>
      ) : (
        <>
          <span>{description.slice(0, 160).trim()}</span>
          <button
            onClick={() => setIsDescriptionExpanded(true)}
            className="inline ml-1 text-white/80 underline font-medium cursor-pointer bg-transparent border-none p-0"
            data-testid="button-read-more"
            aria-label="Read more"
          >
            Read More
          </button>
        </>
      )}
    </div>
  );

  const ctaEl = (
    <div className={`flex flex-col gap-3 sm:flex-row sm:gap-4 px-2 sm:px-0 ${
      styleClasses.isBold || styleClasses.isLuxury ? 'justify-start' : 'justify-center'
    }`}>
      <Button 
        size="lg" 
        className="text-base sm:text-lg px-8 sm:px-10 min-h-[52px] sm:min-h-[56px] bg-white text-gray-900 border-0 shadow-xl font-semibold w-full sm:w-auto"
        onClick={() => document.getElementById("contact")?.scrollIntoView({ behavior: "smooth" })}
        data-testid="button-get-quote"
      >
        {ctaPrimary}
        <ArrowRight className="ml-2 h-5 w-5" />
      </Button>
      {site.phone && (
        <a href={`tel:${site.phone}`} className="w-full sm:w-auto">
          <Button 
            size="lg" 
            variant="outline"
            className="text-base sm:text-lg px-8 sm:px-10 min-h-[52px] sm:min-h-[56px] bg-transparent backdrop-blur-sm border border-white/40 text-white w-full font-medium"
            data-testid="button-call-now"
          >
            <Phone className="mr-2 h-5 w-5" />
            <span className="sm:hidden">Call Now</span>
            <span className="hidden sm:inline">{ctaSecondary}: {site.phone}</span>
          </Button>
        </a>
      )}
    </div>
  );

  const renderHeroContent = () => {
    if (styleClasses.isBold) {
      return (
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-left pt-24 sm:pt-32 pb-20 sm:pb-28">
          {badgeEl}
          {headlineEl}
          {descriptionEl}
          {ctaEl}
        </div>
      );
    }
    if (styleClasses.isLuxury) {
      return (
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 sm:pt-32 pb-20 sm:pb-28">
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 items-center">
            <div className="lg:col-span-3 text-left">
              {badgeEl}
              {headlineEl}
              {descriptionEl}
              {ctaEl}
            </div>
            <div className="hidden lg:block lg:col-span-2" />
          </div>
        </div>
      );
    }
    return (
      <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center pt-20 sm:pt-28 pb-16 sm:pb-20">
        {badgeEl}
        {headlineEl}
        {descriptionEl}
        {ctaEl}
      </div>
    );
  };

  return (
    <section 
      id="hero"
      className={`relative flex items-center overflow-hidden ${
        styleClasses.isWarm 
          ? 'min-h-[75svh] justify-center' 
          : styleClasses.isBold
          ? 'min-h-[90svh] items-end'
          : 'min-h-[85svh] justify-center'
      }`}
      data-testid="section-hero"
      data-style={site.stylePreference || 'professional'}
    >
      <div 
        className="absolute inset-0 bg-cover bg-center bg-no-repeat scale-105"
        style={{ backgroundImage: `url(${heroImage})` }}
      />
      
      <div 
        className="absolute inset-0"
        style={{ background: getOverlayStyle() }}
      />
      
      <div className={`absolute inset-0 ${styleClasses.isLuxury ? 'bg-gradient-to-b from-black/20 via-transparent to-black/40' : 'bg-gradient-to-b from-black/30 via-black/10 to-black/35'}`} />
      
      {renderHeroContent()}

      <div className="absolute bottom-0 left-0 right-0">
        <svg className="w-full h-8 sm:h-14 md:h-20" viewBox="0 0 1440 80" preserveAspectRatio="none">
          <path 
            d="M0,80 L0,40 C360,0 720,70 1080,30 S1440,50 1440,40 L1440,80 Z" 
            className="fill-background"
          />
        </svg>
      </div>
    </section>
  );
}

function TrustBadgesBar({ site }: { site: Site }) {
  const yearsExp = site.totalYearsExperience || site.yearsInBusiness;
  const trustBadges = getTrustBadges(site.tradeType);

  const stats: { value: string; label: string; icon: typeof Award }[] = [];

  if (yearsExp) {
    stats.push({ value: `${yearsExp}+`, label: "Years Experience", icon: Award });
  }

  if (site.projectsPerYear) {
    stats.push({ value: `${site.projectsPerYear}+`, label: "Projects Per Year", icon: Briefcase });
  }

  stats.push({ value: trustBadges[0] || "Licensed & Insured", label: "Verified", icon: Shield });

  if (site.serviceArea) {
    stats.push({ value: "Local", label: site.serviceArea.split(",")[0].trim(), icon: MapPin });
  }

  stats.push({ value: "Free", label: "Estimates", icon: CheckCircle });

  if (stats.length === 0) return null;

  return (
    <section className="bg-background py-8 sm:py-12 md:py-14 border-b" data-testid="section-trust-stats">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        <div className={`grid grid-cols-2 ${stats.length >= 4 ? 'md:grid-cols-4' : stats.length === 3 ? 'md:grid-cols-3' : 'md:grid-cols-2'} gap-4 sm:gap-8 md:gap-12`}>
          {stats.map((stat, index) => {
            const IconComponent = stat.icon;
            return (
              <div 
                key={index} 
                className="text-center"
                data-testid={`stat-${stat.label.toLowerCase().replace(/\s+/g, '-')}`}
              >
                <div 
                  className="w-10 h-10 sm:w-14 sm:h-14 rounded-xl sm:rounded-2xl flex items-center justify-center mx-auto mb-2 sm:mb-4"
                  style={{ backgroundColor: `${site.brandColor}15` }}
                >
                  <IconComponent 
                    className="h-5 w-5 sm:h-7 sm:w-7"
                    style={{ color: site.brandColor }} 
                  />
                </div>
                <div 
                  className="text-2xl sm:text-3xl md:text-4xl font-bold mb-0.5 sm:mb-1"
                  style={{ color: site.brandColor }}
                >
                  {stat.value}
                </div>
                <div className="text-muted-foreground font-medium text-xs sm:text-sm md:text-base">
                  {stat.label}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function ServiceCard({ site, service, index, description, faqs, matchingPhoto, styleClasses, TradeIcon }: {
  site: Site;
  service: string;
  index: number;
  description: string;
  faqs: Array<{question: string; answer: string}>;
  matchingPhoto?: SitePhoto;
  styleClasses: ReturnType<typeof getStyleClasses>;
  TradeIcon: typeof Wrench;
}) {
  const [faqOpen, setFaqOpen] = useState(false);
  const firstFaq = faqs?.[0];

  const photoThumbnail = matchingPhoto ? (
    <div className="w-full h-32 sm:h-40 overflow-hidden rounded-t-md">
      <img
        src={matchingPhoto.url}
        alt={matchingPhoto.caption || service}
        className="w-full h-full object-cover"
        data-testid={`img-service-photo-${index}`}
      />
    </div>
  ) : null;

  const faqSection = firstFaq ? (
    <div className="mt-3 border-t border-border/40 pt-3">
      <button
        onClick={(e) => { e.stopPropagation(); setFaqOpen(!faqOpen); }}
        className="flex items-start gap-2 w-full text-left min-h-[36px]"
        data-testid={`button-faq-toggle-${index}`}
      >
        <ChevronDown
          className={`h-4 w-4 mt-0.5 flex-shrink-0 transition-transform duration-200 ${faqOpen ? 'rotate-180' : ''}`}
          style={{ color: site.brandColor }}
        />
        <span className="text-sm font-medium text-foreground/80 leading-snug">{firstFaq.question}</span>
      </button>
      {faqOpen && (
        <p className="text-sm text-muted-foreground leading-relaxed mt-2 ml-6" data-testid={`text-faq-answer-${index}`}>
          {firstFaq.answer}
        </p>
      )}
    </div>
  ) : null;

  const galleryLink = (
    <button
      onClick={() => document.getElementById("gallery")?.scrollIntoView({ behavior: "smooth" })}
      className="inline-flex items-center text-xs font-medium mt-3 min-h-[32px] transition-colors"
      style={{ color: site.brandColor }}
      data-testid={`link-gallery-${index}`}
    >
      <Camera className="h-3.5 w-3.5 mr-1" />
      View Gallery <ChevronRight className="ml-0.5 h-3.5 w-3.5" />
    </button>
  );

  if (styleClasses.isLuxury) {
    return (
      <Card 
        key={index} 
        className="group hover-elevate border border-border/30 transition-all duration-300 hover:shadow-lg"
        data-testid={`card-service-${index}`}
      >
        {photoThumbnail}
        <CardContent className="p-6 sm:p-8 lg:p-10 flex flex-col sm:flex-row items-start gap-5 sm:gap-8">
          <div 
            className="w-14 h-14 sm:w-16 sm:h-16 rounded-sm flex items-center justify-center flex-shrink-0 transition-all duration-300 group-hover:scale-105"
            style={{ 
              backgroundColor: `${site.brandColor}10`,
              border: `1px solid ${site.brandColor}20`
            }}
          >
            <TradeIcon className="h-7 w-7 sm:h-8 sm:w-8" style={{ color: site.brandColor }} />
          </div>
          <div className="flex-1">
            <h3 className="text-lg sm:text-xl font-bold mb-2 sm:mb-3 font-serif" style={{ fontFamily: 'Playfair Display, serif' }}>{toTitleCase(service)}</h3>
            <p className="text-muted-foreground text-sm sm:text-base leading-relaxed mb-4">
              {description}
            </p>
            {faqSection}
            <div className="flex flex-wrap items-center gap-4 mt-4">
              <button 
                onClick={() => document.getElementById("contact")?.scrollIntoView({ behavior: "smooth" })}
                className="inline-flex items-center text-sm font-semibold transition-all duration-200 group-hover:gap-2 min-h-[44px]"
                style={{ color: site.brandColor }}
                data-testid={`button-service-cta-${index}`}
              >
                Get Started <ChevronRight className="ml-1 h-4 w-4 transition-transform group-hover:translate-x-1" />
              </button>
              {galleryLink}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (styleClasses.isBold) {
    return (
      <Card 
        key={index} 
        className="group hover-elevate border border-border/50 transition-all duration-300 hover:shadow-xl"
        data-testid={`card-service-${index}`}
      >
        {photoThumbnail}
        <CardContent className="p-5 sm:p-6 lg:p-8 relative">
          <div 
            className="absolute left-0 top-4 bottom-4 w-1 rounded-r-full"
            style={{ backgroundColor: site.brandColor }}
          />
          <div className="pl-4">
            <div 
              className="w-12 h-12 sm:w-14 sm:h-14 lg:w-16 lg:h-16 rounded-md flex items-center justify-center mb-4 sm:mb-6 transition-all duration-300 group-hover:scale-110 group-hover:shadow-lg"
              style={{ 
                backgroundColor: `${site.brandColor}15`,
                boxShadow: `0 4px 14px ${site.brandColor}20`
              }}
            >
              <TradeIcon className="h-6 w-6 sm:h-7 sm:w-7 lg:h-8 lg:w-8" style={{ color: site.brandColor }} />
            </div>
            <h3 className="text-lg sm:text-xl font-bold mb-2 sm:mb-4 uppercase tracking-wider">{toTitleCase(service)}</h3>
            <p className="text-muted-foreground text-sm sm:text-base leading-relaxed mb-4 sm:mb-6">
              {description}
            </p>
            {faqSection}
            <div className="flex flex-wrap items-center gap-4 mt-4">
              <button 
                onClick={() => document.getElementById("contact")?.scrollIntoView({ behavior: "smooth" })}
                className="inline-flex items-center text-sm font-semibold transition-all duration-200 group-hover:gap-2 min-h-[44px] uppercase tracking-wider"
                style={{ color: site.brandColor }}
                data-testid={`button-service-cta-${index}`}
              >
                Get Started <ChevronRight className="ml-1 h-4 w-4 transition-transform group-hover:translate-x-1" />
              </button>
              {galleryLink}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card 
      key={index} 
      className={`group hover-elevate border border-border/50 hover:border-[var(--brand-color)] transition-all duration-300 hover:shadow-xl ${
        styleClasses.isWarm ? 'rounded-2xl' : ''
      }`}
      style={{ "--brand-color": site.brandColor } as React.CSSProperties}
      data-testid={`card-service-${index}`}
    >
      {photoThumbnail}
      <CardContent className="p-5 sm:p-6 lg:p-8">
        <div 
          className={`w-12 h-12 sm:w-14 sm:h-14 lg:w-16 lg:h-16 flex items-center justify-center mb-4 sm:mb-6 transition-all duration-300 group-hover:scale-110 group-hover:shadow-lg ${
            styleClasses.isWarm ? 'rounded-2xl' : 'rounded-xl sm:rounded-2xl'
          }`}
          style={{ 
            backgroundColor: `${site.brandColor}15`,
            boxShadow: styleClasses.isWarm ? `0 2px 8px ${site.brandColor}10` : `0 4px 14px ${site.brandColor}20`
          }}
        >
          <TradeIcon className="h-6 w-6 sm:h-7 sm:w-7 lg:h-8 lg:w-8" style={{ color: site.brandColor }} />
        </div>
        <h3 className="text-lg sm:text-xl font-bold mb-2 sm:mb-4">{toTitleCase(service)}</h3>
        <p className="text-muted-foreground text-sm sm:text-base leading-relaxed mb-4 sm:mb-6">
          {description}
        </p>
        {faqSection}
        <div className="flex flex-wrap items-center gap-4 mt-4">
          <button 
            onClick={() => document.getElementById("contact")?.scrollIntoView({ behavior: "smooth" })}
            className="inline-flex items-center text-sm font-semibold transition-all duration-200 group-hover:gap-2 min-h-[44px]"
            style={{ color: site.brandColor }}
            data-testid={`button-service-cta-${index}`}
          >
            Get Started <ChevronRight className="ml-1 h-4 w-4 transition-transform group-hover:translate-x-1" />
          </button>
          {galleryLink}
        </div>
      </CardContent>
    </Card>
  );
}

function ServicesSection({ site, servicesPage }: { site: Site; servicesPage?: Page }) {
  const allServices = site.services || [];
  const services = allServices.slice(0, 6);
  const TradeIcon = getTradeIcon(site.tradeType);
  const styleClasses = getStyleClasses(site.stylePreference);
  const { getSitePath } = usePreview();
  const { data: photos } = useQuery<SitePhoto[]>({
    queryKey: [getSitePath("/api/site/photos")],
    queryFn: async () => {
      const res = await fetch(getSitePath("/api/site/photos"));
      if (!res.ok) return [];
      return res.json();
    },
  });
  
  const serviceDescriptions = servicesPage?.content?.servicesList?.reduce((acc: Record<string, string>, item: { name: string; description: string }) => {
    acc[item.name] = item.description;
    return acc;
  }, {}) || {};

  const serviceFaqs = servicesPage?.content?.servicesList?.reduce((acc: Record<string, Array<{question: string; answer: string}>>, item: { name: string; faqs?: Array<{question: string; answer: string}> }) => {
    if (item.faqs && item.faqs.length > 0) {
      acc[item.name] = item.faqs;
    }
    return acc;
  }, {}) || {};

  if (services.length === 0) return null;

  const sectionHeadingClass = styleClasses.isBold
    ? 'uppercase tracking-wider'
    : styleClasses.isLuxury
    ? 'font-serif'
    : '';

  const getServiceDescription = (service: string, index: number) => {
    const fallbackDescriptions = [
      `Professional ${service.toLowerCase()} services tailored to your specific needs and budget.`,
      `Reliable ${service.toLowerCase()} solutions backed by years of hands-on expertise.`,
      `Comprehensive ${service.toLowerCase()} services from consultation through project completion.`,
      `Trusted ${service.toLowerCase()} work with a focus on quality materials and craftsmanship.`,
      `Skilled ${service.toLowerCase()} services designed to exceed your expectations.`,
      `Dependable ${service.toLowerCase()} solutions with transparent pricing and timely delivery.`,
    ];
    return serviceDescriptions[service] || fallbackDescriptions[index % fallbackDescriptions.length];
  };

  const getMatchingPhoto = (service: string) => {
    return photos?.find(p =>
      (p.type === "service" || p.type === "project") &&
      p.caption?.toLowerCase().includes(service.toLowerCase())
    );
  };

  const getGridClass = () => {
    if (styleClasses.isLuxury) return 'grid grid-cols-1 gap-4 sm:gap-6';
    if (styleClasses.isBold) return 'grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 lg:gap-8';
    if (styleClasses.isWarm) return 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8';
    return 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8';
  };

  return (
    <section id="services" className={`bg-muted/30 ${
      styleClasses.isLuxury ? 'py-16 sm:py-24 md:py-32' : 'py-12 sm:py-20 md:py-28'
    }`} data-testid="section-services">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        <div className="text-center mb-8 sm:mb-14 md:mb-20">
          <div 
            className={`inline-flex items-center gap-1.5 sm:gap-2 px-3 sm:px-5 py-2 sm:py-2.5 text-xs sm:text-sm font-semibold mb-4 sm:mb-6 ${
              styleClasses.isWarm ? 'rounded-2xl' : 'rounded-full'
            }`}
            style={{ backgroundColor: `${site.brandColor}15`, color: site.brandColor }}
          >
            <TradeIcon className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            What We Do Best
          </div>
          <h2 className={`text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold mb-3 sm:mb-6 ${sectionHeadingClass}`}
            style={styleClasses.isLuxury ? { fontFamily: 'Playfair Display, serif' } : undefined}
          >Our Expert Services</h2>
          <p className="text-muted-foreground text-base sm:text-lg md:text-xl max-w-3xl mx-auto leading-relaxed px-2 sm:px-0">
            {site.serviceArea 
              ? `From ${site.serviceArea}, we bring expertise and dedication to every project. Here's how we can help you.`
              : "Every project receives our full attention and expertise. Discover the services that set us apart."
            }
          </p>
        </div>

        <div className={getGridClass()}>
          {services.map((service, index) => {
            const cardEl = (
              <ServiceCard
                key={index}
                site={site}
                service={service}
                index={index}
                description={getServiceDescription(service, index)}
                faqs={serviceFaqs[service] || []}
                matchingPhoto={getMatchingPhoto(service)}
                styleClasses={styleClasses}
                TradeIcon={TradeIcon}
              />
            );
            if (styleClasses.isWarm) {
              return (
                <div key={index} className={index % 3 === 0 ? 'sm:col-span-2 lg:col-span-1' : ''}>
                  {cardEl}
                </div>
              );
            }
            return cardEl;
          })}
        </div>
      </div>
    </section>
  );
}

function AboutSection({ site, aboutPage }: { site: Site; aboutPage?: Page }) {
  const styleClasses = getStyleClasses(site.stylePreference);
  const sectionTitle = aboutPage?.content?.sectionTitle || 
    (site.ownerName ? `Meet ${site.ownerName}` : `The ${site.businessName} Story`);
  const description = aboutPage?.content?.companyStory || site.ownerStory || site.businessDescription || 
    `${site.businessName} is dedicated to providing exceptional service to our community.`;
  const uniquePoints = site.uniqueSellingPoints || [];
  const certifications = site.certifications || [];

  const sectionHeadingClass = styleClasses.isBold
    ? 'uppercase tracking-wider'
    : styleClasses.isLuxury
    ? 'font-serif'
    : '';

  return (
    <section id="about" className={`${styleClasses.isLuxury ? 'py-16 sm:py-24 md:py-32' : 'py-12 sm:py-20 md:py-28'}`} data-testid="section-about">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-8 sm:gap-12 lg:gap-20 items-center">
          <div>
            <div 
              className={`inline-flex items-center gap-1.5 sm:gap-2 px-3 sm:px-5 py-2 sm:py-2.5 text-xs sm:text-sm font-semibold mb-4 sm:mb-6 ${
                styleClasses.isWarm ? 'rounded-2xl' : 'rounded-full'
              }`}
              style={{ backgroundColor: `${site.brandColor}15`, color: site.brandColor }}
            >
              <Users className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              Our Story
            </div>
            <h2 className={`text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold mb-4 sm:mb-8 leading-tight ${sectionHeadingClass}`}
              style={styleClasses.isLuxury ? { fontFamily: 'Playfair Display, serif' } : undefined}
            >
              {sectionTitle}
            </h2>
            <p className="text-muted-foreground text-base sm:text-lg md:text-xl mb-6 sm:mb-10 leading-relaxed">
              {description}
            </p>

            {((site.totalYearsExperience || site.yearsInBusiness) || site.projectsPerYear) && (
              <div className="flex flex-wrap gap-3 sm:gap-4 mb-6 sm:mb-8">
                {(site.totalYearsExperience || site.yearsInBusiness) && (
                  <div className="flex items-center gap-3 sm:gap-4 flex-1 min-w-[200px] p-3 sm:p-4 rounded-xl bg-muted/50">
                    <div 
                      className="w-12 h-12 sm:w-16 sm:h-16 rounded-full flex items-center justify-center flex-shrink-0"
                      style={{ backgroundColor: site.brandColor }}
                    >
                      <span className="text-lg sm:text-2xl font-bold text-white">{site.totalYearsExperience || site.yearsInBusiness}+</span>
                    </div>
                    <div>
                      <p className="font-semibold text-base sm:text-lg">Years of Experience</p>
                      <p className="text-muted-foreground text-sm sm:text-base">Serving our community with pride</p>
                    </div>
                  </div>
                )}
                {site.projectsPerYear && (
                  <div className="flex items-center gap-3 sm:gap-4 flex-1 min-w-[200px] p-3 sm:p-4 rounded-xl bg-muted/50">
                    <div 
                      className="w-12 h-12 sm:w-16 sm:h-16 rounded-full flex items-center justify-center flex-shrink-0"
                      style={{ backgroundColor: site.brandColor }}
                    >
                      <span className="text-lg sm:text-2xl font-bold text-white">{site.projectsPerYear}+</span>
                    </div>
                    <div>
                      <p className="font-semibold text-base sm:text-lg">Projects Per Year</p>
                      <p className="text-muted-foreground text-sm sm:text-base">Consistent delivery, every time</p>
                    </div>
                  </div>
                )}
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

          <div className="space-y-4 sm:space-y-6">
            <div 
              className="relative aspect-square max-w-sm mx-auto lg:max-w-none rounded-2xl overflow-hidden"
              style={{ backgroundColor: `${site.brandColor}10` }}
            >
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center p-4 sm:p-8">
                  <div 
                    className="w-20 h-20 sm:w-28 sm:h-28 lg:w-32 lg:h-32 rounded-full flex items-center justify-center mx-auto mb-4 sm:mb-6"
                    style={{ backgroundColor: site.brandColor }}
                  >
                    <span className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white">
                      {site.businessName.charAt(0)}
                    </span>
                  </div>
                  <p className="text-xl sm:text-2xl font-bold">{site.businessName}</p>
                  <p className="text-muted-foreground text-base sm:text-lg">Your Trusted Local Contractor</p>
                </div>
              </div>
            </div>

            {certifications.length > 0 && (
              <div className="grid grid-cols-2 gap-2 sm:gap-3">
                {certifications.slice(0, 4).map((cert, index) => (
                  <div 
                    key={index}
                    className="flex items-center gap-2 p-2.5 sm:p-3 rounded-lg bg-muted/50"
                  >
                    <Award className="h-4 w-4 sm:h-5 sm:w-5 flex-shrink-0" style={{ color: site.brandColor }} />
                    <span className="text-xs sm:text-sm font-medium line-clamp-2">{cert}</span>
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

function GallerySection({ site }: { site: Site }) {
  const { getSitePath } = usePreview();
  const { data: photos } = useQuery<SitePhoto[]>({
    queryKey: [getSitePath("/api/site/photos")],
    queryFn: async () => {
      const res = await fetch(getSitePath("/api/site/photos"));
      if (!res.ok) return [];
      return res.json();
    },
  });
  const [selectedPhoto, setSelectedPhoto] = useState<SitePhoto | null>(null);
  const [activeCategory, setActiveCategory] = useState<string>("all");
  const styleClasses = getStyleClasses(site.stylePreference);

  if (!photos || photos.length === 0) return null;

  const displayPhotos = photos.filter(p => p.type !== "logo" && p.type !== "hero");
  if (displayPhotos.length === 0) return null;

  const categories: { key: string; label: string; photos: SitePhoto[] }[] = [];

  const projectPhotos = displayPhotos.filter(p => p.type === "project");
  if (projectPhotos.length > 0) {
    categories.push({ key: "projects", label: "Our Projects", photos: projectPhotos });
  }

  const beforeAfterPhotos = displayPhotos.filter(p => p.type === "before" || p.type === "after");
  if (beforeAfterPhotos.length > 0) {
    categories.push({ key: "before-after", label: "Before & After", photos: beforeAfterPhotos });
  }

  const teamPhotos = displayPhotos.filter(p => p.type === "team");
  if (teamPhotos.length > 0) {
    categories.push({ key: "team", label: "Our Team", photos: teamPhotos });
  }

  const servicePhotos = displayPhotos.filter(p => p.type === "service");
  if (servicePhotos.length > 0) {
    categories.push({ key: "services", label: "Our Services", photos: servicePhotos });
  }

  if (categories.length === 0) return null;

  const filteredPhotos = activeCategory === "all"
    ? displayPhotos
    : categories.find(c => c.key === activeCategory)?.photos || [];

  const sectionHeadingClass = styleClasses.isBold
    ? 'uppercase tracking-wider'
    : styleClasses.isLuxury
    ? 'font-serif'
    : '';

  return (
    <section id="gallery" className={`bg-muted/30 ${styleClasses.isLuxury ? 'py-16 sm:py-24 md:py-32' : 'py-12 sm:py-20 md:py-28'}`} data-testid="section-gallery">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        <div className="text-center mb-8 sm:mb-14 md:mb-20">
          <div
            className={`inline-flex items-center gap-1.5 sm:gap-2 px-3 sm:px-5 py-2 sm:py-2.5 text-xs sm:text-sm font-semibold mb-4 sm:mb-6 ${
              styleClasses.isWarm ? 'rounded-2xl' : 'rounded-full'
            }`}
            style={{ backgroundColor: `${site.brandColor}15`, color: site.brandColor }}
          >
            <Camera className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            Our Work
          </div>
          <h2 className={`text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold mb-3 sm:mb-6 ${sectionHeadingClass}`}
            style={styleClasses.isLuxury ? { fontFamily: 'Playfair Display, serif' } : undefined}
          >Project Gallery</h2>
          <p className="text-muted-foreground text-base sm:text-lg md:text-xl max-w-3xl mx-auto leading-relaxed px-2 sm:px-0">
            Browse through our recent projects and see the quality of our craftsmanship firsthand.
          </p>
        </div>

        <div className="flex flex-wrap justify-center gap-2 sm:gap-3 mb-8 sm:mb-12" data-testid="gallery-filter-tabs">
          <Button
            variant="ghost"
            className={`toggle-elevate ${activeCategory === "all" ? "toggle-elevated" : ""}`}
            style={activeCategory === "all" ? { backgroundColor: `${site.brandColor}15`, color: site.brandColor } : undefined}
            onClick={() => setActiveCategory("all")}
            data-testid="gallery-tab-all"
          >
            All ({displayPhotos.length})
          </Button>
          {categories.map((cat) => (
            <Button
              key={cat.key}
              variant="ghost"
              className={`toggle-elevate ${activeCategory === cat.key ? "toggle-elevated" : ""}`}
              style={activeCategory === cat.key ? { backgroundColor: `${site.brandColor}15`, color: site.brandColor } : undefined}
              onClick={() => setActiveCategory(cat.key)}
              data-testid={`gallery-tab-${cat.key}`}
            >
              {cat.label} ({cat.photos.length})
            </Button>
          ))}
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4 lg:gap-5">
          {filteredPhotos.map((photo) => (
            <div
              key={photo.id}
              className="group relative aspect-square rounded-lg cursor-pointer hover-elevate"
              onClick={() => setSelectedPhoto(photo)}
              data-testid={`gallery-photo-${photo.id}`}
            >
              <img
                src={photo.url}
                alt={photo.caption || "Gallery photo"}
                className="w-full h-full object-cover rounded-lg transition-transform duration-300 group-hover:scale-105"
                loading="lazy"
              />
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-300 rounded-lg" />
              {photo.caption && (
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-3 rounded-b-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  <p className="text-white text-sm truncate">{photo.caption}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      <Dialog
        open={!!selectedPhoto}
        onOpenChange={(open) => !open && setSelectedPhoto(null)}
      >
        <DialogContent
          className="max-w-4xl w-full p-0 bg-black/95 border-none"
          data-testid="gallery-lightbox"
        >
          {selectedPhoto && (
            <div className="flex flex-col items-center w-full p-4">
              <img
                src={selectedPhoto.url}
                alt={selectedPhoto.caption || "Photo"}
                className="max-h-[70vh] max-w-full object-contain rounded-lg"
                data-testid="lightbox-image"
              />
              {selectedPhoto.caption && (
                <p
                  className="mt-4 text-white text-center text-sm"
                  data-testid="lightbox-caption"
                >
                  {selectedPhoto.caption}
                </p>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </section>
  );
}

function TestimonialsSection({ site }: { site: Site }) {
  const { getSitePath } = usePreview();
  const { data: testimonials = [] } = useQuery<Testimonial[]>({
    queryKey: [getSitePath("/api/site/testimonials")],
    queryFn: async () => {
      const res = await fetch(getSitePath("/api/site/testimonials"));
      if (!res.ok) return [];
      return res.json();
    },
  });
  const styleClasses = getStyleClasses(site.stylePreference);

  if (testimonials.length === 0) {
    return null;
  }

  const avgRating = testimonials.length > 0 
    ? testimonials.reduce((sum, t) => sum + t.rating, 0) / testimonials.length 
    : 5;
  const reviewCount = testimonials.length;
  const featuredTestimonial = testimonials[0];
  const otherTestimonials = testimonials.slice(1, 7);

  const sectionHeadingClass = styleClasses.isBold
    ? 'uppercase tracking-wider'
    : styleClasses.isLuxury
    ? 'font-serif'
    : '';

  return (
    <section id="testimonials" className={`bg-muted/30 ${styleClasses.isLuxury ? 'py-16 sm:py-20 md:py-28' : 'py-12 sm:py-16 md:py-24'}`} data-testid="section-testimonials">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        <div className="text-center mb-8 sm:mb-12 md:mb-16">
          <div 
            className={`inline-flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium mb-4 ${
              styleClasses.isWarm ? 'rounded-2xl' : 'rounded-full'
            }`}
            style={{ backgroundColor: `${site.brandColor}15`, color: site.brandColor }}
          >
            <ThumbsUp className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            Customer Reviews
          </div>
          <h2 className={`text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold mb-4 ${sectionHeadingClass}`}
            style={styleClasses.isLuxury ? { fontFamily: 'Playfair Display, serif' } : undefined}
          >What Our Customers Say</h2>
          
          <div className="flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-4 mt-4 sm:mt-6" data-testid="testimonials-aggregate-rating">
            <div className="flex items-center gap-0.5 sm:gap-1">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star 
                  key={i}
                  className={`h-5 w-5 sm:h-6 sm:w-6 ${i < Math.round(avgRating) ? "fill-yellow-400 text-yellow-400" : "text-muted"}`}
                />
              ))}
            </div>
            <div className="text-center sm:text-left">
              <span className="text-xl sm:text-2xl font-bold">{avgRating.toFixed(1)}</span>
              <span className="text-muted-foreground ml-1 sm:ml-2 text-sm sm:text-base">out of 5</span>
              <p className="text-xs sm:text-sm text-muted-foreground">Based on {reviewCount} review{reviewCount !== 1 ? "s" : ""}</p>
            </div>
          </div>
        </div>

        {featuredTestimonial && (
          <Card 
            className="mb-6 sm:mb-8 overflow-hidden border-2"
            style={{ borderColor: `${site.brandColor}30` }}
            data-testid={`card-testimonial-featured-${featuredTestimonial.id}`}
          >
            <CardContent className="p-5 sm:p-8 md:p-12">
              <div className="grid md:grid-cols-[1fr,auto] gap-6 sm:gap-8 items-center">
                <div>
                  <div className="flex flex-wrap items-center gap-1 mb-3 sm:mb-4">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star 
                        key={i}
                        className={`h-5 w-5 sm:h-6 sm:w-6 ${i < featuredTestimonial.rating ? "fill-yellow-400 text-yellow-400" : "text-muted"}`}
                      />
                    ))}
                    <span 
                      className="ml-2 sm:ml-3 px-2 sm:px-3 py-1 rounded-full text-[10px] sm:text-xs font-semibold uppercase tracking-wide"
                      style={{ backgroundColor: `${site.brandColor}15`, color: site.brandColor }}
                    >
                      Featured
                    </span>
                  </div>
                  <Quote className="h-8 w-8 sm:h-10 sm:w-10 mb-3 sm:mb-4" style={{ color: `${site.brandColor}40` }} />
                  <p className="text-base sm:text-lg md:text-xl text-foreground leading-relaxed mb-4 sm:mb-6">
                    "{featuredTestimonial.content}"
                  </p>
                  <div className="flex items-center gap-3 sm:gap-4">
                    <div 
                      className="w-10 h-10 sm:w-14 sm:h-14 rounded-full flex items-center justify-center text-white text-lg sm:text-xl font-bold flex-shrink-0"
                      style={{ backgroundColor: site.brandColor }}
                    >
                      {featuredTestimonial.customerName.charAt(0)}
                    </div>
                    <div className="min-w-0">
                      <p className="font-bold text-base sm:text-lg truncate">{featuredTestimonial.customerName}</p>
                      <div className="flex flex-wrap items-center gap-1 sm:gap-2 text-muted-foreground text-sm">
                        {featuredTestimonial.customerLocation && (
                          <span className="truncate">{featuredTestimonial.customerLocation}</span>
                        )}
                        {featuredTestimonial.projectType && featuredTestimonial.customerLocation && (
                          <span className="text-muted hidden sm:inline">|</span>
                        )}
                        {featuredTestimonial.projectType && (
                          <span className="text-xs sm:text-sm">{featuredTestimonial.projectType}</span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
                <div 
                  className="hidden md:flex items-center justify-center w-32 h-32 rounded-full"
                  style={{ backgroundColor: `${site.brandColor}10` }}
                >
                  <CheckCircle className="h-16 w-16" style={{ color: site.brandColor }} />
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {otherTestimonials.map((testimonial) => (
            <Card 
              key={testimonial.id} 
              className="hover-elevate group"
              data-testid={`card-testimonial-${testimonial.id}`}
            >
              <CardContent className="p-4 sm:p-6 md:p-8">
                <div className="flex items-center justify-between gap-2 mb-3 sm:mb-4">
                  <div className="flex items-center gap-0.5 sm:gap-1">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star 
                        key={i}
                        className={`h-4 w-4 sm:h-5 sm:w-5 ${i < testimonial.rating ? "fill-yellow-400 text-yellow-400" : "text-muted"}`}
                      />
                    ))}
                  </div>
                  {testimonial.projectType && (
                    <span 
                      className="px-2 py-1 rounded text-[10px] sm:text-xs font-medium whitespace-nowrap"
                      style={{ backgroundColor: `${site.brandColor}10`, color: site.brandColor }}
                    >
                      {testimonial.projectType}
                    </span>
                  )}
                </div>
                <Quote className="h-6 w-6 sm:h-8 sm:w-8 text-muted-foreground/30 mb-2 sm:mb-3 group-hover:text-muted-foreground/50 transition-colors" />
                <p className="text-muted-foreground text-sm sm:text-base mb-4 sm:mb-6 leading-relaxed line-clamp-4">
                  "{testimonial.content}"
                </p>
                <div className="flex items-center gap-2 sm:gap-3 pt-3 sm:pt-4 border-t">
                  <div 
                    className="w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center text-white font-semibold text-sm sm:text-base flex-shrink-0"
                    style={{ backgroundColor: site.brandColor }}
                  >
                    {testimonial.customerName.charAt(0)}
                  </div>
                  <div className="min-w-0">
                    <p className="font-semibold text-sm sm:text-base truncate">{testimonial.customerName}</p>
                    {testimonial.customerLocation && (
                      <p className="text-xs sm:text-sm text-muted-foreground truncate">{testimonial.customerLocation}</p>
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
  const styleClasses = getStyleClasses(site.stylePreference);
  if (!site.serviceArea) return null;

  const sectionHeadingClass = styleClasses.isBold
    ? 'uppercase tracking-wider'
    : styleClasses.isLuxury
    ? 'font-serif'
    : '';

  return (
    <section id="service-area" className={`${styleClasses.isLuxury ? 'py-16 sm:py-20 md:py-28' : 'py-12 sm:py-16 md:py-24'}`} data-testid="section-service-area">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-8 sm:gap-12 items-center">
          <div>
            <div 
              className={`inline-flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium mb-3 sm:mb-4 ${
                styleClasses.isWarm ? 'rounded-2xl' : 'rounded-full'
              }`}
              style={{ backgroundColor: `${site.brandColor}15`, color: site.brandColor }}
            >
              <MapPin className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              Service Area
            </div>
            <h2 className={`text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold mb-4 sm:mb-6 ${sectionHeadingClass}`}
              style={styleClasses.isLuxury ? { fontFamily: 'Playfair Display, serif' } : undefined}
            >Where We Serve</h2>
            <p className="text-muted-foreground text-base sm:text-lg mb-6 sm:mb-8 leading-relaxed">
              We proudly serve {site.serviceArea} and surrounding communities. Not sure if you're in our area? Give us a call!
            </p>
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
              <Button 
                size="lg"
                className="min-h-[48px] text-base"
                style={{ backgroundColor: site.brandColor }}
                onClick={() => document.getElementById("contact")?.scrollIntoView({ behavior: "smooth" })}
                data-testid="button-check-availability"
              >
                Check Availability
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
              {site.phone && (
                <a href={`tel:${site.phone}`} className="w-full sm:w-auto">
                  <Button size="lg" variant="outline" className="w-full min-h-[48px] text-base">
                    <Phone className="mr-2 h-5 w-5" />
                    <span className="sm:hidden">Call Now</span>
                    <span className="hidden sm:inline">{site.phone}</span>
                  </Button>
                </a>
              )}
            </div>
          </div>
          <div 
            className="aspect-video rounded-2xl flex items-center justify-center order-first lg:order-last"
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
  const { getSitePath } = usePreview();
  const [submitted, setSubmitted] = useState(false);
  const styleClasses = getStyleClasses(site.stylePreference);

  const form = useForm<ContactFormValues>({
    resolver: zodResolver(contactFormSchema),
    defaultValues: {
      name: "",
      email: "",
      phone: "",
      message: "",
      website: "",
    },
  });

  const submitLead = useMutation({
    mutationFn: async (data: ContactFormValues) => {
      if (data.website) {
        console.log('Spam detected');
        return { success: true };
      }
      const { website, ...leadData } = data;
      const response = await apiRequest("POST", getSitePath("/api/site/leads"), leadData);
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

  const sectionHeadingClass = styleClasses.isBold
    ? 'uppercase tracking-wider'
    : styleClasses.isLuxury
    ? 'font-serif'
    : '';

  return (
    <section id="contact" className={`bg-muted/30 ${styleClasses.isLuxury ? 'py-16 sm:py-20 md:py-28' : 'py-12 sm:py-16 md:py-24'}`} data-testid="section-contact">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        <div className="text-center mb-8 sm:mb-12 md:mb-16">
          <div 
            className={`inline-flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium mb-3 sm:mb-4 ${
              styleClasses.isWarm ? 'rounded-2xl' : 'rounded-full'
            }`}
            style={{ backgroundColor: `${site.brandColor}15`, color: site.brandColor }}
          >
            <Mail className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            Get In Touch
          </div>
          <h2 className={`text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold mb-3 sm:mb-4 ${sectionHeadingClass}`}
            style={styleClasses.isLuxury ? { fontFamily: 'Playfair Display, serif' } : undefined}
          >Ready to Get Started?</h2>
          <p className="text-muted-foreground text-base sm:text-lg max-w-2xl mx-auto px-2 sm:px-0">
            Contact us today for a free estimate. We're here to help with all your needs.
          </p>
        </div>

        <div className="grid lg:grid-cols-5 gap-6 sm:gap-8 lg:gap-12">
          <div className="lg:col-span-2 space-y-4 sm:space-y-6">
            {site.phone && (
              <a 
                href={`tel:${site.phone}`}
                className="group flex items-start gap-3 sm:gap-4 p-4 sm:p-5 rounded-xl bg-background hover-elevate border min-h-[72px] active:bg-muted/50"
                data-testid="link-contact-phone"
              >
                <div 
                  className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ backgroundColor: `${site.brandColor}15` }}
                >
                  <Phone className="h-5 w-5 sm:h-6 sm:w-6" style={{ color: site.brandColor }} />
                </div>
                <div className="min-w-0">
                  <p className="font-semibold text-base sm:text-lg">Phone</p>
                  <p className="text-muted-foreground text-sm sm:text-base truncate">{site.phone}</p>
                  <p className="text-xs sm:text-sm text-muted-foreground hidden sm:block">
                    {['plumber', 'electrician', 'hvac'].includes(site.tradeType || '') 
                      ? 'Available for emergency calls 24/7' 
                      : 'Call us for a free estimate'}
                  </p>
                </div>
              </a>
            )}

            {site.email && (
              <a 
                href={`mailto:${site.email}`}
                className="group flex items-start gap-3 sm:gap-4 p-4 sm:p-5 rounded-xl bg-background hover-elevate border min-h-[72px] active:bg-muted/50"
                data-testid="link-contact-email"
              >
                <div 
                  className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ backgroundColor: `${site.brandColor}15` }}
                >
                  <Mail className="h-5 w-5 sm:h-6 sm:w-6" style={{ color: site.brandColor }} />
                </div>
                <div className="min-w-0">
                  <p className="font-semibold text-base sm:text-lg">Email</p>
                  <p className="text-muted-foreground text-sm sm:text-base truncate">{site.email}</p>
                  <p className="text-xs sm:text-sm text-muted-foreground hidden sm:block">We respond within 24 hours</p>
                </div>
              </a>
            )}

            {site.address && (
              <div className="flex items-start gap-3 sm:gap-4 p-4 sm:p-5 rounded-xl bg-background border min-h-[72px]">
                <div 
                  className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ backgroundColor: `${site.brandColor}15` }}
                >
                  <MapPin className="h-5 w-5 sm:h-6 sm:w-6" style={{ color: site.brandColor }} />
                </div>
                <div className="min-w-0">
                  <p className="font-semibold text-base sm:text-lg">Address</p>
                  <p className="text-muted-foreground text-sm sm:text-base">{site.address}</p>
                </div>
              </div>
            )}

            <div 
              className="p-4 sm:p-6 rounded-xl text-white"
              style={{ backgroundColor: site.brandColor }}
            >
              <h3 className="font-bold text-lg sm:text-xl mb-2">Need Immediate Help?</h3>
              <p className="text-white/80 text-sm sm:text-base mb-3 sm:mb-4">
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
                <CardContent className="text-center p-6 sm:p-8 md:p-12">
                  <div 
                    className="w-16 h-16 sm:w-20 sm:h-20 rounded-full flex items-center justify-center mx-auto mb-4 sm:mb-6"
                    style={{ backgroundColor: `${site.brandColor}15` }}
                  >
                    <CheckCircle className="h-8 w-8 sm:h-10 sm:w-10" style={{ color: site.brandColor }} />
                  </div>
                  <h3 className="text-xl sm:text-2xl md:text-3xl font-bold mb-3 sm:mb-4">Thank You!</h3>
                  <p className="text-muted-foreground text-base sm:text-lg mb-4 sm:mb-6">
                    Your message has been received. We'll get back to you as soon as possible.
                  </p>
                  <Button 
                    onClick={() => setSubmitted(false)}
                    className="min-h-[44px]"
                    style={{ backgroundColor: site.brandColor }}
                    data-testid="button-send-another"
                  >
                    Send Another Message
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardContent className="p-4 sm:p-6 md:p-8">
                  <h3 className="text-lg sm:text-xl font-bold mb-4 sm:mb-6">Request a Free Quote</h3>
                  <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 sm:space-y-5">
                      <div className="grid sm:grid-cols-2 gap-4 sm:gap-5">
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
                      <FormField
                        control={form.control}
                        name="website"
                        render={({ field }) => (
                          <FormItem className="hidden" aria-hidden="true">
                            <FormLabel>Website</FormLabel>
                            <FormControl>
                              <Input 
                                {...field}
                                tabIndex={-1}
                                autoComplete="off"
                              />
                            </FormControl>
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
    <footer className="bg-foreground text-background pb-20 sm:pb-0" data-testid="section-footer">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-10 sm:py-12 md:py-16">
        <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8 lg:gap-12 mb-8 sm:mb-12">
          <div className="col-span-2 sm:col-span-2 md:col-span-1 lg:col-span-1">
            <div className="flex items-center gap-2 sm:gap-3 mb-3 sm:mb-4">
              <div 
                className="w-8 h-8 sm:w-10 sm:h-10 rounded-md flex items-center justify-center flex-shrink-0"
                style={{ backgroundColor: site.brandColor }}
              >
                <span className="text-base sm:text-lg font-bold text-white">
                  {site.businessName.charAt(0)}
                </span>
              </div>
              <span className="font-bold text-lg sm:text-xl">{site.businessName}</span>
            </div>
            <p className="text-background/70 text-sm sm:text-base mb-3 sm:mb-4 leading-relaxed">
              Your trusted local contractor for all your home service needs. Quality workmanship guaranteed.
            </p>
            {(site.totalYearsExperience || site.yearsInBusiness) && (
              <p className="text-xs sm:text-sm text-background/50">
                Proudly serving for {site.totalYearsExperience || site.yearsInBusiness}+ years
              </p>
            )}
          </div>

          {services.length > 0 && (
            <div className="hidden md:block">
              <h4 className="font-semibold text-base sm:text-lg mb-3 sm:mb-4">Services</h4>
              <ul className="space-y-1.5 sm:space-y-2">
                {services.slice(0, 6).map((service, index) => (
                  <li key={index}>
                    <button
                      onClick={() => scrollToSection("services")}
                      className="text-background/70 hover:text-background transition-colors text-left text-sm sm:text-base min-h-[36px] flex items-center"
                    >
                      {toTitleCase(service)}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div>
            <h4 className="font-semibold text-base sm:text-lg mb-3 sm:mb-4">Quick Links</h4>
            <ul className="space-y-1 sm:space-y-2">
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
                    className="text-background/70 hover:text-background transition-colors text-sm sm:text-base min-h-[36px] flex items-center"
                  >
                    {link.label}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {(site.phone || site.email || site.serviceArea) && (
            <div>
              <h4 className="font-semibold text-base sm:text-lg mb-3 sm:mb-4">Contact</h4>
              <ul className="space-y-2 sm:space-y-3">
                {site.phone && (
                  <li>
                    <a
                      href={`tel:${site.phone}`}
                      className="flex items-center gap-2 text-background/70 hover:text-background transition-colors text-sm sm:text-base min-h-[36px]"
                    >
                      <Phone className="h-4 w-4 flex-shrink-0" />
                      <span className="truncate">{site.phone}</span>
                    </a>
                  </li>
                )}
                {site.email && (
                  <li>
                    <a
                      href={`mailto:${site.email}`}
                      className="flex items-center gap-2 text-background/70 hover:text-background transition-colors text-sm sm:text-base min-h-[36px]"
                    >
                      <Mail className="h-4 w-4 flex-shrink-0" />
                      <span className="truncate">{site.email}</span>
                    </a>
                  </li>
                )}
                {site.serviceArea && (
                  <li className="flex items-center gap-2 text-background/70 text-sm sm:text-base">
                    <MapPin className="h-4 w-4 flex-shrink-0" />
                    <span className="truncate">{site.serviceArea}</span>
                  </li>
                )}
              </ul>
            </div>
          )}
        </div>

        <div className="border-t border-background/20 pt-6 sm:pt-8">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-2 sm:gap-4">
            <p className="text-background/60 text-xs sm:text-sm text-center sm:text-left">
              &copy; {currentYear} {site.businessName}. All rights reserved.
            </p>
            <p className="text-background/40 text-xs sm:text-sm">
              Powered by LocalBlue
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}

function MobileCTABar({ site }: { site: Site }) {
  if (!site.phone) return null;
  
  return (
    <div 
      className="fixed bottom-0 left-0 right-0 z-50 sm:hidden bg-background/95 backdrop-blur-md border-t shadow-lg safe-area-inset-bottom"
      data-testid="mobile-cta-bar"
    >
      <div className="flex items-center gap-2 p-3">
        <a 
          href={`tel:${site.phone}`}
          className="flex-1"
        >
          <Button 
            className="w-full min-h-[48px] text-base font-semibold gap-2"
            style={{ backgroundColor: site.brandColor }}
            data-testid="button-mobile-call"
          >
            <Phone className="h-5 w-5" />
            Call Now
          </Button>
        </a>
        <Button 
          variant="outline"
          className="min-h-[48px] min-w-[48px] px-4"
          onClick={() => document.getElementById("contact")?.scrollIntoView({ behavior: "smooth" })}
          data-testid="button-mobile-quote"
        >
          <Mail className="h-5 w-5" />
        </Button>
      </div>
    </div>
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
  const { getSitePath } = usePreview();
  const [isScrolled, setIsScrolled] = useState(false);

  const tradeLabel = site.tradeType && TRADE_TEMPLATES[site.tradeType] 
    ? TRADE_TEMPLATES[site.tradeType].name 
    : "Contractor";
  
  const seoTitle = `${site.businessName} | ${tradeLabel} in ${site.serviceArea || "Your Area"}`;
  const seoDescription = site.businessDescription 
    || site.tagline 
    || `${site.businessName} offers professional ${tradeLabel.toLowerCase()} services${site.serviceArea ? ` in ${site.serviceArea}` : ""}. Contact us today for a free estimate.`;

  useSEO({
    title: seoTitle,
    description: seoDescription.slice(0, 160),
    ogTitle: site.businessName,
    ogDescription: seoDescription.slice(0, 200),
    ogType: "business.business",
    businessName: site.businessName,
    phone: site.phone || undefined,
    email: site.email || undefined,
    address: site.address || undefined,
    serviceArea: site.serviceArea || undefined,
    priceRange: "$$",
    tradeType: site.tradeType || undefined,
  });

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    if (isPreview) return;
    const sessionId = (() => {
      let sid = sessionStorage.getItem("lb_sid");
      if (!sid) {
        sid = Math.random().toString(36).slice(2) + Date.now().toString(36);
        sessionStorage.setItem("lb_sid", sid);
      }
      return sid;
    })();
    const deviceType = window.innerWidth < 768 ? "mobile" : window.innerWidth < 1024 ? "tablet" : "desktop";
    const start = Date.now();
    const trackView = () => {
      const duration = Math.round((Date.now() - start) / 1000);
      fetch(getSitePath("/api/site/analytics"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId,
          page: window.location.pathname,
          referrer: document.referrer || null,
          deviceType,
          duration: duration > 0 ? duration : 1,
        }),
        keepalive: true,
      }).catch(() => {});
    };
    window.addEventListener("beforeunload", trackView);
    const timer = setTimeout(trackView, 30000);
    return () => {
      window.removeEventListener("beforeunload", trackView);
      clearTimeout(timer);
    };
  }, [isPreview]);

  const { data: homePage } = useQuery<Page>({
    queryKey: [getSitePath("/api/site/pages"), "home"],
    queryFn: async () => {
      const res = await fetch(getSitePath("/api/site/pages/home"));
      if (!res.ok) return null;
      return res.json();
    },
  });

  const { data: aboutPage } = useQuery<Page>({
    queryKey: [getSitePath("/api/site/pages"), "about"],
    queryFn: async () => {
      const res = await fetch(getSitePath("/api/site/pages/about"));
      if (!res.ok) return null;
      return res.json();
    },
  });

  const { data: servicesPage } = useQuery<Page>({
    queryKey: [getSitePath("/api/site/pages"), "services"],
    queryFn: async () => {
      const res = await fetch(getSitePath("/api/site/pages/services"));
      if (!res.ok) return null;
      return res.json();
    },
  });

  if (!site.isPublished && !isPreview) {
    return <ComingSoon site={site} />;
  }

  const sectionComponents: Record<string, JSX.Element> = {
    hero: <HeroSection key="hero" site={site} homePage={homePage || undefined} />,
    trustBadges: <TrustBadgesBar key="trustBadges" site={site} />,
    services: <ServicesSection key="services" site={site} servicesPage={servicesPage || undefined} />,
    about: <AboutSection key="about" site={site} aboutPage={aboutPage || undefined} />,
    gallery: <GallerySection key="gallery" site={site} />,
    testimonials: <TestimonialsSection key="testimonials" site={site} />,
    serviceArea: <ServiceAreaSection key="serviceArea" site={site} />,
    contact: <ContactSection key="contact" site={site} />,
  };

  const getSectionOrder = (): string[] => {
    switch (site.stylePreference) {
      case 'bold':
        return ['hero', 'services', 'trustBadges', 'gallery', 'about', 'testimonials', 'serviceArea', 'contact'];
      case 'warm':
        return ['hero', 'about', 'trustBadges', 'services', 'testimonials', 'gallery', 'serviceArea', 'contact'];
      case 'luxury':
        return ['hero', 'trustBadges', 'about', 'gallery', 'services', 'testimonials', 'serviceArea', 'contact'];
      case 'professional':
      default:
        return ['hero', 'trustBadges', 'services', 'about', 'testimonials', 'gallery', 'serviceArea', 'contact'];
    }
  };

  const orderedSections = getSectionOrder();

  return (
    <div className="min-h-screen bg-background overflow-x-hidden">
      <StickyHeader site={site} isScrolled={isScrolled} />
      {orderedSections.map((sectionKey) => sectionComponents[sectionKey])}
      <Footer site={site} />
      <MobileCTABar site={site} />
      {site.enableChatbot && <ChatBot site={site} isVisible={true} />}
    </div>
  );
}
