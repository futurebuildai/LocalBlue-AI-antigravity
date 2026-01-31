import type { TradeType, StylePreference } from "./schema";

export interface TradeTemplate {
  id: TradeType;
  name: string;
  description: string;
  defaultServices: string[];
  defaultCertifications: string[];
  trustBadges: string[];
  commonFaqs: Array<{ question: string; answer: string }>;
  heroTaglines: string[];
  stockImageKeywords: string[];
  iconName: string;
}

export interface StyleTemplate {
  id: StylePreference;
  name: string;
  description: string;
  colors: {
    primary: string;
    secondary: string;
    accent: string;
    background: string;
    foreground: string;
  };
  fontFamily: {
    heading: string;
    body: string;
  };
  borderRadius: string;
  buttonStyle: "rounded" | "square" | "pill";
}

export const TRADE_TEMPLATES: Record<TradeType, TradeTemplate> = {
  general_contractor: {
    id: "general_contractor",
    name: "General Contractor",
    description: "Home remodeling, new construction, and renovation specialists",
    defaultServices: [
      "Home Remodeling",
      "Kitchen Renovation", 
      "Bathroom Renovation",
      "Room Additions",
      "Basement Finishing",
      "Deck & Patio Construction",
      "New Home Construction",
      "Commercial Build-Outs"
    ],
    defaultCertifications: [
      "Licensed General Contractor",
      "Bonded & Insured",
      "EPA Lead-Safe Certified",
      "OSHA Safety Certified"
    ],
    trustBadges: [
      "Licensed & Insured",
      "Free Estimates",
      "Satisfaction Guaranteed",
      "Local Family Owned"
    ],
    commonFaqs: [
      { question: "How long does a typical kitchen remodel take?", answer: "A typical kitchen remodel takes 6-12 weeks depending on scope. We'll provide a detailed timeline during your consultation." },
      { question: "Do you handle permits?", answer: "Yes, we handle all necessary permits and inspections as part of our full-service approach." },
      { question: "What areas do you serve?", answer: "We serve the greater metropolitan area and surrounding communities within a 50-mile radius." },
      { question: "Do you offer financing?", answer: "Yes, we partner with several financing companies to offer flexible payment options for qualified customers." }
    ],
    heroTaglines: [
      "Building Dreams, One Project at a Time",
      "Quality Craftsmanship You Can Trust",
      "Your Vision, Our Expertise",
      "Transforming Houses into Homes"
    ],
    stockImageKeywords: ["home renovation", "construction site", "home remodel", "contractor at work", "new home construction"],
    iconName: "Hammer"
  },

  plumber: {
    id: "plumber",
    name: "Plumber",
    description: "Residential and commercial plumbing services",
    defaultServices: [
      "Emergency Plumbing Repairs",
      "Drain Cleaning & Unclogging",
      "Water Heater Installation & Repair",
      "Pipe Repair & Replacement",
      "Fixture Installation",
      "Sewer Line Services",
      "Leak Detection & Repair",
      "Bathroom & Kitchen Plumbing"
    ],
    defaultCertifications: [
      "Licensed Master Plumber",
      "Bonded & Insured",
      "Backflow Prevention Certified",
      "Gas Line Certified"
    ],
    trustBadges: [
      "24/7 Emergency Service",
      "Licensed & Insured",
      "Upfront Pricing",
      "Same-Day Service"
    ],
    commonFaqs: [
      { question: "Do you offer emergency plumbing services?", answer: "Yes! We offer 24/7 emergency plumbing services. Call us anytime and we'll dispatch a technician right away." },
      { question: "How quickly can you respond to a plumbing emergency?", answer: "We typically respond within 1-2 hours for emergencies in our service area." },
      { question: "Do you provide free estimates?", answer: "Yes, we provide free estimates for most plumbing jobs. We believe in transparent, upfront pricing." },
      { question: "Are your plumbers licensed?", answer: "All our plumbers are fully licensed, insured, and undergo background checks for your peace of mind." }
    ],
    heroTaglines: [
      "Fast, Reliable Plumbing When You Need It",
      "Your Trusted Local Plumbing Experts",
      "No Job Too Big, No Leak Too Small",
      "Professional Plumbing Services 24/7"
    ],
    stockImageKeywords: ["plumber at work", "pipe repair", "water heater", "bathroom plumbing", "kitchen sink repair"],
    iconName: "Wrench"
  },

  electrician: {
    id: "electrician",
    name: "Electrician", 
    description: "Residential and commercial electrical services",
    defaultServices: [
      "Electrical Panel Upgrades",
      "Outlet & Switch Installation",
      "Lighting Installation",
      "Ceiling Fan Installation",
      "Electrical Repairs",
      "Whole-Home Surge Protection",
      "EV Charger Installation",
      "Generator Installation"
    ],
    defaultCertifications: [
      "Licensed Master Electrician",
      "Bonded & Insured",
      "NFPA Certified",
      "OSHA Safety Certified"
    ],
    trustBadges: [
      "Licensed & Insured",
      "Same-Day Service",
      "Upfront Pricing",
      "Safety First"
    ],
    commonFaqs: [
      { question: "How do I know if I need an electrical panel upgrade?", answer: "Signs include frequently tripping breakers, flickering lights, or if your home is over 25 years old. We can assess your panel during a free consultation." },
      { question: "Can you install EV chargers?", answer: "Yes! We're certified to install Level 2 EV chargers for all major electric vehicle brands." },
      { question: "Do you handle emergency electrical issues?", answer: "Absolutely. Electrical emergencies like sparking outlets or power outages require immediate attention. Call us 24/7." },
      { question: "Are your electricians licensed?", answer: "All our electricians are licensed, insured, and continuously trained on the latest electrical codes and safety standards." }
    ],
    heroTaglines: [
      "Powering Your Home Safely",
      "Expert Electrical Services You Can Trust",
      "Your Local Electrical Professionals",
      "Quality Electrical Work, Every Time"
    ],
    stockImageKeywords: ["electrician work", "electrical panel", "lighting installation", "wiring", "electrical repair"],
    iconName: "Zap"
  },

  roofer: {
    id: "roofer",
    name: "Roofer",
    description: "Residential and commercial roofing services",
    defaultServices: [
      "Roof Replacement",
      "Roof Repair",
      "Storm Damage Repair",
      "Roof Inspections",
      "Gutter Installation & Repair",
      "Shingle Replacement",
      "Metal Roofing",
      "Flat Roof Services"
    ],
    defaultCertifications: [
      "Licensed Roofing Contractor",
      "Bonded & Insured",
      "GAF Certified Installer",
      "Owens Corning Preferred"
    ],
    trustBadges: [
      "Free Roof Inspections",
      "Storm Damage Experts",
      "Manufacturer Warranties",
      "Licensed & Insured"
    ],
    commonFaqs: [
      { question: "How do I know if I need a new roof?", answer: "Signs include missing shingles, visible wear, leaks, or if your roof is over 20 years old. We offer free inspections to assess your roof's condition." },
      { question: "Do you work with insurance companies?", answer: "Yes, we have extensive experience working with insurance companies on storm damage claims and can help guide you through the process." },
      { question: "What roofing materials do you offer?", answer: "We install asphalt shingles, metal roofing, tile, slate, and flat roofing systems. We'll recommend the best option for your home and budget." },
      { question: "How long does a roof replacement take?", answer: "Most residential roof replacements are completed in 1-3 days, depending on size and complexity." }
    ],
    heroTaglines: [
      "Protecting What Matters Most",
      "Your Trusted Roofing Experts",
      "Quality Roofing That Lasts",
      "Storm Damage? We've Got You Covered"
    ],
    stockImageKeywords: ["roofing work", "roof installation", "shingle roof", "roofer at work", "new roof"],
    iconName: "Home"
  },

  hvac: {
    id: "hvac",
    name: "HVAC",
    description: "Heating, ventilation, and air conditioning services",
    defaultServices: [
      "AC Installation & Replacement",
      "Heating System Installation",
      "HVAC Repair & Maintenance",
      "Duct Cleaning & Repair",
      "Thermostat Installation",
      "Indoor Air Quality",
      "Heat Pump Services",
      "Emergency HVAC Repair"
    ],
    defaultCertifications: [
      "EPA 608 Certified",
      "NATE Certified Technicians",
      "Bonded & Insured",
      "Factory Authorized Dealer"
    ],
    trustBadges: [
      "24/7 Emergency Service",
      "Financing Available",
      "Same-Day Service",
      "Satisfaction Guaranteed"
    ],
    commonFaqs: [
      { question: "How often should I have my HVAC system serviced?", answer: "We recommend servicing your system twice a year - once before summer for AC and once before winter for heating. This keeps your system running efficiently." },
      { question: "What size AC unit do I need?", answer: "The right size depends on your home's square footage, insulation, and other factors. We perform load calculations to recommend the perfect size." },
      { question: "Do you offer financing?", answer: "Yes! We offer flexible financing options with approved credit to make your new HVAC system affordable." },
      { question: "How quickly can you respond to an AC emergency?", answer: "We offer same-day emergency service and typically arrive within 2-4 hours for urgent calls." }
    ],
    heroTaglines: [
      "Keep Your Home Comfortable Year-Round",
      "Heating & Cooling Experts",
      "Your Comfort Is Our Priority",
      "Professional HVAC Services"
    ],
    stockImageKeywords: ["hvac technician", "air conditioning", "heating system", "thermostat", "ductwork"],
    iconName: "Thermometer"
  },

  painter: {
    id: "painter",
    name: "Painter",
    description: "Interior and exterior painting services",
    defaultServices: [
      "Interior Painting",
      "Exterior Painting",
      "Cabinet Painting & Refinishing",
      "Deck & Fence Staining",
      "Wallpaper Removal",
      "Drywall Repair",
      "Color Consultation",
      "Commercial Painting"
    ],
    defaultCertifications: [
      "Licensed Painting Contractor",
      "Bonded & Insured",
      "EPA Lead-Safe Certified",
      "Benjamin Moore Certified"
    ],
    trustBadges: [
      "Free Color Consultation",
      "Premium Paints Used",
      "Clean & Professional",
      "Satisfaction Guaranteed"
    ],
    commonFaqs: [
      { question: "How long does interior painting take?", answer: "A typical room takes 1-2 days, including prep work. Whole-house interior painting usually takes 3-7 days depending on size." },
      { question: "Do you provide color consultation?", answer: "Yes! We offer free color consultations to help you choose the perfect colors for your space." },
      { question: "What type of paint do you use?", answer: "We use premium paints from trusted brands like Benjamin Moore and Sherwin-Williams for lasting results." },
      { question: "Do you move furniture?", answer: "We can move and cover furniture as part of our prep work. We take care to protect your belongings throughout the project." }
    ],
    heroTaglines: [
      "Transform Your Space with Color",
      "Professional Painting, Beautiful Results",
      "Quality Painting That Shows",
      "Bringing Color to Your Life"
    ],
    stockImageKeywords: ["house painting", "interior painting", "painter at work", "paint colors", "exterior painting"],
    iconName: "Paintbrush"
  },

  landscaper: {
    id: "landscaper",
    name: "Landscaper",
    description: "Landscape design, installation, and maintenance",
    defaultServices: [
      "Landscape Design",
      "Lawn Care & Maintenance",
      "Hardscape Installation",
      "Tree & Shrub Planting",
      "Irrigation Systems",
      "Outdoor Lighting",
      "Mulching & Bed Maintenance",
      "Seasonal Cleanup"
    ],
    defaultCertifications: [
      "Licensed Landscape Contractor",
      "Bonded & Insured",
      "Certified Irrigation Technician",
      "Pesticide Applicator License"
    ],
    trustBadges: [
      "Free Design Consultation",
      "Sustainable Practices",
      "Weekly Maintenance Plans",
      "Licensed & Insured"
    ],
    commonFaqs: [
      { question: "Do you offer ongoing maintenance?", answer: "Yes! We offer weekly, bi-weekly, and monthly maintenance plans to keep your landscape looking its best year-round." },
      { question: "Can you design a low-maintenance landscape?", answer: "Absolutely! We specialize in designing beautiful landscapes with native plants and smart irrigation that require minimal upkeep." },
      { question: "Do you install irrigation systems?", answer: "Yes, we design and install complete irrigation systems including smart controllers to keep your landscape healthy while conserving water." },
      { question: "When is the best time to start a landscaping project?", answer: "Spring and fall are ideal, but we work year-round. Contact us for a consultation and we'll recommend the best timing for your project." }
    ],
    heroTaglines: [
      "Creating Outdoor Living Spaces",
      "Your Landscape, Transformed",
      "Professional Landscaping Services",
      "Beautiful Yards, Happy Homeowners"
    ],
    stockImageKeywords: ["landscaping", "garden design", "lawn care", "outdoor patio", "landscape installation"],
    iconName: "Leaf"
  }
};

