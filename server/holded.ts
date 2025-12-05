import type { User, Community, Provider } from "@shared/schema";

const HOLDED_API_BASE = "https://api.holded.com/api";

interface HoldedContactResponse {
  id: string;
  name: string;
  email?: string;
  [key: string]: unknown;
}

interface HoldedDocumentResponse {
  id: string;
  docNumber: string;
  contact: string;
  date: number;
  total: number;
  status: number; // 0: draft, 1: not paid, 2: paid, 3: late
  [key: string]: unknown;
}

interface HoldedDocumentListResponse {
  id: string;
  docNumber: string;
  contactId: string;
  contactName: string;
  date: number;
  dueDate: number;
  total: number;
  subtotal: number;
  currency: string;
  status: number;
  [key: string]: unknown;
}

interface HoldedError {
  error?: string;
  message?: string;
  status?: number;
}

interface HoldedInvoiceItem {
  name: string;
  desc?: string;
  units: number;
  subtotal: number;
  tax?: number;
  sku?: string;
}

interface CreateInvoiceParams {
  contactId: string;
  items: HoldedInvoiceItem[];
  date?: Date;
  dueDate?: Date;
  notes?: string;
  customFields?: Record<string, string>;
}

function getHoldedConfig() {
  const apiKey = process.env.HOLDED_API_KEY;

  if (!apiKey) {
    console.warn("[Holded] Integration not configured: Missing HOLDED_API_KEY");
    return null;
  }

  return { apiKey };
}

function getHeaders(apiKey: string) {
  return {
    "Accept": "application/json",
    "Content-Type": "application/json",
    "key": apiKey,
  };
}

function formatDateForHolded(date: Date): number {
  return Math.floor(date.getTime() / 1000);
}

