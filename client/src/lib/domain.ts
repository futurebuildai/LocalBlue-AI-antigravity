/**
 * Returns the base domain from environment or default.
 * Reads from server-injected runtime config first (window.__APP_CONFIG__),
 * then Vite build-time env, then falls back to localblue.co.
 */
export function getBaseDomain(): string {
  return (window as any).__APP_CONFIG__?.baseDomain
    || import.meta.env.VITE_MAIN_DOMAIN
    || "localblue.co";
}

/** Returns the full tenant site URL for a given subdomain */
export function getTenantUrl(subdomain: string): string {
  return `https://${subdomain}.${getBaseDomain()}`;
}

/** Returns the full tenant admin URL for a given subdomain */
export function getTenantAdminUrl(subdomain: string): string {
  return `https://admin.${subdomain}.${getBaseDomain()}`;
}
