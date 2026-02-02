interface CloudflareConfig {
  apiToken: string;
  zoneId: string;
  cnameTarget: string;
}

interface DNSRecord {
  id: string;
  type: string;
  name: string;
  content: string;
  proxied: boolean;
}

interface CloudflareResponse<T> {
  success: boolean;
  errors: Array<{ code: number; message: string }>;
  messages: string[];
  result: T;
}

const CLOUDFLARE_API_BASE = "https://api.cloudflare.com/client/v4";
const BASE_DOMAIN = "localblue.co";

function getConfig(): CloudflareConfig {
  const apiToken = process.env.CLOUDFLARE_API_TOKEN;
  const zoneId = process.env.CLOUDFLARE_ZONE_ID;
  const cnameTarget = process.env.CLOUDFLARE_CNAME_TARGET || BASE_DOMAIN;

  if (!apiToken) {
    throw new Error("CLOUDFLARE_API_TOKEN is not configured");
  }
  if (!zoneId) {
    throw new Error("CLOUDFLARE_ZONE_ID is not configured");
  }

  return { apiToken, zoneId, cnameTarget };
}

async function cloudflareRequest<T>(
  method: string,
  endpoint: string,
  body?: object
): Promise<CloudflareResponse<T>> {
  const config = getConfig();
  
  const response = await fetch(`${CLOUDFLARE_API_BASE}${endpoint}`, {
    method,
    headers: {
      "Authorization": `Bearer ${config.apiToken}`,
      "Content-Type": "application/json",
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  const data = await response.json() as CloudflareResponse<T>;
  
  if (!data.success) {
    const errorMessages = data.errors.map(e => e.message).join(", ");
    throw new Error(`Cloudflare API error: ${errorMessages}`);
  }

  return data;
}

export async function createSubdomainRecord(subdomain: string): Promise<{ success: boolean; recordId?: string; message: string }> {
  try {
    const config = getConfig();
    const fullDomain = `${subdomain}.${BASE_DOMAIN}`;
    
    const existingRecord = await findDNSRecord(fullDomain);
    if (existingRecord) {
      console.log(`DNS record already exists for ${fullDomain}`);
      return { success: true, recordId: existingRecord.id, message: "DNS record already exists" };
    }

    const response = await cloudflareRequest<DNSRecord>("POST", `/zones/${config.zoneId}/dns_records`, {
      type: "CNAME",
      name: fullDomain,
      content: config.cnameTarget,
      proxied: true,
      ttl: 1,
    });

    console.log(`Created DNS record for ${fullDomain}: ${response.result.id}`);
    return { success: true, recordId: response.result.id, message: `DNS record created for ${fullDomain}` };
  } catch (error) {
    console.error("Failed to create DNS record:", error);
    return { success: false, message: error instanceof Error ? error.message : "Unknown error" };
  }
}

export async function createAdminSubdomainRecord(subdomain: string): Promise<{ success: boolean; recordId?: string; message: string }> {
  try {
    const config = getConfig();
    const fullDomain = `admin.${subdomain}.${BASE_DOMAIN}`;
    
    const existingRecord = await findDNSRecord(fullDomain);
    if (existingRecord) {
      console.log(`DNS record already exists for ${fullDomain}`);
      return { success: true, recordId: existingRecord.id, message: "DNS record already exists" };
    }

    const response = await cloudflareRequest<DNSRecord>("POST", `/zones/${config.zoneId}/dns_records`, {
      type: "CNAME",
      name: fullDomain,
      content: config.cnameTarget,
      proxied: true,
      ttl: 1,
    });

    console.log(`Created DNS record for ${fullDomain}: ${response.result.id}`);
    return { success: true, recordId: response.result.id, message: `DNS record created for ${fullDomain}` };
  } catch (error) {
    console.error("Failed to create admin DNS record:", error);
    return { success: false, message: error instanceof Error ? error.message : "Unknown error" };
  }
}

async function findDNSRecord(fullDomain: string): Promise<DNSRecord | null> {
  try {
    const config = getConfig();
    
    const response = await cloudflareRequest<DNSRecord[]>(
      "GET",
      `/zones/${config.zoneId}/dns_records?name=${encodeURIComponent(fullDomain)}`
    );

    return response.result.length > 0 ? response.result[0] : null;
  } catch (error) {
    console.error("Failed to find DNS record:", error);
    return null;
  }
}

export async function deleteSubdomainRecord(subdomain: string): Promise<{ success: boolean; message: string }> {
  try {
    const config = getConfig();
    const fullDomain = `${subdomain}.${BASE_DOMAIN}`;
    
    const record = await findDNSRecord(fullDomain);
    if (!record) {
      return { success: true, message: "No DNS record found to delete" };
    }

    await cloudflareRequest<{ id: string }>("DELETE", `/zones/${config.zoneId}/dns_records/${record.id}`);
    
    console.log(`Deleted DNS record for ${fullDomain}`);
    return { success: true, message: `DNS record deleted for ${fullDomain}` };
  } catch (error) {
    console.error("Failed to delete DNS record:", error);
    return { success: false, message: error instanceof Error ? error.message : "Unknown error" };
  }
}

export async function deleteAdminSubdomainRecord(subdomain: string): Promise<{ success: boolean; message: string }> {
  try {
    const config = getConfig();
    const fullDomain = `admin.${subdomain}.${BASE_DOMAIN}`;
    
    const record = await findDNSRecord(fullDomain);
    if (!record) {
      return { success: true, message: "No admin DNS record found to delete" };
    }

    await cloudflareRequest<{ id: string }>("DELETE", `/zones/${config.zoneId}/dns_records/${record.id}`);
    
    console.log(`Deleted DNS record for ${fullDomain}`);
    return { success: true, message: `DNS record deleted for ${fullDomain}` };
  } catch (error) {
    console.error("Failed to delete admin DNS record:", error);
    return { success: false, message: error instanceof Error ? error.message : "Unknown error" };
  }
}

export async function publishSiteDNS(subdomain: string): Promise<{ success: boolean; messages: string[] }> {
  const messages: string[] = [];
  
  const siteResult = await createSubdomainRecord(subdomain);
  messages.push(siteResult.message);
  
  const adminResult = await createAdminSubdomainRecord(subdomain);
  messages.push(adminResult.message);
  
  return {
    success: siteResult.success && adminResult.success,
    messages,
  };
}

export async function unpublishSiteDNS(subdomain: string): Promise<{ success: boolean; messages: string[] }> {
  const messages: string[] = [];
  
  const siteResult = await deleteSubdomainRecord(subdomain);
  messages.push(siteResult.message);
  
  const adminResult = await deleteAdminSubdomainRecord(subdomain);
  messages.push(adminResult.message);
  
  return {
    success: siteResult.success && adminResult.success,
    messages,
  };
}

export function isCloudflareConfigured(): boolean {
  return !!(process.env.CLOUDFLARE_API_TOKEN && process.env.CLOUDFLARE_ZONE_ID);
}
