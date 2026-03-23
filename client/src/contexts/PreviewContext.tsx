import { createContext, useContext } from "react";

interface PreviewContextType {
  isPreview: boolean;
  subdomain: string | null;
  getApiPath: (tenantPath: string) => string;
  getSitePath: (sitePath: string) => string;
}

const PreviewContext = createContext<PreviewContextType>({
  isPreview: false,
  subdomain: null,
  getApiPath: (path) => path,
  getSitePath: (path) => path,
});

export function PreviewProvider({ subdomain, children }: { subdomain: string; children: React.ReactNode }) {
  const getApiPath = (tenantPath: string) => {
    if (tenantPath.startsWith("/api/tenant/")) {
      return tenantPath.replace("/api/tenant/", `/api/preview/${subdomain}/`);
    }
    return tenantPath;
  };

  const getSitePath = (sitePath: string) => {
    if (sitePath.startsWith("/api/site/")) {
      return sitePath.replace("/api/site/", `/api/preview/${subdomain}/`);
    }
    return sitePath;
  };

  return (
    <PreviewContext.Provider value={{ isPreview: true, subdomain, getApiPath, getSitePath }}>
      {children}
    </PreviewContext.Provider>
  );
}

export function OnboardingPreviewProvider({ subdomain, children }: { subdomain: string; children: React.ReactNode }) {
  const getApiPath = (tenantPath: string) => {
    if (tenantPath.startsWith("/api/tenant/")) {
      return tenantPath.replace("/api/tenant/", `/api/onboarding/preview/${subdomain}/`);
    }
    return tenantPath;
  };

  const getSitePath = (sitePath: string) => {
    if (sitePath.startsWith("/api/site/")) {
      return sitePath.replace("/api/site/", `/api/onboarding/preview/${subdomain}/`);
    }
    return sitePath;
  };

  return (
    <PreviewContext.Provider value={{ isPreview: true, subdomain, getApiPath, getSitePath }}>
      {children}
    </PreviewContext.Provider>
  );
}

export function usePreview() {
  return useContext(PreviewContext);
}

export default PreviewContext;
