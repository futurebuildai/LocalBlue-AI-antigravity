const FB_BRAIN_URL = process.env.FB_BRAIN_URL || "http://localhost:8082";
const INTEGRATION_API_KEY = process.env.INTEGRATION_API_KEY || "fb-brain-demo-key-2026";

export interface SupplierStatus {
  connected: boolean;
  supplier_name?: string;
  customer_id?: string;
}

export interface ScopeItemInput {
  item: string;
  quantity: number;
  unit: string;
}

export interface PricedScopeItem {
  scope_item: string;
  product_id: string;
  product_name: string;
  sku: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  uom: string;
}

export interface MaterialPricingResponse {
  items: PricedScopeItem[];
  unmatched_items: string[];
  total_cents: number;
}

export async function checkSupplierStatus(siteId: string): Promise<SupplierStatus> {
  const resp = await fetch(
    `${FB_BRAIN_URL}/api/localblue/supplier-status?site_id=${encodeURIComponent(siteId)}`,
    {
      headers: { "X-Integration-Key": INTEGRATION_API_KEY },
    }
  );

  if (!resp.ok) {
    throw new Error(`FB-Brain supplier-status failed: ${resp.status}`);
  }

  return resp.json() as Promise<SupplierStatus>;
}

export async function getMaterialPricing(
  siteId: string,
  scopeItems: ScopeItemInput[]
): Promise<MaterialPricingResponse> {
  const resp = await fetch(`${FB_BRAIN_URL}/api/localblue/material-pricing`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Integration-Key": INTEGRATION_API_KEY,
    },
    body: JSON.stringify({ site_id: siteId, scope_items: scopeItems }),
  });

  if (!resp.ok) {
    throw new Error(`FB-Brain material-pricing failed: ${resp.status}`);
  }

  return resp.json() as Promise<MaterialPricingResponse>;
}
