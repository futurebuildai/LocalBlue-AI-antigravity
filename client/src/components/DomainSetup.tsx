import { useState, useCallback } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { usePreview } from "@/contexts/PreviewContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Globe, Copy, Check, ExternalLink, Info, RefreshCw, CheckCircle2, Clock, AlertCircle } from "lucide-react";
import type { Site } from "@shared/schema";

interface DomainSetupProps {
  site: Site;
}

type DomainStatus = "pending" | "active" | "error" | null;

interface VerifyResponse {
  dnsVerified: boolean;
  dnsMessage: string;
  dnsTarget?: string;
  sslStatus: string;
  cfStatus: string;
  ownershipVerification?: { type: string; name: string; value: string };
  domainStatus: DomainStatus;
}

export default function DomainSetup({ site }: DomainSetupProps) {
  const { toast } = useToast();
  const { getApiPath } = usePreview();
  const [customDomain, setCustomDomain] = useState(site.customDomain || "");
  const [copied, setCopied] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const subdomainUrl = `${site.subdomain}.localblue.co`;

  const updateDomainMutation = useMutation({
    mutationFn: async (domain: string | null) => {
      const res = await apiRequest("PATCH", getApiPath("/api/tenant/settings/domain"), { customDomain: domain });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [getApiPath("/api/tenant/settings")] });
      queryClient.invalidateQueries({ queryKey: [getApiPath("/api/tenant/auth/me")] });
      toast({ title: "Domain updated successfully" });
    },
    onError: (error: Error) => {
      toast({ title: "Failed to update domain", description: error.message, variant: "destructive" });
    },
  });

  const verifyDomainMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", getApiPath("/api/tenant/settings/domain/verify"));
      return res.json() as Promise<VerifyResponse>;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: [getApiPath("/api/tenant/settings")] });
      if (data.dnsVerified && data.sslStatus === "active") {
        toast({ title: "Domain verified and active!" });
      } else if (data.dnsVerified) {
        toast({ title: "DNS verified", description: "SSL certificate is being provisioned..." });
      } else {
        toast({ title: "DNS not yet configured", description: data.dnsMessage, variant: "destructive" });
      }
    },
    onError: (error: Error) => {
      toast({ title: "Verification failed", description: error.message, variant: "destructive" });
    },
  });

  const handleSaveDomain = () => {
    const trimmedDomain = customDomain.trim().toLowerCase();
    updateDomainMutation.mutate(trimmedDomain || null);
  };

  const handleRemoveDomain = () => {
    setCustomDomain("");
    updateDomainMutation.mutate(null);
  };

  const copyToClipboard = useCallback((text: string, field?: string) => {
    navigator.clipboard.writeText(text);
    if (field) {
      setCopiedField(field);
      setTimeout(() => setCopiedField(null), 2000);
    } else {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
    toast({ title: "Copied to clipboard" });
  }, [toast]);

  const domainStatus = (site as any).domainStatus as DomainStatus;

  const getDomainStatusBadge = () => {
    if (!site.customDomain) return null;

    switch (domainStatus) {
      case "active":
        return (
          <Badge variant="outline" className="text-green-600 border-green-600 gap-1">
            <CheckCircle2 className="h-3 w-3" />
            Active
          </Badge>
        );
      case "pending":
        return (
          <Badge variant="outline" className="text-yellow-600 border-yellow-600 gap-1">
            <Clock className="h-3 w-3" />
            Pending Verification
          </Badge>
        );
      case "error":
        return (
          <Badge variant="outline" className="text-red-600 border-red-600 gap-1">
            <AlertCircle className="h-3 w-3" />
            Error
          </Badge>
        );
      default:
        return (
          <Badge variant="outline" className="text-green-600 border-green-600">
            Connected
          </Badge>
        );
    }
  };

  const cnameTarget = "localblue.co";

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Globe className="h-5 w-5" />
          Domain Settings
        </CardTitle>
        <CardDescription>Configure how customers access your site</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <Label className="text-sm font-medium">Your LocalBlue Subdomain</Label>
          <div className="flex items-center gap-2">
            <div className="flex-1 flex items-center gap-2 px-3 py-2 bg-muted rounded-md">
              <Globe className="h-4 w-4 text-muted-foreground" />
              <span className="font-medium" data-testid="text-subdomain-url">{subdomainUrl}</span>
              <Badge variant="secondary" className="ml-auto">Free</Badge>
            </div>
            <Button
              size="icon"
              variant="outline"
              onClick={() => copyToClipboard(`https://${subdomainUrl}`)}
              data-testid="button-copy-subdomain"
            >
              {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
            </Button>
            <Button
              size="icon"
              variant="outline"
              onClick={() => window.open(`https://${subdomainUrl}`, "_blank")}
              data-testid="button-open-subdomain"
            >
              <ExternalLink className="h-4 w-4" />
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">
            This is your default site address. It's always active and free.
          </p>
        </div>

        <div className="border-t pt-6 space-y-4">
          <div className="space-y-2">
            <Label htmlFor="custom-domain" className="text-sm font-medium">
              Custom Domain (Optional)
            </Label>
            <div className="flex gap-2">
              <Input
                id="custom-domain"
                placeholder="www.yourdomain.com"
                value={customDomain}
                onChange={(e) => setCustomDomain(e.target.value)}
                data-testid="input-custom-domain"
              />
              <Button
                onClick={handleSaveDomain}
                disabled={updateDomainMutation.isPending}
                data-testid="button-save-domain"
              >
                {updateDomainMutation.isPending ? "Saving..." : "Save"}
              </Button>
            </div>
            {site.customDomain && (
              <div className="flex items-center gap-2 flex-wrap">
                {getDomainStatusBadge()}
                <span className="text-sm text-muted-foreground">{site.customDomain}</span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleRemoveDomain}
                  className="text-destructive"
                  data-testid="button-remove-domain"
                >
                  Remove
                </Button>
              </div>
            )}
          </div>

          {(customDomain || site.customDomain) && (
            <Alert>
              <Info className="h-4 w-4" />
              <AlertTitle>DNS Setup Instructions</AlertTitle>
              <AlertDescription className="mt-2 space-y-3">
                <p>To connect your custom domain, add this DNS record at your domain registrar:</p>
                <div className="bg-muted p-3 rounded-md font-mono text-sm space-y-2">
                  <div className="flex justify-between flex-wrap gap-2">
                    <span><strong>Type:</strong> CNAME</span>
                    <span><strong>Host/Name:</strong> {(customDomain || site.customDomain)?.startsWith("www.") ? "www" : "@"}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span><strong>Points to:</strong> {cnameTarget}</span>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-6"
                      onClick={() => copyToClipboard(cnameTarget, "cname")}
                    >
                      {copiedField === "cname" ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                    </Button>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">
                  DNS changes can take up to 48 hours to propagate. Your subdomain will continue to work during this time.
                </p>
              </AlertDescription>
            </Alert>
          )}

          {site.customDomain && (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => verifyDomainMutation.mutate()}
                  disabled={verifyDomainMutation.isPending}
                  className="gap-2"
                >
                  <RefreshCw className={`h-4 w-4 ${verifyDomainMutation.isPending ? "animate-spin" : ""}`} />
                  {verifyDomainMutation.isPending ? "Checking..." : "Check DNS Status"}
                </Button>
              </div>

              {verifyDomainMutation.data && (
                <div className="bg-muted p-3 rounded-md text-sm space-y-2">
                  <div className="flex items-center gap-2">
                    {verifyDomainMutation.data.dnsVerified ? (
                      <CheckCircle2 className="h-4 w-4 text-green-600" />
                    ) : (
                      <Clock className="h-4 w-4 text-yellow-600" />
                    )}
                    <span>
                      <strong>DNS:</strong>{" "}
                      {verifyDomainMutation.data.dnsVerified ? "Verified" : "Pending"}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    {verifyDomainMutation.data.sslStatus === "active" ? (
                      <CheckCircle2 className="h-4 w-4 text-green-600" />
                    ) : (
                      <Clock className="h-4 w-4 text-yellow-600" />
                    )}
                    <span>
                      <strong>SSL:</strong>{" "}
                      {verifyDomainMutation.data.sslStatus === "active"
                        ? "Active"
                        : verifyDomainMutation.data.sslStatus === "unknown"
                        ? "Waiting for DNS"
                        : `Provisioning (${verifyDomainMutation.data.sslStatus})`}
                    </span>
                  </div>
                  {verifyDomainMutation.data.dnsTarget && (
                    <p className="text-xs text-muted-foreground">
                      Current target: {verifyDomainMutation.data.dnsTarget}
                    </p>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