export const STYLE_TEMPLATES: Record<StylePreference, StyleTemplate> = {
  professional: {
    id: "professional",
    name: "Professional & Clean",
    description: "Modern, trustworthy appearance with clean lines",
    colors: {
      primary: "#2563EB",
      secondary: "#3B82F6",
      accent: "#1E40AF",
      background: "#FFFFFF",
      foreground: "#1F2937"
    },
    fontFamily: {
      heading: "Inter, sans-serif",
      body: "Inter, sans-serif"
    },
    borderRadius: "0.375rem",
    buttonStyle: "rounded"
  },

  bold: {
    id: "bold",
    name: "Bold & Modern",
    description: "Strong, confident presence with striking contrasts",
    colors: {
      primary: "#DC2626",
      secondary: "#F97316",
      accent: "#B91C1C",
      background: "#18181B",
      foreground: "#FAFAFA"
    },
    fontFamily: {
      heading: "Oswald, sans-serif",
      body: "Roboto, sans-serif"
    },
    borderRadius: "0",
    buttonStyle: "square"
  },

  warm: {
    id: "warm",
    name: "Warm & Friendly",
    description: "Approachable, welcoming feel for family businesses",
    colors: {
      primary: "#059669",
      secondary: "#10B981",
      accent: "#047857",
      background: "#FFFBEB",
      foreground: "#44403C"
    },
    fontFamily: {
      heading: "Merriweather, serif",
      body: "Open Sans, sans-serif"
    },
    borderRadius: "0.5rem",
    buttonStyle: "rounded"
  },

  luxury: {
    id: "luxury",
    name: "Luxury & Elegant",
    description: "Sophisticated, premium positioning for high-end services",
    colors: {
      primary: "#7C3AED",
      secondary: "#8B5CF6",
      accent: "#6D28D9",
      background: "#0F0F0F",
      foreground: "#E5E5E5"
    },
    fontFamily: {
      heading: "Playfair Display, serif",
      body: "Lato, sans-serif"
    },
    borderRadius: "0.25rem",
    buttonStyle: "pill"
  }
};

