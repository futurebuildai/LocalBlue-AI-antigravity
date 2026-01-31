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
  "AI-powered website in minutes",
  "Custom domain management",
  "Built-in lead capture",
  "24/7 AI chatbot support",
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
        <header className="p-4">
          <Link href="/">
            <Button variant="ghost" size="sm" data-testid="link-back-landing">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Home
            </Button>
          </Link>
        </header>

        <main className="flex-1 flex items-center justify-center p-6">
          <div className="w-full max-w-md">
            <div className="text-center mb-8">
              <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl gradient-primary shadow-lg shadow-primary/25 mb-6">
                <Sparkles className="h-7 w-7 text-white" />
              </div>
              <h1 className="text-3xl font-bold mb-2" data-testid="text-signup-title">
                Create Your Account
              </h1>
              <p className="text-muted-foreground">
                Start building your professional contractor website
              </p>
            </div>
            
            <Card className="border-0 shadow-xl">
              <CardContent className="p-6">
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
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
                      className="w-full gradient-primary shadow-lg shadow-primary/25" 
                      disabled={signUpMutation.isPending}
                      data-testid="button-signup-submit"
                    >
                      {signUpMutation.isPending ? (
                        "Creating your account..."
                      ) : (
                        <>
                          Create Account
                          <ArrowRight className="ml-2 h-4 w-4" />
                        </>
                      )}
                    </Button>
                  </form>
                </Form>
                
                <div className="mt-6 flex items-center justify-center gap-2 text-sm text-muted-foreground">
                  <Shield className="h-4 w-4" />
                  <span>No credit card required</span>
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

        <div className="relative z-10 flex flex-col justify-center px-12 xl:px-20">
          <div className="max-w-md">
            <h2 className="text-3xl xl:text-4xl font-bold text-white mb-6">
              Get your professional website in minutes
            </h2>
            <p className="text-white/70 text-lg mb-10">
              Join hundreds of contractors who trust LocalBlue.ai to power their online presence.
            </p>
            
            <div className="space-y-4">
              {benefits.map((benefit, index) => (
                <div key={index} className="flex items-center gap-3">
                  <div className="flex-shrink-0 w-6 h-6 rounded-full bg-emerald-500/20 flex items-center justify-center">
                    <CheckCircle className="h-4 w-4 text-emerald-400" />
                  </div>
                  <span className="text-white/90">{benefit}</span>
                </div>
              ))}
            </div>

            <div className="mt-12 pt-8 border-t border-white/10">
              <div className="flex items-center gap-4">
                <div className="flex -space-x-2">
                  {['M', 'S', 'D'].map((initial, i) => (
                    <div 
                      key={i} 
                      className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-violet-500 flex items-center justify-center text-white font-medium text-sm border-2 border-slate-900"
                    >
                      {initial}
                    </div>
                  ))}
                </div>
                <div className="text-white/80 text-sm">
                  <span className="font-semibold text-white">500+</span> contractors already trust us
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
