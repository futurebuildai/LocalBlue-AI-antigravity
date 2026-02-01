import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertCircle, Loader2, CheckCircle } from "lucide-react";

export default function TenantImpersonate() {
  const [, setLocation] = useLocation();
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [subdomain, setSubdomain] = useState<string>("");

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get("token");

    if (!token) {
      setStatus("error");
      setErrorMessage("No impersonation token provided");
      return;
    }

    fetch(`/api/tenant/impersonate?token=${encodeURIComponent(token)}`, {
      credentials: "include",
    })
      .then(async (response) => {
        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.error || "Impersonation failed");
        }
        return response.json();
      })
      .then((data) => {
        setStatus("success");
        setSubdomain(data.subdomain);
        setTimeout(() => {
          setLocation(`/tenant/${data.subdomain}/dashboard`);
        }, 1500);
      })
      .catch((error) => {
        setStatus("error");
        setErrorMessage(error.message || "Failed to start impersonation session");
      });
  }, [setLocation]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/30 p-4">
      <Card className="w-full max-w-md" data-testid="card-impersonate">
        <CardHeader className="text-center">
          <CardTitle className="text-xl">
            {status === "loading" && "Starting Impersonation Session..."}
            {status === "success" && "Session Created"}
            {status === "error" && "Impersonation Failed"}
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col items-center gap-4">
          {status === "loading" && (
            <>
              <Loader2 className="h-12 w-12 animate-spin text-primary" data-testid="icon-loading" />
              <p className="text-muted-foreground text-sm text-center">
                Setting up your admin session...
              </p>
            </>
          )}
          
          {status === "success" && (
            <>
              <CheckCircle className="h-12 w-12 text-green-500" data-testid="icon-success" />
              <p className="text-muted-foreground text-sm text-center">
                Redirecting to tenant admin dashboard...
              </p>
            </>
          )}
          
          {status === "error" && (
            <>
              <AlertCircle className="h-12 w-12 text-destructive" data-testid="icon-error" />
              <p className="text-destructive text-sm text-center" data-testid="text-error-message">
                {errorMessage}
              </p>
              <Button onClick={() => window.close()} variant="outline" data-testid="button-close">
                Close Window
              </Button>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
