import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation } from "@tanstack/react-query";
import { Calculator, DollarSign, Loader2, Phone, CheckCircle } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

const PROJECT_SIZES = [
  { value: "small", label: "Small Project", multiplier: 1 },
  { value: "medium", label: "Medium Project", multiplier: 2 },
  { value: "large", label: "Large Project", multiplier: 3.5 },
] as const;

const URGENCY_LEVELS = [
  { value: "regular", label: "Regular (1-2 weeks)", multiplier: 1 },
  { value: "soon", label: "Soon (3-5 days)", multiplier: 1.25 },
  { value: "emergency", label: "Emergency (24-48 hrs)", multiplier: 1.75 },
] as const;

const BASE_PRICE = 150;
const PRICE_VARIANCE = 0.25;

const quoteFormSchema = z.object({
  serviceType: z.string().min(1, "Please select a service"),
  projectSize: z.enum(["small", "medium", "large"], { required_error: "Please select project size" }),
  urgency: z.enum(["regular", "soon", "emergency"], { required_error: "Please select urgency" }),
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Please enter a valid email"),
  phone: z.string().optional(),
});

type QuoteFormData = z.infer<typeof quoteFormSchema>;

interface QuoteCalculatorProps {
  siteId: string;
  services: string[];
  phone?: string;
}

export function QuoteCalculator({ siteId, services, phone }: QuoteCalculatorProps) {
  const { toast } = useToast();
  const [priceRange, setPriceRange] = useState<{ low: number; high: number } | null>(null);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const form = useForm<QuoteFormData>({
    resolver: zodResolver(quoteFormSchema),
    defaultValues: {
      serviceType: "",
      projectSize: undefined,
      urgency: undefined,
      name: "",
      email: "",
      phone: "",
    },
  });

  const calculateEstimate = (serviceType: string, projectSize: string, urgency: string) => {
    const sizeMultiplier = PROJECT_SIZES.find(s => s.value === projectSize)?.multiplier || 1;
    const urgencyMultiplier = URGENCY_LEVELS.find(u => u.value === urgency)?.multiplier || 1;
    
    const serviceIndex = services.indexOf(serviceType);
    const serviceMultiplier = 1 + (serviceIndex * 0.1);
    
    const baseEstimate = BASE_PRICE * sizeMultiplier * urgencyMultiplier * serviceMultiplier;
    const low = Math.round(baseEstimate * (1 - PRICE_VARIANCE));
    const high = Math.round(baseEstimate * (1 + PRICE_VARIANCE));
    
    return { low, high };
  };

  const submitMutation = useMutation({
    mutationFn: async (data: QuoteFormData) => {
      const message = `Quote Request:\nService: ${data.serviceType}\nProject Size: ${data.projectSize}\nUrgency: ${data.urgency}\nEstimated Range: $${priceRange?.low} - $${priceRange?.high}`;
      
      const response = await apiRequest("POST", "/api/site/leads", {
        siteId,
        name: data.name,
        email: data.email,
        phone: data.phone || null,
        message,
      });
      return response.json();
    },
    onSuccess: () => {
      setIsSubmitted(true);
      toast({
        title: "Quote Request Submitted",
        description: "We'll get back to you with a detailed quote soon!",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to submit quote request",
        variant: "destructive",
      });
    },
  });

  const watchedFields = form.watch(["serviceType", "projectSize", "urgency"]);
  
  const updateEstimate = () => {
    const [serviceType, projectSize, urgency] = watchedFields;
    if (serviceType && projectSize && urgency) {
      const estimate = calculateEstimate(serviceType, projectSize, urgency);
      setPriceRange(estimate);
    }
  };

  if (isSubmitted) {
    return (
      <Card data-testid="quote-calculator-success">
        <CardContent className="pt-6">
          <div className="text-center space-y-4">
            <CheckCircle className="h-12 w-12 text-green-500 mx-auto" />
            <div>
              <h3 className="text-lg font-semibold">Quote Request Received!</h3>
              <p className="text-muted-foreground mt-2">
                We've received your quote request and will contact you shortly with a detailed estimate.
              </p>
            </div>
            {phone && (
              <div className="pt-4">
                <p className="text-sm text-muted-foreground">Need immediate assistance?</p>
                <a 
                  href={`tel:${phone}`} 
                  className="inline-flex items-center gap-2 text-primary font-medium"
                  data-testid="link-call-phone"
                >
                  <Phone className="h-4 w-4" />
                  Call {phone}
                </a>
              </div>
            )}
            <Button 
              variant="outline" 
              onClick={() => {
                setIsSubmitted(false);
                setPriceRange(null);
                form.reset();
              }}
              data-testid="button-new-quote"
            >
              Get Another Quote
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card data-testid="quote-calculator">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calculator className="h-5 w-5" />
          Get an Instant Quote
        </CardTitle>
        <CardDescription>
          Get an estimated price range for your project in seconds
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form 
            onSubmit={form.handleSubmit((data) => submitMutation.mutate(data))} 
            className="space-y-4"
          >
            <FormField
              control={form.control}
              name="serviceType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Service Type</FormLabel>
                  <Select 
                    onValueChange={(value) => {
                      field.onChange(value);
                      updateEstimate();
                    }} 
                    value={field.value}
                  >
                    <FormControl>
                      <SelectTrigger data-testid="select-service-type">
                        <SelectValue placeholder="Select a service" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {services.map((service) => (
                        <SelectItem key={service} value={service}>
                          {service}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="projectSize"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Project Size</FormLabel>
                  <Select 
                    onValueChange={(value) => {
                      field.onChange(value);
                      updateEstimate();
                    }} 
                    value={field.value}
                  >
                    <FormControl>
                      <SelectTrigger data-testid="select-project-size">
                        <SelectValue placeholder="Select project size" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {PROJECT_SIZES.map((size) => (
                        <SelectItem key={size.value} value={size.value}>
                          {size.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="urgency"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Urgency</FormLabel>
                  <Select 
                    onValueChange={(value) => {
                      field.onChange(value);
                      updateEstimate();
                    }} 
                    value={field.value}
                  >
                    <FormControl>
                      <SelectTrigger data-testid="select-urgency">
                        <SelectValue placeholder="How soon do you need it?" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {URGENCY_LEVELS.map((level) => (
                        <SelectItem key={level.value} value={level.value}>
                          {level.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {priceRange && (
              <div 
                className="bg-secondary/50 rounded-lg p-4 text-center"
                data-testid="quote-estimate-display"
              >
                <p className="text-sm text-muted-foreground mb-1">Estimated Price Range</p>
                <div className="flex items-center justify-center gap-2">
                  <DollarSign className="h-5 w-5 text-primary" />
                  <span className="text-2xl font-bold text-primary">
                    ${priceRange.low.toLocaleString()} - ${priceRange.high.toLocaleString()}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  Final price may vary based on specific requirements
                </p>
              </div>
            )}

            <div className="border-t pt-4 space-y-4">
              <p className="text-sm font-medium">Your Contact Information</p>
              
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
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
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
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Phone (optional)</FormLabel>
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

            <Button 
              type="submit" 
              className="w-full" 
              disabled={submitMutation.isPending || !priceRange}
              data-testid="button-request-quote"
            >
              {submitMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Submitting...
                </>
              ) : (
                "Request Detailed Quote"
              )}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
