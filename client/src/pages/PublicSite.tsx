import { useState } from "react";
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
import { Phone, Mail, MapPin, CheckCircle, Wrench, Shield, Clock } from "lucide-react";
import type { Site, Page } from "@shared/schema";

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

function HeroSection({ site, homePage }: { site: Site; homePage?: Page }) {
  const tagline = homePage?.content?.heroTagline || 
    `Professional ${(site.services || []).slice(0, 2).join(" & ")} Services`;
  const description = homePage?.content?.heroDescription || 
    "Quality services for your home and business. Licensed, insured, and ready to help.";

  return (
    <section 
      className="relative py-20 px-4 md:py-32"
      style={{ backgroundColor: site.brandColor }}
      data-testid="section-hero"
    >
      <div className="absolute inset-0 bg-black/40" />
      <div className="relative z-10 max-w-4xl mx-auto text-center text-white">
        <h1 className="text-4xl md:text-6xl font-bold mb-4" data-testid="text-business-name">
          {site.businessName}
        </h1>
        <p className="text-xl md:text-2xl mb-6 opacity-90" data-testid="text-tagline">
          {tagline}
        </p>
        <p className="text-lg mb-8 opacity-80 max-w-2xl mx-auto">
          {description}
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button 
            size="lg" 
            variant="secondary"
            className="text-lg px-8"
            onClick={() => document.getElementById("contact")?.scrollIntoView({ behavior: "smooth" })}
            data-testid="button-get-quote"
          >
            Get a Free Quote
          </Button>
          <Button 
            size="lg" 
            variant="outline"
            className="text-lg px-8 bg-transparent border-white text-white hover:bg-white/10"
            onClick={() => document.getElementById("services")?.scrollIntoView({ behavior: "smooth" })}
            data-testid="button-view-services"
          >
            Our Services
          </Button>
        </div>
      </div>
    </section>
  );
}

function FeaturesBar({ brandColor }: { brandColor: string }) {
  const features = [
    { icon: Shield, text: "Licensed & Insured" },
    { icon: Clock, text: "24/7 Emergency Service" },
    { icon: CheckCircle, text: "Satisfaction Guaranteed" },
  ];

  return (
    <section className="bg-background border-b py-6 px-4">
      <div className="max-w-6xl mx-auto flex flex-wrap justify-center gap-8">
        {features.map((feature, index) => (
          <div key={index} className="flex items-center gap-2 text-muted-foreground">
            <feature.icon className="h-5 w-5" style={{ color: brandColor }} />
            <span className="font-medium">{feature.text}</span>
          </div>
        ))}
      </div>
    </section>
  );
}

