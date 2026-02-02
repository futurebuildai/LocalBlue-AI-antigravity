import { useMutation } from "@tanstack/react-query";
import { useLocation, Link } from "wouter";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { ArrowLeft, ArrowRight, Shield, Sparkles, Loader2 } from "lucide-react";

const loginSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(1, "Password is required"),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export default function Login() {
  const { toast } = useToast();
  const [, setLocation] = useLocation();

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const loginMutation = useMutation({
    mutationFn: async (data: LoginFormValues) => {
      return apiRequest("POST", "/api/login", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/auth/me"] });
      toast({ title: "Login successful!" });
      setLocation("/onboarding");
    },
    onError: (error: Error) => {
      toast({ 
        title: "Login failed", 
        description: error.message, 
        variant: "destructive" 
      });
    },
  });

  const handleSubmit = (values: LoginFormValues) => {
    loginMutation.mutate(values);
  };

  return (
    <div className="min-h-screen flex bg-background">
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
                <Shield className="h-6 w-6 sm:h-7 sm:w-7 text-white" />
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold mb-2" data-testid="text-login-title">
                Welcome Back
              </h1>
              <p className="text-sm sm:text-base text-muted-foreground">
                Sign in to continue building your website
              </p>
            </div>
            
            <Card className="border-0 shadow-xl">
              <CardContent className="p-4 sm:p-6">
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-3 sm:space-y-4">
                    <FormField
                      control={form.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email</FormLabel>
                          <FormControl>
                            <Input 
                              type="email"
                              placeholder="john@smithplumbing.com" 
                              data-testid="input-login-email"
                              {...field} 
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
                              placeholder="Enter your password" 
                              data-testid="input-login-password"
                              {...field} 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <Button 
                      type="submit" 
                      className="w-full" 
                      size="lg"
                      disabled={loginMutation.isPending}
                      data-testid="button-login-submit"
                    >
                      {loginMutation.isPending ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Signing in...
                        </>
                      ) : (
                        <>
                          Sign In
                          <ArrowRight className="ml-2 h-4 w-4" />
                        </>
                      )}
                    </Button>
                  </form>
                </Form>
              </CardContent>
            </Card>

            <p className="text-center mt-6 text-sm text-muted-foreground">
              Don't have an account?{" "}
              <Link href="/signup" className="text-primary hover:underline font-medium" data-testid="link-signup">
                Start your free trial
              </Link>
            </p>
          </div>
        </main>
      </div>

      <div className="hidden lg:flex flex-1 section-gradient-dark items-center justify-center p-8 relative overflow-hidden">
        <div className="absolute inset-0 mesh-gradient opacity-30" />
        <div className="relative z-10 max-w-md text-center">
          <div className="mb-8">
            <Sparkles className="h-16 w-16 text-blue-400 mx-auto mb-6" />
          </div>
          <h2 className="text-3xl font-bold text-white mb-4">
            Your Professional Website Awaits
          </h2>
          <p className="text-white/70 text-lg mb-8">
            Continue where you left off. Build, customize, and launch your contractor website.
          </p>
          <div className="flex items-center justify-center gap-2 text-white/60 text-sm">
            <Shield className="h-4 w-4" />
            <span>Secure login protected by industry-standard encryption</span>
          </div>
        </div>
      </div>
    </div>
  );
}