export async function createHoldedContact(
  user: User,
  community: Community | null,
  type: "client" = "client"
): Promise<string | null> {
  const config = getHoldedConfig();
  if (!config) return null;

  try {
    const fullName = [user.firstName, user.lastName].filter(Boolean).join(" ") || user.username;
    
    const payload: Record<string, unknown> = {
      name: fullName,
      email: user.email,
      type,
      tradeName: community?.name || undefined,
    };

    if (user.phone) {
      payload.phone = user.phone;
    }

    if (community?.address) {
      payload.billAddress = {
        address: community.address,
        city: community.city || "",
        postalCode: community.postalCode || "",
        province: community.province || "",
        country: "ES",
      };
    }

    console.log(`[Holded] Creating contact for user: ${user.email}`);

    const response = await fetch(`${HOLDED_API_BASE}/invoicing/v1/contacts`, {
      method: "POST",
      headers: getHeaders(config.apiKey),
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorData = await response.json() as HoldedError;
      console.error(`[Holded] Failed to create contact: ${response.status}`, errorData);
      return null;
    }

    const data = await response.json() as HoldedContactResponse;
    console.log(`[Holded] Contact created successfully: ${data.id}`);
    return data.id;
  } catch (error) {
    console.error("[Holded] Error creating contact:", error);
    return null;
  }
}

export async function createHoldedSupplierContact(
  provider: Provider
): Promise<string | null> {
  const config = getHoldedConfig();
  if (!config) return null;

  try {
    const payload: Record<string, unknown> = {
      name: provider.name,
      type: "supplier",
    };

    if (provider.email) {
      payload.email = provider.email;
    }

    if (provider.phone) {
      payload.phone = provider.phone;
    }

    if (provider.address) {
      payload.billAddress = {
        address: provider.address,
        country: "ES",
      };
    }

    console.log(`[Holded] Creating supplier contact: ${provider.name}`);

    const response = await fetch(`${HOLDED_API_BASE}/invoicing/v1/contacts`, {
      method: "POST",
      headers: getHeaders(config.apiKey),
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorData = await response.json() as HoldedError;
      console.error(`[Holded] Failed to create supplier contact: ${response.status}`, errorData);
      return null;
    }

    const data = await response.json() as HoldedContactResponse;
    console.log(`[Holded] Supplier contact created successfully: ${data.id}`);
    return data.id;
  } catch (error) {
    console.error("[Holded] Error creating supplier contact:", error);
    return null;
  }
}

export async function updateHoldedContact(
  holdedContactId: string,
  userData: Partial<User>,
  community?: Community | null
): Promise<boolean> {
  const config = getHoldedConfig();
  if (!config) return false;

  try {
    const payload: Record<string, unknown> = {};

    if (userData.firstName || userData.lastName) {
      const fullName = [userData.firstName, userData.lastName].filter(Boolean).join(" ");
      if (fullName) payload.name = fullName;
    }

    if (userData.email) payload.email = userData.email;
    if (userData.phone) payload.phone = userData.phone;

    if (community !== undefined) {
      payload.tradeName = community?.name || null;
      if (community?.address) {
        payload.billAddress = {
          address: community.address,
          city: community.city || "",
          postalCode: community.postalCode || "",
          province: community.province || "",
          country: "ES",
        };
      }
    }

    console.log(`[Holded] Updating contact: ${holdedContactId}`);

    const response = await fetch(`${HOLDED_API_BASE}/invoicing/v1/contacts/${holdedContactId}`, {
      method: "PUT",
      headers: getHeaders(config.apiKey),
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorData = await response.json() as HoldedError;
      console.error(`[Holded] Failed to update contact: ${response.status}`, errorData);
      return false;
    }

    console.log(`[Holded] Contact updated successfully: ${holdedContactId}`);
    return true;
  } catch (error) {
    console.error("[Holded] Error updating contact:", error);
    return false;
  }
}

export async function createHoldedInvoice(params: CreateInvoiceParams): Promise<string | null> {
  const config = getHoldedConfig();
  if (!config) return null;

  try {
    const payload: Record<string, unknown> = {
      contactId: params.contactId,
      items: params.items.map(item => ({
        name: item.name,
        desc: item.desc || "",
        units: item.units,
        subtotal: item.subtotal,
        tax: item.tax || 21, // Default 21% IVA in Spain
        sku: item.sku || undefined,
      })),
    };

    if (params.date) {
      payload.date = formatDateForHolded(params.date);
    }

    if (params.dueDate) {
      payload.dueDate = formatDateForHolded(params.dueDate);
    }

    if (params.notes) {
      payload.notes = params.notes;
    }

    console.log(`[Holded] Creating invoice for contact: ${params.contactId}`);

    const response = await fetch(`${HOLDED_API_BASE}/invoicing/v1/documents/invoice`, {
      method: "POST",
      headers: getHeaders(config.apiKey),
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorData = await response.json() as HoldedError;
      console.error(`[Holded] Failed to create invoice: ${response.status}`, errorData);
      return null;
    }

    const data = await response.json() as HoldedDocumentResponse;
    console.log(`[Holded] Invoice created successfully: ${data.id}`);
    return data.id;
  } catch (error) {
    console.error("[Holded] Error creating invoice:", error);
    return null;
  }
}

export async function createHoldedPurchaseInvoice(
  supplierContactId: string,
  items: HoldedInvoiceItem[],
  date?: Date,
  notes?: string
): Promise<string | null> {
  const config = getHoldedConfig();
  if (!config) return null;

  try {
    const payload: Record<string, unknown> = {
      contactId: supplierContactId,
      items: items.map(item => ({
        name: item.name,
        desc: item.desc || "",
        units: item.units,
        subtotal: item.subtotal,
        tax: item.tax || 21,
      })),
    };

    if (date) {
      payload.date = formatDateForHolded(date);
    }

    if (notes) {
      payload.notes = notes;
    }

    console.log(`[Holded] Creating purchase invoice for supplier: ${supplierContactId}`);

    const response = await fetch(`${HOLDED_API_BASE}/invoicing/v1/documents/purchase`, {
      method: "POST",
      headers: getHeaders(config.apiKey),
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorData = await response.json() as HoldedError;
      console.error(`[Holded] Failed to create purchase invoice: ${response.status}`, errorData);
      return null;
    }

    const data = await response.json() as HoldedDocumentResponse;
    console.log(`[Holded] Purchase invoice created successfully: ${data.id}`);
    return data.id;
  } catch (error) {
    console.error("[Holded] Error creating purchase invoice:", error);
    return null;
  }
}

export async function getHoldedInvoicesForContact(holdedContactId: string): Promise<HoldedDocumentListResponse[] | null> {
  const config = getHoldedConfig();
  if (!config) return null;

  try {
    console.log(`[Holded] Fetching invoices for contact: ${holdedContactId}`);

    const response = await fetch(`${HOLDED_API_BASE}/invoicing/v1/documents/invoice?contactId=${holdedContactId}`, {
      method: "GET",
      headers: getHeaders(config.apiKey),
    });

    if (!response.ok) {
      const errorData = await response.json() as HoldedError;
      console.error(`[Holded] Failed to fetch invoices: ${response.status}`, errorData);
      return null;
    }

    const data = await response.json() as HoldedDocumentListResponse[];
    console.log(`[Holded] Found ${data.length} invoices for contact: ${holdedContactId}`);
    return data;
  } catch (error) {
    console.error("[Holded] Error fetching invoices:", error);
    return null;
  }
}

export async function getHoldedInvoice(invoiceId: string): Promise<HoldedDocumentResponse | null> {
  const config = getHoldedConfig();
  if (!config) return null;

  try {
    const response = await fetch(`${HOLDED_API_BASE}/invoicing/v1/documents/invoice/${invoiceId}`, {
      method: "GET",
      headers: getHeaders(config.apiKey),
    });

    if (!response.ok) {
      const errorData = await response.json() as HoldedError;
      console.error(`[Holded] Failed to fetch invoice: ${response.status}`, errorData);
      return null;
    }

    return await response.json() as HoldedDocumentResponse;
  } catch (error) {
    console.error("[Holded] Error fetching invoice:", error);
    return null;
  }
}

export async function markInvoiceAsPaid(invoiceId: string, paidDate?: Date): Promise<boolean> {
  const config = getHoldedConfig();
  if (!config) return false;

  try {
    const payload: Record<string, unknown> = {
      date: paidDate ? formatDateForHolded(paidDate) : formatDateForHolded(new Date()),
    };

    console.log(`[Holded] Marking invoice as paid: ${invoiceId}`);

    const response = await fetch(`${HOLDED_API_BASE}/invoicing/v1/documents/invoice/${invoiceId}/pay`, {
      method: "POST",
      headers: getHeaders(config.apiKey),
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorData = await response.json() as HoldedError;
      console.error(`[Holded] Failed to mark invoice as paid: ${response.status}`, errorData);
      return false;
    }

    console.log(`[Holded] Invoice marked as paid: ${invoiceId}`);
    return true;
  } catch (error) {
    console.error("[Holded] Error marking invoice as paid:", error);
    return false;
  }
}

export async function sendInvoiceByEmail(invoiceId: string, email: string): Promise<boolean> {
  const config = getHoldedConfig();
  if (!config) return false;

  try {
    const payload = {
      emails: [email],
    };

    console.log(`[Holded] Sending invoice ${invoiceId} to: ${email}`);

    const response = await fetch(`${HOLDED_API_BASE}/invoicing/v1/documents/invoice/${invoiceId}/send`, {
      method: "POST",
      headers: getHeaders(config.apiKey),
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorData = await response.json() as HoldedError;
      console.error(`[Holded] Failed to send invoice: ${response.status}`, errorData);
      return false;
    }

    console.log(`[Holded] Invoice sent successfully: ${invoiceId}`);
    return true;
  } catch (error) {
    console.error("[Holded] Error sending invoice:", error);
    return false;
  }
}

export function isHoldedConfigured(): boolean {
  return getHoldedConfig() !== null;
}

export function getInvoiceStatusLabel(status: number): string {
  switch (status) {
    case 0: return "Borrador";
    case 1: return "Pendiente";
    case 2: return "Pagada";
    case 3: return "Vencida";
    default: return "Desconocido";
  }
}

export type { HoldedDocumentListResponse, HoldedDocumentResponse, HoldedInvoiceItem, CreateInvoiceParams };
