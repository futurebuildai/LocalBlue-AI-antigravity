import { clerkMiddleware, getAuth, requireAuth } from "@clerk/express";
import type { Request, Response, NextFunction } from "express";

export { clerkMiddleware, getAuth, requireAuth };

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
