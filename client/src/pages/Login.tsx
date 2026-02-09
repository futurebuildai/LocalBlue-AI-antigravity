import { useEffect } from "react";
import { Loader2 } from "lucide-react";

export default function Login() {
  useEffect(() => {
    window.location.href = "/api/login";
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center">
        <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-muted-foreground" />
        <h1 className="text-xl font-semibold mb-2" data-testid="text-login-title">
          Redirecting to login...
        </h1>
        <p className="text-sm text-muted-foreground">
          You'll be redirected momentarily.
        </p>
      </div>
    </div>
  );
}
