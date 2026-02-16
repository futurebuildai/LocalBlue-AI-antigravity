import { useMutation } from "@tanstack/react-query";
import { useLocation, Link } from "wouter";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { ArrowLeft, ArrowRight, Shield, Sparkles, CheckCircle } from "lucide-react";

const signUpSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  businessName: z.string().min(2, "Business name must be at least 2 characters"),
});

type SignUpFormValues = z.infer<typeof signUpSchema>;

const benefits = [
  "Free access during beta",
  "No credit card required",
  "AI-powered website builder",
  "Help shape the product with your feedback",
];

export default function SignUp() {
  const { toast } = useToast();
  const [, setLocation] = useLocation();

  const form = useForm<SignUpFormValues>({
    resolver: zodResolver(signUpSchema),
    defaultValues: {
      email: "",
      password: "",
      businessName: "",
    },
  });

  const signUpMutation = useMutation({
    mutationFn: async (data: SignUpFormValues) => {
      return apiRequest("POST", "/api/signup", data);
    },
    onSuccess: () => {
      toast({ title: "Account created successfully!" });
      setLocation("/onboarding");
    },
    onError: (error: Error) => {
      toast({ 
        title: "Sign up failed", 
        description: error.message, 
        variant: "destructive" 
      });
    },
  });

  const handleSubmit = (values: SignUpFormValues) => {
    signUpMutation.mutate(values);
  };

  return (
    <div className="min-h-screen flex bg-background">
      {/* Left Panel - Form */}
      <div className="flex-1 flex flex-col">
        <header className="p-3 sm:p-4">
          <Link href="/">
            <Button variant="ghost" size="sm" className="min-h-10" data-testid="link-back-landing">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Home
            </Button>
          </Link>
        </header>

        <main className="flex-1 flex items-center justify-center px-4 py-6 sm:p-6">
          <div className="w-full max-w-md">
            <div className="text-center mb-8">
              <div className="inline-flex h-12 w-12 sm:h-14 sm:w-14 items-center justify-center rounded-2xl gradient-primary shadow-lg shadow-primary/25 mb-6">
                <Sparkles className="h-6 w-6 sm:h-7 sm:w-7 text-white" />
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold mb-2" data-testid="text-signup-title">
                Join the Beta
              </h1>
              <p className="text-sm sm:text-base text-muted-foreground">
                Get free early access and help us build the best contractor website tool
              </p>
            </div>
            
            <Card className="border-0 shadow-xl">
              <CardContent className="p-4 sm:p-6">
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-3 sm:space-y-4">
                    <FormField
                      control={form.control}
                      name="businessName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Business Name</FormLabel>
                          <FormControl>
                            <Input 
                              placeholder="Acme Plumbing Co." 
                              {...field} 
                              data-testid="input-signup-business-name" 
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
                              placeholder="you@example.com"
                              {...field} 
                              data-testid="input-signup-email" 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="password"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Password</FormLabel>
                          <FormControl>
                            <Input 
                              type="password" 
                              placeholder="At least 8 characters"
                              {...field} 
                              data-testid="input-signup-password" 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <Button 
                      type="submit" 
                      className="w-full min-h-11 gradient-primary shadow-lg shadow-primary/25" 
                      disabled={signUpMutation.isPending}
                      data-testid="button-signup-submit"
                    >
                      {signUpMutation.isPending ? (
                        "Creating your account..."
                      ) : (
                        <>
                          Join the Beta
                          <ArrowRight className="ml-2 h-4 w-4" />
                        </>
                      )}
                    </Button>
                  </form>
                </Form>
                
                <div className="mt-6 flex items-center justify-center gap-2 text-xs sm:text-sm text-muted-foreground">
                  <Shield className="h-4 w-4 flex-shrink-0" />
                  <span>No credit card required to start</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>

      {/* Right Panel - Benefits */}
      <div className="hidden lg:flex flex-1 gradient-hero relative overflow-hidden">
        {/* Decorative elements */}
        <div className="absolute top-1/4 left-10 w-72 h-72 bg-blue-500/20 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-10 w-96 h-96 bg-violet-500/20 rounded-full blur-3xl" />
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:72px_72px]" />

        <div className="relative z-10 flex flex-col justify-center px-8 lg:px-12 xl:px-20">
          <div className="max-w-md">
            <h2 className="text-2xl lg:text-3xl xl:text-4xl font-bold text-white mb-6">
              Join Our Beta Program
            </h2>
            <p className="text-white/70 text-base lg:text-lg mb-10">
              Get early access to LocalBlue and help us build something great for contractors. Your feedback directly shapes what we build next.
            </p>
            
            <div className="space-y-4">
              {benefits.map((benefit, index) => (
                <div key={index} className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-6 h-6 rounded-full bg-emerald-500/20 flex items-center justify-center mt-0.5">
                    <CheckCircle className="h-4 w-4 text-emerald-400" />
                  </div>
                  <span className="text-white/90 text-sm lg:text-base">{benefit}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
