import { clerkMiddleware as clerkMiddlewareBase, getAuth, requireAuth } from "@clerk/express";
import type { Request, Response, NextFunction } from "express";

export { getAuth, requireAuth };

export function clerkMiddleware() {
  return clerkMiddlewareBase({
    publishableKey: process.env.VITE_CLERK_PUBLISHABLE_KEY,
    secretKey: process.env.CLERK_SECRET_KEY,
  });
}

export function isAuthenticated(req: Request, res: Response, next: NextFunction) {
  const auth = getAuth(req);
  
  if (!auth.userId) {
    return res.status(401).json({ message: "Unauthorized" });
  }
  
  next();
}

export function getCurrentUserId(req: Request): string | null {
  const auth = getAuth(req);
  return auth.userId;
}
