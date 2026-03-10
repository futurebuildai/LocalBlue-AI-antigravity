import session from "express-session";
import connectPg from "connect-pg-simple";
import type { Express } from "express";

export function getSession() {
    const sessionTtl = 7 * 24 * 60 * 60 * 1000; // 1 week
    const pgStore = connectPg(session);
    const sessionStore = new pgStore({
        conString: process.env.DATABASE_URL,
        createTableIfMissing: false,
        ttl: sessionTtl,
        tableName: "sessions",
    });
    return session({
        secret: process.env.SESSION_SECRET || "localblue_default_secret_key_123",
        store: sessionStore,
        resave: false,
        saveUninitialized: false,
        cookie: {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            maxAge: sessionTtl,
        },
    });
}

export async function setupAuth(app: Express) {
    app.set("trust proxy", 1);
    app.use(getSession());
}

export function registerAuthRoutes(app: Express) {
    app.post("/api/admin/login", (req, res) => {
        const { email, password } = req.body;
        const adminEmails = (process.env.PLATFORM_ADMIN_EMAILS || "").split(",").map(e => e.trim().toLowerCase());
        const adminPassword = process.env.PLATFORM_ADMIN_PASSWORD;

        if (!adminPassword) {
            return res.status(500).json({ error: "PLATFORM_ADMIN_PASSWORD environment variable not set." });
        }

        if (adminEmails.includes(email.toLowerCase()) && password === adminPassword) {
            req.session.platformAdmin = { email: email.toLowerCase(), id: 'admin' };
            return res.json({ message: "Logged in successfully", user: req.session.platformAdmin });
        }
        return res.status(401).json({ error: "Invalid credentials" });
    });

    app.post("/api/admin/logout", (req, res) => {
        req.session.destroy(() => {
            res.json({ message: "Logged out" });
        });
    });

    app.get("/api/admin/me", (req, res) => {
        if (req.session.platformAdmin) {
            return res.json({ user: req.session.platformAdmin });
        }
        return res.status(401).json({ error: "Unauthorized" });
    });
}
