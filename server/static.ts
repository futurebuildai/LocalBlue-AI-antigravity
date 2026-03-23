import express, { type Express } from "express";
import fs from "fs";
import path from "path";

export function serveStatic(app: Express) {
  const distPath = path.resolve(__dirname, "public");
  if (!fs.existsSync(distPath)) {
    throw new Error(
      `Could not find the build directory: ${distPath}, make sure to build the client first`,
    );
  }

  // Inject runtime config into index.html so domain detection works
  // regardless of build-time env vars (important for Railway/Nixpacks builds)
  const indexPath = path.resolve(distPath, "index.html");
  const baseDomain = process.env.BASE_DOMAIN || "localblue.co";
  const rawHtml = fs.readFileSync(indexPath, "utf-8");
  const configScript = `<script>window.__APP_CONFIG__={baseDomain:"${baseDomain}"}</script>`;
  const indexHtml = rawHtml.replace("<head>", `<head>${configScript}`);

  // Serve static assets (JS, CSS, images) but skip index.html
  app.use(express.static(distPath, { index: false }));

  // All HTML requests get the config-injected index.html (SPA routing)
  app.use("/{*path}", (_req, res) => {
    res.type("html").send(indexHtml);
  });
}