export const AVAILABLE_PAGES = [
  { id: "home", name: "Home", description: "Your main landing page with hero section and overview", required: true },
  { id: "about", name: "About Us", description: "Tell your story and introduce your team", required: false },
  { id: "services", name: "Services", description: "Detailed list of services you offer", required: true },
  { id: "gallery", name: "Project Gallery", description: "Showcase your best work with photos", required: false },
  { id: "testimonials", name: "Testimonials", description: "Customer reviews and success stories", required: false },
  { id: "faq", name: "FAQ", description: "Common questions and answers", required: false },
  { id: "service-area", name: "Service Area", description: "Map and list of areas you serve", required: false },
  { id: "contact", name: "Contact", description: "Contact form and business information", required: true },
  { id: "quote", name: "Get a Quote", description: "Online quote calculator", required: false },
  { id: "schedule", name: "Schedule Service", description: "Appointment booking form", required: false },
  { id: "financing", name: "Financing", description: "Payment options and financing info", required: false },
  { id: "blog", name: "Blog", description: "Tips, news, and helpful articles", required: false },
] as const;

export function getTradeTemplate(tradeType: TradeType): TradeTemplate {
  return TRADE_TEMPLATES[tradeType];
}

export function getStyleTemplate(stylePreference: StylePreference): StyleTemplate {
  return STYLE_TEMPLATES[stylePreference];
}

export function getDefaultPagesForTrade(tradeType: TradeType): string[] {
  const requiredPages = AVAILABLE_PAGES.filter(p => p.required).map(p => p.id);
  const recommendedPages = ["about", "gallery", "testimonials", "faq"];
  return [...new Set([...requiredPages, ...recommendedPages])];
}