function ServicesSection({ site }: { site: Site }) {
  const services = site.services || [];

  if (services.length === 0) {
    return null;
  }

  return (
    <section id="services" className="py-16 px-4 bg-muted/30" data-testid="section-services">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Our Services</h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            We offer a wide range of professional services to meet all your needs.
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {services.map((service, index) => (
            <Card key={index} className="hover-elevate" data-testid={`card-service-${index}`}>
              <CardContent className="p-6">
                <div 
                  className="w-12 h-12 rounded-md flex items-center justify-center mb-4"
                  style={{ backgroundColor: `${site.brandColor}20` }}
                >
                  <Wrench className="h-6 w-6" style={{ color: site.brandColor }} />
                </div>
                <h3 className="text-xl font-semibold mb-2">{service}</h3>
                <p className="text-muted-foreground">
                  Professional {service.toLowerCase()} services with quality workmanship and competitive pricing.
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}

function AboutSection({ site, aboutPage }: { site: Site; aboutPage?: Page }) {
  const description = aboutPage?.content?.description || 
    `${site.businessName} is a trusted local contractor providing quality services to residential and commercial customers. With years of experience, we pride ourselves on delivering exceptional workmanship and outstanding customer service.`;
  const serviceArea = aboutPage?.content?.serviceArea || "";

  return (
    <section id="about" className="py-16 px-4" data-testid="section-about">
      <div className="max-w-6xl mx-auto">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          <div>
            <h2 className="text-3xl md:text-4xl font-bold mb-6">About {site.businessName}</h2>
            <p className="text-muted-foreground text-lg mb-6 leading-relaxed">
              {description}
            </p>
            {serviceArea && (
              <div className="flex items-start gap-3 text-muted-foreground">
                <MapPin className="h-5 w-5 mt-1 flex-shrink-0" style={{ color: site.brandColor }} />
                <p>Proudly serving {serviceArea}</p>
              </div>
            )}
          </div>
          <div 
            className="aspect-video rounded-md flex items-center justify-center"
            style={{ backgroundColor: `${site.brandColor}15` }}
          >
            <div className="text-center p-8">
              <div 
                className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4"
                style={{ backgroundColor: site.brandColor }}
              >
                <span className="text-3xl font-bold text-white">
                  {site.businessName.charAt(0)}
                </span>
              </div>
              <p className="text-lg font-semibold">{site.businessName}</p>
              <p className="text-muted-foreground">Your Trusted Local Contractor</p>
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

  if (submitted) {
    return (
      <section id="contact" className="py-16 px-4 bg-muted/30" data-testid="section-contact">
        <div className="max-w-2xl mx-auto text-center">
          <div 
            className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6"
            style={{ backgroundColor: `${site.brandColor}20` }}
          >
            <CheckCircle className="h-8 w-8" style={{ color: site.brandColor }} />
          </div>
          <h2 className="text-3xl font-bold mb-4">Thank You!</h2>
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
        </div>
      </section>
    );
  }

  return (
    <section id="contact" className="py-16 px-4 bg-muted/30" data-testid="section-contact">
      <div className="max-w-6xl mx-auto">
        <div className="grid md:grid-cols-2 gap-12">
          <div>
            <h2 className="text-3xl md:text-4xl font-bold mb-6">Get In Touch</h2>
            <p className="text-muted-foreground text-lg mb-8">
              Ready to get started? Fill out the form and we'll get back to you with a free quote.
            </p>
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div 
                  className="w-10 h-10 rounded-md flex items-center justify-center"
                  style={{ backgroundColor: `${site.brandColor}20` }}
                >
                  <Phone className="h-5 w-5" style={{ color: site.brandColor }} />
                </div>
                <div>
                  <p className="font-medium">Call Us</p>
                  <p className="text-muted-foreground">Available 24/7 for emergencies</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div 
                  className="w-10 h-10 rounded-md flex items-center justify-center"
                  style={{ backgroundColor: `${site.brandColor}20` }}
                >
                  <Mail className="h-5 w-5" style={{ color: site.brandColor }} />
                </div>
                <div>
                  <p className="font-medium">Email Us</p>
                  <p className="text-muted-foreground">We respond within 24 hours</p>
                </div>
              </div>
            </div>
          </div>
          <Card>
            <CardContent className="p-6">
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Name</FormLabel>
                        <FormControl>
                          <Input placeholder="Your name" {...field} data-testid="input-name" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email</FormLabel>
                        <FormControl>
                          <Input type="email" placeholder="your@email.com" {...field} data-testid="input-email" />
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
                        <FormLabel>Phone (Optional)</FormLabel>
                        <FormControl>
                          <Input type="tel" placeholder="(555) 123-4567" {...field} data-testid="input-phone" />
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
                        <FormLabel>Message</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Tell us about your project or ask a question..." 
                            className="min-h-[120px]"
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
                    className="w-full"
                    style={{ backgroundColor: site.brandColor }}
                    disabled={submitLead.isPending}
                    data-testid="button-submit-contact"
                  >
                    {submitLead.isPending ? "Sending..." : "Send Message"}
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  );
}

function Footer({ site }: { site: Site }) {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-foreground text-background py-12 px-4" data-testid="section-footer">
      <div className="max-w-6xl mx-auto">
        <div className="grid md:grid-cols-3 gap-8 mb-8">
          <div>
            <h3 className="text-xl font-bold mb-4">{site.businessName}</h3>
            <p className="opacity-70">
              Your trusted local contractor for all your home service needs.
            </p>
          </div>
          <div>
            <h4 className="font-semibold mb-4">Services</h4>
            <ul className="space-y-2 opacity-70">
              {(site.services || []).slice(0, 5).map((service, index) => (
                <li key={index}>{service}</li>
              ))}
            </ul>
          </div>
          <div>
            <h4 className="font-semibold mb-4">Quick Links</h4>
            <ul className="space-y-2 opacity-70">
              <li>
                <button 
                  onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
                  className="hover:opacity-100 transition-opacity"
                >
                  Home
                </button>
              </li>
              <li>
                <button 
                  onClick={() => document.getElementById("services")?.scrollIntoView({ behavior: "smooth" })}
                  className="hover:opacity-100 transition-opacity"
                >
                  Services
                </button>
              </li>
              <li>
                <button 
                  onClick={() => document.getElementById("about")?.scrollIntoView({ behavior: "smooth" })}
                  className="hover:opacity-100 transition-opacity"
                >
                  About
                </button>
              </li>
              <li>
                <button 
                  onClick={() => document.getElementById("contact")?.scrollIntoView({ behavior: "smooth" })}
                  className="hover:opacity-100 transition-opacity"
                >
                  Contact
                </button>
              </li>
            </ul>
          </div>
        </div>
        <div className="border-t border-background/20 pt-8 text-center opacity-70">
          <p>&copy; {currentYear} {site.businessName}. All rights reserved.</p>
          <p className="text-sm mt-2">Powered by LocalBlue.ai</p>
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
          className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6"
          style={{ backgroundColor: site.brandColor }}
        >
          <span className="text-3xl font-bold text-white">
            {site.businessName.charAt(0)}
          </span>
        </div>
        <h1 className="text-3xl font-bold mb-4" data-testid="text-coming-soon-title">
          {site.businessName}
        </h1>
        <p className="text-muted-foreground text-lg" data-testid="text-coming-soon-message">
          Our website is coming soon. Check back later!
        </p>
      </div>
    </div>
  );
}

export default function PublicSite({ site }: PublicSiteProps) {
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

  if (!site.isPublished) {
    return <ComingSoon site={site} />;
  }

  return (
    <div className="min-h-screen bg-background">
      <HeroSection site={site} homePage={homePage || undefined} />
      <FeaturesBar brandColor={site.brandColor} />
      <ServicesSection site={site} />
      <AboutSection site={site} aboutPage={aboutPage || undefined} />
      <ContactSection site={site} />
      <Footer site={site} />
    </div>
  );
}
