import { Request, Response, NextFunction } from "express";
import { storage } from "../storage";
import { Site } from "@shared/schema";

declare global {
  namespace Express {
    interface Request {
      site?: Site;
      tenantId?: string;
      isTenantAdmin?: boolean;
      platformAdmin?: {
        email: string;
        id: string;
      };
    }
  }
}

// Get allowed platform admin emails from environment
function getPlatformAdminEmails(): string[] {
  const emails = process.env.PLATFORM_ADMIN_EMAILS || "";
  return emails.split(",").map(e => e.trim().toLowerCase()).filter(Boolean);
}

declare module "express-session" {
  interface SessionData {
    userId?: string;
    siteId?: string;
    isImpersonating?: boolean;
    impersonatedBy?: string;
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
    let isTenantAdmin = false;

    // Check if this is an admin subdomain for a custom domain (admin.customdomain.com)
    if (hostname.startsWith("admin.")) {
      const customDomainPart = hostname.slice(6); // Remove "admin." prefix
      site = await storage.getSiteByCustomDomain(customDomainPart);
      if (site) {
        isTenantAdmin = true;
      }
    }

    // If not found via admin.customdomain, try to match by exact custom domain
    if (!site) {
      site = await storage.getSiteByCustomDomain(hostname);
    }

    if (!site) {
      // Extract subdomain from hostname
      // For hostnames like "mysite.example.com", the subdomain is "mysite"
      // For local development, handle "mysite.localhost" pattern
      const parts = hostname.split(".");
      
      if (parts.length >= 2) {
        let subdomain = parts[0];
        
        // Check if this is an admin subdomain (admin.acme.localhost, admin.acme.repl.co)
        if (subdomain === "admin" && parts.length >= 3) {
          // Strip "admin." and use the next part as the tenant subdomain
          subdomain = parts[1];
          isTenantAdmin = true;
        }
        
        // Skip common non-subdomain prefixes
        if (subdomain !== "www" && subdomain !== "api") {
          site = await storage.getSiteBySubdomain(subdomain);
        }
      }
    }

    if (site) {
      req.site = site;
      req.tenantId = site.id;
      req.isTenantAdmin = isTenantAdmin;
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

export function requireTenantAdmin(
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

  if (!req.isTenantAdmin) {
    res.status(403).json({ 
      error: "Forbidden",
      message: "This endpoint requires tenant admin access" 
    });
    return;
  }
  
  next();
}

export function requireTenantAuth(
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

  if (!req.session.userId || !req.session.siteId) {
    res.status(401).json({ 
      error: "Unauthorized",
      message: "Authentication required" 
    });
    return;
  }

  // Verify the session is for the current site
  if (req.session.siteId !== req.site.id) {
    res.status(403).json({ 
      error: "Forbidden",
      message: "Session is not valid for this site" 
    });
    return;
  }
  
  next();
}

/**
 * Middleware to require platform admin access (for LocalBlue company admin)
 * Checks if user is authenticated via Replit Auth and their email is in allowed list
 */
export function requirePlatformAdmin(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const user = req.user as any;
  
  // Check if authenticated via Replit Auth
  if (!req.isAuthenticated() || !user?.claims) {
    res.status(401).json({ 
      error: "Unauthorized",
      message: "Platform admin authentication required. Please log in." 
    });
    return;
  }
  
  const userEmail = (user.claims.email || "").toLowerCase();
  const allowedEmails = getPlatformAdminEmails();
  
  // If no admin emails configured, allow any authenticated Replit user (for dev convenience)
  // In production, PLATFORM_ADMIN_EMAILS should always be set
  if (allowedEmails.length === 0) {
    console.warn("PLATFORM_ADMIN_EMAILS not configured - allowing any authenticated user");
    req.platformAdmin = { email: userEmail, id: user.claims.sub };
    return next();
  }
  
  // Check if user's email is in allowed list
  if (!allowedEmails.includes(userEmail)) {
    res.status(403).json({ 
      error: "Forbidden",
      message: "You do not have platform admin access" 
    });
    return;
  }
  
  req.platformAdmin = { email: userEmail, id: user.claims.sub };
  next();
}
