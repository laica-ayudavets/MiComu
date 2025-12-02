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

// Convert date to ISO 8601 format that GHL accepts
function formatDateForGHL(date: string | null | undefined): string | null {
  if (!date) return null;
  // If it's already a full ISO string, return as-is
  if (date.includes('T')) return date;
  // Convert YYYY-MM-DD to ISO 8601 with midnight UTC
  return `${date}T00:00:00.000Z`;
}

// Add a tag to a GHL contact using the dedicated tag endpoint
async function addTagToContact(ghlContactId: string, tag: string, apiKey: string): Promise<boolean> {
  try {
    const response = await fetch(`${GHL_API_BASE}/contacts/${ghlContactId}/tags`, {
      method: "POST",
      headers: getHeaders(apiKey),
      body: JSON.stringify({ tags: [tag] }),
    });

    if (!response.ok) {
      const errorData = await response.json() as GHLError;
      console.error(`[GHL] Failed to add tag "${tag}": ${response.status}`, errorData);
      return false;
    }

    console.log(`[GHL] Tag "${tag}" added to contact: ${ghlContactId}`);
    return true;
  } catch (error) {
    console.error(`[GHL] Error adding tag "${tag}":`, error);
    return false;
  }
}

// Remove a tag from a GHL contact using the dedicated tag endpoint
async function removeTagFromContact(ghlContactId: string, tag: string, apiKey: string): Promise<boolean> {
  try {
    const response = await fetch(`${GHL_API_BASE}/contacts/${ghlContactId}/tags`, {
      method: "DELETE",
      headers: getHeaders(apiKey),
      body: JSON.stringify({ tags: [tag] }),
    });

    if (!response.ok) {
      const errorData = await response.json() as GHLError;
      console.error(`[GHL] Failed to remove tag "${tag}": ${response.status}`, errorData);
      return false;
    }

    console.log(`[GHL] Tag "${tag}" removed from contact: ${ghlContactId}`);
    return true;
  } catch (error) {
    console.error(`[GHL] Error removing tag "${tag}":`, error);
    return false;
  }
}

export async function createGHLBusiness(community: Community, residentCount?: number): Promise<string | null> {
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
    
    // Add description with resident count
    if (residentCount !== undefined) {
      payload.description = `Residentes: ${residentCount}`;
    }

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
    // Use firstName/lastName directly from user, fallback to username
    const firstName = user.firstName || user.username;
    const lastName = user.lastName || "";

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

    // Add phone if provided
    if (user.phone) {
      payload.phone = user.phone;
    }

    // Add company/business name - this appears as "Business Name" in GHL
    if (community) {
      payload.companyName = community.name;
    }

    // Add date of birth if provided - convert to ISO 8601 format
    const formattedDOB = formatDateForGHL(user.dateOfBirth);
    if (formattedDOB) {
      payload.dateOfBirth = formattedDOB;
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
  community: Partial<Community>,
  residentCount?: number
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
    
    // Update description with resident count
    if (residentCount !== undefined) {
      payload.description = `Residentes: ${residentCount}`;
    }

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
  userData: Record<string, unknown>,
  community?: Community | null
): Promise<boolean> {
  const config = getGHLConfig();
  if (!config) return false;

  try {
    const payload: Record<string, unknown> = {};

    // Handle firstName/lastName directly
    if (userData.firstName !== undefined) payload.firstName = userData.firstName;
    if (userData.lastName !== undefined) payload.lastName = userData.lastName;
    if (userData.email !== undefined) payload.email = userData.email;
    if (userData.phone !== undefined) payload.phone = userData.phone;

    // Handle community change - update companyName (Business Name in GHL)
    if (community !== undefined) {
      if (community) {
        payload.companyName = community.name;
      } else {
        // Clear company name if community is null
        payload.companyName = null;
      }
    }

    // Handle date of birth - convert to ISO 8601 format
    if (userData.dateOfBirth !== undefined) {
      const formattedDOB = formatDateForGHL(userData.dateOfBirth as string | null);
      if (formattedDOB) {
        payload.dateOfBirth = formattedDOB;
      }
    }

    console.log(`[GHL] Updating contact: ${ghlContactId}`, payload);

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

    console.log(`[GHL] Deactivating contact: ${ghlContactId} (was ${previousRole})`);

    // Use dedicated tag endpoints - add Ex-Residente, remove role tag
    const addResult = await addTagToContact(ghlContactId, "Ex-Residente", config.apiKey);
    const removeResult = await removeTagFromContact(ghlContactId, previousTag, config.apiKey);

    if (addResult && removeResult) {
      console.log(`[GHL] Contact deactivated successfully: ${ghlContactId}`);
      return true;
    } else {
      console.error(`[GHL] Partial deactivation - add: ${addResult}, remove: ${removeResult}`);
      return addResult; // Return true if at least the Ex-Residente tag was added
    }
  } catch (error) {
    console.error("[GHL] Error deactivating contact:", error);
    return false;
  }
}

export async function reactivateGHLContact(
  ghlContactId: string,
  role: string
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

    const roleTag = roleTagMap[role] || role;

    console.log(`[GHL] Reactivating contact: ${ghlContactId} (role: ${role})`);

    // Use dedicated tag endpoints - add role tag, remove Ex-Residente
    const addResult = await addTagToContact(ghlContactId, roleTag, config.apiKey);
    const removeResult = await removeTagFromContact(ghlContactId, "Ex-Residente", config.apiKey);

    if (addResult && removeResult) {
      console.log(`[GHL] Contact reactivated successfully: ${ghlContactId}`);
      return true;
    } else {
      console.error(`[GHL] Partial reactivation - add: ${addResult}, remove: ${removeResult}`);
      return addResult; // Return true if at least the role tag was added
    }
  } catch (error) {
    console.error("[GHL] Error reactivating contact:", error);
    return false;
  }
}

export function isGHLConfigured(): boolean {
  return getGHLConfig() !== null;
}
