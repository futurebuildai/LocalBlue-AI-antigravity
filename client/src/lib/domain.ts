/**
 * Returns the base domain from environment or default.
 * Production: localblue.co
 * Staging: staging.localblue.co
 */
export function getBaseDomain(): string {
  return import.meta.env.VITE_MAIN_DOMAIN || "localblue.co";
}

/** Returns the full tenant site URL for a given subdomain */
export function getTenantUrl(subdomain: string): string {
  return `https://${subdomain}.${getBaseDomain()}`;
}

/** Returns the full tenant admin URL for a given subdomain */
export function getTenantAdminUrl(subdomain: string): string {
  return `https://admin.${subdomain}.${getBaseDomain()}`;
}
