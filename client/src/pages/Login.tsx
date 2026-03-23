import { useEffect } from "react";
import { useLocation } from "wouter";
import { ArrowRight, LogIn } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { getBaseDomain } from "@/lib/domain";

export default function Login() {
  const [, setLocation] = useLocation();

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-b from-background to-muted/30">
      <Card className="max-w-md w-full shadow-lg">
        <CardContent className="p-8 text-center">
          <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-6">
            <LogIn className="h-8 w-8 text-primary" />
          </div>
          <h1 className="text-2xl font-bold mb-3">Welcome Back</h1>
          <p className="text-muted-foreground mb-6">
            To manage your contractor website, sign in through your admin portal at{" "}
            <strong>admin.yoursite.{getBaseDomain()}</strong>
          </p>
          <div className="space-y-3">
            <Button
              onClick={() => setLocation("/signup")}
              className="w-full"
              size="lg"
            >
              Create a New Account
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
            <p className="text-xs text-muted-foreground">
              Already have a site? Go to <strong>admin.&lt;your-subdomain&gt;.{getBaseDomain()}</strong> to sign in.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
