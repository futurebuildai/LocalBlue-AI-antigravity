import { Request, Response, NextFunction } from "express";
import { storage } from "../storage";
import { Site } from "@shared/schema";

declare global {
  namespace Express {
    interface Request {
      site?: Site;
      tenantId?: string;
    }
  }
}

export async function tenantMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const hostname = req.hostname;
    
    // Skip tenant detection for admin routes or API routes without tenant context
    if (req.path.startsWith("/api/admin")) {
      return next();
    }

    let site: Site | undefined;

    // First, try to match by custom domain (full hostname)
    site = await storage.getSiteByCustomDomain(hostname);

    if (!site) {
      // Extract subdomain from hostname
      // For hostnames like "mysite.example.com", the subdomain is "mysite"
      // For local development, handle "mysite.localhost" pattern
      const parts = hostname.split(".");
      
      if (parts.length >= 2) {
        const subdomain = parts[0];
        
        // Skip common non-subdomain prefixes
        if (subdomain !== "www" && subdomain !== "api") {
          site = await storage.getSiteBySubdomain(subdomain);
        }
      }
    }

    if (site) {
      req.site = site;
      req.tenantId = site.id;
    }

    next();
  } catch (error) {
    console.error("Tenant middleware error:", error);
    next(error);
  }
}

export function requireTenant(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  if (!req.site) {
    res.status(404).json({ 
      error: "Site not found",
      message: "No site is configured for this domain" 
    });
    return;
  }
  
  if (!req.site.isPublished) {
    res.status(403).json({ 
      error: "Site not published",
      message: "This site is not yet published" 
    });
    return;
  }
  
  next();
}
