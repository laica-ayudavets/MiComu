import type { Community, User } from "@shared/schema";

const GHL_API_BASE = "https://services.leadconnectorhq.com";
const GHL_API_VERSION = "2021-07-28";

interface GHLBusinessResponse {
  business: {
    id: string;
    name: string;
    locationId: string;
    [key: string]: unknown;
  };
}

interface GHLContactResponse {
  contact: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    [key: string]: unknown;
  };
}

interface GHLError {
  message?: string;
  error?: string;
  statusCode?: number;
}

function getGHLConfig() {
  const apiKey = process.env.GHL_API_KEY;
  const locationId = process.env.GHL_LOCATION_ID;

  if (!apiKey || !locationId) {
    console.warn("GHL integration not configured: Missing GHL_API_KEY or GHL_LOCATION_ID");
    return null;
  }

  return { apiKey, locationId };
}

function getHeaders(apiKey: string) {
  return {
    "Authorization": `Bearer ${apiKey}`,
    "Content-Type": "application/json",
    "Version": GHL_API_VERSION,
  };
}

export async function createGHLBusiness(community: Community): Promise<string | null> {
  const config = getGHLConfig();
  if (!config) return null;

  try {
    const payload: Record<string, unknown> = {
      locationId: config.locationId,
      name: community.name,
      country: "ES",
    };

    if (community.address) payload.address = community.address;
    if (community.city) payload.city = community.city;
    if (community.province) payload.state = community.province;
    if (community.postalCode) payload.postalCode = community.postalCode;

    console.log(`[GHL] Creating business for community: ${community.name}`);

    const response = await fetch(`${GHL_API_BASE}/businesses/`, {
      method: "POST",
      headers: getHeaders(config.apiKey),
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorData = await response.json() as GHLError;
      console.error(`[GHL] Failed to create business: ${response.status}`, errorData);
      return null;
    }

    const data = await response.json() as GHLBusinessResponse;
    console.log(`[GHL] Business created successfully: ${data.business.id}`);
    return data.business.id;
  } catch (error) {
    console.error("[GHL] Error creating business:", error);
    return null;
  }
}

export async function createGHLContact(
  user: User,
  community: Community | null
): Promise<string | null> {
  const config = getGHLConfig();
  if (!config) return null;

  try {
    const nameParts = (user.fullName || user.username).split(" ");
    const firstName = nameParts[0] || user.username;
    const lastName = nameParts.slice(1).join(" ") || "";

    const roleMap: Record<string, string> = {
      vecino: "Resident",
      presidente: "President",
      admin_fincas: "Property Manager",
      superadmin: "Super Admin",
    };

    const payload: Record<string, unknown> = {
      locationId: config.locationId,
      firstName,
      lastName,
      email: user.email,
      tags: [roleMap[user.role] || user.role],
    };

    if (community?.ghlBusinessId) {
      payload.companyId = community.ghlBusinessId;
    }

    console.log(`[GHL] Creating contact for user: ${user.email}`);

    const response = await fetch(`${GHL_API_BASE}/contacts/`, {
      method: "POST",
      headers: getHeaders(config.apiKey),
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorData = await response.json() as GHLError;
      console.error(`[GHL] Failed to create contact: ${response.status}`, errorData);
      return null;
    }

    const data = await response.json() as GHLContactResponse;
    console.log(`[GHL] Contact created successfully: ${data.contact.id}`);
    return data.contact.id;
  } catch (error) {
    console.error("[GHL] Error creating contact:", error);
    return null;
  }
}

export async function updateGHLBusiness(
  ghlBusinessId: string,
  community: Partial<Community>
): Promise<boolean> {
  const config = getGHLConfig();
  if (!config) return false;

  try {
    const payload: Record<string, unknown> = {};

    if (community.name) payload.name = community.name;
    if (community.address) payload.address = community.address;
    if (community.city) payload.city = community.city;
    if (community.province) payload.state = community.province;
    if (community.postalCode) payload.postalCode = community.postalCode;

    console.log(`[GHL] Updating business: ${ghlBusinessId}`);

    const response = await fetch(`${GHL_API_BASE}/businesses/${ghlBusinessId}`, {
      method: "PUT",
      headers: getHeaders(config.apiKey),
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorData = await response.json() as GHLError;
      console.error(`[GHL] Failed to update business: ${response.status}`, errorData);
      return false;
    }

    console.log(`[GHL] Business updated successfully: ${ghlBusinessId}`);
    return true;
  } catch (error) {
    console.error("[GHL] Error updating business:", error);
    return false;
  }
}

export async function updateGHLContact(
  ghlContactId: string,
  user: Record<string, unknown>
): Promise<boolean> {
  const config = getGHLConfig();
  if (!config) return false;

  try {
    const payload: Record<string, unknown> = {};

    if (user.fullName) {
      const nameParts = (user.fullName as string).split(" ");
      payload.firstName = nameParts[0];
      payload.lastName = nameParts.slice(1).join(" ") || "";
    }

    if (user.email) payload.email = user.email;
    if (user.phone) payload.phone = user.phone;

    console.log(`[GHL] Updating contact: ${ghlContactId}`);

    const response = await fetch(`${GHL_API_BASE}/contacts/${ghlContactId}`, {
      method: "PUT",
      headers: getHeaders(config.apiKey),
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorData = await response.json() as GHLError;
      console.error(`[GHL] Failed to update contact: ${response.status}`, errorData);
      return false;
    }

    console.log(`[GHL] Contact updated successfully: ${ghlContactId}`);
    return true;
  } catch (error) {
    console.error("[GHL] Error updating contact:", error);
    return false;
  }
}

export async function archiveGHLBusiness(ghlBusinessId: string, communityName?: string): Promise<boolean> {
  const config = getGHLConfig();
  if (!config) return false;

  try {
    const archivedName = communityName 
      ? `[ARCHIVADO] ${communityName}` 
      : `[ARCHIVADO] Community`;
    
    const payload = {
      name: archivedName,
    };

    console.log(`[GHL] Archiving business: ${ghlBusinessId}`);

    const response = await fetch(`${GHL_API_BASE}/businesses/${ghlBusinessId}`, {
      method: "PUT",
      headers: getHeaders(config.apiKey),
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorData = await response.json() as GHLError;
      console.error(`[GHL] Failed to archive business: ${response.status}`, errorData);
      return false;
    }

    console.log(`[GHL] Business archived successfully: ${ghlBusinessId}`);
    return true;
  } catch (error) {
    console.error("[GHL] Error archiving business:", error);
    return false;
  }
}

export async function deactivateGHLContact(
  ghlContactId: string,
  previousRole: string
): Promise<boolean> {
  const config = getGHLConfig();
  if (!config) return false;

  try {
    const roleTagMap: Record<string, string> = {
      vecino: "Resident",
      presidente: "President",
      admin_fincas: "Property Manager",
      superadmin: "Super Admin",
    };

    const previousTag = roleTagMap[previousRole] || previousRole;

    const payload = {
      tags: ["Ex-Residente"],
      tagsToRemove: [previousTag],
    };

    console.log(`[GHL] Deactivating contact: ${ghlContactId} (was ${previousRole})`);

    const response = await fetch(`${GHL_API_BASE}/contacts/${ghlContactId}`, {
      method: "PUT",
      headers: getHeaders(config.apiKey),
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorData = await response.json() as GHLError;
      console.error(`[GHL] Failed to deactivate contact: ${response.status}`, errorData);
      return false;
    }

    console.log(`[GHL] Contact deactivated successfully: ${ghlContactId}`);
    return true;
  } catch (error) {
    console.error("[GHL] Error deactivating contact:", error);
    return false;
  }
}

export function isGHLConfigured(): boolean {
  return getGHLConfig() !== null;
}
