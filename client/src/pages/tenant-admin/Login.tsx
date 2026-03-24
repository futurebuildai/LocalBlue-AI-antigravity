import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { ArrowRight, Shield } from "lucide-react";

const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

type LoginFormValues = z.infer<typeof loginSchema>;

interface LoginProps {
  onLoginSuccess: () => void;
}

export default function Login({ onLoginSuccess }: LoginProps) {
  const { toast } = useToast();

  const { data: siteInfo } = useQuery<{ businessName: string; brandColor: string }>({
    queryKey: ["/api/tenant/site-info"],
    retry: false,
    staleTime: Infinity,
  });

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const loginMutation = useMutation({
    mutationFn: async (data: LoginFormValues) => {
      return apiRequest("POST", "/api/tenant/auth/login", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tenant/auth/me"] });
      toast({ title: "Login successful" });
      onLoginSuccess();
    },
    onError: (error: Error) => {
      toast({ title: "Login failed", description: error.message, variant: "destructive" });
    },
  });

  const handleSubmit = (values: LoginFormValues) => {
    loginMutation.mutate(values);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-[hsl(0,0%,5%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(16,185,129,0.12),transparent_50%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_right,rgba(16,185,129,0.08),transparent_50%)]" />

      {/* Floating elements - hidden on mobile for performance */}
      <div className="hidden sm:block absolute top-1/4 left-10 w-72 h-72 bg-emerald-500/8 rounded-full blur-3xl animate-pulse-slow" />
      <div className="hidden sm:block absolute bottom-1/4 right-10 w-96 h-96 bg-emerald-500/5 rounded-full blur-3xl animate-pulse-slow" style={{ animationDelay: '2s' }} />
      
      {/* Grid pattern */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:72px_72px]" />

      <div className="relative z-10 w-full max-w-md px-1">
        <div className="text-center mb-6 sm:mb-8">
          <div
            className={`inline-flex h-14 w-14 sm:h-16 sm:w-16 items-center justify-center rounded-2xl shadow-xl shadow-primary/30 mb-4 sm:mb-6 ${!siteInfo?.brandColor ? "gradient-primary" : ""}`}
            style={siteInfo?.brandColor ? { backgroundColor: siteInfo.brandColor } : undefined}
          >
            {siteInfo ? (
              <span className="text-2xl sm:text-3xl font-bold text-white">{siteInfo.businessName.charAt(0)}</span>
            ) : (
              <Shield className="h-7 w-7 sm:h-8 sm:w-8 text-white" />
            )}
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2" data-testid="text-login-title">
            {siteInfo?.businessName || "Admin Portal"}
          </h1>
          <p className="text-sm sm:text-base text-white/70">
            Sign in to manage your {siteInfo ? "website" : "business website"}
          </p>
        </div>

        <Card className="border-0 shadow-2xl backdrop-blur-sm bg-card/95">
          <CardContent className="p-5 sm:p-8">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4 sm:space-y-5">
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
                          className="min-h-[44px]"
                          {...field} 
                          data-testid="input-login-email" 
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
                          className="min-h-[44px]"
                          {...field} 
                          data-testid="input-login-password" 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button 
                  type="submit" 
                  className="w-full min-h-[48px] gradient-primary shadow-lg shadow-primary/25" 
                  disabled={loginMutation.isPending}
                  data-testid="button-login-submit"
                >
                  {loginMutation.isPending ? (
                    "Signing in..."
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

        <p className="text-center text-white/50 text-xs sm:text-sm mt-5 sm:mt-6">
          Powered by LocalBlue
        </p>
      </div>
    </div>
  );
}
