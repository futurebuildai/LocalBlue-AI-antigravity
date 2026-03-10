const fs = require('fs');
const content = fs.readFileSync('server/routes.ts', 'utf8');
const lines = content.split('\n');

const adminStart = lines.findIndex(l => l.includes('Admin API Routes (Platform Admin only)')) - 1;
const signupStart = lines.findIndex(l => l.includes('Public Signup Route')) - 1;

const adminLines = lines.slice(adminStart, signupStart);
const imports = `import type { Express } from "express";
import { storage } from "../storage";
import { requirePlatformAdmin } from "../middleware/tenantMiddleware";
import { insertSiteSchema, insertTenantUserSchema } from "@shared/schema";
import bcrypt from "bcrypt";
import { z } from "zod";

const SALT_ROUNDS = 10;

export function registerAdminRoutes(app: Express) {
`;

fs.writeFileSync('server/routes/admin.ts', imports + adminLines.join('\n') + '\n}\n');

lines.splice(adminStart, signupStart - adminStart, '  registerAdminRoutes(app);');
const topImports = lines.findIndex(l => l.includes('import { setupAuth'));
lines.splice(topImports, 0, 'import { registerAdminRoutes } from "./routes/admin";');

fs.writeFileSync('server/routes.ts', lines.join('\n'));
